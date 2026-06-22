jest.mock('../config/bull')

const request = require('supertest')
const db = require('./setup/db')
const app = require('../app')
const User = require('../models/user')
const { generateAccessRefreshToken } = require('../utils/token')

beforeAll(async () => db.connect())
afterEach(async () => db.clearDatabase())
afterAll(async () => db.closeDatabase())

const createAuthedUser = async () => {
  const user = await new User({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'password123',
    isVerified: true
  }).save()
  const accessToken = generateAccessRefreshToken(user, 'access')
  return { user, accessToken }
}

describe('GET /api/v1/users', () => {
  it('returns the authenticated user details', async () => {
    const { accessToken } = await createAuthedUser()

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('jane@example.com')
    expect(res.body.user.hashed_password).toBeUndefined()
  })

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/users')
    expect(res.status).toBe(403)
  })
})

describe('PUT /api/v1/users', () => {
  it('updates first and last name', async () => {
    const { accessToken } = await createAuthedUser()

    const res = await request(app)
      .put('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Janet', lastName: 'Smith' })

    expect(res.status).toBe(200)
    expect(res.body.user.fullName).toBe('Janet Smith')
  })

  it('rejects an empty firstName', async () => {
    const { accessToken } = await createAuthedUser()

    const res = await request(app)
      .put('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: '' })

    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/v1/users', () => {
  it('removes the authenticated user', async () => {
    const { user, accessToken } = await createAuthedUser()

    const res = await request(app)
      .delete('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    const found = await User.findById(user._id)
    expect(found).toBeNull()
  })
})
