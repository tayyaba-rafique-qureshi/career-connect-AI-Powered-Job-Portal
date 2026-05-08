import { useState } from 'react'
import { X, Link2, Mail, MessageCircle, Check } from 'lucide-react'

export default function ShareJobModal({ job, onClose }) {
  const [copied, setCopied] = useState(false)
  const jobUrl = `${window.location.origin}/dashboard/applicant?job=${job._id}`
  const shareText = `Check out this job: ${job.title} at ${job.company} - ${job.location || 'Remote'}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = jobUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const emailShare = () => {
    const subject = encodeURIComponent(`Job opportunity: ${job.title} at ${job.company}`)
    const body = encodeURIComponent(`${shareText}\n\nApply here: ${jobUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const whatsappShare = () => {
    const text = encodeURIComponent(`${shareText}\n\n${jobUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative', backgroundColor: 'white',
        borderRadius: '12px', width: '420px', maxWidth: '90vw',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        animation: 'shareModalIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E4E2E0',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2D2D2D', margin: 0 }}>
            Share this job
          </h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: 'none', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            backgroundColor: 'transparent', color: '#595959',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F0F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Job preview */}
        <div style={{ padding: '16px 24px', backgroundColor: '#F7F9FC', borderBottom: '1px solid #E4E2E0' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#2D2D2D', margin: '0 0 2px' }}>
            {job.title}
          </p>
          <p style={{ fontSize: '13px', color: '#595959', margin: 0 }}>
            {job.company} · {job.location || 'Remote'}
          </p>
        </div>

        {/* Share options */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Copy link */}
          <button onClick={copyLink} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            backgroundColor: copied ? '#E7F5E8' : '#F7F9FC',
            border: `1px solid ${copied ? '#A8D5AD' : '#E4E2E0'}`,
            borderRadius: '8px', cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.backgroundColor = '#E8F0FE' } }}
            onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.backgroundColor = '#F7F9FC' } }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: copied ? '#C8E6C9' : '#E8F0FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {copied ? <Check size={18} color="#137333" /> : <Link2 size={18} color="#2557A7" />}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: copied ? '#137333' : '#2D2D2D', margin: 0 }}>
                {copied ? 'Link copied!' : 'Copy link'}
              </p>
              <p style={{ fontSize: '12px', color: '#767676', margin: '2px 0 0' }}>
                {copied ? 'Paste it anywhere to share' : 'Copy the job link to clipboard'}
              </p>
            </div>
          </button>

          {/* Email */}
          <button onClick={emailShare} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            backgroundColor: '#F7F9FC', border: '1px solid #E4E2E0',
            borderRadius: '8px', cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.backgroundColor = '#E8F0FE' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.backgroundColor = '#F7F9FC' }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#FFF4E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mail size={18} color="#B45309" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', margin: 0 }}>Email</p>
              <p style={{ fontSize: '12px', color: '#767676', margin: '2px 0 0' }}>Share via email</p>
            </div>
          </button>

          {/* WhatsApp */}
          <button onClick={whatsappShare} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            backgroundColor: '#F7F9FC', border: '1px solid #E4E2E0',
            borderRadius: '8px', cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.backgroundColor = '#E8F8EC' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.backgroundColor = '#F7F9FC' }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#E8F8EC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MessageCircle size={18} color="#25D366" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', margin: 0 }}>WhatsApp</p>
              <p style={{ fontSize: '12px', color: '#767676', margin: '2px 0 0' }}>Share on WhatsApp</p>
            </div>
          </button>
        </div>

        <style>{`
          @keyframes shareModalIn {
            from { opacity: 0; transform: scale(0.95) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )
}
