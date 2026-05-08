/**
 * Auth API Tests
 * Tests registration, login, validation, and duplicate prevention.
 * Uses supertest to hit real Express routes without a running server.
 */
const request = require('supertest')
const mongoose = require('mongoose')

// Load env before anything else
require('dotenv').config()

let app

beforeAll(async () => {
  // Use a separate test database so we never touch production data
  const testUri = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/careerconnect_test$1')
  await mongoose.connect(testUri)
  app = require('../src/index')
})

afterAll(async () => {
  // Clean up test users and close connection
  await mongoose.connection.db.dropCollection('users').catch(() => {})
  await mongoose.connection.close()
})

// ── Registration ──────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'Test1234',
    role: 'applicant'
  }

  it('registers a new user and returns a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(validUser.email)
    expect(res.body.user.role).toBe('applicant')
  })

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already in use/i)
  })

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'short@test.com', password: '123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/6 characters/i)
  })

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com', password: 'Test1234' })
    expect(res.status).toBe(400)
  })

  it('blocks admin role registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'admin@test.com', role: 'admin' })
    expect(res.status).toBe(403)
  })
})

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  const creds = { email: `login_${Date.now()}@example.com`, password: 'Login1234' }

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({ name: 'Login User', ...creds, role: 'applicant' })
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(creds)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(creds.email)
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ ...creds, password: 'wrongpass' })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid/i)
  })

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'Test1234' })
    expect(res.status).toBe(401)
  })

  it('rejects missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: creds.email })
    expect(res.status).toBe(400)
  })
})

// ── Protected route ───────────────────────────────────────────────────────────
describe('Protected routes', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalidtoken123')
    expect(res.status).toBe(401)
  })
})
