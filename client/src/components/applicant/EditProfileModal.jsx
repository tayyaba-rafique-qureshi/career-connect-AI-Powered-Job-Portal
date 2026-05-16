import { useState } from 'react'
import { X, CheckCircle, Loader2, User, Briefcase, Wrench, Settings, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import SkillChipInput from '../onboarding/SkillChipInput'
import TagInput from '../onboarding/TagInput'

// ── Constants (mirrored from ApplicantOnboarding) ─────────────────────────
const CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Quetta','Multan',
  'Faisalabad','Hyderabad','Sialkot','Gujranwala','Bahawalpur','Sargodha',
  'Sukkur','Larkana','Sheikhupura','Rahim Yar Khan','Jhang','Dera Ghazi Khan',
  'Gujrat','Sahiwal','Wah Cantonment','Mardan','Mingora','Nawabshah',
  'Mirpur Khas','Okara','Chiniot','Kamoke','Hafizabad','Kohat','Abbottabad',
  'Muzaffarabad','Gilgit','Turbat','Khuzdar','Hub','Jacobabad','Shikarpur',
  'Dadu','Mirpur (AJK)','Attock','Chakwal','Jhelum','Mandi Bahauddin',
  'Narowal','Kasur','Nankana Sahib','Toba Tek Singh','Vehari','Pakpattan','Remote',
]
const INDUSTRIES   = ['IT/Software','Finance','Healthcare','Education','Marketing','Engineering','Other']
const EXP_OPTIONS  = ['No experience','Less than 1 year','1–3 years','3–5 years','5–10 years','10+ years']
const EDU_OPTIONS  = ['Matric','Intermediate',"Bachelor's","Master's",'PhD']
const JOB_TYPES    = ['Full-time','Part-time','Contract','Internship','Freelance']
const WORK_MODES   = ['On-site','Remote','Hybrid','Any']

const TABS = [
  { id: 'basic',   label: 'Basic Info',    icon: User },
  { id: 'prof',    label: 'Professional',  icon: Briefcase },
  { id: 'skills',  label: 'Skills',        icon: Wrench },
  { id: 'prefs',   label: 'Preferences',   icon: Settings },
  { id: 'summary', label: 'Summary',       icon: FileText },
]

