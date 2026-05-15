import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/shared/Navbar'
import JobCard from '../../components/applicant/JobCard'
import JobDetails from '../../components/applicant/JobDetails'
import FilterModal from '../../components/applicant/FilterModal'
import ApplyModal from '../../components/applicant/ApplyModal'
import { fetchJobs, searchJobs, getRecommendedJobs, fetchJobById, getAIMatch } from '../../services/jobService'
import { saveJob, unsaveJob, getSavedJobIds, getMyApplications } from '../../services/applicationService'

const SORT_OPTIONS = [
  { value: 'date', label: 'Date posted' },
  { value: 'relevance', label: 'Relevance' },
]

// ── No-jobs illustration ──────────────────────────────────────────────────
const NoJobsSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <circle cx="36" cy="36" r="24" stroke="#C5D8FA" strokeWidth="6" fill="none" />
    <circle cx="36" cy="36" r="14" fill="#EDF3FC" />
    <line x1="54" y1="54" x2="68" y2="68" stroke="#2557A7" strokeWidth="6" strokeLinecap="round" />
    <circle cx="36" cy="36" r="6" fill="#2557A7" opacity="0.4" />
  </svg>
)

const SelectJobSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <rect x="14" y="10" width="36" height="44" rx="4" fill="#EDF3FC" />
    <rect x="18" y="16" width="28" height="5" rx="2.5" fill="#C5D8FA" />
    <rect x="18" y="26" width="22" height="4" rx="2" fill="#C5D8FA" />
    <rect x="18" y="34" width="26" height="4" rx="2" fill="#C5D8FA" />
    <circle cx="52" cy="48" r="14" fill="#E7F5E8" />
    <path d="M46 48l4 4 8-8" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ApplicantDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs]               = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [matchData, setMatchData]     = useState({})
  const [matchLoading, setMatchLoading] = useState(false)
  const [savedIds, setSavedIds]       = useState(new Set())
  const [appliedIds, setAppliedIds]   = useState(new Set())
  const [loading, setLoading]         = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sort, setSort]               = useState('date')
  const [filters, setFilters]         = useState({ jobType: [], experienceLevel: '', workMode: '', salaryMin: 0, salaryMax: 500000 })
  const [filterOpen, setFilterOpen]   = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [toast, setToast]             = useState(null)
  const [searchQuery, setSearchQuery] = useState({ keyword: '', location: '' })
  const [keywordInput, setKeywordInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const matchCache = useRef({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load jobs
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [jobsData, savedData, appsData] = await Promise.all([
          fetchJobs({ status: 'active' }),
          getSavedJobIds(),
          getMyApplications()
        ])
        setJobs(jobsData)
        setFilteredJobs(jobsData)
        setSavedIds(new Set(savedData))
        setAppliedIds(new Set(appsData.map(a => a.job?._id || a.job)))
        // If ?job=ID is in the URL, auto-select that job (e.g. from Saved Jobs "Apply now")
        const targetJobId = searchParams.get('job')
        let targetJob = targetJobId ? jobsData.find(j => j._id === targetJobId) : null
        
        if (targetJobId && !targetJob) {
          try {
            targetJob = await fetchJobById(targetJobId)
          } catch (e) {
            console.error('Failed to fetch target job', e)
          }
        }
        
        setSelectedJob(prev => targetJob || prev || jobsData[0] || null)

        if (targetJob) {
          setApplyModalOpen(true)
          setSearchParams({}, { replace: true })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
    // Also load recommendations (separate, non-blocking)
    getRecommendedJobs()
      .then(data => setRecommendedJobs(data || []))
      .catch(() => {})
  }, [])

  // AI match — fetch live score whenever a job is selected
  useEffect(() => {
    if (!selectedJob) return
    const id = selectedJob._id
    if (matchCache.current[id]) {
      setMatchData(prev => ({ ...prev, [id]: matchCache.current[id] }))
      return
    }
    setMatchLoading(true)
    getAIMatch(id)
      .then(data => { matchCache.current[id] = data; setMatchData(prev => ({ ...prev, [id]: data })) })
      .catch(() => {})
      .finally(() => setMatchLoading(false))
  }, [selectedJob])

  // Filter + search + recommendations
  useEffect(() => {
    let result = [...jobs]
    const { keyword, location } = searchQuery
    const hasSearch = keyword || location

    if (keyword) result = result.filter(j =>
      j.title.toLowerCase().includes(keyword.toLowerCase()) ||
      j.company.toLowerCase().includes(keyword.toLowerCase()) ||
      (j.description || '').toLowerCase().includes(keyword.toLowerCase())
    )
    if (location) result = result.filter(j =>
      j.location.toLowerCase().includes(location.toLowerCase())
    )
    if (filters.jobType.length > 0) result = result.filter(j => j.jobType?.some(t => filters.jobType.includes(t)))
    if (filters.workMode) result = result.filter(j => j.workMode === filters.workMode)
    if (filters.experienceLevel) result = result.filter(j => j.experienceLevel === filters.experienceLevel)
    if (filters.salaryMax < 500000) result = result.filter(j => !j.salaryMin || j.salaryMin <= filters.salaryMax)
    if (sort === 'date') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // When no search active, put recommended jobs first (deduplicated)
    // Only reorder — never re-introduce jobs that were already filtered out
    if (!hasSearch && recommendedJobs.length > 0) {
      const recIds = new Set(recommendedJobs.map(j => j._id || j.job_id))
      const recommended = result.filter(j => recIds.has(j._id))
      const rest = result.filter(j => !recIds.has(j._id))
      result = [...recommended, ...rest]
    }

    setFilteredJobs(result)
  }, [jobs, filters, sort, searchQuery, recommendedJobs])

  const handleSearch = async (e) => {
    e.preventDefault()
    const kw = keywordInput.trim()
    const loc = locationInput.trim()

    // If both fields cleared, reset to full job list
    if (!kw && !loc) {
      setSearchQuery({ keyword: '', location: '' })
      return
    }

    // Call backend search API for keyword searches (MongoDB text search)
    // Location-only also hits the API for server-side filtering
    setSearchLoading(true)
    try {
      const results = await searchJobs({ title: kw, location: loc })
      setJobs(results)
      setFilteredJobs(results)
      setSearchQuery({ keyword: kw, location: loc })
      if (results.length > 0) setSelectedJob(results[0])
    } catch (err) {
      console.error('[search]', err)
      showToast('Search failed. Please try again.', 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSave = async (job) => {
    const id = job._id
    const wasSaved = savedIds.has(id)
    setSavedIds(prev => { const s = new Set(prev); wasSaved ? s.delete(id) : s.add(id); return s })
    try {
      wasSaved ? await unsaveJob(id) : await saveJob(id)
      showToast(wasSaved ? 'Job removed from saved' : 'Job saved!')
    } catch {
      setSavedIds(prev => { const s = new Set(prev); wasSaved ? s.add(id) : s.delete(id); return s })
      showToast('Failed to update saved jobs', 'error')
    }
  }

  const handleApplySuccess = () => {
    setApplyModalOpen(false)
    setAppliedIds(prev => new Set([...prev, selectedJob._id]))
    showToast('Application submitted! ✓')
  }

  const activeFiltersCount = [
    filters.jobType.length > 0, !!filters.workMode,
    !!filters.experienceLevel, filters.salaryMax < 500000,
  ].filter(Boolean).length

  return (
    <div className="applicant-dashboard-root" style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EDF3FC 0%, #E4EEF9 25%, #EEF3FA 55%, #F7F9FC 80%, #FFFFFF 100%)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blob — top right, matches Indeed's geometric shape */}
      <div style={{
        position: 'fixed', top: '-40px', right: '-80px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,205,248,0.5) 0%, rgba(197,216,250,0.2) 50%, transparent 75%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Fixed Navbar */}
      <Navbar />

      {/* ── HEADER ZONE (search) ─── */}
      <div className="applicant-dashboard-body" style={{
        position: 'relative', zIndex: 1,
        paddingTop: '76px', /* navbar height + breathing room */
      }}>
        <div
          className="applicant-dashboard-search-wrap"
          style={{
            padding: '20px 0 0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >

          {/* Search Bar — centered, max 780px */}
          <form
            onSubmit={handleSearch}
            className="applicant-dashboard-search-form"
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '820px',
              padding: '0 40px',
              marginBottom: '0',
            }}
          >
            <div className="applicant-dashboard-search" style={{
              width: '100%', maxWidth: '820px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(228,226,224,0.9)',
              boxShadow: searchFocused
                ? '0 0 0 2px #2557A7, 0 2px 12px rgba(0,0,0,0.12)'
                : '0 10px 30px rgba(17,24,39,0.08)',
              display: 'flex', alignItems: 'center', height: '56px',
              overflow: 'hidden',
              transition: 'box-shadow 0.15s',
            }}>
              {/* Keyword */}
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', minWidth: 0 }}>
                <Search size={18} style={{ color: '#767676', flexShrink: 0, marginRight: '10px' }} />
                <input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Job title, keywords, or company"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: '15px', color: '#2D2D2D',
                    backgroundColor: 'transparent', fontFamily: 'inherit', minWidth: 0,
                  }}
                />
              </div>
              {/* Divider */}
              <div className="applicant-dashboard-search-divider" style={{ width: '1px', height: '34px', backgroundColor: '#E4E2E0', flexShrink: 0, opacity: 0.8 }} />
              {/* Location */}
              <div className="applicant-dashboard-location" style={{ display: 'flex', alignItems: 'center', width: '210px', padding: '0 14px', flexShrink: 0 }}>
                <MapPin size={17} style={{ color: '#767676', flexShrink: 0, marginRight: '9px' }} />
                <input
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="City, state, or zip code"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: '15px', color: '#2D2D2D',
                    backgroundColor: 'transparent', fontFamily: 'inherit', minWidth: 0,
                  }}
                />
              </div>
              {/* Button */}
              <button type="submit" disabled={searchLoading} className="applicant-dashboard-search-btn" style={{
                flexShrink: 0, height: '48px', margin: '4px',
                padding: '0 26px', backgroundColor: searchLoading ? '#6B8EC7' : '#2557A7',
                color: 'white', border: 'none', borderRadius: '6px',
                fontSize: '15px', fontWeight: '600', cursor: searchLoading ? 'wait' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (!searchLoading) e.currentTarget.style.backgroundColor = '#1D4589' }}
                onMouseLeave={e => { if (!searchLoading) e.currentTarget.style.backgroundColor = '#2557A7' }}
              >
                {searchLoading ? 'Searching…' : 'Find jobs'}
              </button>
            </div>
          </form>

        </div>

        {/* ── TWO-PANE AREA — centered container, left/right padding ── */}
        <div className="applicant-dashboard-panes" style={{
          maxWidth: '1240px',
          margin: '20px auto 0',
          padding: '0 40px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}>

          {/* ── LEFT COLUMN (40%) — Welcome heading + card ── */}
          <div className="applicant-dashboard-left" style={{
            width: '40%',
            minWidth: '300px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Welcome heading lives in LEFT column, above the card */}
            <h1 style={{
              fontSize: '22px', fontWeight: '700', color: '#2D2D2D',
              margin: '0 0 16px', lineHeight: 1.3,
            }}>
              Welcome to CareerConnect
            </h1>

            {/* "Jobs for you" + sort/filter bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#2D2D2D', margin: 0 }}>
                  Jobs for you
                </p>
                <span style={{ fontSize: '13px', color: '#767676' }}>
                  {loading ? '' : `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}${searchQuery.location ? ` in ${searchQuery.location}` : ''}`}
                </span>
              </div>
              <button
                onClick={() => setFilterOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 14px',
                  backgroundColor: activeFiltersCount > 0 ? '#E8F0FE' : 'white',
                  border: `1px solid ${activeFiltersCount > 0 ? '#2557A7' : '#E4E2E0'}`,
                  borderRadius: '6px', fontSize: '13px',
                  color: activeFiltersCount > 0 ? '#2557A7' : '#595959',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.color = '#2557A7' }}
                onMouseLeave={e => {
                  if (!activeFiltersCount) { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.color = '#595959' }
                }}
              >
                <SlidersHorizontal size={14} />
                Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </button>
            </div>

            {/* Sort bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderTop: '1px solid rgba(228,226,224,0.7)',
              borderBottom: '1px solid rgba(228,226,224,0.7)',
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: '4px 4px 0 0',
            }}>
              <span style={{ fontSize: '13px', color: '#767676' }}>
                {loading ? 'Loading...' : (
                  <><strong style={{ color: '#2D2D2D' }}>{filteredJobs.length}</strong> jobs</>
                )}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#767676' }}>Sort by:</span>
                <select value={sort} onChange={e => setSort(e.target.value)} style={{
                  fontSize: '13px', color: '#2D2D2D',
                  border: '1px solid #E4E2E0', borderRadius: '4px',
                  padding: '3px 6px', outline: 'none',
                  backgroundColor: 'white', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Scrollable job list — shorter than right pane (Welcome heading takes space above) */}
            <div className="applicant-dashboard-joblist" style={{ height: 'calc(100vh - 310px)', overflowY: 'auto', padding: '12px 0' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: 'white', border: '1px solid #E4E2E0',
                    borderRadius: '8px', padding: '16px', marginBottom: '12px',
                  }}>
                    {[{ w: '70%', h: '15px' }, { w: '48%', h: '12px' }, { w: '38%', h: '12px' }].map((b, j) => (
                      <div key={j} style={{
                        height: b.h, width: b.w, backgroundColor: '#E4E2E0',
                        borderRadius: '4px', marginBottom: '8px',
                        animation: 'pulse 1.4s ease-in-out infinite',
                      }} />
                    ))}
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
                  </div>
                ))
              ) : filteredJobs.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', textAlign: 'center', padding: '40px 20px',
                }}>
                  <NoJobsSVG />
                  <p style={{ fontWeight: '600', color: '#2D2D2D', margin: '16px 0 4px', fontSize: '15px' }}>No jobs found</p>
                  <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>Try adjusting your filters or search terms</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <JobCard
                    key={job._id}
                    job={job}
                    selected={selectedJob?._id === job._id}
                    saved={savedIds.has(job._id)}
                    matchScore={matchData[job._id]?.matchScore}
                    onSelect={() => setSelectedJob(job)}
                    onSave={() => handleSave(job)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT PANE (60%) — white card, shadow, TALLER than left ── */}
          <div className="applicant-dashboard-right" style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 145px)',
          }}>
            {selectedJob ? (
              <JobDetails
                job={selectedJob}
                matchData={matchData[selectedJob._id] || null}
                matchLoading={matchLoading}
                saved={savedIds.has(selectedJob._id)}
                applied={appliedIds.has(selectedJob._id)}
                onApply={() => setApplyModalOpen(true)}
                onSave={() => handleSave(selectedJob)}
              />
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', padding: '40px',
              }}>
                <div>
                  <SelectJobSVG />
                  <p style={{ fontWeight: '600', color: '#2D2D2D', margin: '16px 0 4px', fontSize: '15px' }}>
                    Select a job to view details
                  </p>
                  <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>
                    Click any job on the left to read the full description
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <FilterModal filters={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      )}

      {/* Apply Modal */}
      {applyModalOpen && selectedJob && (
        <ApplyModal
          job={selectedJob}
          matchData={matchData[selectedJob._id] || null}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          fontSize: '14px', fontWeight: '500', zIndex: 60,
          backgroundColor: toast.type === 'error' ? '#D93025' : '#1A1A2E',
          color: 'white', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4D2D0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #B0ADAB; }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .applicant-dashboard-root { overflow-x: hidden; }
          .applicant-dashboard-search-form { padding: 0 16px !important; }
          .applicant-dashboard-search { flex-direction: column; height: auto !important; align-items: stretch; padding: 10px; gap: 10px; }
          .applicant-dashboard-search-divider { display: none; }
          .applicant-dashboard-location { width: 100% !important; padding: 0 6px !important; }
          .applicant-dashboard-search-btn { width: 100% !important; margin: 0 !important; height: 44px !important; }

          .applicant-dashboard-panes { flex-direction: column; padding: 0 16px !important; }
          .applicant-dashboard-left { width: 100% !important; min-width: 0 !important; }
          .applicant-dashboard-joblist { height: auto !important; max-height: 55vh; }
          .applicant-dashboard-right { height: auto !important; min-height: 55vh; }
        }
      `}</style>
    </div>
  )
}
