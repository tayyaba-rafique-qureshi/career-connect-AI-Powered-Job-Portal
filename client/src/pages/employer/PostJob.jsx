import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmployerLayout from '../../components/employer/EmployerLayout'
import TagInput from '../../components/onboarding/TagInput'
import Toast from '../../components/employer/Toast'
import api from '../../services/api'
import {
  Briefcase, MapPin, Users, Monitor, FileText, Building2,
  Eye, Loader2, ChevronDown
} from 'lucide-react'

const EXP_LEVELS   = ['any', 'entry', 'mid', 'senior', 'lead']
const JOB_TYPES    = ['full-time', 'part-time', 'contract', 'internship']
const WORK_MODES   = ['remote', 'on-site', 'hybrid']
const SALARY_TYPES = [
  { value: 'yearly',  label: 'Yearly',  rangeLabel: 'Annual Salary Range (PKR/yr)' },
  { value: 'monthly', label: 'Monthly', rangeLabel: 'Monthly Salary Range (PKR/mo)' },
  { value: 'stipend', label: 'Stipend (for internships)', rangeLabel: 'Monthly Stipend Range (PKR/mo)' },
]

const EMPTY_FORM = {
  company:         '',
  title:           '',
  description:     '',
  requiredSkills:  [],
  experienceLevel: 'any',
  jobType:         [],
  workMode:        'remote',
  location:        '',
  salaryMin:       '',
  salaryMax:       '',
  salaryType:      'yearly',
}

