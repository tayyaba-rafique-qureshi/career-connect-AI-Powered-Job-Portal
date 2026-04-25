import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import StepWrapper from '../../components/onboarding/StepWrapper'
import SkillChipInput from '../../components/onboarding/SkillChipInput'
import TagInput from '../../components/onboarding/TagInput'

const TOTAL = 3
const INDUSTRIES = ['IT/Software','Finance','Healthcare','Education','Marketing','Engineering','Other']
const SIZES = ['1–10','11–50','51–200','201–1000','1000+']
const REMOTE_POLICIES = ['Fully Remote','Hybrid','On-site Only','Flexible']
const COMPANY_TYPES = ['Startup','SME','Enterprise','NGO','Government']
const EXP_LEVELS = ['Entry Level','Mid Level','Senior','Lead / Manager']
const HIRING_VOLUMES = ['1–5','6–20','21–50','50+']

const field = (label, children, error, optional) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label} {optional && <span className="text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const inp = (props) => (
  <input {...props} className={`w-full h-12 px-4 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 ${props.error ? 'border-red-400' : 'border-[#D4D2D0]'}`} />
)

const sel = (props) => (
  <select {...props} className={`w-full h-12 px-4 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 bg-white ${props.error ? 'border-red-400' : 'border-[#D4D2D0]'}`} />
)

