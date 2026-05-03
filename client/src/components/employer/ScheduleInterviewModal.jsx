import { useState } from 'react'
import { X, Calendar, Clock, Video, MapPin, FileText, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function ScheduleInterviewModal({ application, employerAddress, onClose, onSuccess }) {
  const [form, setForm] = useState({
    date:        '',
    time:        '',
    type:        'virtual',
    meetingLink: '',
    address:     employerAddress || '',
    notes:       '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Date is required'
    else {
      const chosen = new Date(`${form.date}T${form.time || '00:00'}`)
      if (chosen < new Date()) e.date = 'Date and time must be in the future'
    }
    if (!form.time) e.time = 'Time is required'
    if (form.type === 'virtual' && !form.meetingLink.trim())
      e.meetingLink = 'Meeting link is required for virtual interviews'
    if (form.type === 'in-person' && !form.address.trim())
      e.address = 'Address is required for in-person interviews'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    setApiError('')
    try {
      await api.post(`/applications/${application._id}/interview`, form)
      onSuccess(application._id)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to schedule interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `w-full h-11 px-3 border rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 ${
      errors[field] ? 'border-red-400' : 'border-[#D4D2D0]'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A2E]">Schedule Interview</h2>
            <p className="text-xs text-[#595959] mt-0.5">
              {application.applicant?.name} — {application.job?.title}
            </p>
          </div>
          <button onClick={onClose} className="text-[#595959] hover:text-[#1A1A2E]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {apiError}
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                <Calendar size={12} className="inline mr-1" />Date
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('date', e.target.value)}
                className={inputCls('date')}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                <Clock size={12} className="inline mr-1" />Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                className={inputCls('time')}
              />
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Interview type toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-2">Interview Type</label>
            <div className="flex rounded-lg border border-[#D4D2D0] overflow-hidden">
              {['virtual', 'in-person'].map(t => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                    form.type === t
                      ? 'bg-[#2557A7] text-white'
                      : 'bg-white text-[#595959] hover:bg-gray-50'
                  }`}
                >
                  {t === 'virtual' ? <><Video size={13} className="inline mr-1.5" />Virtual</> : <><MapPin size={13} className="inline mr-1.5" />In-Person</>}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional field */}
          {form.type === 'virtual' ? (
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">Meeting Link</label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={e => set('meetingLink', e.target.value)}
                placeholder="https://meet.google.com/..."
                className={inputCls('meetingLink')}
              />
              {errors.meetingLink && <p className="text-xs text-red-500 mt-1">{errors.meetingLink}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">Office Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="123 Main St, City, Country"
                className={inputCls('address')}
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
              <FileText size={12} className="inline mr-1" />Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Any instructions or preparation notes for the candidate..."
              className="w-full px-3 py-2 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#595959] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  )
}
