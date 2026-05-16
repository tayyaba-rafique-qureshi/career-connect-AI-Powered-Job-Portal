import { useState } from 'react'
import { Calendar, MapPin, Video, ExternalLink, Copy, Check, Navigation } from 'lucide-react'

// ── Detect meeting platform from URL ──────────────────────────────────────────
const detectPlatform = (url = '') => {
  if (!url) return { name: 'Meeting', color: '#2557A7', icon: '🔗' }
  const u = url.toLowerCase()
  if (u.includes('meet.google'))  return { name: 'Google Meet', color: '#00897B', icon: '📹' }
  if (u.includes('zoom.us'))       return { name: 'Zoom', color: '#2D8CFF', icon: '📹' }
  if (u.includes('teams.microsoft') || u.includes('teams.live'))
                                   return { name: 'Microsoft Teams', color: '#6264A7', icon: '📹' }
  if (u.includes('webex'))         return { name: 'Webex', color: '#009A44', icon: '📹' }
  if (u.includes('whereby'))       return { name: 'Whereby', color: '#5C6BC0', icon: '📹' }
  return { name: 'Virtual Meeting', color: '#2557A7', icon: '🔗' }
}

// ── Generate ICS calendar file ──────────────────────────────────────────────
const generateICS = (interview, jobTitle, company) => {
  const dateStr = interview.date?.replace(/-/g, '') || '20260101'
  const timeStr = interview.time?.replace(':', '') || '1000'
  const dtStart = `${dateStr}T${timeStr}00`
  const dtEnd   = `${dateStr}T${(parseInt(timeStr) + 100).toString().padStart(4, '0')}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareerConnect//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Interview - ${jobTitle} at ${company}`,
    `DESCRIPTION:${interview.type === 'virtual' ? `Join: ${interview.meetingLink || 'Link TBD'}` : `Address: ${interview.address || 'TBD'}`}`,
    `LOCATION:${interview.type === 'virtual' ? 'Virtual' : (interview.address || 'TBD')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `interview-${jobTitle.replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InterviewCard({ application }) {
  const job = application.job || {}
  const iv  = application.interview
  const [copied, setCopied] = useState(false)

  if (!iv) return null

  const formatDate = (d) => {
    if (!d) return 'Date TBD'
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(iv.address || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(iv.address || '')}`
  const platform = detectPlatform(iv.meetingLink)

  const isVirtual   = iv.type === 'virtual'
  const isInPerson  = iv.type === 'in-person'
  const scheduledAt = iv.scheduledAt ? new Date(iv.scheduledAt) : null
  const isPast = scheduledAt && !Number.isNaN(scheduledAt.getTime()) && scheduledAt < new Date()
  const interviewStatus = iv.status || (isPast ? 'completed' : 'scheduled')

  const statusStyles = interviewStatus === 'completed'
    ? { backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-3)', borderColor: 'var(--cc-border)' }
    : interviewStatus === 'cancelled'
    ? { backgroundColor: 'var(--cc-red-bg)', color: 'var(--cc-red)', borderColor: 'var(--cc-red)' }
    : { backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)', borderColor: 'var(--cc-green-border)' }

  return (
    <div className="p-4 border-b border-[var(--cc-border)] hover:bg-[var(--cc-surface-2)] transition-colors">
      <div className="flex items-start gap-4">

        {/* Company logo */}
        <div className="w-12 h-12 rounded-lg bg-[var(--cc-blue-light)] flex items-center justify-center text-[var(--cc-blue)] font-bold text-sm shrink-0">
          {(job.company || 'C').slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1">
          {/* Job header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-[var(--cc-text-1)] text-sm">{job.title}</h3>
              <p className="text-sm text-[var(--cc-text-2)]">{job.company}</p>
            </div>
            <span className="text-xs px-2.5 py-1 border rounded-full font-semibold shrink-0" style={statusStyles}>
              {interviewStatus === 'completed' ? 'Completed' : interviewStatus === 'cancelled' ? 'Cancelled' : 'Interview Scheduled'}
            </span>
          </div>

          {/* ── Interview Details Card ── */}
          <div className="mt-3 rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)' }}>

            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-[var(--cc-text-1)]">
              <Calendar size={14} className="text-[var(--cc-blue)] shrink-0" />
              <span className="font-semibold">{formatDate(iv.date)}</span>
              {iv.time && (
                <span className="text-[var(--cc-text-2)]">at {formatTime(iv.time)}</span>
              )}
            </div>

            {/* ──── VIRTUAL ──── */}
            {isVirtual && (
              <div className="space-y-2">
                {/* Platform label */}
                <div className="flex items-center gap-2 text-sm text-[var(--cc-text-2)]">
                  <Video size={14} className="text-[var(--cc-blue)] shrink-0" />
                  <span>
                    Virtual Interview
                    {iv.meetingLink && (
                      <span
                        className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
                      >
                        {platform.name}
                      </span>
                    )}
                  </span>
                </div>

                {/* Action buttons */}
                {iv.meetingLink ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={iv.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                      style={{ backgroundColor: platform.color }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Video size={15} />
                      Join Meeting
                      <ExternalLink size={12} className="opacity-70" />
                    </a>
                    <button
                      onClick={() => generateICS(iv, job.title, job.company)}
                      className="text-xs text-[var(--cc-blue)] hover:underline font-medium"
                    >
                      + Add to Calendar
                    </button>
                  </div>
                ) : (
                  <p className="text-xs rounded px-2 py-1 inline-block" style={{ color: 'var(--cc-amber)', backgroundColor: 'var(--cc-amber-bg)', border: '1px solid var(--cc-amber)' }}>
                    ⏳ Meeting link will be provided soon
                  </p>
                )}
              </div>
            )}

            {/* ──── IN-PERSON ──── */}
            {isInPerson && (
              <div className="space-y-2">
                {/* Location label */}
                <div className="flex items-center gap-2 text-sm text-[var(--cc-text-2)]">
                  <MapPin size={14} className="text-[var(--cc-blue)] shrink-0" />
                  <span>In-Person Interview</span>
                </div>

                {iv.address ? (
                  <>
                    {/* Address box */}
                    <div className="flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-blue-border)' }}>
                      <MapPin size={15} className="text-[var(--cc-blue)] shrink-0 mt-0.5" />
                      <p className="text-sm text-[var(--cc-text-1)] font-medium leading-snug">
                        {iv.address}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
                      >
                        <Navigation size={14} />
                        Get Directions
                        <ExternalLink size={12} className="opacity-70" />
                      </a>

                      <button
                        onClick={handleCopyAddress}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                        style={{ color: 'var(--cc-text-2)', border: '1px solid var(--cc-border)', backgroundColor: 'var(--cc-surface)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cc-blue)'; e.currentTarget.style.color = 'var(--cc-blue)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cc-border)'; e.currentTarget.style.color = 'var(--cc-text-2)' }}
                      >
                        {copied
                          ? <><Check size={13} className="text-[var(--cc-green)]" /> Copied!</>
                          : <><Copy size={13} /> Copy Address</>
                        }
                      </button>

                      <button
                        onClick={() => generateICS(iv, job.title, job.company)}
                        className="text-xs text-[var(--cc-blue)] hover:underline font-medium"
                      >
                        + Add to Calendar
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs rounded px-2 py-1 inline-block" style={{ color: 'var(--cc-amber)', backgroundColor: 'var(--cc-amber-bg)', border: '1px solid var(--cc-amber)' }}>
                    ⏳ Office address will be confirmed soon
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {iv.notes && (
              <div className="pt-1" style={{ borderTop: '1px solid var(--cc-blue-border)' }}>
                <p className="text-xs text-[var(--cc-text-2)] italic">📝 {iv.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
