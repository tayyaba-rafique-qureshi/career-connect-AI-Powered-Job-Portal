/**
 * HelpPage — /help route
 * Full-page chat interface for the Help & FAQ feature.
 */
import Navbar from '../../components/shared/Navbar'
import HelpChatbot from '../../components/applicant/HelpChatbot'

export default function HelpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cc-bg-gradient)',
      fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
    }}>
      <Navbar />

      <div style={{
        paddingTop: '80px',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px 40px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Page heading */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 6px' }}>
            Help Centre
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--cc-text-3)', margin: 0 }}>
            Ask anything about CareerConnect — our bot answers instantly.
          </p>
        </div>

        {/* Chat card — fills remaining height */}
        <div style={{
          flex: 1,
          borderRadius: '16px',
          boxShadow: 'var(--cc-shadow-lg)',
          overflow: 'hidden',
          border: '1px solid var(--cc-border)',
          minHeight: 0,
        }}>
          <HelpChatbot mode="page" />
        </div>
      </div>
    </div>
  )
}
