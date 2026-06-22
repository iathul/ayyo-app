jest.mock('multer-s3', () => jest.fn(() => ({
  _handleFile(req, file, cb) {
    const chunks = []
    file.stream.on('data', (chunk) => chunks.push(chunk))
    file.stream.on('end', () => {
      const buffer = Buffer.concat(chunks)
      cb(null, {
        location: `https://s3.test/${file.originalname}`,
        bucket: 'test-bucket',
        key: `mock/${file.originalname}`,
        etag: 'mock-etag',
        size: buffer.length
      })
    })
    file.stream.on('error', cb)
  },
  _removeFile(req, file, cb) {
    cb(null)
  }
})))
jest.mock('../config/S3Config')
jest.mock('../config/bull')

const request = require('supertest')
const moment = require('moment')
const { Readable } = require('stream')
const db = require('./setup/db')
const app = require('../app')
const Package = require('../models/package')
const User = require('../models/user')
const { generateAccessRefreshToken } = require('../utils/token')
const s3 = require('../config/S3Config')

beforeAll(async () => db.connect())
afterEach(async () => {
  await db.clearDatabase()
  jest.clearAllMocks()
})
afterAll(async () => db.closeDatabase())

const createAuthedUser = async () => {
  const user = await new User({
    firstName: 'Jane', email: 'jane@example.com', password: 'password123', isVerified: true
  }).save()
  const accessToken = generateAccessRefreshToken(user, 'access')
  return { user, accessToken }
}

const readableFrom = (content) => Readable.from([Buffer.from(content)])

describe('POST /api/v1/files', () => {
  it('uploads a single file and creates a package', async () => {
    const { accessToken } = await createAuthedUser()

    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('fileData', Buffer.from('hello world'), 'hello.txt')

    expect(res.status).toBe(200)
    expect(res.body.packageId).toMatch(/^package_/)

    const pkg = await Package.findOne({ packageId: res.body.packageId })
    expect(pkg.files).toHaveLength(1)
    expect(pkg.files[0].originalname).toBe('hello.txt')
    expect(pkg.status).toBe('created')
  })

  it('uploads multiple files into the same package', async () => {
    const { accessToken } = await createAuthedUser()

    const res = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('fileData', Buffer.from('one'), 'one.txt')
      .attach('fileData', Buffer.from('two'), 'two.txt')

    expect(res.status).toBe(200)
    const pkg = await Package.findOne({ packageId: res.body.packageId })
    expect(pkg.files).toHaveLength(2)
  })

  it('rejects unauthenticated uploads', async () => {
    const res = await request(app)
      .post('/api/v1/files')
      .attach('fileData', Buffer.from('hello'), 'hello.txt')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/v1/files/sharable-link/:packageId', () => {
  it('returns a download URL for an existing package', async () => {
    const { accessToken, user } = await createAuthedUser()
    const pkg = await new Package({
      user: user._id,
      packageId: 'package_abc',
      files: [{ originalname: 'a.txt', size: 1 }],
      package_destination: 'dest',
      package_expiry_date: moment().add(1, 'day')
    }).save()

    const res = await request(app)
      .get(`/api/v1/files/sharable-link/${pkg.packageId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.url).toContain(`/api/v1/files/download/${pkg.packageId}`)
  })

  it('returns 404 for an unknown package', async () => {
    const { accessToken } = await createAuthedUser()
    const res = await request(app)
      .get('/api/v1/files/sharable-link/package_does_not_exist')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/files/download/:packageId', () => {
  it('streams a single file and marks the package downloaded', async () => {
    const { user } = await createAuthedUser()
    const pkg = await new Package({
      user: user._id,
      packageId: 'package_single',
      files: [{ originalname: 'a.txt', size: 1 }],
      package_destination: 'dest',
      package_expiry_date: moment().add(1, 'day')
    }).save()

    s3.getObject.mockReturnValue({ createReadStream: () => readableFrom('file content') })

    const res = await request(app).get(`/api/v1/files/download/${pkg.packageId}`)

    expect(res.status).toBe(200)
    expect(res.text).toBe('file content')

    const updated = await Package.findOne({ packageId: pkg.packageId })
    expect(updated.status).toBe('downloaded')
    expect(updated.package_download_count).toBe(1)
  })

  it('zips multiple files and marks the package downloaded', async () => {
    const { user } = await createAuthedUser()
    const pkg = await new Package({
      user: user._id,
      packageId: 'package_multi',
      files: [
        { originalname: 'a.txt', size: 1 },
        { originalname: 'b.txt', size: 1 }
      ],
      package_destination: 'dest',
      package_expiry_date: moment().add(1, 'day')
    }).save()

    s3.getObject.mockImplementation((options) => ({
      createReadStream: () => readableFrom(`content-for-${options.Key}`)
    }))

    const res = await request(app).get(`/api/v1/files/download/${pkg.packageId}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-disposition']).toMatch(/\.zip/)

    const updated = await Package.findOne({ packageId: pkg.packageId })
    expect(updated.status).toBe('downloaded')
  })

  it('returns 400 for an expired package', async () => {
    const { user } = await createAuthedUser()
    const pkg = await new Package({
      user: user._id,
      packageId: 'package_expired',
      files: [{ originalname: 'a.txt', size: 1 }],
      package_destination: 'dest',
      package_expiry_date: moment().subtract(1, 'day')
    }).save()

    const res = await request(app).get(`/api/v1/files/download/${pkg.packageId}`)
    expect(res.status).toBe(400)
  })

  it('returns 500 when the S3 stream errors', async () => {
    const { user } = await createAuthedUser()
    const pkg = await new Package({
      user: user._id,
      packageId: 'package_broken',
      files: [{ originalname: 'a.txt', size: 1 }],
      package_destination: 'dest',
      package_expiry_date: moment().add(1, 'day')
    }).save()

    s3.getObject.mockReturnValue({
      createReadStream: () => {
        const stream = new Readable({ read() {} })
        process.nextTick(() => stream.emit('error', new Error('boom')))
        return stream
      }
    })

    const res = await request(app).get(`/api/v1/files/download/${pkg.packageId}`)
    expect(res.status).toBe(500)
  })
})
