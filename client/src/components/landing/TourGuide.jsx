/**
 * TourGuide — first-time visitor walkthrough
 * Fires automatically on first visit (localStorage flag).
 * A minimal step-by-step overlay with a spotlight + tooltip.
 */
import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const TOUR_KEY = 'cc_tour_done_v1'

const STEPS = [
  {
    title: 'Welcome to CareerConnect 👋',
    body:  'Pakistan\'s AI-powered job platform. We match your skills to the right opportunities automatically. Let us show you how it works in 4 quick steps.',
    target: null,   // no spotlight — center modal
  },
  {
    title: 'Upload your resume',
    body:  'Register and upload your CV. Our AI extracts your skills and experience to start matching you with relevant jobs instantly.',
    target: '#hero-cta',
  },
  {
    title: 'Browse AI-matched jobs',
    body:  'Every job gets an AI match score based on your profile. The higher the score, the better the fit — no more guessing.',
    target: '#featured-jobs',
  },
  {
    title: 'Build your CareerCONNECT resume',
    body:  'Use the built-in resume builder to create an ATS-friendly resume. Download it as a PDF or let it power your AI job matching.',
    target: null,
  },
]

export default function TourGuide() {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      // Slight delay so the page settles before the tour appears
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(TOUR_KEY, '1')
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      const nextStep = step + 1
      setStep(nextStep)
      // Scroll target into view if it has one
      const t = STEPS[nextStep].target
      if (t) {
        setTimeout(() => {
          document.querySelector(t)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    } else {
      dismiss()
    }
  }

  const back = () => { if (step > 0) setStep(step - 1) }

  if (!visible) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          backgroundColor: 'rgba(0,0,0,0.55)',
          animation: 'fadeIn 0.25s ease',
        }}
      />

      {/* Tour card — centered */}
      <div style={{
        position: 'fixed', zIndex: 9001,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '420px',
        backgroundColor: 'white', borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
        margin: '0 16px',
      }}>
        {/* Blue top bar */}
        <div style={{
          background: 'linear-gradient(135deg, #2557A7 0%, #1D4589 100%)',
          padding: '20px 20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="rgba(255,255,255,0.9)" />
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Quick tour · {step + 1}/{STEPS.length}
              </span>
            </div>
            <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0, display: 'flex', lineHeight: 1 }}>
              <X size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '10px 0 0', lineHeight: 1.3 }}>
            {s.title}
          </h2>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', padding: '14px 20px 0' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: '4px', borderRadius: '2px',
              flex: i <= step ? 1 : 0.4,
              backgroundColor: i <= step ? '#2557A7' : '#E4E2E0',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: '14px', color: '#595959', lineHeight: 1.65, margin: '0 0 20px' }}>
            {s.body}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={dismiss}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#9CA3AF', fontFamily: 'inherit', padding: 0 }}
            >
              Skip tour
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {step > 0 && (
                <button onClick={back} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '8px 14px', borderRadius: '8px',
                  border: '1px solid #E4E2E0', background: 'white',
                  fontSize: '13px', fontWeight: '600', color: '#595959',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button onClick={next} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '8px 18px', borderRadius: '8px',
                background: '#2557A7', border: 'none',
                fontSize: '13px', fontWeight: '700', color: 'white',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a4283'}
              onMouseLeave={e => e.currentTarget.style.background = '#2557A7'}
              >
                {isLast ? 'Get started' : 'Next'} {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }           to { opacity: 1 } }
        @keyframes slideUp { from { transform: translate(-50%, -44%); opacity: 0 } to { transform: translate(-50%, -50%); opacity: 1 } }
      `}</style>
    </>
  )
}
