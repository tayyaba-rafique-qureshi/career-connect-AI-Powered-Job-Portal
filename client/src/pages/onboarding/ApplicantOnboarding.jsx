import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import StepWrapper from '../../components/onboarding/StepWrapper'
import SkillChipInput from '../../components/onboarding/SkillChipInput'
import FileUpload from '../../components/onboarding/FileUpload'
import TagInput from '../../components/onboarding/TagInput'

const TOTAL = 5
const CITIES = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Quetta','Multan',
  'Faisalabad','Hyderabad','Sialkot','Gujranwala','Bahawalpur','Sargodha',
  'Sukkur','Larkana','Sheikhupura','Rahim Yar Khan','Jhang','Dera Ghazi Khan',
  'Gujrat','Sahiwal','Wah Cantonment','Mardan','Mingora','Nawabshah',
  'Mirpur Khas','Okara','Chiniot','Kamoke','Hafizabad','Kohat','Abbottabad',
  'Muzaffarabad','Gilgit','Turbat','Khuzdar','Hub','Jacobabad','Shikarpur',
  'Dadu','Mirpur (AJK)','Attock','Chakwal','Jhelum','Mandi Bahauddin',
  'Narowal','Kasur','Nankana Sahib','Toba Tek Singh','Vehari','Pakpattan',
  'Remote'
]
const INDUSTRIES = ['IT/Software','Finance','Healthcare','Education','Marketing','Engineering','Other']
const EXP_OPTIONS = ['No experience','Less than 1 year','1–3 years','3–5 years','5–10 years','10+ years']
const EDU_OPTIONS = ['Matric','Intermediate',"Bachelor's","Master's",'PhD']
const JOB_TYPES = ['Full-time','Part-time','Contract','Internship','Freelance']
const WORK_MODES = ['On-site','Remote','Hybrid','Any']

