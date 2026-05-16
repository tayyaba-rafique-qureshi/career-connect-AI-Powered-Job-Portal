/**
 * CompanyReviews — inline section shown inside JobDetails
 * Displays existing reviews for the job's company + a form to submit a new one.
 * Reviews submitted here are stored in MongoDB and appear on /company-reviews page.
 */
import { useState, useEffect } from 'react'
import { Star, ChevronDown, ChevronUp, PenLine } from 'lucide-react'
import api from '../../services/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={24}
          fill={(hovered || value) >= i ? 'var(--cc-amber)' : 'none'}
          stroke={(hovered || value) >= i ? 'var(--cc-amber)' : 'var(--cc-border)'}
          style={{ cursor: 'pointer', transition: 'all 0.1s' }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        />
      ))}
    </div>
  )
}

function StarDisplay({ rating, size = 13 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? 'var(--cc-amber)' : 'none'}
          stroke={i <= Math.round(rating) ? 'var(--cc-amber)' : 'var(--cc-border)'}
        />
      ))}
    </div>
  )
}

function SubRatingRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', color: 'var(--cc-text-2)', width: '130px', flexShrink: 0 }}>{label}</span>
      <StarPicker value={value} onChange={onChange} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CompanyReviews({ companyName }) {
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState('')
  const [expanded, setExpanded]     = useState(false)   // show all vs first 2

  const [form, setForm] = useState({
    rating: 0, title: '', body: '', pros: '', cons: '',
    role: '', employmentType: 'Full-time', recommended: true,
    workLifeBalance: 0, compensation: 0, jobSecurity: 0, management: 0, culture: 0,
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  // Fetch reviews for this company
  useEffect(() => {
    if (!companyName) return
    setLoading(true)
    api.get(`/company-reviews/${encodeURIComponent(companyName)}`)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [companyName])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) return setError('Please select a star rating')
    if (!form.title.trim()) return setError('Please add a review title')
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post(`/company-reviews/${encodeURIComponent(companyName)}`, form)
      // Prepend new review to list so it shows immediately
      setReviews(prev => [res.data, ...prev])
      setSubmitted(true)
      setShowForm(false)
      setForm({ rating: 0, title: '', body: '', pros: '', cons: '', role: '', employmentType: 'Full-time', recommended: true, workLifeBalance: 0, compensation: 0, jobSecurity: 0, management: 0, culture: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const displayedReviews = expanded ? reviews : reviews.slice(0, 2)

  return (
    <div id="company-reviews" style={{ marginBottom: '24px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 2px' }}>
            {companyName} Reviews
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StarDisplay rating={parseFloat(avgRating)} size={14} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-1)' }}>{avgRating}</span>
              <span style={{ fontSize: '13px', color: 'var(--cc-text-3)' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSubmitted(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', backgroundColor: showForm ? 'var(--cc-surface-2)' : 'var(--cc-blue)',
            color: showForm ? 'var(--cc-text-2)' : 'var(--cc-text-4)',
            border: showForm ? '1px solid var(--cc-border)' : 'none',
            borderRadius: '6px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          <PenLine size={14} />
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      {/* Success banner */}
      {submitted && (
        <div style={{
          padding: '12px 16px', backgroundColor: 'var(--cc-green-bg)', border: '1px solid var(--cc-green-border)',
          borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: 'var(--cc-green)', fontWeight: '500',
        }}>
          ✓ Your review has been submitted and is now visible on the Company Reviews page.
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'var(--cc-surface-2)', border: '1px solid var(--cc-border)',
          borderRadius: '8px', padding: '20px', marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 16px' }}>
            Rate {companyName}
          </h3>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--cc-red-bg)', border: '1px solid var(--cc-red)', borderRadius: '6px', marginBottom: '14px', fontSize: '13px', color: 'var(--cc-red)' }}>
              {error}
            </div>
          )}

          {/* Overall rating */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '8px' }}>
              Overall rating *
            </label>
            <StarPicker value={form.rating} onChange={v => set('rating', v)} />
          </div>

          {/* Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '6px' }}>Review title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Summarize your experience"
              style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
            />
          </div>

          {/* Pros / Cons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-green)', marginBottom: '6px' }}>Pros</label>
              <textarea value={form.pros} onChange={e => set('pros', e.target.value)}
                placeholder="What did you like?"
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-red)', marginBottom: '6px' }}>Cons</label>
              <textarea value={form.cons} onChange={e => set('cons', e.target.value)}
                placeholder="What could be improved?"
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
              />
            </div>
          </div>

          {/* Body */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '6px' }}>Full review (optional)</label>
            <textarea value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Share more details about your experience..."
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
            />
          </div>

          {/* Sub-ratings */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '10px' }}>Rate specific areas (optional)</label>
            <SubRatingRow label="Work-life balance" value={form.workLifeBalance} onChange={v => set('workLifeBalance', v)} />
            <SubRatingRow label="Compensation"      value={form.compensation}    onChange={v => set('compensation', v)} />
            <SubRatingRow label="Job security"      value={form.jobSecurity}     onChange={v => set('jobSecurity', v)} />
            <SubRatingRow label="Management"        value={form.management}      onChange={v => set('management', v)} />
            <SubRatingRow label="Culture"           value={form.culture}         onChange={v => set('culture', v)} />
          </div>

          {/* Role + type + recommend */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '6px' }}>Your role</label>
              <input value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="e.g. Software Engineer"
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--cc-input-bg)', color: 'var(--cc-text-1)' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '6px' }}>Employment type</label>
              <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', border: '1px solid var(--cc-input-border)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: 'var(--cc-input-bg)', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--cc-text-1)' }}>
                {['Full-time', 'Part-time', 'Contract', 'Intern'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
            <input type="checkbox" checked={form.recommended} onChange={e => set('recommended', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--cc-blue)' }} />
            <span style={{ fontSize: '13px', color: 'var(--cc-text-2)' }}>I would recommend this company to a friend</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ padding: '8px 20px', border: '1px solid var(--cc-border)', borderRadius: '6px', fontSize: '13px', color: 'var(--cc-text-2)', background: 'var(--cc-surface)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '8px 24px', backgroundColor: submitting ? 'var(--cc-blue-border)' : 'var(--cc-blue)', color: 'var(--cc-text-4)', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--cc-text-3)', padding: '12px 0' }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{
          padding: '20px', backgroundColor: 'var(--cc-surface-2)', border: '1px solid var(--cc-border)',
          borderRadius: '8px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--cc-text-2)', margin: '0 0 4px' }}>No reviews yet for {companyName}</p>
          <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0 }}>Be the first to share your experience</p>
        </div>
      ) : (
        <>
          {displayedReviews.map((r, i) => (
            <div key={r._id || i} style={{
              backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
              borderRadius: '8px', padding: '16px', marginBottom: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>{r.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StarDisplay rating={r.rating} />
                    <span style={{ fontSize: '12px', color: 'var(--cc-text-3)' }}>
                      {r.role || 'Employee'} · {r.employmentType} · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {r.recommended && (
                  <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)', borderRadius: '4px', fontWeight: '500', flexShrink: 0 }}>
                    ✓ Recommends
                  </span>
                )}
              </div>
              {(r.pros || r.cons) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '10px 0' }}>
                  {r.pros && <div><p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-green)', margin: '0 0 3px' }}>Pros</p><p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>{r.pros}</p></div>}
                  {r.cons && <div><p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-red)', margin: '0 0 3px' }}>Cons</p><p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>{r.cons}</p></div>}
                </div>
              )}
              {r.body && <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', lineHeight: 1.6, margin: '8px 0 0' }}>{r.body}</p>}
            </div>
          ))}

          {reviews.length > 2 && (
            <button onClick={() => setExpanded(!expanded)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600',
                padding: '4px 0', fontFamily: 'inherit',
              }}>
              {expanded
                ? <><ChevronUp size={14} /> Show fewer reviews</>
                : <><ChevronDown size={14} /> See all {reviews.length} reviews</>
              }
            </button>
          )}
        </>
      )}
    </div>
  )
}
