import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, MapPin, Users, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import api from '../../services/api'

// ── Star rating display ───────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? '#F5A623' : 'none'}
          stroke={i <= Math.round(rating) ? '#F5A623' : '#D4D2D0'}
        />
      ))}
    </div>
  )
}

// ── Rating bar (like Indeed's breakdown) ─────────────────────────────────────
function RatingBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      <span className="cr-rating-label" style={{ fontSize: '13px', color: 'var(--cc-text-2)', width: '140px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--cc-border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(value / 5) * 100}%`,
          backgroundColor: value >= 4 ? 'var(--cc-green)' : value >= 3 ? 'var(--cc-amber)' : 'var(--cc-red)',
          borderRadius: '4px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', width: '28px', textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  )
}

// ── Single review card ────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.body?.length > 300

  return (
    <div style={{
      backgroundColor: 'var(--cc-surface)',
      border: '1px solid var(--cc-border)',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '12px',
    }}>
      <div className="cr-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>
            {review.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarRating rating={review.rating} />
            <span style={{ fontSize: '13px', color: 'var(--cc-text-3)' }}>
              {review.role} · {review.employmentType} · {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {review.recommended && (
            <span style={{
              fontSize: '12px', padding: '3px 8px', borderRadius: '4px',
              backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)', fontWeight: '500',
            }}>
              ✓ Recommends
            </span>
          )}
        </div>
      </div>

      {/* Pros / Cons */}
      {(review.pros || review.cons) && (
        <div className="cr-pros-cons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
          {review.pros && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-green)', margin: '0 0 4px' }}>Pros</p>
              <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0, lineHeight: 1.5 }}>{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-red)', margin: '0 0 4px' }}>Cons</p>
              <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0, lineHeight: 1.5 }}>{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {review.body && (
        <div>
          <p style={{ fontSize: '14px', color: 'var(--cc-text-1)', lineHeight: 1.6, margin: 0 }}>
            {isLong && !expanded ? review.body.slice(0, 300) + '…' : review.body}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '500',
                padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
            </button>
          )}
        </div>
      )}

      {/* Helpful */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--cc-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--cc-text-3)' }}>Was this helpful?</span>
        <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--cc-border)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: 'var(--cc-text-2)' }}>
          <ThumbsUp size={12} /> Yes
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--cc-border)', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', color: 'var(--cc-text-2)' }}>
          <ThumbsDown size={12} /> No
        </button>
      </div>
    </div>
  )
}

