import { useState } from 'react'
import { X } from 'lucide-react'

const JOB_TYPES  = ['full-time', 'part-time', 'contract', 'internship']
const EXP_LEVELS = ['Entry level', 'Mid level', 'Senior level', 'Lead / Manager']
const WORK_MODES = ['Remote', 'On-site', 'Hybrid']
const DATE_OPTS  = ['Last 24 hours', 'Last 3 days', 'Last 7 days', 'Last 14 days', 'Any time']

export default function FilterModal({ filters, onApply, onClose }) {
  const [local, setLocal] = useState(filters || {
    jobType: [], experienceLevel: '', workMode: '',
    salaryMin: 0, salaryMax: 500000, datePosted: '',
  })

  const toggleJobType = (t) => setLocal(f => ({
    ...f,
    jobType: f.jobType.includes(t) ? f.jobType.filter(x => x !== t) : [...f.jobType, t],
  }))

  const clear = () => setLocal({ jobType: [], experienceLevel: '', workMode: '', salaryMin: 0, salaryMax: 500000, datePosted: '' })

  const activeCount = [
    local.jobType.length > 0,
    !!local.workMode,
    !!local.experienceLevel,
    local.salaryMax < 500000,
    !!local.datePosted && local.datePosted !== 'Any time',
  ].filter(Boolean).length

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel — slides from right */}
      <div style={{
        position: 'relative',
        width: 'min(400px, 100vw)',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.22s ease-out',
        fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          .filter-checkbox:checked { accent-color: #2557A7; }
          .filter-radio:checked    { accent-color: #2557A7; }
          input[type=range] { accent-color: #2557A7; }

          @media (max-width: 768px) {
            /* Ensure the drawer never causes horizontal overflow */
            body { overflow-x: hidden; }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #E4E2E0',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#2D2D2D', margin: 0 }}>Filters</h2>
            {activeCount > 0 && (
              <p style={{ fontSize: '13px', color: '#2557A7', margin: '2px 0 0', fontWeight: '500' }}>
                {activeCount} filter{activeCount !== 1 ? 's' : ''} active
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backgroundColor: 'transparent', color: '#595959',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F0F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Date posted */}
          <FilterSection label="Date posted">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DATE_OPTS.map(opt => (
                <RadioRow
                  key={opt}
                  name="datePosted"
                  value={opt}
                  checked={local.datePosted === opt || (!local.datePosted && opt === 'Any time')}
                  onChange={() => setLocal(f => ({ ...f, datePosted: opt === 'Any time' ? '' : opt }))}
                  label={opt}
                />
              ))}
            </div>
          </FilterSection>

          {/* Job type */}
          <FilterSection label="Job type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {JOB_TYPES.map(t => (
                <CheckRow
                  key={t}
                  checked={local.jobType.includes(t)}
                  onChange={() => toggleJobType(t)}
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Work mode */}
          <FilterSection label="Work mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {WORK_MODES.map(m => (
                <RadioRow
                  key={m}
                  name="workMode"
                  value={m}
                  checked={local.workMode === m.toLowerCase()}
                  onChange={() => setLocal(f => ({ ...f, workMode: m.toLowerCase() }))}
                  label={m}
                />
              ))}
            </div>
          </FilterSection>

          {/* Experience level */}
          <FilterSection label="Experience level">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {EXP_LEVELS.map(l => (
                <RadioRow
                  key={l}
                  name="expLevel"
                  value={l}
                  checked={local.experienceLevel === l.split(' ')[0].toLowerCase()}
                  onChange={() => setLocal(f => ({ ...f, experienceLevel: l.split(' ')[0].toLowerCase() }))}
                  label={l}
                />
              ))}
            </div>
          </FilterSection>

          {/* Salary */}
          <FilterSection label="Salary range" noBorder>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#595959' }}>Rs 0</span>
              <span style={{ fontSize: '13px', color: '#2557A7', fontWeight: '600' }}>
                Rs {local.salaryMax.toLocaleString()}{local.salaryMax >= 500000 ? '+' : ''}
              </span>
            </div>
            <input
              type="range" min={0} max={500000} step={10000}
              value={local.salaryMax}
              onChange={e => setLocal(f => ({ ...f, salaryMax: Number(e.target.value) }))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#767676' }}>Any salary</span>
              <span style={{ fontSize: '12px', color: '#767676' }}>Rs 5,00,000+</span>
            </div>
          </FilterSection>
        </div>

        {/* ── Sticky Footer ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E4E2E0',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button onClick={clear} style={{
            fontSize: '14px', color: '#595959', background: 'none',
            border: 'none', cursor: 'pointer', fontWeight: '500',
            fontFamily: 'inherit', padding: '8px 0',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#2D2D2D'}
            onMouseLeave={e => e.currentTarget.style.color = '#595959'}
          >
            Clear all
          </button>
          <button onClick={() => { onApply(local); onClose() }} style={{
            padding: '0 28px', height: '44px',
            backgroundColor: '#2557A7', color: 'white',
            border: 'none', borderRadius: '6px',
            fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1D4589'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2557A7'}
          >
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Helper sub-components ── */
function FilterSection({ label, children, noBorder }) {
  return (
    <div style={{ marginBottom: noBorder ? 0 : '24px', paddingBottom: noBorder ? 0 : '24px', borderBottom: noBorder ? 'none' : '1px solid #F0F0F0' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D', margin: '0 0 12px' }}>{label}</h3>
      {children}
    </div>
  )
}

function CheckRow({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="filter-checkbox"
        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2557A7', flexShrink: 0 }}
      />
      <span style={{ fontSize: '14px', color: '#2D2D2D' }}>{label}</span>
    </label>
  )
}

function RadioRow({ name, value, checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="filter-radio"
        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2557A7', flexShrink: 0 }}
      />
      <span style={{ fontSize: '14px', color: '#2D2D2D' }}>{label}</span>
    </label>
  )
}
