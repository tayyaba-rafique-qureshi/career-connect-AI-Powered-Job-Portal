import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusCircle, X, MapPin, DollarSign, Save } from 'lucide-react'
import EmployerLayout from '../../components/employer/EmployerLayout'
import api from '../../services/api'

const EXP_LEVELS = [
  { value: 'any',    label: 'Any Level' },
  { value: 'entry',  label: 'Entry Level (0–2 yrs)' },
  { value: 'mid',    label: 'Mid Level (2–5 yrs)' },
  { value: 'senior', label: 'Senior Level (5–10 yrs)' },
  { value: 'lead',   label: 'Lead / Principal (10+ yrs)' },
]
const JOB_TYPES  = ['full-time', 'part-time', 'contract', 'internship']
const WORK_MODES = ['remote', 'on-site', 'hybrid']

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm]         = useState(null)
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => {
        setForm({
          title:           data.title || '',
          description:     data.description || '',
          requiredSkills:  data.requiredSkills || data.skills || [],
          experienceLevel: data.experienceLevel || 'any',
          jobType:         data.jobType || [],
          workMode:        data.workMode || 'remote',
          location:        data.location || '',
          salaryMin:       data.salaryMin ?? '',
          salaryMax:       data.salaryMax ?? '',
          status:          data.status || 'active',
        })
      })
      .catch(() => setError('Failed to load job.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.requiredSkills.includes(s)) set('requiredSkills', [...form.requiredSkills, s])
    setSkillInput('')
  }

  const removeSkill = (skill) => set('requiredSkills', form.requiredSkills.filter(s => s !== skill))

  const toggleJobType = (type) => {
    set('jobType', form.jobType.includes(type)
      ? form.jobType.filter(t => t !== type)
      : [...form.jobType, type])
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Job title and description are required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await api.put(`/jobs/${id}`, {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      })
      navigate('/employer/jobs')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <EmployerLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#2557A7] border-t-transparent rounded-full animate-spin" />
      </div>
    </EmployerLayout>
  )

  if (!form) return (
    <EmployerLayout>
      <div className="p-8 text-center text-red-500">{error || 'Job not found.'}</div>
    </EmployerLayout>
  )

  return (
    <EmployerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Edit Job</h1>
        <p className="text-sm text-[#595959] mt-0.5">Update the job details below</p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="max-w-2xl space-y-5">
        <Card title="Job Title">
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7]" />
        </Card>

        <Card title="Job Description">
          <textarea rows={7} value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7] resize-none" />
        </Card>

        <Card title="Required Skills">
          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="Add a skill..." value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7]" />
            <button onClick={addSkill} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2557A7] text-white rounded-lg text-sm font-semibold hover:bg-[#1a4283]">
              <PlusCircle size={15} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.requiredSkills.map(skill => (
              <span key={skill} className="flex items-center gap-1.5 bg-blue-50 text-[#2557A7] border border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X size={13} /></button>
              </span>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Experience Level">
            <select value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7] bg-white">
              {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Card>
          <Card title="Job Type">
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(type => (
                <button key={type} type="button" onClick={() => toggleJobType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    form.jobType.includes(type) ? 'bg-[#2557A7] text-white border-[#2557A7]' : 'border-gray-300 text-[#595959] hover:border-[#2557A7] hover:text-[#2557A7]'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Work Mode">
            <div className="flex gap-3">
              {WORK_MODES.map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="workMode" value={mode} checked={form.workMode === mode}
                    onChange={() => set('workMode', mode)} className="accent-[#2557A7]" />
                  <span className="text-sm text-[#595959] capitalize">{mode}</span>
                </label>
              ))}
            </div>
          </Card>
          <Card title="Location">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7]" />
            </div>
          </Card>
        </div>

        <Card title="Salary Range (Annual, USD)">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="number" placeholder="Min" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7]" />
            </div>
            <span className="text-[#595959] text-sm">to</span>
            <div className="relative flex-1">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="number" placeholder="Max" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7]" />
            </div>
          </div>
        </Card>

        <Card title="Status">
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2557A7]/30 focus:border-[#2557A7] bg-white">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </Card>

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate('/employer/jobs')}
            className="px-5 py-2.5 border border-gray-300 text-[#595959] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2557A7] text-white rounded-lg text-sm font-semibold hover:bg-[#1a4283] transition-colors disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </EmployerLayout>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <label className="block text-sm font-semibold text-[#1A1A2E] mb-3">{title}</label>
      {children}
    </div>
  )
}
