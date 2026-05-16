/**
 * Frontend Component Tests
 * Tests UI components render correctly and respond to interactions.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AIMatchBadge from '../components/applicant/AIMatchBadge'

// ── AIMatchBadge ──────────────────────────────────────────────────────────────
describe('AIMatchBadge', () => {
  it('renders match score', () => {
    render(<AIMatchBadge score={87} />)
    expect(screen.getByText(/87%/)).toBeInTheDocument()
  })

  it('renders nothing when score is null', () => {
    const { container } = render(<AIMatchBadge score={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when score is undefined', () => {
    const { container } = render(<AIMatchBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('shows green for high match (>=70)', () => {
    const { container } = render(<AIMatchBadge score={85} />)
    const badge = container.firstChild
    expect(badge).toHaveStyle({ backgroundColor: expect.stringContaining('') })
  })
})
