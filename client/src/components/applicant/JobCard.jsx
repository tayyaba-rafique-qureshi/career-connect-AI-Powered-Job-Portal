import { Bookmark, MapPin } from 'lucide-react'
import AIMatchBadge from './AIMatchBadge'
import { formatSalary } from '../../utils/formatSalary'
import { useState } from 'react'

const timeAgo = (date) => {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const JOB_TYPE_COLORS = {
  'full-time': { bg: '#E7F5E8', color: '#137333' },
  'part-time': { bg: '#FFF4E0', color: '#B45309' },
  'contract': { bg: '#E8F0FE', color: '#1558D6' },
  'internship': { bg: '#F3E8FF', color: '#7E22CE' },
}

export default function JobCard({ job, selected, saved, onSelect, onSave, matchScore }) {
  const [hovered, setHovered] = useState(false)
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
        backgroundColor: selected ? '#F0F5FF' : '#FFFFFF',
        border: `1px solid ${selected ? '#2557A7' : '#E4E2E0'}`,
        borderLeft: selected ? '3px solid #2557A7' : '3px solid transparent',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: hovered && !selected ? '0 2px 8px rgba(0,0,0,0.12)' : selected ? '0 1px 4px rgba(37,87,167,0.1)' : 'none',
      }}
    >
      {/* Top badges + actions row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {hasEasilyApply && (
            <Badge bg="#E8F0FE" color="#1558D6">Easily apply</Badge>
          )}
          {isUrgent && (
            <Badge bg="#FEECEA" color="#D93025">Urgently hiring</Badge>
          )}
          {job.multipleOpenings && (
            <Badge bg="#F0F0F0" color="#595959">Multiple openings</Badge>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
          {matchScore !== undefined && <AIMatchBadge score={matchScore} />}
          <IconBtn
            onClick={e => { e.stopPropagation(); onSave() }}
            active={saved}
            title={saved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark size={16} fill={saved ? '#2557A7' : 'none'} />
          </IconBtn>
        </div>
      </div>

      {/* Job title */}
      <h3 style={{
        fontSize: '15px',
        fontWeight: '700',
        color: '#2557A7',
        margin: '0 0 4px',
        lineHeight: 1.3,
        textDecoration: hovered ? 'underline' : 'none',
      }}>
        {job.title}
      </h3>

      {/* Company */}
      <p style={{ fontSize: '14px', color: '#595959', margin: '0 0 4px' }}>
        {job.company}
      </p>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#595959', marginBottom: '8px' }}>
        <MapPin size={13} style={{ flexShrink: 0, color: '#767676' }} />
        <span>{job.location}</span>
      </div>

      {/* Salary */}
      {salaryText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2D7D2E', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600' }}>✓</span>
          <span>{salaryText}</span>
        </div>
      )}

      {/* Job type badges */}
      {job.jobType?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {job.jobType.map(t => {
            const colors = JOB_TYPE_COLORS[t] || { bg: '#E8F0FE', color: '#1558D6' }
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#2D7D2E', fontSize: '12px', fontWeight: '600' }}>✓</span>
                <Badge bg={colors.bg} color={colors.color}>{t.charAt(0).toUpperCase() + t.slice(1)}</Badge>
              </div>
            )
          })}
        </div>
      )}

      {/* Skills preview */}
      {skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {skills.slice(0, 3).map(s => (
            <span key={s} style={{
              fontSize: '12px',
              padding: '2px 8px',
              backgroundColor: '#F0F0F0',
              color: '#595959',
              borderRadius: '3px',
            }}>{s}</span>
          ))}
          {skills.length > 3 && <span style={{ fontSize: '12px', color: '#767676' }}>+{skills.length - 3} more</span>}
        </div>
      )}

      {/* Posted date */}
      <p style={{ fontSize: '12px', color: '#767676', margin: '8px 0 0' }}>
        {timeAgo(job.createdAt)}
      </p>
    </div>
  )
}

function Badge({ bg, color, children }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: '24px',
      padding: '0 10px',
      borderRadius: '4px',
      backgroundColor: bg,
      color: color,
      fontSize: '13px',
      fontWeight: '500',
      lineHeight: 1,
    }}>
      {children}
    </span>
  )
}

function IconBtn({ onClick, active, title, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: hovered ? '#F0F0F0' : 'transparent',
        color: active ? '#2557A7' : '#767676',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