const field = (label, children, error, optional) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label} {optional && <span className="text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

// Searchable city chip input
function CityChipInput({ selected, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = query.length > 0
    ? CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()) && !selected.includes(c))
    : CITIES.filter(c => !selected.includes(c)).slice(0, 8)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map(c => (
          <span key={c} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full px-3 py-1">
            {c}
            <button type="button" onClick={() => onChange(selected.filter(x => x !== c))} className="text-blue-400 hover:text-blue-700 font-bold text-xs ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search city..."
          className="w-full h-12 px-4 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <li key={c} onMouseDown={() => { onChange([...selected, c]); setQuery(''); setOpen(false) }}
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const input = (props) => (
  <input {...props} className={`w-full h-12 px-4 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 ${props.error ? 'border-red-400' : 'border-[#D4D2D0]'} ${props.className || ''}`} />
)

const select = (props) => (
  <select {...props} className={`w-full h-12 px-4 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 bg-white ${props.error ? 'border-red-400' : 'border-[#D4D2D0]'}`} />
)

export default function ApplicantOnboarding() {
  const { user, markProfileComplete } = useAuth()
  const navigate = useNavigate()

  // Admin accounts have no onboarding — redirect away immediately
  if (user?.role === 'admin') return <Navigate to="/dashboard/admin" replace />

  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  // Step data
  const [basic, setBasic] = useState({ fullName: user?.name || '', phone: '', location: '' })
  const [prof, setProf] = useState({ currentTitle: '', yearsOfExp: '', industry: '', educationLevel: '', fieldOfStudy: '' })
  const [skills, setSkills] = useState([])
  const [tools, setTools] = useState([])
  const [certs, setCerts] = useState([])
  const [prefs, setPrefs] = useState({ jobType: [], workMode: '', salaryMin: 0, salaryMax: 100000, preferredLocations: [], openToRelocation: false, careerGoals: '' })
  const [resume, setResume] = useState({ file: null, profileSummary: '', linkedinUrl: '', portfolioUrl: '' })

  const [uploading, setUploading] = useState(false)

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const saveStep = async (stepNum, data) => {
    await api.patch('/users/onboarding', { step: stepNum, role: user?.role || 'applicant', data })
    showSaved()
  }

  const saveStepWithFile = async (stepNum, data, file) => {
    const formData = new FormData()
    formData.append('step', stepNum)
    formData.append('role', user?.role || 'applicant')
    formData.append('data', JSON.stringify(data))
    if (file) formData.append('resume', file)
    // Do NOT set Content-Type — browser sets it with boundary automatically
    await api.patch('/users/onboarding', formData)
    showSaved()
  }

  // Validation per step
  const validate = () => {
    const e = {}
    if (step === 1) {
      if (!basic.fullName || basic.fullName.length < 2) e.fullName = 'Full name is required (min 2 chars)'
      if (!basic.phone) {
        e.phone = 'Phone number is required'
      } else if (!/^\d{11}$/.test(basic.phone)) {
        e.phone = 'Phone number must be exactly 11 digits (e.g. 03001234567)'
      }
      if (!basic.location) e.location = 'Location is required'
    }
    if (step === 2) {
      if (!prof.currentTitle) e.currentTitle = 'Job title is required'
      if (!prof.yearsOfExp) e.yearsOfExp = 'Please select experience'
      if (!prof.industry) e.industry = 'Please select industry'
      if (!prof.educationLevel) e.educationLevel = 'Please select education level'
    }
    if (step === 3) {
      if (skills.length < 2) e.skills = 'Please add at least 2 skills'
    }
    if (step === 4) {
      if (prefs.jobType.length === 0) e.jobType = 'Select at least one job type'
      if (!prefs.workMode) e.workMode = 'Select a work mode'
    }
    if (step === 5) {
      if (!resume.file) e.resume = 'Please upload your resume (PDF)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = async () => {
    if (!validate()) return
    try {
      if (step === 1) await saveStep(1, basic)
      if (step === 2) await saveStep(2, prof)
      if (step === 3) await saveStep(3, { skills, tools, certifications: certs })
      if (step === 4) await saveStep(4, prefs)
      if (step === 5) {
        setUploading(true)
        try {
          await saveStepWithFile(5, {
            profileSummary: resume.profileSummary,
            linkedinUrl:    resume.linkedinUrl,
            portfolioUrl:   resume.portfolioUrl
          }, resume.file)
          markProfileComplete()
          navigate('/dashboard/applicant')
        } catch (uploadError) {
          // Show specific error message from backend
          const errorMsg = uploadError.response?.data?.message || 'Failed to upload resume. Please try again.'
          setErrors({ resume: errorMsg })
          console.error('Resume upload error:', uploadError)
        } finally {
          setUploading(false)
        }
        return
      }
      setStep(s => s + 1)
    } catch (err) {
      console.error(err)
      // Show generic error for other steps
      const errorMsg = err.response?.data?.message || 'An error occurred. Please try again.'
      setErrors({ general: errorMsg })
    }
  }

  const toggleArr = (arr, val, setter) =>
    setter(prev => ({ ...prev, [arr]: prev[arr].includes(val) ? prev[arr].filter(x => x !== val) : [...prev[arr], val] }))

  return (
    <StepWrapper
      step={step} totalSteps={TOTAL}
      title={['Tell us about yourself', 'Your professional background', 'Your skills', 'Job preferences', 'Resume & profile'][step - 1]}
      subtitle={['Let\'s start with the basics.', 'Help employers understand your experience.', 'Skills are key to AI job matching.', 'What kind of work are you looking for?', 'Upload your resume to complete your profile.'][step - 1]}
      onBack={() => setStep(s => s - 1)}
      onContinue={handleContinue}
      continueLabel={step === TOTAL ? (uploading ? 'Uploading & processing...' : 'Complete Profile') : 'Continue'}
      continueDisabled={uploading}
    >
      {saved && <div className="mb-4 text-xs text-green-600 font-medium">✓ Saved</div>}

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          {field('Full Name', input({ value: basic.fullName, onChange: e => setBasic({ ...basic, fullName: e.target.value }), placeholder: 'John Doe', error: errors.fullName }), errors.fullName)}
          {field('Phone Number',
            <input
              value={basic.phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                setBasic({ ...basic, phone: val })
              }}
              placeholder="03001234567xx (13 digits)"
              inputMode="numeric"
              className={`w-full h-12 px-4 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 ${errors.phone ? 'border-red-400' : 'border-[#D4D2D0]'}`}
            />,
            errors.phone)}
          {field('City / Location', input({ value: basic.location, onChange: e => setBasic({ ...basic, location: e.target.value }), placeholder: 'e.g. Karachi', error: errors.location }), errors.location)}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          {field('Current or Most Recent Job Title', input({ value: prof.currentTitle, onChange: e => setProf({ ...prof, currentTitle: e.target.value }), placeholder: 'e.g. Frontend Developer', error: errors.currentTitle }), errors.currentTitle)}
          {field('Years of Experience',
            select({ value: prof.yearsOfExp, onChange: e => setProf({ ...prof, yearsOfExp: e.target.value }), error: errors.yearsOfExp, children: [<option key="" value="">Select...</option>, ...EXP_OPTIONS.map(o => <option key={o}>{o}</option>)] }),
            errors.yearsOfExp)}
          {field('Industry',
            select({ value: prof.industry, onChange: e => setProf({ ...prof, industry: e.target.value }), error: errors.industry, children: [<option key="" value="">Select...</option>, ...INDUSTRIES.map(o => <option key={o}>{o}</option>)] }),
            errors.industry)}
          {field('Highest Education Level',
            select({ value: prof.educationLevel, onChange: e => setProf({ ...prof, educationLevel: e.target.value }), error: errors.educationLevel, children: [<option key="" value="">Select...</option>, ...EDU_OPTIONS.map(o => <option key={o}>{o}</option>)] }),
            errors.educationLevel)}
          {field('Field of Study', input({ value: prof.fieldOfStudy, onChange: e => setProf({ ...prof, fieldOfStudy: e.target.value }), placeholder: 'e.g. Computer Science' }), null, true)}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          {field('Primary Skills',
            <SkillChipInput skills={skills} onChange={setSkills} showLevel />,
            errors.skills)}
          {field('Tools & Technologies', <TagInput tags={tools} onChange={setTools} placeholder="e.g. Docker, AWS, Figma..." />, null, true)}
          {field('Certifications', <TagInput tags={certs} onChange={setCerts} placeholder="e.g. AWS Certified, PMP..." />, null, true)}
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div>
          {field('Job Type',
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(t => (
                <button key={t} type="button"
                  onClick={() => toggleArr('jobType', t, setPrefs)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${prefs.jobType.includes(t) ? 'bg-indeed-blue text-white border-indeed-blue' : 'border-gray-300 text-gray-600 hover:border-indeed-blue'}`}>
                  {t}
                </button>
              ))}
            </div>, errors.jobType)}
          {field('Work Mode',
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map(m => (
                <button key={m} type="button"
                  onClick={() => setPrefs({ ...prefs, workMode: m })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${prefs.workMode === m ? 'bg-indeed-blue text-white border-indeed-blue' : 'border-gray-300 text-gray-600 hover:border-indeed-blue'}`}>
                  {m}
                </button>
              ))}
            </div>, errors.workMode)}
          {field('Expected Monthly Salary (PKR)',
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>PKR {prefs.salaryMin.toLocaleString()}</span>
                <span>PKR {prefs.salaryMax.toLocaleString()}</span>
              </div>
              <input type="range" min={0} max={500000} step={5000} value={prefs.salaryMax}
                onChange={e => setPrefs({ ...prefs, salaryMax: Number(e.target.value) })}
                className="w-full accent-indeed-blue" />
            </div>)}
          {field('Preferred Locations',
            <CityChipInput selected={prefs.preferredLocations} onChange={locs => setPrefs({ ...prefs, preferredLocations: locs })} />
          )}
          {field('Open to Relocation',
            <div className="flex items-center gap-3">
              {['Yes','No'].map(v => (
                <button key={v} type="button"
                  onClick={() => setPrefs({ ...prefs, openToRelocation: v === 'Yes' })}
                  className={`px-6 py-2 rounded-full border text-sm font-medium transition-colors ${(v === 'Yes') === prefs.openToRelocation ? 'bg-indeed-blue text-white border-indeed-blue' : 'border-gray-300 text-gray-600'}`}>
                  {v}
                </button>
              ))}
            </div>)}
          {field('Career Goals',
            <div>
              <textarea value={prefs.careerGoals} onChange={e => setPrefs({ ...prefs, careerGoals: e.target.value })} maxLength={300}
                placeholder="Briefly describe your career goals..."
                className="w-full px-4 py-3 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 resize-none h-24" />
              <p className="text-xs text-gray-400 text-right">{prefs.careerGoals.length}/300</p>
            </div>, null, true)}
        </div>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <div>
          {field('Resume (PDF)', <FileUpload file={resume.file} onChange={f => setResume({ ...resume, file: f })} error={errors.resume} />, errors.resume)}
          {field('Professional Summary',
            <div>
              <textarea value={resume.profileSummary} onChange={e => setResume({ ...resume, profileSummary: e.target.value })} maxLength={500}
                placeholder="A short bio about yourself..."
                className="w-full px-4 py-3 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 resize-none h-28" />
              <p className="text-xs text-gray-400 text-right">{resume.profileSummary.length}/500</p>
            </div>, null, true)}
          {field('LinkedIn URL', input({ value: resume.linkedinUrl, onChange: e => setResume({ ...resume, linkedinUrl: e.target.value }), placeholder: 'https://linkedin.com/in/yourname', type: 'url' }), null, true)}
          {field('Portfolio / GitHub URL', input({ value: resume.portfolioUrl, onChange: e => setResume({ ...resume, portfolioUrl: e.target.value }), placeholder: 'https://github.com/yourname', type: 'url' }), null, true)}
        </div>
      )}
    </StepWrapper>
  )
}