// ── Company card in search results ────────────────────────────────────────────
function CompanyCard({ company, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--cc-surface)',
        border: '1px solid var(--cc-border)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--cc-shadow)'; e.currentTarget.style.borderColor = 'var(--cc-blue)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--cc-border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '8px',
          backgroundColor: 'var(--cc-blue-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: 'var(--cc-blue)', flexShrink: 0,
        }}>
          {company.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cc-blue)', margin: '0 0 2px' }}>{company.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <StarRating rating={company.avgRating} size={13} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)' }}>{company.avgRating?.toFixed(1)}</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--cc-text-3)' }}>{company.reviewCount} review{company.reviewCount !== 1 ? 's' : ''}</span>
            {company.industry && <span style={{ fontSize: '12px', color: 'var(--cc-text-3)' }}>· {company.industry}</span>}
            {company.headquarters && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--cc-text-3)' }}>
                <MapPin size={11} /> {company.headquarters}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--cc-blue)', fontWeight: '500', flexShrink: 0 }}>View reviews →</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompanyReviews() {
  const [query, setQuery]           = useState('')
  const [companies, setCompanies]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [reviews, setReviews]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [sortReviews, setSortReviews] = useState('recent')
  const [filterRating, setFilterRating] = useState(0)

  // Load all companies with reviews on mount
  useEffect(() => {
    setLoading(true)
    api.get('/company-reviews/companies')
      .then(r => setCompanies(r.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }, [])

  // Search companies
  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) {
      api.get('/company-reviews/companies').then(r => setCompanies(r.data)).catch(() => {})
      return
    }
    setLoading(true)
    api.get('/company-reviews/companies', { params: { q: query } })
      .then(r => setCompanies(r.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false))
  }

  // Load reviews for selected company
  const selectCompany = (company) => {
    setSelected(company)
    setReviewsLoading(true)
    api.get(`/company-reviews/${encodeURIComponent(company.name)}`)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }

  // Sort + filter reviews client-side
  const displayedReviews = reviews
    .filter(r => filterRating === 0 || Math.round(r.rating) === filterRating)
    .sort((a, b) => sortReviews === 'recent'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : b.rating - a.rating
    )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--cc-bg)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <Navbar />

      {/* ── Mobile-only layout fixes ── */}
      <style>{`
        @media (max-width: 768px) {
          /* Hero: reduce horizontal padding */
          .cr-hero { padding: 24px 16px 20px !important; }

          /* Search bar: full width, no overflow */
          .cr-search-wrap { max-width: 100% !important; }

          /* Content area: single column, no side-by-side */
          .cr-content {
            flex-direction: column !important;
            padding: 16px !important;
            gap: 16px !important;
          }

          /* Left company list: full width, not fixed 380px */
          .cr-left {
            width: 100% !important;
            flex-shrink: 1 !important;
          }

          /* Right reviews panel: full width, same as left */
          .cr-right { min-width: 0 !important; width: 100% !important; }

          /* Review controls: wrap on small screens */
          .cr-controls {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .cr-controls-right {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          /* Rating bar label: shorter on mobile */
          .cr-rating-label { width: 110px !important; }

          /* Review card header: allow wrapping */
          .cr-card-header { flex-wrap: wrap !important; gap: 6px !important; }

          /* Pros/Cons grid: single column on mobile */
          .cr-pros-cons { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ paddingTop: '60px' }}>
        {/* Hero */}
        <div className="cr-hero" style={{
          background: 'var(--cc-bg-gradient)',
          padding: '40px 40px 32px',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--cc-text-1)', margin: '0 0 8px' }}>
            Company Reviews
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--cc-text-2)', margin: '0 0 24px' }}>
            Read reviews from real employees. Find the right company culture for you.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="cr-search-wrap" style={{
              display: 'flex', alignItems: 'center',
              backgroundColor: 'var(--cc-surface)', borderRadius: '8px',
              boxShadow: 'var(--cc-shadow)',
              width: '100%', maxWidth: '560px', height: '52px', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px' }}>
                <Search size={18} style={{ color: 'var(--cc-text-3)', marginRight: '10px', flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search company name..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: 'var(--cc-text-1)', fontFamily: 'inherit', backgroundColor: 'transparent' }}
                />
              </div>
              <button type="submit" style={{
                height: '44px', margin: '4px', padding: '0 24px',
                backgroundColor: 'var(--cc-blue)', color: 'white', border: 'none',
                borderRadius: '6px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="cr-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 40px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Left — company list */}
          <div className="cr-left" style={{ width: '380px', flexShrink: 0 }}>
            <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: '0 0 12px' }}>
              {loading ? 'Loading...' : `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'}`}
            </p>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '16px', marginBottom: '10px', height: '72px' }} />
              ))
            ) : companies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--cc-surface)', borderRadius: '8px', border: '1px solid var(--cc-border)' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🏢</p>
                <p style={{ fontSize: '14px', color: 'var(--cc-text-2)', margin: 0 }}>No companies found</p>
              </div>
            ) : (
              companies.map(c => (
                <CompanyCard
                  key={c.name}
                  company={c}
                  onClick={() => selectCompany(c)}
                />
              ))
            )}
          </div>

          {/* Right — reviews */}
          <div className="cr-right" style={{ flex: 1, minWidth: 0 }}>
            {!selected ? (
              <div style={{
                backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
                borderRadius: '8px', padding: '60px 40px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>👈</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>Select a company</p>
                <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0 }}>Click a company on the left to read employee reviews</p>
              </div>
            ) : (
              <>
                {/* Company header */}
                <div style={{
                  backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
                  borderRadius: '8px', padding: '24px', marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '10px',
                      backgroundColor: 'var(--cc-blue-light)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'var(--cc-blue)', flexShrink: 0,
                    }}>
                      {selected.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>{selected.name}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StarRating rating={selected.avgRating} size={16} />
                          <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cc-text-1)' }}>{selected.avgRating?.toFixed(1)}</span>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--cc-text-3)' }}>{selected.reviewCount} reviews</span>
                        {selected.industry && <span style={{ fontSize: '13px', color: 'var(--cc-text-3)' }}>· {selected.industry}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Rating breakdown */}
                  {selected.breakdown && (
                    <div style={{ borderTop: '1px solid var(--cc-border)', paddingTop: '16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 10px' }}>Rating breakdown</p>
                      <RatingBar label="Work-life balance" value={selected.breakdown.workLifeBalance || 0} />
                      <RatingBar label="Compensation" value={selected.breakdown.compensation || 0} />
                      <RatingBar label="Job security" value={selected.breakdown.jobSecurity || 0} />
                      <RatingBar label="Management" value={selected.breakdown.management || 0} />
                      <RatingBar label="Culture" value={selected.breakdown.culture || 0} />
                    </div>
                  )}
                </div>

                {/* Reviews controls */}
                <div className="cr-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', margin: 0 }}>
                    {displayedReviews.length} review{displayedReviews.length !== 1 ? 's' : ''}
                  </p>
                  <div className="cr-controls-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a href="/dashboard/applicant" style={{
                      fontSize: '13px', color: 'var(--cc-blue)', fontWeight: '600',
                      textDecoration: 'none', padding: '6px 14px',
                      border: '1px solid var(--cc-blue)', borderRadius: '6px',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--cc-blue-light)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      ✏ Write a review
                    </a>
                    <select value={filterRating} onChange={e => setFilterRating(Number(e.target.value))} style={{
                      fontSize: '13px', border: '1px solid var(--cc-border)', borderRadius: '6px',
                      padding: '6px 10px', outline: 'none', backgroundColor: 'var(--cc-surface)', cursor: 'pointer',
                    }}>
                      <option value={0}>All ratings</option>
                      {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>)}
                    </select>
                    <select value={sortReviews} onChange={e => setSortReviews(e.target.value)} style={{
                      fontSize: '13px', border: '1px solid var(--cc-border)', borderRadius: '6px',
                      padding: '6px 10px', outline: 'none', backgroundColor: 'var(--cc-surface)', cursor: 'pointer',
                    }}>
                      <option value="recent">Most recent</option>
                      <option value="rating">Highest rated</option>
                    </select>
                  </div>
                </div>

                {/* Review list */}
                {reviewsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cc-text-3)', fontSize: '14px' }}>Loading reviews...</div>
                ) : displayedReviews.length === 0 ? (
                  <div style={{
                    backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
                    borderRadius: '8px', padding: '40px', textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📝</p>
                    <p style={{ fontSize: '14px', color: 'var(--cc-text-2)', margin: 0 }}>No reviews yet for this company</p>
                  </div>
                ) : (
                  displayedReviews.map((r, i) => <ReviewCard key={r._id || i} review={r} />)
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
