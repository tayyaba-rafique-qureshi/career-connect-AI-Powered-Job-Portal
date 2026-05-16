/**
 * HelpModal — FAQ / Help centre for applicants.
 * Opened from the Navbar Help button.
 */
import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react'

const FAQS = [
  {
    category: 'AI Match Score',
    items: [
      {
        q: 'What is the AI match score?',
        a: 'The AI match score (0–100%) shows how well your profile and resume align with a job\'s requirements. It considers your skills, experience level, resume language, and tools.',
      },
      {
        q: 'How do I improve my score?',
        a: 'Add missing skills to your profile, upload a text-based PDF resume, and make sure your experience section is complete. Skills have the biggest impact on your score.',
      },
      {
        q: 'Why is my score low even though I\'m qualified?',
        a: 'The score is based on what\'s in your profile and resume. If your resume doesn\'t mention certain skills or technologies, the AI can\'t detect them. Try updating your profile skills list.',
      },
    ],
  },
  {
    category: 'Applying for Jobs',
    items: [
      {
        q: 'How do I apply for a job?',
        a: 'Click "Apply now" on any job listing. A modal will appear showing your AI match score, matched/missing skills, and a cover letter field. Click "Submit Application" to apply.',
      },
      {
        q: 'Can I apply without a resume?',
        a: 'You can submit an application, but your AI match score won\'t be calculated without a resume. Upload a PDF resume in your profile for the best experience.',
      },
      {
        q: 'How do I track my applications?',
        a: 'Go to My Jobs → Applied to see all your submitted applications and their current status (Pending, Reviewed, Interview, Offered, Rejected).',
      },
    ],
  },
  {
    category: 'Profile & Resume',
    items: [
      {
        q: 'How do I upload my resume?',
        a: 'Go to your Profile page and click the Resume section. Upload a text-based PDF (not a scanned image). The AI will extract your skills and experience automatically.',
      },
      {
        q: 'What file types are supported for resume upload?',
        a: 'Only PDF files are supported. Make sure your PDF is text-based (not a scanned image) so the AI can extract your information.',
      },
    ],
  },
  {
    category: 'Saved Jobs & Notifications',
    items: [
      {
        q: 'How do I save a job?',
        a: 'Click the bookmark icon on any job card or in the job details panel. Saved jobs appear under My Jobs → Saved.',
      },
      {
        q: 'How do I hide a job I\'m not interested in?',
        a: 'Click the thumbs-down icon on a job. It will be hidden from your feed. You can undo this immediately with the "Undo" button in the toast notification.',
      },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid var(--cc-border)',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '12px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', lineHeight: 1.4 }}>{q}</span>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />
        }
      </button>
      {open && (
        <p style={{
          margin: '0 0 12px', fontSize: '13px', color: 'var(--cc-text-2)',
          lineHeight: 1.65, paddingRight: '24px',
        }}>
          {a}
        </p>
      )}
    </div>
  )
}

export default function HelpModal({ onClose }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? FAQS.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(query.toLowerCase()) ||
            item.a.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQS

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--cc-overlay)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        backgroundColor: 'var(--cc-surface)', borderRadius: '16px',
        boxShadow: 'var(--cc-shadow-lg)',
        width: '100%', maxWidth: '520px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--cc-border)',
          background: 'var(--cc-bg-gradient)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)' }}>
                Help Centre
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--cc-text-3)' }}>
                Frequently asked questions
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--cc-text-3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--cc-surface)', borderRadius: '8px',
            border: '1px solid var(--cc-border)',
          }}>
            <Search size={15} style={{ color: 'var(--cc-text-4)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search help articles…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: '13px', color: 'var(--cc-text-1)',
                backgroundColor: 'transparent', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* FAQ list — scrollable */}
        <div style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--cc-text-4)', textAlign: 'center', padding: '24px 0' }}>
              No results for "{query}"
            </p>
          ) : (
            filtered.map(cat => (
              <div key={cat.category} style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: '11px', fontWeight: '700', color: 'var(--cc-blue)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  margin: '0 0 4px',
                }}>
                  {cat.category}
                </p>
                {cat.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--cc-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--cc-text-4)' }}>
            Still need help?{' '}
            <a href="mailto:support@careerconnect.com" style={{ color: 'var(--cc-blue)', textDecoration: 'none', fontWeight: '600' }}>
              Contact support
            </a>
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px', borderRadius: '8px',
              backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)',
              border: 'none', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
