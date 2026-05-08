import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Clock, ArrowRight } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import { getNotifications, markRead, markAllRead } from '../../services/notificationService'

/* ── SVG illustration ── */
const NotificationsSVG = () => (
  <svg width="180" height="160" viewBox="0 0 180 160" fill="none">
    <ellipse cx="90" cy="148" rx="60" ry="8" fill="#EDF3FC" />
    {/* Base/platform */}
    <ellipse cx="90" cy="132" rx="40" ry="6" fill="#C5D8FA" opacity="0.5" />
    {/* Bell body */}
    <path d="M60 100 Q58 72 90 65 Q122 72 120 100 L120 110 L60 110 Z" fill="#2557A7" />
    <rect x="60" y="108" width="60" height="8" rx="4" fill="#1A4589" />
    {/* Bell top */}
    <circle cx="90" cy="65" r="8" fill="#4A90D9" />
    <rect x="86" y="57" width="8" height="8" rx="0" fill="#4A90D9" />
    {/* Clapper */}
    <ellipse cx="90" cy="120" rx="8" ry="5" fill="#F5A623" />
    {/* Notification dot */}
    <circle cx="118" cy="70" r="14" fill="#D93025" />
    <text x="118" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">!</text>
    {/* Notification lines floating */}
    <rect x="30" y="78" width="20" height="4" rx="2" fill="#A0B8E8" opacity="0.7" />
    <rect x="25" y="88" width="28" height="4" rx="2" fill="#A0B8E8" opacity="0.5" />
    <rect x="130" y="82" width="22" height="4" rx="2" fill="#A0B8E8" opacity="0.7" />
    <rect x="134" y="92" width="16" height="4" rx="2" fill="#A0B8E8" opacity="0.5" />
  </svg>
)

const TYPE_META = {
  job_match:     { icon: '🎯', color: '#2557A7', bg: '#E8F0FE' },
  interview:     { icon: '📅', color: '#B45309', bg: '#FFF4E0' },
  status_update: { icon: '📋', color: '#137333', bg: '#E7F5E8' },
  general:       { icon: '🔔', color: '#767676', bg: '#F0F0F0' },
}

const timeAgo = (date) => {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ── Job alert chips (mimicking Indeed's notification empty state) ── */
const SAMPLE_ALERTS = [
  { label: 'remote', location: 'islamabad', count: 108 },
  { label: 'centrox ai', location: 'islamabad', count: null },
  { label: 'systems ltd internships', location: 'islamabad', count: 19 },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = async (id) => {
    await markRead(id).catch(() => {})
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await markAllRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifications.filter(n => !n.read)

  return (
    <div className="notifications-root" style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EDF3FC 0%, #F7F9FC 50%, #FFFFFF 100%)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}>
      <Navbar />

      <div className="notifications-container" style={{ paddingTop: '60px', maxWidth: '760px', margin: '0 auto', padding: '60px 40px 0' }}>
        <div style={{ paddingTop: '32px', paddingBottom: '40px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#767676', fontSize: '14px' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            /* ── Empty state ── */
            <div style={{ textAlign: 'center' }}>
              <NotificationsSVG />
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#2D2D2D', margin: '24px 0 8px' }}>
                Nothing right now. Check back later!
              </h1>
              <p style={{ fontSize: '14px', color: '#767676', margin: '0 0 24px' }}>
                Get updates from your recent searches
              </p>

              {/* Job alert chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #E4E2E0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'white' }}>
                {SAMPLE_ALERTS.map((alert, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: i < SAMPLE_ALERTS.length - 1 ? '1px solid #E4E2E0' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Clock size={16} color="#767676" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: '#2D2D2D' }}>
                        {alert.count && (
                          <span style={{ color: '#D93025', fontWeight: '700' }}>{alert.count} new jobs </span>
                        )}
                        for <strong>{alert.label}</strong> near <strong>{alert.location}</strong>
                      </span>
                    </div>
                    <button style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: '1px solid #E4E2E0', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', backgroundColor: 'white', color: '#767676',
                    }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 16px', lineHeight: 1.6 }}>
                You'll receive your email update when jobs become available.{' '}
                <a href="#" style={{ color: '#2557A7' }}>Edit email settings</a>
              </p>

              <Link to="/dashboard/applicant" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 32px', height: '44px',
                border: '1px solid #E4E2E0', borderRadius: '6px',
                fontSize: '14px', fontWeight: '600', color: '#2D2D2D',
                textDecoration: 'none', backgroundColor: 'white',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2557A7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E4E2E0'}
              >
                Find jobs <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            /* ── Notifications list ── */
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E4E2E0', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid #E4E2E0',
              }}>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#2D2D2D', margin: 0 }}>
                  Notifications
                  {unread.length > 0 && (
                    <span style={{ fontSize: '14px', color: '#2557A7', fontWeight: '600', marginLeft: '8px' }}>
                      ({unread.length} new)
                    </span>
                  )}
                </h1>
                {unread.length > 0 && (
                  <button onClick={handleMarkAllRead} style={{
                    fontSize: '13px', color: '#2557A7', background: 'none',
                    border: 'none', cursor: 'pointer', fontWeight: '600',
                    fontFamily: 'inherit', padding: 0,
                  }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Items */}
              {notifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.general
                return (
                  <div key={n._id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #E4E2E0',
                    backgroundColor: !n.read ? '#F0F7FF' : 'white',
                    transition: 'background 0.12s',
                    cursor: 'pointer',
                  }}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    onMouseEnter={e => { if (n.read) e.currentTarget.style.backgroundColor = '#FAFAFA' }}
                    onMouseLeave={e => { if (n.read) e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: meta.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: !n.read ? '600' : '400',
                        color: '#2D2D2D', margin: '0 0 2px', lineHeight: 1.4,
                      }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '13px', color: '#595959', margin: '0 0 4px', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} color="#767676" />
                        <span style={{ fontSize: '12px', color: '#767676' }}>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: '#2557A7', flexShrink: 0, marginTop: '6px',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .notifications-container { padding: 60px 16px 0 !important; }
        }
      `}</style>
    </div>
  )
}