export default function PostJob() {
  const navigate   = useNavigate()
  const { jobId }  = useParams()          // present when editing
  const isEdit     = Boolean(jobId)

  const [form, setForm]       = useState(EMPTY_FORM)
  const [loadingJob, setLoadingJob] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]     = useState(null)
  const [errors, setErrors]   = useState({})

  // Load existing job when editing
  useEffect(() => {
    if (!isEdit) return
    api.get(`/jobs/${jobId}`)
      .then(({ data }) => {
        setForm({
          company:         data.company         || '',
          title:           data.title           || '',
          description:     data.description     || '',
          requiredSkills:  data.requiredSkills  || data.skills || [],
          experienceLevel: data.experienceLevel || 'any',
          jobType:         data.jobType         || [],
          workMode:        data.workMode        || 'remote',
          location:        data.location        || '',
          salaryMin:       data.salaryMin != null ? String(data.salaryMin) : '',
          salaryMax:       data.salaryMax != null ? String(data.salaryMax) : '',
          salaryType:      data.salaryType      || 'yearly',
        })
      })
      .catch(() => setToast({ message: 'Failed to load job details.', type: 'error' }))
      .finally(() => setLoadingJob(false))
  }, [jobId, isEdit])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const toggleJobType = (type) => {
    set('jobType', form.jobType.includes(type)
      ? form.jobType.filter(t => t !== type)
      : [...form.jobType, type])
  }

  const validate = () => {
    const e = {}
    if (!form.company.trim())     e.company     = 'Company name is required'
    if (!form.title.trim())       e.title       = 'Job title is required'
    if (!form.description.trim()) e.description = 'Job description is required'
    if (form.jobType.length === 0) e.jobType    = 'Select at least one job type'
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax))
      e.salaryMax = 'Max salary must be greater than min salary'
    return e
  }

  const submit = async (status) => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        status,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        salaryType: form.salaryType || 'yearly',
      }

      // Temporary verification log — confirms correct status is being sent
      console.log(`[PostJob] submitting payload:`, { title: payload.title, status: payload.status })

      if (isEdit) {
        await api.put(`/jobs/${jobId}`, payload)
      } else {
        await api.post('/jobs', payload)
      }

      navigate('/dashboard/recruiter/jobs', {
        state: { toast: isEdit ? 'Job updated successfully.' : status === 'active' ? 'Job posted successfully!' : 'Job saved as draft.' }
      })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save job. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = (field) =>
    `w-full h-11 px-3 border rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 bg-white ${
      errors[field] ? 'border-red-400' : 'border-[#D4D2D0]'
    }`

  const salarySuffix = form.salaryType === 'monthly' || form.salaryType === 'stipend' ? '/mo' : '/yr'

  if (loadingJob) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-[#2557A7]" />
        </div>
      </EmployerLayout>
    )
  }

  return (
    <EmployerLayout>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          {isEdit ? 'Edit Job' : 'Post a New Job'}
        </h1>
        <p className="text-[#595959] text-sm mt-1">
          {isEdit ? 'Update the details below.' : 'Fill in the details below. You can save as draft or publish immediately.'}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Form ── */}
        <div className="flex-1 space-y-5">

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
              <Building2 size={14} className="inline mr-1.5" />Company Name *
            </label>
            <input
              type="text"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              placeholder="e.g. Contour Software"
              className={inputCls('company')}
            />
            {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
          </div>

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
              <Briefcase size={14} className="inline mr-1.5" />Job Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputCls('title')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
              <FileText size={14} className="inline mr-1.5" />Job Description *
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={8}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className={`w-full px-3 py-2.5 border rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 resize-y ${
                errors.description ? 'border-red-400' : 'border-[#D4D2D0]'
              }`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">Required Skills</label>
            <TagInput
              tags={form.requiredSkills}
              onChange={tags => set('requiredSkills', tags)}
              placeholder="Type a skill and press Enter (e.g. React, Node.js)"
            />
          </div>

          {/* Experience + Work Mode */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                  <Users size={14} className="inline mr-1.5" />Experience Level
                </label>
                <div className="relative">
                  <select
                    value={form.experienceLevel}
                    onChange={e => set('experienceLevel', e.target.value)}
                    className={`${inputCls('experienceLevel')} appearance-none pr-8 capitalize`}
                  >
                    {EXP_LEVELS.map(l => (
                      <option key={l} value={l} className="capitalize">{l === 'any' ? 'Any Level' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595959] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                  <Monitor size={14} className="inline mr-1.5" />Work Mode
                </label>
                <div className="flex rounded-lg border border-[#D4D2D0] overflow-hidden h-11">
                  {WORK_MODES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('workMode', m)}
                      className={`flex-1 text-xs font-medium transition-colors capitalize ${
                        form.workMode === m
                          ? 'bg-[#2557A7] text-white'
                          : 'bg-white text-[#595959] hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
              Job Type * <span className="font-normal text-[#595959]">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleJobType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                    form.jobType.includes(t)
                      ? 'bg-[#2557A7] text-white border-[#2557A7]'
                      : 'bg-white text-[#595959] border-[#D4D2D0] hover:border-[#2557A7] hover:text-[#2557A7]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.jobType && <p className="text-xs text-red-500 mt-2">{errors.jobType}</p>}
          </div>

          {/* Location + Salary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                  <MapPin size={14} className="inline mr-1.5" />Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Islamabad, Remote"
                  className={inputCls('location')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                  Salary Type
                </label>
                <div className="relative">
                  <select
                    value={form.salaryType}
                    onChange={e => set('salaryType', e.target.value)}
                    className={`${inputCls('salaryType')} appearance-none pr-8`}
                  >
                    {SALARY_TYPES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595959] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                <span className="inline mr-1.5 font-semibold">₨</span>
                {SALARY_TYPES.find(s => s.value === form.salaryType)?.rangeLabel || 'Salary Range'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={e => set('salaryMin', e.target.value)}
                  placeholder="Min"
                  min="0"
                  className={inputCls('salaryMin')}
                />
                <span className="text-[#595959] text-sm flex-shrink-0">–</span>
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={e => set('salaryMax', e.target.value)}
                  placeholder="Max"
                  min="0"
                  className={inputCls('salaryMax')}
                />
              </div>
              {errors.salaryMax && <p className="text-xs text-red-500 mt-1">{errors.salaryMax}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pb-8">
            <button
              onClick={() => submit('active')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Post Job'}
            </button>
            {!isEdit && (
              <button
                onClick={() => submit('draft')}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-[#1A1A2E] text-sm font-semibold rounded-lg transition-colors"
              >
                Save as Draft
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/recruiter/jobs')}
              className="px-6 py-2.5 text-sm font-medium text-[#595959] hover:text-[#1A1A2E] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="xl:w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Eye size={14} className="text-[#595959]" />
                <span className="text-xs font-semibold text-[#595959] uppercase tracking-wide">Live Preview</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#1A1A2E] leading-tight">
                  {form.title || <span className="text-gray-300">Job Title</span>}
                </h3>
                <p className="text-xs text-[#595959] mt-1">
                  {form.company || <span className="text-gray-300">Company Name</span>}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {form.workMode && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#2557A7] font-medium capitalize">
                      {form.workMode}
                    </span>
                  )}
                  {form.experienceLevel && form.experienceLevel !== 'any' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#595959] font-medium capitalize">
                      {form.experienceLevel}
                    </span>
                  )}
                  {form.jobType.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#595959] font-medium capitalize">
                      {t}
                    </span>
                  ))}
                </div>

                {form.location && (
                  <p className="text-xs text-[#595959] mt-2 flex items-center gap-1">
                    <MapPin size={11} />{form.location}
                  </p>
                )}

                {(form.salaryMin || form.salaryMax) && (
                  <p className="text-xs text-[#595959] mt-1 flex items-center gap-1">
                    <span className="font-semibold text-xs">₨</span>
                    {form.salaryMin && form.salaryMax
                      ? `Rs.${Number(form.salaryMin).toLocaleString()} – Rs.${Number(form.salaryMax).toLocaleString()}${salarySuffix}`
                      : form.salaryMin
                      ? `From Rs.${Number(form.salaryMin).toLocaleString()}${salarySuffix}`
                      : `Up to Rs.${Number(form.salaryMax).toLocaleString()}${salarySuffix}`}
                  </p>
                )}

                {form.description && (
                  <p className="text-xs text-[#595959] mt-3 leading-relaxed line-clamp-4">
                    {form.description}
                  </p>
                )}

                {form.requiredSkills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-[#1A1A2E] mb-1.5">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.requiredSkills.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#2557A7] border border-blue-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  )
}
