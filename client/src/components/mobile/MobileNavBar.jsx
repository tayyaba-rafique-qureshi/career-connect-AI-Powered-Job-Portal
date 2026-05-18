/**
 * MobileNavBar
 * Fixed bottom navigation bar for mobile (≤768px).
 * Supports two variants: 'applicant' and 'recruiter'.
 *
 * Usage:
 *   <MobileNavBar variant="applicant" />
 *   <MobileNavBar variant="recruiter" />
 */
import { NavLink } from 'react-router-dom'
import { Home, Briefcase, MessageSquare, Bell, User, LayoutDashboard, PlusCircle } from 'lucide-react'

// ── Applicant nav items ───────────────────────────────────────────────────────
const APPLICANT_ITEMS = [
  { to: '/dashboard/applicant', icon: Home,          label: 'Home' },
  { to: '/my-jobs',             icon: Briefcase,     label: 'My Jobs' },
  { to: '/messages',            icon: MessageSquare, label: 'Messages' },
  { to: '/notifications',       icon: Bell,          label: 'Alerts' },
  { to: '/profile',             icon: User,          label: 'Profile' },
]

// ── Recruiter nav items ───────────────────────────────────────────────────────
const RECRUITER_ITEMS = [
  { to: '/dashboard/recruiter',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/recruiter/jobs', icon: Briefcase,       label: 'My Jobs' },
  { to: '/employer/messages',        icon: MessageSquare,   label: 'Messages' },
  { to: '/profile',                  icon: User,            label: 'Profile' },
]

export default function MobileNavBar({ variant = 'applicant' }) {
  const items = variant === 'recruiter' ? RECRUITER_ITEMS : APPLICANT_ITEMS

  return (
    <nav style={{
      position:        'fixed',
      bottom:          0,
      left:            0,
      right:           0,
      zIndex:          50,
      height:          '60px',
      backgroundColor: 'var(--cc-surface)',
      borderTop:       '1px solid var(--cc-border)',
      display:         'flex',
      alignItems:      'stretch',
      boxShadow:       '0 -2px 12px rgba(0,0,0,0.08)',
      // Safe area for notched phones
      paddingBottom:   'env(safe-area-inset-bottom, 0px)',
    }}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard/applicant' || to === '/dashboard/recruiter'}
          style={({ isActive }) => ({
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '3px',
            textDecoration: 'none',
            color:          isActive ? 'var(--cc-blue)' : 'var(--cc-text-3)',
            fontSize:       '10px',
            fontWeight:     isActive ? '600' : '400',
            transition:     'color 0.15s',
            minWidth:       0,
          })}
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{ flexShrink: 0 }}
              />
              <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