export default function EmployerOnboarding() {
  const { user, markProfileComplete } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  const [company, setCompany] = useState({ name: '', industry: '', size: '', websiteUrl: '', yearFounded: '' })
  const [loc, setLoc] = useState({ headquarters: '', countries: [], remotePolicy: '', companyType: '' })
  const [hiring, setHiring] = useState({ typicalRoles: [], preferredExpLevel: [], hiringVolume: '', aboutCompany: '', employerPerks: [] })

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const saveStep = async (stepNum, data) => {
    await api.patch('/users/onboarding', { step: stepNum, role: 'employer', data })
    showSaved()
  }

  const validate = () => {
    const e = {}
    if (step === 1) {
      if (!company.name) e.name = 'Company name is required'
      if (!company.industry) e.industry = 'Please select industry'
      if (!company.size) e.size = 'Please select company size'
    }
    if (step === 2) {
      if (!loc.headquarters) e.headquarters = 'Headquarters city is required'
      if (!loc.remotePolicy) e.remotePolicy = 'Please select remote work policy'
      if (!loc.companyType) e.companyType = 'Please select company type'
    }
    if (step === 3) {
      if (hiring.typicalRoles.length === 0) e.typicalRoles = 'Add at least one role'
      if (hiring.preferredExpLevel.length === 0) e.preferredExpLevel = 'Select at least one experience level'
      if (!hiring.aboutCompany) e.aboutCompany = 'Please describe your company'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = async () => {
    if (!validate()) return
    try {
      if (step === 1) await saveStep(1, company)
      if (step === 2) await saveStep(2, loc)
      if (step === 3) {
        await saveStep(3, hiring)
        markProfileComplete('employer')
        navigate('/dashboard/recruiter')
        return
      }
      setStep(s => s + 1)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleLevel = (val) =>
    setHiring(h => ({ ...h, preferredExpLevel: h.preferredExpLevel.includes(val) ? h.preferredExpLevel.filter(x => x !== val) : [...h.preferredExpLevel, val] }))

  return (
    <StepWrapper
      step={step} totalSteps={TOTAL}
      title={['Company information', 'Location & work policy', 'Hiring preferences'][step - 1]}
      subtitle={['Tell candidates about your company.', 'Where is your team based?', 'What kind of talent are you looking for?'][step - 1]}
      onBack={() => setStep(s => s - 1)}
      onContinue={handleContinue}
      continueLabel={step === TOTAL ? 'Complete Setup' : 'Continue'}
    >
      {saved && <div className="mb-4 text-xs text-green-600 font-medium">✓ Saved</div>}

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          {field('Company Name', inp({ value: company.name, onChange: e => setCompany({ ...company, name: e.target.value }), placeholder: 'e.g. Acme Corp', error: errors.name }), errors.name)}
          {field('Industry',
            sel({ value: company.industry, onChange: e => setCompany({ ...company, industry: e.target.value }), error: errors.industry, children: [<option key="" value="">Select...</option>, ...INDUSTRIES.map(o => <option key={o}>{o}</option>)] }),
            errors.industry)}
          {field('Company Size',
            sel({ value: company.size, onChange: e => setCompany({ ...company, size: e.target.value }), error: errors.size, children: [<option key="" value="">Select...</option>, ...SIZES.map(o => <option key={o}>{o}</option>)] }),
            errors.size)}
          {field('Website URL', inp({ value: company.websiteUrl, onChange: e => setCompany({ ...company, websiteUrl: e.target.value }), placeholder: 'https://yourcompany.com', type: 'url' }), null, true)}
          {field('Year Founded', inp({ value: company.yearFounded, onChange: e => setCompany({ ...company, yearFounded: e.target.value }), placeholder: 'e.g. 2015', type: 'number' }), null, true)}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          {field('Headquarters City', inp({ value: loc.headquarters, onChange: e => setLoc({ ...loc, headquarters: e.target.value }), placeholder: 'e.g. Lahore', error: errors.headquarters }), errors.headquarters)}
          {field('Remote Work Policy',
            <div className="flex flex-wrap gap-2">
              {REMOTE_POLICIES.map(p => (
                <button key={p} type="button"
                  onClick={() => setLoc({ ...loc, remotePolicy: p })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${loc.remotePolicy === p ? 'bg-indeed-blue text-white border-indeed-blue' : 'border-gray-300 text-gray-600 hover:border-indeed-blue'}`}>
                  {p}
                </button>
              ))}
            </div>, errors.remotePolicy)}
          {field('Company Type',
            sel({ value: loc.companyType, onChange: e => setLoc({ ...loc, companyType: e.target.value }), error: errors.companyType, children: [<option key="" value="">Select...</option>, ...COMPANY_TYPES.map(o => <option key={o}>{o}</option>)] }),
            errors.companyType)}
          {field('Operating Countries', <TagInput tags={loc.countries} onChange={c => setLoc({ ...loc, countries: c })} placeholder="e.g. Pakistan, UAE..." />, null, true)}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          {field('Roles Typically Hired For',
            <SkillChipInput skills={hiring.typicalRoles.map(r => ({ name: r, level: '' }))} onChange={arr => setHiring({ ...hiring, typicalRoles: arr.map(a => a.name) })} />,
            errors.typicalRoles)}
          {field('Preferred Experience Level',
            <div className="flex flex-wrap gap-2">
              {EXP_LEVELS.map(l => (
                <button key={l} type="button" onClick={() => toggleLevel(l)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${hiring.preferredExpLevel.includes(l) ? 'bg-indeed-blue text-white border-indeed-blue' : 'border-gray-300 text-gray-600 hover:border-indeed-blue'}`}>
                  {l}
                </button>
              ))}
            </div>, errors.preferredExpLevel)}
          {field('Annual Hiring Volume',
            sel({ value: hiring.hiringVolume, onChange: e => setHiring({ ...hiring, hiringVolume: e.target.value }), children: [<option key="" value="">Select...</option>, ...HIRING_VOLUMES.map(o => <option key={o}>{o}</option>)] }),
            null, true)}
          {field('About the Company',
            <div>
              <textarea value={hiring.aboutCompany} onChange={e => setHiring({ ...hiring, aboutCompany: e.target.value })} maxLength={1000}
                placeholder="Tell candidates what makes your company great..."
                className={`w-full px-4 py-3 border rounded text-sm focus:outline-none focus:border-indeed-blue focus:ring-2 focus:ring-blue-100 resize-none h-32 ${errors.aboutCompany ? 'border-red-400' : 'border-[#D4D2D0]'}`} />
              <p className="text-xs text-gray-400 text-right">{hiring.aboutCompany.length}/1000</p>
            </div>, errors.aboutCompany)}
          {field('Employer Perks', <TagInput tags={hiring.employerPerks} onChange={p => setHiring({ ...hiring, employerPerks: p })} placeholder="e.g. Remote-first, Health insurance..." />, null, true)}
        </div>
      )}
    </StepWrapper>
  )
}
