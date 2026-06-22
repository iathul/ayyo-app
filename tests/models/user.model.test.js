const db = require('../setup/db')
const User = require('../../models/user')

beforeAll(async () => db.connect())
afterEach(async () => db.clearDatabase())
afterAll(async () => db.closeDatabase())

describe('User model', () => {
  it('hashes the password and authenticates with the correct plaintext password', async () => {
    const user = new User({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'correct-password'
    })
    await user.save()

    expect(user.hashed_password).toBeTruthy()
    expect(user.hashed_password).not.toBe('correct-password')
    expect(user.authenticate('correct-password')).toBe(true)
    expect(user.authenticate('wrong-password')).toBe(false)
  })

  it('generates a unique salt per user', async () => {
    const userA = new User({
      firstName: 'A', email: 'a@example.com', password: 'same-password'
    })
    const userB = new User({
      firstName: 'B', email: 'b@example.com', password: 'same-password'
    })
    await userA.save()
    await userB.save()

    expect(userA.salt).not.toBe(userB.salt)
    expect(userA.hashed_password).not.toBe(userB.hashed_password)
  })

  it('builds fullName from first and last name, or just firstName when lastName is empty', async () => {
    const withLastName = new User({
      firstName: 'Jane', lastName: 'Doe', email: 'jane2@example.com', password: 'x'
    })
    const withoutLastName = new User({
      firstName: 'Jane', email: 'jane3@example.com', password: 'x'
    })

    expect(withLastName.fullName()).toBe('Jane Doe')
    expect(withoutLastName.fullName()).toBe('Jane')
  })

  it('userDetails excludes sensitive fields', async () => {
    const user = new User({
      firstName: 'Jane', email: 'jane4@example.com', password: 'secret'
    })
    await user.save()

    const details = user.userDetails()
    expect(details).toEqual({
      id: user._id,
      fullName: 'Jane',
      email: 'jane4@example.com',
      isVerified: false
    })
    expect(details.hashed_password).toBeUndefined()
    expect(details.salt).toBeUndefined()
  })
})
