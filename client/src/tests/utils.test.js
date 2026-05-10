/**
 * Frontend Utility Tests
 * Tests pure utility functions — no DOM, no mocks needed.
 */
import { describe, it, expect } from 'vitest'
import { formatSalary } from '../utils/formatSalary'

// ── formatSalary ──────────────────────────────────────────────────────────────
describe('formatSalary', () => {
  it('formats monthly range', () => {
    const result = formatSalary(100000, 150000, 'monthly')
    expect(result).toContain('100')
    expect(result).toContain('150')
  })

  it('returns null when no salary', () => {
    expect(formatSalary(null, null)).toBeNull()
    expect(formatSalary(undefined, undefined)).toBeNull()
  })

  it('handles min-only salary', () => {
    const result = formatSalary(80000, null, 'monthly')
    expect(result).toBeTruthy()
    expect(result).toContain('80')
  })

  it('handles max-only salary', () => {
    const result = formatSalary(null, 200000, 'yearly')
    expect(result).toBeTruthy()
    expect(result).toContain('200')
  })
})

// ── Email validation ──────────────────────────────────────────────────────────
describe('Email validation regex', () => {
  const isValid = (email) => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)

  it('accepts valid emails', () => {
    expect(isValid('user@example.com')).toBe(true)
    expect(isValid('name.surname@company.org')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValid('notanemail')).toBe(false)
    expect(isValid('missing@tld')).toBe(false)
    expect(isValid('')).toBe(false)
  })
})

// ── Time ago formatting ───────────────────────────────────────────────────────
describe('timeAgo formatting', () => {
  const timeAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  it('returns Today for current date', () => {
    expect(timeAgo(new Date())).toBe('Today')
  })

  it('returns 1 day ago for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000)
    expect(timeAgo(yesterday)).toBe('1 day ago')
  })

  it('returns N days ago for older dates', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000)
    expect(timeAgo(fiveDaysAgo)).toBe('5 days ago')
  })
})
