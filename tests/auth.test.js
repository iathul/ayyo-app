jest.mock('../config/bull')

const request = require('supertest')
const jwt = require('jsonwebtoken')
const db = require('./setup/db')
const app = require('../app')
const User = require('../models/user')

beforeAll(async () => db.connect())
afterEach(async () => db.clearDatabase())
afterAll(async () => db.closeDatabase())

const registerPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password123'
}

describe('POST /api/v1/auth/register', () => {
  it('creates a new unverified user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(registerPayload)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('jane@example.com')
    expect(res.body.user.isVerified).toBe(false)

    const stored = await User.findOne({ email: 'jane@example.com' })
    expect(stored.token).toBeTruthy()
  })

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)
    const res = await request(app).post('/api/v1/auth/register').send(registerPayload)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/already exists/i)
  })

  it('rejects an invalid payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, email: 'not-an-email' })

    expect(res.status).toBe(422)
  })
})

describe('GET /api/v1/auth/verify/email', () => {
  it('verifies a user with a valid token', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)
    const user = await User.findOne({ email: 'jane@example.com' })

    const res = await request(app).get('/api/v1/auth/verify/email').query({ token: user.token })

    expect(res.status).toBe(200)
    const verified = await User.findOne({ email: 'jane@example.com' })
    expect(verified.isVerified).toBe(true)
    expect(verified.token).toBeNull()
  })

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/v1/auth/verify/email').query({ token: 'bogus' })
    expect(res.status).toBe(400)
  })
})

const verifyUser = async (email) => {
  await User.findOneAndUpdate({ email }, { $set: { isVerified: true } })
}

describe('POST /api/v1/auth/login', () => {
  it('logs in a verified user with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)
    await verifyUser(registerPayload.email)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registerPayload.email, password: registerPayload.password })

    expect(res.status).toBe(200)
    expect(res.body.access_token).toBeTruthy()
    expect(res.body.refresh_token).toBeTruthy()
  })

  it('rejects login for an unverified user', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registerPayload.email, password: registerPayload.password })

    expect(res.status).toBe(400)
  })

  it('rejects an incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)
    await verifyUser(registerPayload.email)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registerPayload.email, password: 'wrong-password' })

    expect(res.status).toBe(401)
  })

  it('returns 404 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/auth/refresh-token', () => {
  it('returns 200 with a new access token for a valid refresh token', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)
    await verifyUser(registerPayload.email)
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registerPayload.email, password: registerPayload.password })

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: login.body.refresh_token })

    expect(res.status).toBe(200)
    expect(res.body.access_token).toBeTruthy()
  })

  it('rejects an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: jwt.sign({ _id: 'x' }, 'wrong-secret') })

    expect(res.status).toBe(401)
  })
})

describe('password reset flow', () => {
  it('issues a reset token and accepts a new password with it', async () => {
    await request(app).post('/api/v1/auth/register').send(registerPayload)

    const requestRes = await request(app)
      .post('/api/v1/auth/password')
      .send({ email: registerPayload.email })
    expect(requestRes.status).toBe(200)

    const user = await User.findOne({ email: registerPayload.email })
    const updateRes = await request(app)
      .put('/api/v1/auth/password')
      .query({ token: user.token })
      .send({ new_password: 'newpassword123' })
    expect(updateRes.status).toBe(200)

    const login = await User.findOne({ email: registerPayload.email })
    expect(login.authenticate('newpassword123')).toBe(true)
  })
})