// ── City chip input (same as onboarding) ─────────────────────────────────
function CityChipInput({ selected, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const filtered = query.length > 0
    ? CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()) && !selected.includes(c))
    : CITIES.filter(c => !selected.includes(c)).slice(0, 8)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map(c => (
          <span key={c} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full px-3 py-1">
            {c}
            <button type="button" onClick={() => onChange(selected.filter(x => x !== c))}
              className="text-blue-400 hover:text-blue-700 font-bold text-xs ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search city..."
          className="w-full h-10 px-3 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
            {filtered.map(c => (
              <li key={c}
                onMouseDown={() => { onChange([...selected, c]); setQuery(''); setOpen(false) }}
                className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Small field wrapper ───────────────────────────────────────────────────
function Field({ label, children, error, optional }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-10 px-3 border rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 ${error ? 'border-red-400' : 'border-[#D4D2D0]'}`}
    />
  )
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full h-10 px-3 border rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 bg-white ${error ? 'border-red-400' : 'border-[#D4D2D0]'}`}
    >
      {children}
    </select>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────
export default function EditProfileModal({ onClose, onSuccess }) {
  const { user, refreshUser } = useAuth()

  const p  = user?.applicantProfile || {}
  const bi = p.basicInfo         || {}
  const pi = p.professionalInfo  || {}
  const pr = p.preferences       || {}

  // Normalise certifications — they can be strings or objects
  const normCerts = (p.certifications || []).map(c =>
    typeof c === 'string' ? c : [c.name, c.issuer, c.year].filter(Boolean).join(' - ')
  )

  // Tab state
  const [activeTab, setActiveTab] = useState('basic')

  // Form sections
  const [basic,   setBasic]   = useState({ fullName: user?.name || '', phone: bi.phone || '', location: bi.location || '' })
  const [prof,    setProf]    = useState({ currentTitle: pi.currentTitle || '', yearsOfExp: pi.yearsOfExp || '', industry: pi.industry || '', educationLevel: pi.educationLevel || '', fieldOfStudy: pi.fieldOfStudy || '' })
  const [skills,  setSkills]  = useState(p.skills || [])
  const [tools,   setTools]   = useState(p.tools  || [])
  const [certs,   setCerts]   = useState(normCerts)
  const [prefs,   setPrefs]   = useState({ jobType: pr.jobType || [], workMode: pr.workMode || '', salaryMin: pr.salaryMin || 0, salaryMax: pr.salaryMax || 100000, preferredLocations: pr.preferredLocations || [], openToRelocation: pr.openToRelocation || false, careerGoals: pr.careerGoals || '' })
  const [summary, setSummary] = useState({ profileSummary: p.profileSummary || '', linkedinUrl: p.linkedinUrl || '', portfolioUrl: p.portfolioUrl || '' })

  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const validate = () => {
    const e = {}
    if (activeTab === 'basic') {
      if (!basic.fullName || basic.fullName.length < 2) e.fullName = 'Full name is required (min 2 chars)'
      if (basic.phone && !/^\d{11}$/.test(basic.phone)) e.phone = 'Phone must be exactly 11 digits'
      if (!basic.location) e.location = 'Location is required'
    }
    if (activeTab === 'prof') {
      if (!prof.currentTitle) e.currentTitle = 'Job title is required'
    }
    if (activeTab === 'skills') {
      if (skills.length < 1) e.skills = 'Add at least 1 skill'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const stepMap = { basic: 1, prof: 2, skills: 3, prefs: 4, summary: 5 }
      const dataMap = {
        basic:   basic,
        prof:    prof,
        skills:  { skills, tools, certifications: certs },
        prefs:   prefs,
        summary: summary,
      }
      await api.patch('/users/onboarding', {
        step: stepMap[activeTab],
        role: user?.role || 'applicant',
        data: dataMap[activeTab],
      })
      await refreshUser()
      showSaved()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleJobType = (t) =>
    setPrefs(p => ({ ...p, jobType: p.jobType.includes(t) ? p.jobType.filter(x => x !== t) : [...p.jobType, t] }))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '640px',
        maxHeight: '90vh',
        backgroundColor: 'var(--cc-surface, #fff)',
        borderRadius: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Noto Sans", Arial, sans-serif',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--cc-border, #e5e7eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--cc-text-1, #111)' }}>
              Edit Profile
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cc-text-3, #767676)' }}>
              Update your profile information
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--cc-text-3, #767676)', padding: '4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--cc-border, #e5e7eb)',
          overflowX: 'auto', flexShrink: 0,
          backgroundColor: 'var(--cc-surface-2, #f9fafb)',
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => { setErrors({}); setActiveTab(tab.id) }} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: active ? '700' : '500',
                color: active ? '#2557A7' : 'var(--cc-text-2, #595959)',
                borderBottom: active ? '2px solid #2557A7' : '2px solid transparent',
                background: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}>
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px' }}>

          {/* ── Basic Info ── */}
          {activeTab === 'basic' && (
            <div>
              <Field label="Full Name" error={errors.fullName}>
                <Input
                  value={basic.fullName}
                  onChange={e => setBasic({ ...basic, fullName: e.target.value })}
                  placeholder="John Doe"
                  error={errors.fullName}
                />
              </Field>
              <Field label="Phone Number" error={errors.phone} optional>
                <Input
                  value={basic.phone}
                  onChange={e => setBasic({ ...basic, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  placeholder="03001234567 (11 digits)"
                  inputMode="numeric"
                  error={errors.phone}
                />
              </Field>
              <Field label="City / Location" error={errors.location}>
                <Input
                  value={basic.location}
                  onChange={e => setBasic({ ...basic, location: e.target.value })}
                  placeholder="e.g. Karachi"
                  error={errors.location}
                />
              </Field>
            </div>
          )}

          {/* ── Professional ── */}
          {activeTab === 'prof' && (
            <div>
              <Field label="Current or Most Recent Job Title" error={errors.currentTitle}>
                <Input
                  value={prof.currentTitle}
                  onChange={e => setProf({ ...prof, currentTitle: e.target.value })}
                  placeholder="e.g. Frontend Developer"
                  error={errors.currentTitle}
                />
              </Field>
              <Field label="Years of Experience">
                <Select value={prof.yearsOfExp} onChange={e => setProf({ ...prof, yearsOfExp: e.target.value })}>
                  <option value="">Select...</option>
                  {EXP_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="Industry">
                <Select value={prof.industry} onChange={e => setProf({ ...prof, industry: e.target.value })}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map(o => <option key={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="Highest Education Level">
                <Select value={prof.educationLevel} onChange={e => setProf({ ...prof, educationLevel: e.target.value })}>
                  <option value="">Select...</option>
                  {EDU_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </Select>
              </Field>
              <Field label="Field of Study" optional>
                <Input
                  value={prof.fieldOfStudy}
                  onChange={e => setProf({ ...prof, fieldOfStudy: e.target.value })}
                  placeholder="e.g. Computer Science"
                />
              </Field>
            </div>
          )}

          {/* ── Skills ── */}
          {activeTab === 'skills' && (
            <div>
              <Field label="Primary Skills" error={errors.skills}>
                <SkillChipInput skills={skills} onChange={setSkills} showLevel />
              </Field>
              <Field label="Tools & Technologies" optional>
                <TagInput tags={tools} onChange={setTools} placeholder="e.g. Docker, AWS, Figma..." />
              </Field>
              <Field label="Certifications" optional>
                <TagInput tags={certs} onChange={setCerts} placeholder="e.g. AWS Certified, PMP..." />
              </Field>
            </div>
          )}

          {/* ── Preferences ── */}
          {activeTab === 'prefs' && (
            <div>
              <Field label="Job Type">
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => toggleJobType(t)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${prefs.jobType.includes(t) ? 'bg-[#2557A7] text-white border-[#2557A7]' : 'border-gray-300 text-gray-600 hover:border-[#2557A7]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Work Mode">
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map(m => (
                    <button key={m} type="button" onClick={() => setPrefs({ ...prefs, workMode: m })}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${prefs.workMode === m ? 'bg-[#2557A7] text-white border-[#2557A7]' : 'border-gray-300 text-gray-600 hover:border-[#2557A7]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Expected Monthly Salary (PKR)">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>PKR {(prefs.salaryMin || 0).toLocaleString()}</span>
                    <span>PKR {(prefs.salaryMax || 0).toLocaleString()}</span>
                  </div>
                  <input type="range" min={0} max={500000} step={5000} value={prefs.salaryMax}
                    onChange={e => setPrefs({ ...prefs, salaryMax: Number(e.target.value) })}
                    className="w-full accent-[#2557A7]" />
                </div>
              </Field>
              <Field label="Preferred Locations" optional>
                <CityChipInput
                  selected={prefs.preferredLocations}
                  onChange={locs => setPrefs({ ...prefs, preferredLocations: locs })}
                />
              </Field>
              <Field label="Open to Relocation">
                <div className="flex gap-3">
                  {['Yes', 'No'].map(v => (
                    <button key={v} type="button"
                      onClick={() => setPrefs({ ...prefs, openToRelocation: v === 'Yes' })}
                      className={`px-6 py-2 rounded-full border text-sm font-medium transition-colors ${(v === 'Yes') === prefs.openToRelocation ? 'bg-[#2557A7] text-white border-[#2557A7]' : 'border-gray-300 text-gray-600'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Career Goals" optional>
                <div>
                  <textarea value={prefs.careerGoals} onChange={e => setPrefs({ ...prefs, careerGoals: e.target.value })} maxLength={300}
                    placeholder="Briefly describe your career goals..."
                    className="w-full px-3 py-2 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 resize-none h-20" />
                  <p className="text-xs text-gray-400 text-right">{(prefs.careerGoals || '').length}/300</p>
                </div>
              </Field>
            </div>
          )}

          {/* ── Summary & Links ── */}
          {activeTab === 'summary' && (
            <div>
              <Field label="Professional Summary" optional>
                <div>
                  <textarea value={summary.profileSummary} onChange={e => setSummary({ ...summary, profileSummary: e.target.value })} maxLength={500}
                    placeholder="A short bio about yourself..."
                    className="w-full px-3 py-2 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 resize-none h-28" />
                  <p className="text-xs text-gray-400 text-right">{(summary.profileSummary || '').length}/500</p>
                </div>
              </Field>
              <Field label="LinkedIn URL" optional>
                <Input
                  value={summary.linkedinUrl}
                  onChange={e => setSummary({ ...summary, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourname"
                  type="url"
                />
              </Field>
              <Field label="Portfolio / GitHub URL" optional>
                <Input
                  value={summary.portfolioUrl}
                  onChange={e => setSummary({ ...summary, portfolioUrl: e.target.value })}
                  placeholder="https://github.com/yourname"
                  type="url"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--cc-border, #e5e7eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: 'var(--cc-surface, #fff)',
        }}>
          {saved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a' }}>
              <CheckCircle size={14} />
              Saved successfully!
            </div>
          ) : <div />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={{
              padding: '8px 16px', borderRadius: '7px', border: '1px solid var(--cc-border, #e5e7eb)',
              background: 'none', fontSize: '13px', fontWeight: '600',
              color: 'var(--cc-text-2, #595959)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '8px 20px', borderRadius: '7px', border: 'none',
              backgroundColor: saving ? '#6b9de0' : '#2557A7',
              color: 'white', fontSize: '13px', fontWeight: '700',
              cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s',
            }}>
              {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </>
  )
}
