/**
 * Jobs API Tests
 * Tests public job listing, search, and employer-only creation.
 */
const request = require('supertest')
const mongoose = require('mongoose')

require('dotenv').config()

let app, employerToken, applicantToken

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/careerconnect_test$1')
  if (mongoose.connection.readyState === 0) await mongoose.connect(testUri)
  app = require('../src/index')

  // Register employer
  const emp = await request(app).post('/api/auth/register').send({
    name: 'Test Employer', email: `emp_${Date.now()}@test.com`,
    password: 'Emp12345', role: 'employer'
  })
  employerToken = emp.body.token

  // Register applicant
  const app2 = await request(app).post('/api/auth/register').send({
    name: 'Test Applicant', email: `app_${Date.now()}@test.com`,
    password: 'App12345', role: 'applicant'
  })
  applicantToken = app2.body.token
})

afterAll(async () => {
  await mongoose.connection.db.dropCollection('jobs').catch(() => {})
  await mongoose.connection.db.dropCollection('users').catch(() => {})
  await mongoose.connection.close()
})

describe('GET /api/jobs', () => {
  it('returns array of active jobs (public)', async () => {
    const res = await request(app).get('/api/jobs')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /api/jobs/search', () => {
  it('returns search results for a keyword', async () => {
    const res = await request(app).get('/api/jobs/search?title=developer')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('returns empty array for no matches', async () => {
    const res = await request(app).get('/api/jobs/search?title=xyznonexistentjob999')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/jobs', () => {
  const jobPayload = {
    title: 'Senior React Developer',
    description: 'We need a React developer with 3+ years experience.',
    location: 'Lahore',
    requiredSkills: ['React', 'Node.js'],
    jobType: ['full-time'],
    workMode: 'remote',
    salaryMin: 100000,
    salaryMax: 150000,
    status: 'active'
  }

  it('allows employer to create a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send(jobPayload)
    expect(res.status).toBe(201)
    expect(res.body.title).toBe(jobPayload.title)
    expect(res.body.status).toBe('active')
  })

  it('blocks applicant from creating a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send(jobPayload)
    expect(res.status).toBe(403)
  })

  it('blocks unauthenticated job creation', async () => {
    const res = await request(app).post('/api/jobs').send(jobPayload)
    expect(res.status).toBe(401)
  })
})
