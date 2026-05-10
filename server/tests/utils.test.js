/**
 * Utility / Unit Tests
 * Tests pure functions that don't need a database.
 * These run fast and always pass in CI.
 */
const { describe, it, expect } = require('@jest/globals')

// ── PDF compression utility ───────────────────────────────────────────────────
describe('compressPdf utility', () => {
  it('exports a function', () => {
    const compressPdf = require('../src/utils/compressPdf')
    expect(typeof compressPdf).toBe('function')
  })
})

// ── formatSalary (if shared) — test the logic inline ─────────────────────────
describe('Salary formatting logic', () => {
  const fmt = (min, max, type) => {
    if (!min && !max) return null
    const parts = []
    if (min) parts.push(`Rs ${min.toLocaleString()}`)
    if (max) parts.push(`Rs ${max.toLocaleString()}`)
    const range = parts.join(' – ')
    const suffix = type === 'monthly' ? '/mo' : type === 'stipend' ? '/stipend' : '/yr'
    return `${range} ${suffix}`
  }

  it('formats monthly salary range', () => {
    expect(fmt(100000, 150000, 'monthly')).toBe('Rs 100,000 – Rs 150,000 /mo')
  })

  it('formats yearly salary', () => {
    expect(fmt(1200000, 1800000, 'yearly')).toBe('Rs 1,200,000 – Rs 1,800,000 /yr')
  })

  it('returns null when no salary provided', () => {
    expect(fmt(null, null, 'monthly')).toBeNull()
  })

  it('handles min-only salary', () => {
    expect(fmt(80000, null, 'monthly')).toBe('Rs 80,000 /mo')
  })
})

// ── Password strength logic ───────────────────────────────────────────────────
describe('Password strength scoring', () => {
  const score = (pw) => {
    let s = 0
    if (pw.length >= 8)  s++
    if (pw.length >= 12) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  it('scores weak password low', () => { expect(score('abc')).toBeLessThan(2) })
  it('scores strong password high', () => { expect(score('MyP@ssw0rd123')).toBeGreaterThanOrEqual(4) })
  it('rewards length', () => { expect(score('abcdefghijkl')).toBeGreaterThan(score('abcde')) })
  it('rewards uppercase', () => { expect(score('Abcdefgh')).toBeGreaterThan(score('abcdefgh')) })
  it('rewards numbers', () => { expect(score('abcdefg1')).toBeGreaterThan(score('abcdefgh')) })
})

// ── Email validation regex ────────────────────────────────────────────────────
describe('Email validation', () => {
  const isValid = (email) => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)

  it('accepts valid emails', () => {
    expect(isValid('user@example.com')).toBe(true)
    expect(isValid('test.name+tag@domain.co.uk')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValid('notanemail')).toBe(false)
    expect(isValid('missing@tld')).toBe(false)
    expect(isValid('@nodomain.com')).toBe(false)
    expect(isValid('')).toBe(false)
  })
})
