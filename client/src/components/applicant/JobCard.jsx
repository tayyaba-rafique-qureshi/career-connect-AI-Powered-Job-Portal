import { Bookmark, MapPin, ThumbsDown } from 'lucide-react'
import AIMatchBadge from './AIMatchBadge'
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

export default function JobCard({ job, selected, saved, onSelect, onSave, matchScore, onDislike, disliked, onCompanyClick }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const skills = job.requiredSkills || job.skills || []
  const hasEasilyApply = job.workMode === 'remote' || job.easyApply
  const isUrgent = job.urgent || job.urgentlyHiring
  const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryType)

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
          {matchScore !== undefined && <AIMatchBadge score={matchScore} />}
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
