/**
 * ResumeBuilderPage.jsx
 * Route: /resume-builder
 *
 * ATS-friendly resume builder with:
 * - Pre-fill from onboarding data
 * - 7 collapsible editable sections
 * - Live preview panel (desktop) / preview tab (mobile)
 * - Smart summary generator
 * - Save to DB
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Plus, Trash2, Wand2,
  Save, Check, ArrowLeft, Eye, Edit3, X, GripVertical,
  User, FileText, Zap, Briefcase, FolderOpen, GraduationCap, Award
} from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import ATSPreview from '../../utils/resumeTemplate'

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

const RESUME_ACCENTS = [
  { name: 'Blue',    value: '#2557A7' },
  { name: 'Green',   value: '#137333' },
  { name: 'Indigo',  value: '#4F46E5' },
  { name: 'Slate',   value: '#334155' },
  { name: 'Rose',    value: '#BE123C' },
  { name: 'Amber',   value: '#B45309' },
]
const DEFAULT_ACCENT = RESUME_ACCENTS[0].value

const emptyExp = () => ({
  _id: uid(), jobTitle: '', company: '',
  startDate: '', endDate: '', current: false, bullets: ['']
})
const emptyProject = () => ({
  _id: uid(), name: '', techStack: '', description: '', link: ''
})
const emptyEdu = () => ({
  _id: uid(), degree: '', institution: '', year: '', cgpa: ''
})
const emptyCert = () => ({
  _id: uid(), name: '', issuer: '', year: ''
})

const parseMonthYear = (value) => {
  const parts = (value || '').trim().split(/\s+/)
  const monthIndex = MONTHS.indexOf(parts[0])
  const year = Number(parts.find(p => /^\d{4}$/.test(p)))
  if (monthIndex < 0 || !year) return null
  return year * 12 + monthIndex
}

const getYearRange = (value) => {
  const years = String(value || '').match(/\d{4}/g)?.map(Number) || []
  return years.length >= 2 ? years : null
}

// Smart summary generator (template-based "AI")
function buildSummary(profile, skills, workExp) {
  const ap = profile?.applicantProfile || {}
  const title = ap.professionalInfo?.currentTitle || 'professional'
  const exp   = ap.professionalInfo?.yearsOfExp   || ''
  const ind   = ap.professionalInfo?.industry     || 'technology'
  const topSkills = skills.slice(0, 5).join(', ') || 'various technologies'
  const recentCo  = workExp[0]?.company || ''

  const templates = [
    `Results-driven ${title} with ${exp ? exp + ' of' : ''} hands-on experience in ${ind}. Proficient in ${topSkills}. ${recentCo ? `Previously contributed at ${recentCo}, d` : 'D'}elivers high-quality solutions and continuously learns new technologies to create meaningful impact.`,
    `Dedicated ${title} with a strong background in ${ind} and expertise in ${topSkills}. Known for problem-solving skills, attention to detail, and a commitment to delivering results.${exp ? ` Brings ${exp} of experience` : ''} working in dynamic, fast-paced environments.`,
    `Motivated ${title} specialising in ${topSkills}. ${exp ? exp + ' of experience in the ' + ind + ' sector with a' : 'Strong'} track record of collaborating effectively and producing impactful outcomes. Committed to continuous growth and professional excellence.`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

// ── Input primitives ─────────────────────────────────────────────────────────
const inputStyle = (focused) => ({
  width: '100%', padding: '8px 10px',
  border: `1px solid ${focused ? 'var(--cc-blue)' : 'var(--cc-input-border)'}`,
  borderRadius: '6px', fontSize: '13px', color: 'var(--cc-text-1)',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s', backgroundColor: 'var(--cc-input-bg)',
  boxSizing: 'border-box',
})

function Field({ label, children, optional, error }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--cc-text-2)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{optional && <span style={{ fontWeight: '400', color: 'var(--cc-text-4)', marginLeft: '4px' }}>(optional)</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '11.5px', color: 'var(--cc-red)', margin: '5px 0 0' }}>{error}</p>}
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder, optional, type = 'text', error }) {
  const [focused, setFocused] = useState(false)
  return (
    <Field label={label} optional={optional} error={error}>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle(focused), border: `1px solid ${error ? 'var(--cc-red)' : (focused ? 'var(--cc-blue)' : 'var(--cc-input-border)')}` }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </Field>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 4, optional, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <Field label={label} optional={optional} error={error}>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...inputStyle(focused), border: `1px solid ${error ? 'var(--cc-red)' : (focused ? 'var(--cc-blue)' : 'var(--cc-input-border)')}`, resize: 'vertical', lineHeight: 1.6 }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </Field>
  )
}

// ── Section wrapper with collapse ────────────────────────────────────────────
function Section({ id, title, icon: Icon, open, onToggle, children, accentColor = 'var(--cc-blue)' }) {
  return (
    <div id={`section-${id}`} style={{
      backgroundColor: 'var(--cc-surface)', borderRadius: '10px',
      border: `1px solid ${open ? 'var(--cc-blue-border)' : 'var(--cc-border)'}`,
      marginBottom: '14px', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--cc-border)' : 'none',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            backgroundColor: 'var(--cc-blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={15} color={accentColor} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-1)' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={17} color="var(--cc-text-3)" /> : <ChevronDown size={17} color="var(--cc-text-3)" />}
      </button>
      {open && (
        <div style={{ padding: '18px 18px 10px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Skill chip ───────────────────────────────────────────────────────────────
function SkillChip({ skill, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '5px 11px', borderRadius: '20px',
      backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
      color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '500',
    }}>
      {skill}
      <button
        onClick={() => onRemove(skill)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--cc-blue)' }}
      >
        <X size={12} />
      </button>
    </span>
  )
}

// ── Work Experience entry ─────────────────────────────────────────────────────
function ExpEntry({ entry, onChange, onDelete, errors = {} }) {
  const update = (key, val) => onChange({ ...entry, [key]: val })
  const updateBullet = (i, val) => {
    const bullets = [...entry.bullets]
    bullets[i] = val
    onChange({ ...entry, bullets })
  }
  const addBullet = () => onChange({ ...entry, bullets: [...entry.bullets, ''] })
  const removeBullet = (i) => {
    const bullets = entry.bullets.filter((_, idx) => idx !== i)
    onChange({ ...entry, bullets: bullets.length ? bullets : [''] })
  }
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{
      border: '1px solid var(--cc-border)', borderRadius: '8px',
      padding: '14px', marginBottom: '12px', backgroundColor: 'var(--cc-surface-2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)' }}>
          {entry.jobTitle || 'New Position'}{entry.company ? ` · ${entry.company}` : ''}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-text-3)', padding: 0 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-red)', padding: 0 }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>JOB TITLE</label>
              <FocusInput value={entry.jobTitle} onChange={v => update('jobTitle', v)} placeholder="e.g. Software Engineer" error={errors.jobTitle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>COMPANY</label>
              <FocusInput value={entry.company} onChange={v => update('company', v)} placeholder="e.g. Google" error={errors.company} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>START DATE</label>
              <MonthYearPicker value={entry.startDate} onChange={v => update('startDate', v)} />
              {errors.startDate && <InlineError>{errors.startDate}</InlineError>}
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                END DATE
              </label>
              {entry.current ? (
                <span style={{ fontSize: '13px', color: 'var(--cc-blue)', fontWeight: '500' }}>Present</span>
              ) : (
                <MonthYearPicker value={entry.endDate} onChange={v => update('endDate', v)} />
              )}
              {errors.endDate && <InlineError>{errors.endDate}</InlineError>}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: 'var(--cc-text-2)', marginBottom: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={entry.current} onChange={e => onChange({ ...entry, current: e.target.checked, endDate: e.target.checked ? '' : entry.endDate })} />
            Currently working here
          </label>
          <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>RESPONSIBILITIES</label>
          {entry.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'flex-start' }}>
              <span style={{ marginTop: '9px', color: 'var(--cc-blue)', fontSize: '16px', lineHeight: 1 }}>•</span>
              <textarea
                value={b}
                onChange={e => updateBullet(i, e.target.value)}
                placeholder="Describe a key responsibility or achievement..."
                rows={2}
                style={{
                  flex: 1, padding: '7px 10px',
                  border: '1px solid var(--cc-input-border)', borderRadius: '6px',
                  fontSize: '13px', fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', lineHeight: 1.5,
                  backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--cc-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--cc-input-border)'}
              />
              {entry.bullets.length > 1 && (
                <button onClick={() => removeBullet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-red)', padding: '6px 0', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addBullet}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: '1px dashed var(--cc-blue-border)',
              borderRadius: '6px', padding: '6px 12px',
              fontSize: '12.5px', color: 'var(--cc-blue)', cursor: 'pointer',
              fontFamily: 'inherit', marginTop: '4px',
            }}
          >
            <Plus size={13} /> Add bullet point
          </button>
        </>
      )}
    </div>
  )
}

// ── Project entry ─────────────────────────────────────────────────────────────
function ProjectEntry({ entry, onChange, onDelete }) {
  const update = (key, val) => onChange({ ...entry, [key]: val })
  const [expanded, setExpanded] = useState(true)
  return (
    <div style={{ border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '14px', marginBottom: '12px', backgroundColor: 'var(--cc-surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)' }}>{entry.name || 'New Project'}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-text-3)', padding: 0 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-red)', padding: 0 }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>PROJECT NAME</label>
            <FocusInput value={entry.name} onChange={v => update('name', v)} placeholder="e.g. E-Commerce Platform" />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>TECH STACK</label>
            <FocusInput value={entry.techStack} onChange={v => update('techStack', v)} placeholder="React, Node.js, MongoDB" />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>LINK (optional)</label>
            <FocusInput value={entry.link} onChange={v => update('link', v)} placeholder="https://github.com/..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>DESCRIPTION</label>
            <textarea
              value={entry.description} onChange={e => update('description', e.target.value)}
              placeholder="Briefly describe what this project does and your role..."
              rows={2}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
              onFocus={e => e.target.style.borderColor = 'var(--cc-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--cc-input-border)'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Education entry ───────────────────────────────────────────────────────────
function EduEntry({ entry, onChange, onDelete, errors = {} }) {
  const update = (key, val) => onChange({ ...entry, [key]: val })
  return (
    <div style={{ border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '14px', marginBottom: '12px', backgroundColor: 'var(--cc-surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-red)', padding: 0 }}>
          <Trash2 size={15} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>DEGREE</label>
          <FocusInput value={entry.degree} onChange={v => update('degree', v)} placeholder="Bachelor's in Computer Science" error={errors.degree} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>INSTITUTION</label>
          <FocusInput value={entry.institution} onChange={v => update('institution', v)} placeholder="FAST-NUCES" error={errors.institution} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>YEARS ATTENDED</label>
          <EduYearPicker value={entry.year} onChange={v => update('year', v)} />
          {errors.year && <InlineError>{errors.year}</InlineError>}
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--cc-text-3)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>CGPA (optional)</label>
          <FocusInput value={entry.cgpa} onChange={v => update('cgpa', v)} placeholder="3.7 / 4.0" />
        </div>
      </div>
    </div>
  )
}

// ── Certification entry ───────────────────────────────────────────────────────
function CertEntry({ entry, onChange, onDelete }) {
  const update = (key, val) => onChange({ ...entry, [key]: val })
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
        <FocusInput value={entry.name} onChange={v => update('name', v)} placeholder="Certification name" />
        <FocusInput value={entry.issuer} onChange={v => update('issuer', v)} placeholder="Issuer (optional)" />
        <YearPicker value={entry.year} onChange={v => update('year', v)} />
      </div>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-red)', padding: '9px 0', flexShrink: 0 }}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Simple focused input ──────────────────────────────────────────────────────
function FocusInput({ value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle(focused), border: `1px solid ${error ? 'var(--cc-red)' : (focused ? 'var(--cc-blue)' : 'var(--cc-input-border)')}` }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {error && <InlineError>{error}</InlineError>}
    </>
  )
}

function InlineError({ children }) {
  return <p style={{ fontSize: '11.5px', color: 'var(--cc-red)', margin: '5px 0 0' }}>{children}</p>
}

// ── Date picker helpers ───────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 36 }, (_, i) => THIS_YEAR - i) // current → 35 years back

const selectSt = (focused) => ({
  flex: 1, padding: '8px 6px',
  border: `1px solid ${focused ? 'var(--cc-blue)' : 'var(--cc-input-border)'}`,
  borderRadius: '6px', fontSize: '13px', color: 'var(--cc-text-1)',
  outline: 'none', fontFamily: 'inherit',
  backgroundColor: 'var(--cc-input-bg)', cursor: 'pointer',
  transition: 'border-color 0.15s', appearance: 'auto',
})

// Month + Year selector (e.g. work experience start/end)
// Stores value as "Jan 2022"
function MonthYearPicker({ value, onChange }) {
  const [focusM, setFocusM] = useState(false)
  const [focusY, setFocusY] = useState(false)
  const parts  = (value || '').trim().split(/\s+/)
  const month  = MONTHS.includes(parts[0]) ? parts[0] : ''
  const year   = parts[parts.length - 1]?.match(/^\d{4}$/) ? parts[parts.length - 1] : ''

  const emit = (m, y) => {
    if (!m && !y) onChange('')
    else if (m && y) onChange(`${m} ${y}`)
    else onChange(m || y)
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <select value={month} onChange={e => emit(e.target.value, year)}
        style={selectSt(focusM)}
        onFocus={() => setFocusM(true)} onBlur={() => setFocusM(false)}>
        <option value="">Month</option>
        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={year} onChange={e => emit(month, e.target.value)}
        style={selectSt(focusY)}
        onFocus={() => setFocusY(true)} onBlur={() => setFocusY(false)}>
        <option value="">Year</option>
        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

// Education year range: "2020 – 2024" or single "2024"
function EduYearPicker({ value, onChange }) {
  const [focusS, setFocusS] = useState(false)
  const [focusE, setFocusE] = useState(false)
  // Parse "2020 – 2024" or "2024"
  const rangeMatch = (value || '').match(/^(\d{4})\s*[–\-]\s*(\d{4}|Present)$/)
  const startYear  = rangeMatch ? rangeMatch[1] : ''
  const endYear    = rangeMatch
    ? rangeMatch[2]
    : /^\d{4}$/.test(value) ? value : ''

  const emit = (s, e) => {
    if (!s && !e) return onChange('')
    if (s && e)   return onChange(`${s} – ${e}`)
    onChange(s || e)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <select value={startYear} onChange={ev => emit(ev.target.value, endYear)}
        style={selectSt(focusS)}
        onFocus={() => setFocusS(true)} onBlur={() => setFocusS(false)}>
        <option value="">From</option>
        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
      <span style={{ color: 'var(--cc-text-4)', fontSize: '12px', flexShrink: 0 }}>–</span>
      <select value={endYear} onChange={ev => emit(startYear, ev.target.value)}
        style={selectSt(focusE)}
        onFocus={() => setFocusE(true)} onBlur={() => setFocusE(false)}>
        <option value="">To</option>
        <option value="Present">Present</option>
        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

// Single year picker (certifications)
function YearPicker({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      style={{ ...selectSt(focused), width: '100%' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <option value="">Year</option>
      {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
    </select>
  )
}

// ── ATS Preview ───────────────────────────────────────────────────────────────
// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saveMsg,        setSaveMsg]        = useState('')  // '' | 'saved' | 'error'
  const [autoSaveStatus, setAutoSaveStatus] = useState('') // '' | 'pending' | 'saving' | 'saved' | 'error'
  const [lastAutoSaved,  setLastAutoSaved]  = useState(null)
  const [genLoading,     setGenLoading]     = useState(false)
  const [activeTab,      setActiveTab]      = useState('editor') // mobile
  const [skillInput,     setSkillInput]     = useState('')
  const [profileRef,     setProfileRef]     = useState(null) // full API response
  const [validation,     setValidation]     = useState({ messages: [], fields: {}, exp: {}, edu: {} })
  const autoSaveTimer   = useRef(null)
  const initialLoad     = useRef(true)
  const pendingPayload  = useRef(null) // tracks unsaved changes for unmount/reload save

  // Which sections are open
  const [open, setOpen] = useState(new Set(['personal', 'summary', 'skills', 'experience', 'projects', 'education', 'certs']))
  const toggle = (id) => setOpen(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  // Resume state
  const [resume, setResume] = useState({
    personalInfo:   { fullName: '', email: '', phone: '', linkedin: '', location: '' },
    summary:        '',
    skills:         [],
    workExperience: [],
    projects:       [],
    education:      [],
    certifications: [],
    accentColor:    DEFAULT_ACCENT,
  })

  const setPI   = (updates) => setResume(r => ({ ...r, personalInfo: { ...r.personalInfo, ...updates } }))
  const setSummary = (v)    => setResume(r => ({ ...r, summary: v }))
  const setSkills  = (v)    => setResume(r => ({ ...r, skills: v }))
  const setExps    = (v)    => setResume(r => ({ ...r, workExperience: v }))
  const setProjs   = (v)    => setResume(r => ({ ...r, projects: v }))
  const setEdus    = (v)    => setResume(r => ({ ...r, education: v }))
  const setCerts   = (v)    => setResume(r => ({ ...r, certifications: v }))
  const setAccent  = (v)    => setResume(r => ({ ...r, accentColor: v }))

  // Load on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/resume-data')
        setProfileRef(data)

        if (data.resumeData) {
          // Restore previously saved resume
          const rd = data.resumeData
          setResume({
            personalInfo:   { fullName: rd.fullName || '', email: rd.email || '', phone: rd.phone || '', linkedin: rd.linkedin || '', location: rd.location || '' },
            summary:        rd.summary        || '',
            skills:         rd.skills         || [],
            workExperience: (rd.workExperience || []).map(e => ({ ...e, _id: e._id || uid() })),
            projects:       (rd.projects      || []).map(p => ({ ...p, _id: p._id || uid() })),
            education:      (rd.education     || []).map(e => ({ ...e, _id: e._id || uid() })),
            certifications: (rd.certifications|| []).map(c => ({ ...c, _id: c._id || uid() })),
            accentColor:    rd.accentColor || DEFAULT_ACCENT,
          })
        } else {
          // Pre-fill from onboarding data
          const ap = data.applicantProfile || {}
          setResume(r => ({
            ...r,
            personalInfo: {
              fullName: ap.basicInfo?.fullName  || user?.name  || '',
              email:    data.email              || user?.email || '',
              phone:    ap.basicInfo?.phone     || '',
              linkedin: ap.linkedinUrl          || '',
              location: ap.basicInfo?.location  || '',
            },
            summary: ap.profileSummary || '',
            skills:  (ap.skills || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean),
            certifications: (ap.certifications || []).map(c =>
              typeof c === 'string' ? { _id: uid(), name: c, issuer: '', year: '' } : { ...c, _id: uid() }
            ),
          }))
        }
      } catch {
        // Fallback: pre-fill from AuthContext cache
        const ap = user?.applicantProfile || {}
        setResume(r => ({
          ...r,
          personalInfo: {
            fullName: ap.basicInfo?.fullName || user?.name  || '',
            email:    user?.email || '',
            phone:    ap.basicInfo?.phone    || '',
            linkedin: ap.linkedinUrl         || '',
            location: ap.basicInfo?.location || '',
          },
          summary: ap.profileSummary || '',
          skills:  (ap.skills || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean),
        }))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Build DB payload from current state
  const buildPayload = useCallback(() => ({
    fullName:       resume.personalInfo.fullName,
    email:          resume.personalInfo.email,
    phone:          resume.personalInfo.phone,
    linkedin:       resume.personalInfo.linkedin,
    location:       resume.personalInfo.location,
    summary:        resume.summary,
    skills:         resume.skills,
    workExperience: resume.workExperience,
    projects:       resume.projects,
    education:      resume.education,
    certifications: resume.certifications,
    accentColor:    resume.accentColor || DEFAULT_ACCENT,
  }), [resume])

  const validateResume = useCallback(() => {
    const messages = []
    const fields = {}
    const exp = {}
    const edu = {}
    const email = resume.personalInfo.email.trim()

    if (!resume.personalInfo.fullName.trim()) {
      fields.fullName = 'Full name is required'
      messages.push('Add your full name.')
    }
    if (!email) {
      fields.email = 'Email is required'
      messages.push('Add your email address.')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fields.email = 'Enter a valid email address'
      messages.push('Enter a valid email address.')
    }
    if (resume.summary && resume.summary.trim().length < 40) {
      fields.summary = 'A professional summary should be at least 40 characters'
      messages.push('Make the summary a little more complete.')
    }

    resume.workExperience.forEach(entry => {
      const touched = entry.jobTitle || entry.company || entry.startDate || entry.endDate || entry.bullets?.some(Boolean)
      if (!touched) return
      const e = {}
      if (!entry.jobTitle.trim()) e.jobTitle = 'Job title is required'
      if (!entry.company.trim()) e.company = 'Company is required'
      if (entry.startDate && !parseMonthYear(entry.startDate)) e.startDate = 'Choose both month and year'
      if (!entry.current && entry.endDate && !parseMonthYear(entry.endDate)) e.endDate = 'Choose both month and year'
      const start = parseMonthYear(entry.startDate)
      const end = entry.current ? null : parseMonthYear(entry.endDate)
      if (start && end && start > end) {
        e.endDate = 'End date cannot be before start date'
      }
      if (Object.keys(e).length) {
        exp[entry._id] = e
        messages.push(`${entry.jobTitle || 'Work experience'} needs valid role and dates.`)
      }
    })

    resume.education.forEach(entry => {
      const touched = entry.degree || entry.institution || entry.year || entry.cgpa
      if (!touched) return
      const e = {}
      if (!entry.degree.trim()) e.degree = 'Degree is required'
      if (!entry.institution.trim()) e.institution = 'Institution is required'
      const years = getYearRange(entry.year)
      if (years && years[0] > years[1]) e.year = 'End year cannot be before start year'
      if (Object.keys(e).length) {
        edu[entry._id] = e
        messages.push(`${entry.degree || 'Education'} needs valid details.`)
      }
    })

    return { messages: [...new Set(messages)], fields, exp, edu }
  }, [resume])

  const hasValidationErrors = (result) =>
    result.messages.length > 0 ||
    Object.keys(result.fields).length > 0 ||
    Object.keys(result.exp).length > 0 ||
    Object.keys(result.edu).length > 0

  const openInvalidSections = (result) => {
    setOpen(prev => {
      const s = new Set(prev)
      if (result.fields.fullName || result.fields.email) s.add('personal')
      if (result.fields.summary) s.add('summary')
      if (Object.keys(result.exp).length) s.add('experience')
      if (Object.keys(result.edu).length) s.add('education')
      return s
    })
  }

  // Manual save
  const handleSave = async () => {
    const result = validateResume()
    setValidation(result)
    if (hasValidationErrors(result)) {
      openInvalidSections(result)
      setSaveMsg('error')
      setAutoSaveStatus('error')
      setTimeout(() => setSaveMsg(''), 3500)
      return
    }
    setSaving(true)
    setSaveMsg('')
    try {
      await api.patch('/users/resume-data', { resumeData: buildPayload() })
      setValidation({ messages: [], fields: {}, exp: {}, edu: {} })
      setSaveMsg('saved')
      setAutoSaveStatus('saved')
      setLastAutoSaved(new Date())
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('error')
      setTimeout(() => setSaveMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save — debounced 1.5s after any resume change
  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return }

    const result = validateResume()
    setValidation(result)

    // For autosave: only block on critical personal info errors (name/email).
    // Incomplete work experience / education entries are allowed through so
    // the user can save partial progress while filling in a new entry.
    const criticalError = result.fields.fullName || result.fields.email
    if (criticalError) {
      pendingPayload.current = null
      setAutoSaveStatus('error')
      return
    }

    // Track latest payload so we can save it if the page is closed before
    // the timer fires (browser reload, tab close, navigate away)
    pendingPayload.current = buildPayload()
    setAutoSaveStatus('pending')

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving')
      try {
        await api.patch('/users/resume-data', { resumeData: buildPayload() })
        setValidation({ messages: [], fields: {}, exp: {}, edu: {} })
        pendingPayload.current = null   // cleared — save succeeded
        setAutoSaveStatus('saved')
        setLastAutoSaved(new Date())
      } catch {
        setAutoSaveStatus('error')
      }
    }, 1500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [resume, validateResume])

  // ── Save on unmount (React Router navigation away from page) ─────────────────
  useEffect(() => {
    return () => {
      if (pendingPayload.current) {
        // best-effort fire-and-forget — don't await, page is leaving
        api.patch('/users/resume-data', { resumeData: pendingPayload.current }).catch(() => {})
        pendingPayload.current = null
      }
    }
  }, [])

  // ── Warn before browser refresh/close if there are unsaved changes ────────────
  // (React Router navigation is handled by the unmount effect above)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingPayload.current) {
        e.preventDefault()
        e.returnValue = 'Your resume has unsaved changes. Leave anyway?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // AI-style summary
  const handleGenerateSummary = () => {
    setGenLoading(true)
    setTimeout(() => {
      const generated = buildSummary(profileRef || { applicantProfile: user?.applicantProfile }, resume.skills, resume.workExperience)
      setSummary(generated)
      setGenLoading(false)
    }, 1100)
  }

  // Skill add
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !resume.skills.includes(s)) {
      setSkills([...resume.skills, s])
    }
    setSkillInput('')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cc-bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', color: 'var(--cc-text-3)', fontSize: '14px' }}>
          Loading your resume data…
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cc-bg)',
      fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
      '--resume-accent': resume.accentColor || DEFAULT_ACCENT,
    }}>
      <Navbar />

      {/* ── Header bar ── */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 20,
        backgroundColor: 'var(--cc-surface)', borderBottom: '1px solid var(--cc-border)',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-text-2)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontFamily: 'inherit', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: 'var(--cc-border)' }}>|</span>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: 0 }}>Resume Builder</h1>
            <p style={{ fontSize: '11px', color: 'var(--cc-text-4)', margin: 0 }}>ATS-friendly · CareerCONNECT</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Auto-save status */}
          {autoSaveStatus === 'pending' && (
            <span style={{ fontSize: '12px', color: 'var(--cc-text-4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--cc-amber)', display: 'inline-block' }}/>
              Unsaved changes
            </span>
          )}
          {autoSaveStatus === 'saving' && (
            <span style={{ fontSize: '12px', color: 'var(--cc-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '13px' }}>⟳</span>
              Auto-saving…
            </span>
          )}
          {autoSaveStatus === 'saved' && !saveMsg && (
            <span style={{ fontSize: '12px', color: 'var(--cc-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12}/> Auto-saved
              {lastAutoSaved && ` · ${new Date(lastAutoSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span style={{ fontSize: '12px', color: 'var(--cc-red)' }}>Auto-save failed</span>
          )}
          {saveMsg === 'saved' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--cc-green)' }}>
              <Check size={15}/> Saved
            </span>
          )}
          {saveMsg === 'error' && (
            <span style={{ fontSize: '13px', color: 'var(--cc-red)' }}>Save failed</span>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ display:'flex',alignItems:'center',gap:'7px',padding:'8px 18px',borderRadius:'7px',backgroundColor:saving?'var(--cc-blue-border)':'var(--cc-blue)',border:'none',color:'var(--cc-text-4)',fontSize:'13.5px',fontWeight:'600',cursor:saving?'default':'pointer',fontFamily:'inherit',transition:'background 0.2s' }}>
            <Save size={15}/> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Sequence Map ── */}
      {(() => {
        const steps = [
          { id: 'personal',   label: 'Info',    icon: User,         done: !!(resume.personalInfo.fullName && resume.personalInfo.email) },
          { id: 'summary',    label: 'Summary', icon: FileText,     done: resume.summary.length > 20 },
          { id: 'skills',     label: 'Skills',  icon: Zap,          done: resume.skills.length > 0 },
          { id: 'experience', label: 'Work',    icon: Briefcase,    done: resume.workExperience.some(e => e.jobTitle || e.company) },
          { id: 'projects',   label: 'Projects',icon: FolderOpen,   done: resume.projects.some(p => p.name) },
          { id: 'education',  label: 'Edu',     icon: GraduationCap,done: resume.education.some(e => e.degree || e.institution) },
          { id: 'certs',      label: 'Certs',   icon: Award,        done: resume.certifications.some(c => c.name) },
        ]
        const completedCount = steps.filter(s => s.done).length
        return (
          <div style={{
            backgroundColor: 'var(--cc-surface)', borderBottom: '1px solid var(--cc-border)',
            padding: '10px 24px',
          }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
              {steps.map((step, i) => {
                const isOpen = open.has(step.id)
                const Icon = step.icon
                const dotColor = step.done ? 'var(--cc-green)' : isOpen ? 'var(--resume-accent)' : 'var(--cc-border)'
                const textColor = step.done ? 'var(--cc-green)' : isOpen ? 'var(--resume-accent)' : 'var(--cc-text-4)'
                return (
                  <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Connector line (left side, skip for first) */}
                    {i > 0 && (
                      <div style={{
                        position: 'absolute', top: '14px', left: 0, width: '50%', height: '2px',
                        backgroundColor: steps[i-1].done ? 'var(--cc-green-bg)' : 'var(--cc-border)',
                      }}/>
                    )}
                    {/* Connector line (right side, skip for last) */}
                    {i < steps.length - 1 && (
                      <div style={{
                        position: 'absolute', top: '14px', right: 0, width: '50%', height: '2px',
                        backgroundColor: step.done ? 'var(--cc-green-bg)' : 'var(--cc-border)',
                      }}/>
                    )}
                    {/* Dot button */}
                    <button
                      onClick={() => { toggle(step.id); if (!open.has(step.id)) { setTimeout(() => document.getElementById(`section-${step.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) } }}
                      title={step.label}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: step.done ? 'var(--cc-green-bg)' : isOpen ? 'color-mix(in srgb, var(--resume-accent) 14%, transparent)' : 'var(--cc-surface-2)',
                        border: `2px solid ${dotColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative', zIndex: 1,
                        transition: 'all 0.2s',
                        padding: 0,
                      }}
                    >
                      <Icon size={13} color={dotColor} />
                    </button>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: textColor, marginTop: '4px', whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
              {/* Progress summary */}
              <div style={{ marginLeft: '16px', flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: completedCount === 7 ? 'var(--cc-green)' : 'var(--resume-accent)' }}>
                  {completedCount}/7
                </span>
                <div style={{ fontSize: '10px', color: 'var(--cc-text-4)' }}>filled</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Mobile tab switcher ── */}
      <div style={{
        backgroundColor: 'var(--cc-surface)',
        borderBottom: '1px solid var(--cc-border)',
        padding: '10px 24px',
      }}>
        <div style={{
          maxWidth: '1300px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--cc-text-2)' }}>CV accent</span>
            {RESUME_ACCENTS.map(color => {
              const active = (resume.accentColor || DEFAULT_ACCENT) === color.value
              return (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  aria-label={`Use ${color.name} accent`}
                  onClick={() => setAccent(color.value)}
                  style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    border: active ? '2px solid var(--cc-text-1)' : '1px solid var(--cc-border)',
                    backgroundColor: color.value,
                    boxShadow: active ? `0 0 0 3px ${color.value}33` : 'none',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              )
            })}
          </div>
          {validation.messages.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: 'var(--cc-red)', fontSize: '12px', fontWeight: '600',
              backgroundColor: 'var(--cc-red-bg)', border: '1px solid var(--cc-red)',
              borderRadius: '7px', padding: '7px 10px',
            }}>
              <X size={13} />
              {validation.messages.slice(0, 2).join(' ')}
            </div>
          )}
        </div>
      </div>

      <div className="resume-mobile-tabs" style={{ display: 'none', padding: '12px 16px 0', gap: '8px' }}>
        {['editor', 'preview'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
              backgroundColor: activeTab === tab ? 'var(--resume-accent)' : 'var(--cc-surface-2)',
              color: activeTab === tab ? 'var(--cc-text-4)' : 'var(--cc-text-2)',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {tab === 'editor' ? <><Edit3 size={14} /> Editor</> : <><Eye size={14} /> Preview</>}
          </button>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="resume-layout" style={{
        display: 'flex', gap: '16px',
        padding: '20px 24px 40px',
        maxWidth: '1300px', margin: '0 auto',
        alignItems: 'flex-start',
      }}>

        {/* ── LEFT: Editor ── */}
        <div className="resume-editor" style={{ flex: '0 0 52%', minWidth: 0 }}>

          {/* Personal Info */}
          <Section id="personal" title="Personal Info" icon={User} open={open.has('personal')} onToggle={toggle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <TextInput label="Full Name" value={resume.personalInfo.fullName} onChange={v => setPI({ fullName: v })} placeholder="e.g. Tayyaba Rafique" error={validation.fields.fullName} />
              </div>
              <TextInput label="Email" type="email" value={resume.personalInfo.email} onChange={v => setPI({ email: v })} placeholder="you@email.com" error={validation.fields.email} />
              <TextInput label="Phone" value={resume.personalInfo.phone} onChange={v => setPI({ phone: v })} placeholder="03001234567" />
              <TextInput label="Location" value={resume.personalInfo.location} onChange={v => setPI({ location: v })} placeholder="Lahore, Pakistan" />
              <TextInput label="LinkedIn URL" optional value={resume.personalInfo.linkedin} onChange={v => setPI({ linkedin: v })} placeholder="linkedin.com/in/yourname" />
            </div>
          </Section>

          {/* Professional Summary */}
          <Section id="summary" title="Professional Summary" icon={FileText} open={open.has('summary')} onToggle={toggle}>
            <div style={{ marginBottom: '10px' }}>
              <button
                onClick={handleGenerateSummary}
                disabled={genLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '7px',
                  backgroundColor: genLoading ? 'var(--cc-surface-2)' : 'var(--cc-amber-bg)',
                  border: '1px solid var(--cc-amber)',
                  color: genLoading ? 'var(--cc-text-4)' : 'var(--cc-amber)',
                  fontSize: '12.5px', fontWeight: '600', cursor: genLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit', marginBottom: '10px',
                }}
              >
                <Wand2 size={14} /> {genLoading ? 'Generating…' : 'AI Generate Summary'}
              </button>
            </div>
            <TextArea
              label="Summary"
              value={resume.summary}
              onChange={setSummary}
              placeholder="Write a compelling 2–3 sentence summary of your professional background, key skills, and career goals…"
              rows={5}
              error={validation.fields.summary}
            />
          </Section>

          {/* Skills */}
          <Section id="skills" title="Skills" icon={Zap} open={open.has('skills')} onToggle={toggle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {resume.skills.map(s => (
                <SkillChip key={s} skill={s} onRemove={removed => setSkills(resume.skills.filter(x => x !== removed))} />
              ))}
              {resume.skills.length === 0 && (
                <span style={{ fontSize: '13px', color: 'var(--cc-text-4)', fontStyle: 'italic' }}>No skills added yet</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                placeholder="Type a skill and press Enter or Add…"
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid var(--cc-input-border)',
                  borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                  backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)',
                }}
              />
              <button
                onClick={addSkill}
                style={{
                  padding: '8px 16px', borderRadius: '6px',
                  backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)',
                  border: 'none', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Add
              </button>
            </div>
          </Section>

          {/* Work Experience */}
          <Section id="experience" title="Work Experience" icon={Briefcase} open={open.has('experience')} onToggle={toggle}>
            {resume.workExperience.map(entry => (
              <ExpEntry
                key={entry._id}
                entry={entry}
                errors={validation.exp[entry._id]}
                onChange={updated => setExps(resume.workExperience.map(e => e._id === entry._id ? updated : e))}
                onDelete={() => setExps(resume.workExperience.filter(e => e._id !== entry._id))}
              />
            ))}
            <button
              onClick={() => setExps([...resume.workExperience, emptyExp()])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px 14px', borderRadius: '7px',
                background: 'none', border: '1px dashed var(--cc-blue-border)',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Add work experience
            </button>
          </Section>

          {/* Projects */}
          <Section id="projects" title="Projects" icon={FolderOpen} open={open.has('projects')} onToggle={toggle}>
            {resume.projects.map(entry => (
              <ProjectEntry
                key={entry._id}
                entry={entry}
                onChange={updated => setProjs(resume.projects.map(p => p._id === entry._id ? updated : p))}
                onDelete={() => setProjs(resume.projects.filter(p => p._id !== entry._id))}
              />
            ))}
            <button
              onClick={() => setProjs([...resume.projects, emptyProject()])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px 14px', borderRadius: '7px',
                background: 'none', border: '1px dashed var(--cc-blue-border)',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Add project
            </button>
          </Section>

          {/* Education */}
          <Section id="education" title="Education" icon={GraduationCap} open={open.has('education')} onToggle={toggle}>
            {resume.education.map(entry => (
              <EduEntry
                key={entry._id}
                entry={entry}
                errors={validation.edu[entry._id]}
                onChange={updated => setEdus(resume.education.map(e => e._id === entry._id ? updated : e))}
                onDelete={() => setEdus(resume.education.filter(e => e._id !== entry._id))}
              />
            ))}
            <button
              onClick={() => setEdus([...resume.education, emptyEdu()])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px 14px', borderRadius: '7px',
                background: 'none', border: '1px dashed var(--cc-blue-border)',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Add education
            </button>
          </Section>

          {/* Certifications */}
          <Section id="certs" title="Certifications" icon={Award} open={open.has('certs')} onToggle={toggle}>
            {resume.certifications.map(entry => (
              <CertEntry
                key={entry._id}
                entry={entry}
                onChange={updated => setCerts(resume.certifications.map(c => c._id === entry._id ? updated : c))}
                onDelete={() => setCerts(resume.certifications.filter(c => c._id !== entry._id))}
              />
            ))}
            <button
              onClick={() => setCerts([...resume.certifications, emptyCert()])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px 14px', borderRadius: '7px',
                background: 'none', border: '1px dashed var(--cc-blue-border)',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Add certification
            </button>
          </Section>

        </div>

        {/* RIGHT: Live Preview */}
        <div className="resume-preview" style={{
          flex: '1 1 48%', minWidth: 0,
          position: 'sticky', top: 148,
          alignSelf: 'flex-start',
        }}>
          <div style={{
            backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
            borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--cc-shadow)',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--cc-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Eye size={14} /> Live Preview
              </span>
              <span style={{ fontSize: '11px', color: 'var(--cc-text-4)' }}>ATS format</span>
            </div>
            <div style={{
              height: 'calc(100vh - 220px)', minHeight: '520px',
              overflow: 'auto',
              backgroundColor: 'var(--cc-surface-2)',
              padding: '18px',
            }}>
              <div style={{
                maxWidth: '720px', minHeight: '920px', margin: '0 auto',
                backgroundColor: 'white',
                boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <ATSPreview resume={resume} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .resume-layout { display: block !important; padding: 16px !important; }
          .resume-editor { display: ${activeTab === 'editor' ? 'block' : 'none'} !important; }
          .resume-preview { display: ${activeTab === 'preview' ? 'block' : 'none'} !important; position: static !important; }
          .resume-mobile-tabs { display: flex !important; }
        }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
