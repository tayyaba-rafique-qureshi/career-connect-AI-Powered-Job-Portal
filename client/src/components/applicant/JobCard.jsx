import { Bookmark, MapPin, ThumbsDown } from 'lucide-react'
import { formatSalary } from '../../utils/formatSalary'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const timeAgo = (date) => {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// Job type badge colors — dark-mode-safe using semi-transparent tints
const JOB_TYPE_COLORS = {
  'full-time':  { bg: 'rgba(20,83,45,0.15)',  color: 'var(--cc-green)' },
  'part-time':  { bg: 'rgba(180,83,9,0.15)',  color: 'var(--cc-amber)' },
  'contract':   { bg: 'rgba(37,87,167,0.15)', color: 'var(--cc-blue)'  },
  'internship': { bg: 'rgba(126,34,206,0.15)',color: '#A78BFA'          },
}

// Match score color tier
function scoreTier(score) {
  if (score == null) return null
  if (score >= 80) return { bg: 'var(--cc-green-bg)', color: 'var(--cc-green)', border: 'var(--cc-green-border)' }
  if (score >= 60) return { bg: 'var(--cc-amber-bg)', color: 'var(--cc-amber)', border: 'var(--cc-amber)' }
  return { bg: 'var(--cc-surface-2)', color: 'var(--cc-text-3)', border: 'var(--cc-border)' }
}

export default function JobCard({
  job, selected, saved, onSelect, onSave, onDislike, disliked, onCompanyClick,
  // Mobile-only props
  isMobile, matchScore, applied, onApply,
}) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const skills = job.requiredSkills || job.skills || []
  const hasEasilyApply = job.workMode === 'remote' || job.easyApply
  const isUrgent = job.urgent || job.urgentlyHiring
  const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryType)

  // ── MOBILE CARD ───────────────────────────────────────────────────────────
  if (isMobile) {
    const tier = scoreTier(matchScore)
    const roundedScore = matchScore != null ? Math.round(matchScore) : null

    return (
      <div
        onClick={onSelect}
        style={{
          backgroundColor: 'var(--cc-surface)',
          border: '1px solid var(--cc-border)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--cc-shadow)',
          position: 'relative',
          transition: 'box-shadow 0.15s',
          // Prevent text selection on tap
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Top row: title + match score badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
          <h3 style={{
            fontSize: '15px', fontWeight: '700', color: 'var(--cc-blue)',
            margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0,
          }}>
            {job.title}
          </h3>
          {tier && roundedScore != null && (
            <span style={{
              flexShrink: 0,
              fontSize: '11px', fontWeight: '700',
              padding: '3px 8px', borderRadius: '10px',
              backgroundColor: tier.bg, color: tier.color,
              border: `1px solid ${tier.border}`,
              whiteSpace: 'nowrap',
            }}>
              {roundedScore}% Match
            </span>
          )}
        </div>

        {/* Company */}
        <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: '0 0 4px' }}>
          {job.company}
        </p>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--cc-text-3)', marginBottom: '8px' }}>
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span>{job.location}</span>
          {job.workMode && (
            <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--cc-surface-2)', fontSize: '11px', color: 'var(--cc-text-2)' }}>
              {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
            </span>
          )}
        </div>

        {/* Job type + salary row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {job.jobType?.slice(0, 2).map(t => {
            const c = JOB_TYPE_COLORS[t] || { bg: 'rgba(37,87,167,0.15)', color: 'var(--cc-blue)' }
            return (
              <span key={t} style={{
                fontSize: '11px', fontWeight: '500', padding: '2px 8px',
                borderRadius: '4px', backgroundColor: c.bg, color: c.color,
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            )
          })}
          {salaryText && (
            <span style={{ fontSize: '11px', color: 'var(--cc-green)', fontWeight: '600' }}>
              {salaryText}
            </span>
          )}
        </div>

        {/* Skills preview */}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
            {skills.slice(0, 3).map(s => (
              <span key={s} style={{
                fontSize: '11px', padding: '2px 7px',
                backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-2)',
                borderRadius: '3px', border: '1px solid var(--cc-border)',
              }}>{s}</span>
            ))}
            {skills.length > 3 && (
              <span style={{ fontSize: '11px', color: 'var(--cc-text-3)' }}>+{skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Bottom row: posted date + action buttons + Apply */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--cc-text-3)' }}>{timeAgo(job.createdAt)}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Save button */}
            <button
              onClick={e => { e.stopPropagation(); onSave() }}
              title={saved ? 'Remove from saved' : 'Save job'}
              style={{
                width: '30px', height: '30px', borderRadius: '50%', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backgroundColor: 'var(--cc-surface-2)',
              }}
            >
              <Bookmark size={14} fill={saved ? 'var(--cc-blue)' : 'none'} color={saved ? 'var(--cc-blue)' : 'var(--cc-text-3)'} />
            </button>

            {/* Apply button */}
            {applied ? (
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '0 12px', height: '30px',
                display: 'inline-flex', alignItems: 'center',
                backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)',
                borderRadius: '8px', border: '1px solid var(--cc-green-border)',
                whiteSpace: 'nowrap',
              }}>
                ✓ Applied
              </span>
            ) : (
              <button
                onClick={onApply}
                style={{
                  fontSize: '12px', fontWeight: '600', padding: '0 14px', height: '30px',
                  backgroundColor: 'var(--cc-blue)', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── DESKTOP CARD (unchanged) ──────────────────────────────────────────────
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: selected ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
        border: `1px solid ${selected ? 'var(--cc-blue)' : 'var(--cc-border)'}`,
        borderLeft: selected ? '3px solid var(--cc-blue)' : '3px solid transparent',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s, background-color 0.2s',
        boxShadow: hovered && !selected ? 'var(--cc-shadow-md)' : selected ? '0 1px 4px rgba(37,87,167,0.15)' : 'none',
      }}
    >
      {/* Top badges + actions row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {hasEasilyApply && <Badge bg="rgba(37,87,167,0.15)" color="var(--cc-blue)">Easily apply</Badge>}
          {isUrgent       && <Badge bg="rgba(217,48,37,0.15)"  color="var(--cc-red)">Urgently hiring</Badge>}
          {job.multipleOpenings && <Badge bg="var(--cc-surface-2)" color="var(--cc-text-2)">Multiple openings</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
          <IconBtn onClick={e => { e.stopPropagation(); onSave() }} active={saved} title={saved ? 'Remove from saved' : 'Save job'}>
            <Bookmark size={16} fill={saved ? 'var(--cc-blue)' : 'none'} color={saved ? 'var(--cc-blue)' : 'var(--cc-text-3)'} />
          </IconBtn>
          {onDislike && (
            <IconBtn onClick={e => { e.stopPropagation(); onDislike() }} active={disliked} title="Not interested" activeColor="var(--cc-red)">
              <ThumbsDown size={15} fill={disliked ? 'var(--cc-red)' : 'none'} color={disliked ? 'var(--cc-red)' : 'var(--cc-text-3)'} />
            </IconBtn>
          )}
        </div>
      </div>

      {/* Job title */}
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cc-blue)', margin: '0 0 4px', lineHeight: 1.3, textDecoration: hovered ? 'underline' : 'none' }}>
        {job.title}
      </h3>

      {/* Company */}
      <p
        onClick={e => { e.stopPropagation(); if (onCompanyClick) onCompanyClick(job.company); else navigate(`/company-reviews?company=${encodeURIComponent(job.company)}`) }}
        style={{ fontSize: '14px', color: 'var(--cc-text-2)', margin: '0 0 4px', cursor: 'pointer', display: 'inline-block' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--cc-blue)'; e.currentTarget.style.textDecoration = 'underline' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--cc-text-2)'; e.currentTarget.style.textDecoration = 'none' }}
      >
        {job.company}
      </p>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--cc-text-2)', marginBottom: '8px' }}>
        <MapPin size={13} style={{ flexShrink: 0, color: 'var(--cc-text-3)' }} />
        <span>{job.location}</span>
      </div>

      {/* Salary */}
      {salaryText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--cc-green)', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600' }}>✓</span>
          <span>{salaryText}</span>
        </div>
      )}

      {/* Job type badges */}
      {job.jobType?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {job.jobType.map(t => {
            const c = JOB_TYPE_COLORS[t] || { bg: 'rgba(37,87,167,0.15)', color: 'var(--cc-blue)' }
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--cc-green)', fontSize: '12px', fontWeight: '600' }}>✓</span>
                <Badge bg={c.bg} color={c.color}>{t.charAt(0).toUpperCase() + t.slice(1)}</Badge>
              </div>
            )
          })}
        </div>
      )}

      {/* Skills preview */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {skills.slice(0, 3).map(s => (
            <span key={s} style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-2)', borderRadius: '3px', border: '1px solid var(--cc-border)' }}>{s}</span>
          ))}
          {skills.length > 3 && <span style={{ fontSize: '12px', color: 'var(--cc-text-3)' }}>+{skills.length - 3} more</span>}
        </div>
      )}

      {/* Posted date */}
      <p style={{ fontSize: '12px', color: 'var(--cc-text-3)', margin: '8px 0 0' }}>{timeAgo(job.createdAt)}</p>
    </div>
  )
}

function Badge({ bg, color, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: '24px', padding: '0 10px', borderRadius: '4px', backgroundColor: bg, color, fontSize: '13px', fontWeight: '500', lineHeight: 1 }}>
      {children}
    </span>
  )
}

function IconBtn({ onClick, active, title, activeColor = 'var(--cc-blue)', children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: hovered ? 'var(--cc-surface-2)' : 'transparent',
        color: active ? activeColor : 'var(--cc-text-3)',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
