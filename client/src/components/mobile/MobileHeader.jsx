/**
 * MobileHeader
 * Sticky top bar shown only on mobile (≤768px).
 * Shows the CareerConnect logo (text fallback — no image asset exists)
 * and optional right-side slot for action buttons.
 *
 * Props:
 *   rightSlot  — ReactNode rendered on the right side
 *   title      — optional override text (e.g. recruiter name)
 *   variant    — 'applicant' (default) | 'recruiter' — controls logo link destination
 */
import { Link } from 'react-router-dom'

export default function MobileHeader({ rightSlot, title, variant = 'applicant' }) {
  const logoHref = variant === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/applicant'

  return (
    <header style={{
      position:        'sticky',
      top:             0,
      zIndex:          50,
      height:          '56px',
      backgroundColor: 'var(--cc-surface)',
      borderBottom:    '1px solid var(--cc-border)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 16px',
      boxShadow:       'var(--cc-shadow)',
    }}>
      {/* Logo — text fallback (no image asset in project) */}
      <Link
        to={logoHref}
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}
      >
        {title ? (
          <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--cc-text-1)' }}>
            {title}
          </span>
        ) : (
          <>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cc-text-1)', letterSpacing: '-0.3px' }}>
              Career
            </span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cc-blue)', letterSpacing: '-0.3px' }}>
              Connect
            </span>
          </>
        )}
      </Link>

      {/* Right slot — notifications, profile, etc. */}
      {rightSlot && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {rightSlot}
        </div>
      )}
    </header>
  )
}
