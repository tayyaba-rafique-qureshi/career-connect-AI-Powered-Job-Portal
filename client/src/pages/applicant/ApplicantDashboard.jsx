import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, MapPin, SlidersHorizontal, HelpCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/shared/Navbar'
import MobileHeader from '../../components/mobile/MobileHeader'
import MobileNavBar from '../../components/mobile/MobileNavBar'
import useIsMobile from '../../hooks/useIsMobile'
import JobCard from '../../components/applicant/JobCard'
import JobDetails from '../../components/applicant/JobDetails'
import FilterModal from '../../components/applicant/FilterModal'
import ApplyModal from '../../components/applicant/ApplyModal'
import HelpChatbot from '../../components/applicant/HelpChatbot'
import { fetchJobs, searchJobs, getRecommendedJobs, fetchJobById, getAIMatch } from '../../services/jobService'
import { saveJob, unsaveJob, getSavedJobIds, getMyApplications, dislikeJob, undislikeJob, getDislikedJobIds } from '../../services/applicationService'

const SORT_OPTIONS = [
  { value: 'date', label: 'Date posted' },
  { value: 'relevance', label: 'Relevance' },
]

const WORK_MODE_PILLS = [
  { label: 'Remote',  value: 'remote'  },
  { label: 'On-site', value: 'on-site' },
  { label: 'Hybrid',  value: 'hybrid'  },
]
const JOB_TYPE_PILLS = [
  { label: 'Full-time',  value: 'full-time'  },
  { label: 'Part-time',  value: 'part-time'  },
  { label: 'Contract',   value: 'contract'   },
  { label: 'Internship', value: 'internship' },
]

const NoJobsSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <circle cx="36" cy="36" r="24" stroke="var(--cc-blue-border)" strokeWidth="6" fill="none" />
    <circle cx="36" cy="36" r="14" fill="var(--cc-blue-light)" />
    <line x1="54" y1="54" x2="68" y2="68" stroke="var(--cc-blue)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="36" cy="36" r="6" fill="var(--cc-blue)" opacity="0.4" />
  </svg>
)

const SelectJobSVG = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <rect x="14" y="10" width="36" height="44" rx="4" fill="var(--cc-blue-light)" />
    <rect x="18" y="16" width="28" height="5" rx="2.5" fill="var(--cc-blue-border)" />
    <rect x="18" y="26" width="22" height="4" rx="2" fill="var(--cc-blue-border)" />
    <rect x="18" y="34" width="26" height="4" rx="2" fill="var(--cc-blue-border)" />
    <circle cx="52" cy="48" r="14" fill="var(--cc-green-bg)" />
    <path d="M46 48l4 4 8-8" stroke="var(--cc-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ApplicantDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [jobs, setJobs]                     = useState([])
  const [filteredJobs, setFilteredJobs]     = useState([])
  const [selectedJob, setSelectedJob]       = useState(null)
  const [matchData, setMatchData]           = useState({})
  const [matchLoading, setMatchLoading]     = useState(false)
  const [savedIds, setSavedIds]             = useState(new Set())
  const [appliedIds, setAppliedIds]         = useState(new Set())
  const [loading, setLoading]               = useState(true)
  const [searchLoading, setSearchLoading]   = useState(false)
  const [sort, setSort]                     = useState('date')
  const [filters, setFilters]               = useState({ jobType: [], experienceLevel: '', workMode: '', salaryMin: 0, salaryMax: 500000 })
  const [filterOpen, setFilterOpen]         = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const [toast, setToast]                   = useState(null)
  const [dislikedIds, setDislikedIds]       = useState(new Set())
  const [fadingIds, setFadingIds]           = useState(new Set())
  const undoTimerRef                        = useRef(null)
  const [searchQuery, setSearchQuery]       = useState({ keyword: '', location: '' })
  const [keywordInput, setKeywordInput]     = useState('')
  const [locationInput, setLocationInput]   = useState('')
  const [searchFocused, setSearchFocused]   = useState(false)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const matchCache = useRef({})

  // Mobile-only: "AI Matches" pill toggle
  const [showAIMatches, setShowAIMatches] = useState(false)
  // Mobile-only: overflow filter bottom sheet
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load jobs ─────────────────────────────────────────────────────────────
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
        const targetJobId = searchParams.get('job')
        let targetJob = targetJobId ? jobsData.find(j => j._id === targetJobId) : null
        if (targetJobId && !targetJob) {
          try { targetJob = await fetchJobById(targetJobId) } catch (e) { console.error(e) }
        }
        // On mobile, don't auto-select the first job — user must tap a card.
        // On desktop, auto-select the first job so the right pane is populated.
        setSelectedJob(prev => targetJob || (isMobile ? null : (prev || jobsData[0] || null)))
        if (targetJob) { setApplyModalOpen(true); setSearchParams({}, { replace: true }) }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
    getRecommendedJobs().then(data => setRecommendedJobs(data || [])).catch(() => {})
  }, [])

  // ── AI match for selected job ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedJob) return
    const id = selectedJob._id
    if (matchCache.current[id]) { setMatchData(prev => ({ ...prev, [id]: matchCache.current[id] })); return }
    setMatchLoading(true)
    getAIMatch(id)
      .then(data => { matchCache.current[id] = data; setMatchData(prev => ({ ...prev, [id]: data })) })
      .catch(() => {})
      .finally(() => setMatchLoading(false))
  }, [selectedJob])

  // ── Eager batch AI scores for all visible jobs (mobile cards) ─────────────
  useEffect(() => {
    if (filteredJobs.length === 0) return
    filteredJobs.forEach(job => {
      const id = job._id
      if (matchCache.current[id]) {
        setMatchData(prev => prev[id] ? prev : { ...prev, [id]: matchCache.current[id] })
        return
      }
      getAIMatch(id).then(data => { matchCache.current[id] = data; setMatchData(prev => ({ ...prev, [id]: data })) }).catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs])

  // ── Filter + search + recommendations ────────────────────────────────────
  useEffect(() => {
    let result = [...jobs]
    const { keyword, location } = searchQuery
    const hasSearch = keyword || location
    result = result.filter(j => !dislikedIds.has(j._id))
    if (keyword) result = result.filter(j =>
      j.title.toLowerCase().includes(keyword.toLowerCase()) ||
      j.company.toLowerCase().includes(keyword.toLowerCase()) ||
      (j.description || '').toLowerCase().includes(keyword.toLowerCase())
    )
    if (location) result = result.filter(j => j.location.toLowerCase().includes(location.toLowerCase()))
    if (filters.jobType.length > 0) result = result.filter(j => j.jobType?.some(t => filters.jobType.includes(t)))
    if (filters.workMode) result = result.filter(j => j.workMode === filters.workMode)
    if (filters.experienceLevel) result = result.filter(j => j.experienceLevel === filters.experienceLevel)
    if (filters.salaryMax < 500000) result = result.filter(j => !j.salaryMin || j.salaryMin <= filters.salaryMax)
    if (sort === 'date') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (!hasSearch && recommendedJobs.length > 0) {
      const recIds = new Set(recommendedJobs.map(j => j._id || j.job_id))
      const recommended = result.filter(j => recIds.has(j._id))
      const rest = result.filter(j => !recIds.has(j._id))
      result = [...recommended, ...rest]
    }
    setFilteredJobs(result)
  }, [jobs, filters, sort, searchQuery, recommendedJobs, dislikedIds])

  const handleSearch = async (e) => {
    e.preventDefault()
    const kw = keywordInput.trim()
    const loc = locationInput.trim()
    if (!kw && !loc) { setSearchQuery({ keyword: '', location: '' }); return }
    setSearchLoading(true)
    try {
      const results = await searchJobs({ title: kw, location: loc })
      setJobs(results); setFilteredJobs(results)
      setSearchQuery({ keyword: kw, location: loc })
      if (results.length > 0) setSelectedJob(results[0])
    } catch (err) { console.error('[search]', err); showToast('Search failed. Please try again.', 'error') }
    finally { setSearchLoading(false) }
  }

  const handleSave = async (job) => {
    const id = job._id; const wasSaved = savedIds.has(id)
    setSavedIds(prev => { const s = new Set(prev); wasSaved ? s.delete(id) : s.add(id); return s })
    try { wasSaved ? await unsaveJob(id) : await saveJob(id); showToast(wasSaved ? 'Job removed from saved' : 'Job saved!') }
    catch { setSavedIds(prev => { const s = new Set(prev); wasSaved ? s.add(id) : s.delete(id); return s }); showToast('Failed to update saved jobs', 'error') }
  }

  const handleApplySuccess = () => {
    setApplyModalOpen(false)
    setAppliedIds(prev => new Set([...prev, selectedJob._id]))
    showToast('Application submitted! ✓')
  }

  const handleDislike = async (job) => {
    const id = job._id; const wasDisliked = dislikedIds.has(id)
    if (wasDisliked) {
      setDislikedIds(prev => { const s = new Set(prev); s.delete(id); return s })
      setFadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
      try { await undislikeJob(id) } catch { /* silent */ }
      showToast('Job restored to your feed'); return
    }
    setFadingIds(prev => new Set([...prev, id]))
    setTimeout(() => {
      setDislikedIds(prev => new Set([...prev, id]))
      setFadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
      if (selectedJob?._id === id) setSelectedJob(null)
    }, 350)
    try { await dislikeJob(id) } catch { /* silent */ }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setToast({
      msg: 'Job hidden', type: 'undo',
      onUndo: () => {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        setDislikedIds(prev => { const s = new Set(prev); s.delete(id); return s })
        setFadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
        undislikeJob(id).catch(() => {}); setToast(null)
      },
    })
    undoTimerRef.current = setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    getDislikedJobIds().then(ids => setDislikedIds(new Set(ids))).catch(() => {})
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) }
  }, [])

  const activeFiltersCount = [
    filters.jobType.length > 0, !!filters.workMode, !!filters.experienceLevel, filters.salaryMax < 500000,
  ].filter(Boolean).length

  // ── Mobile pill handlers (reuse existing filter state) ───────────────────
  const handleAIMatchesPill = () => {
    const next = !showAIMatches
    setShowAIMatches(next)
    if (next) setFilters({ jobType: [], experienceLevel: '', workMode: '', salaryMin: 0, salaryMax: 500000 })
  }
  const handleWorkModePill = (value) => {
    setShowAIMatches(false)
    setFilters(f => ({ ...f, workMode: f.workMode === value ? '' : value }))
  }
  const handleJobTypePill = (value) => {
    setShowAIMatches(false)
    setFilters(f => {
      const already = f.jobType.includes(value)
      return { ...f, jobType: already ? f.jobType.filter(t => t !== value) : [...f.jobType, value] }
    })
  }

  // ── Shared job list renderer ──────────────────────────────────────────────
  const renderJobList = (containerStyle) => (
    <div style={containerStyle}>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            {[{ w: '70%', h: '15px' }, { w: '48%', h: '12px' }, { w: '38%', h: '12px' }].map((b, j) => (
              <div key={j} style={{ height: b.h, width: b.w, backgroundColor: 'var(--cc-border)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))}
          </div>
        ))
      ) : filteredJobs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <NoJobsSVG />
          <p style={{ fontWeight: '600', color: 'var(--cc-text-1)', margin: '16px 0 4px', fontSize: '15px' }}>No jobs found</p>
          <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0 }}>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        filteredJobs.map(job => (
          <div key={job._id} style={{
            opacity: fadingIds.has(job._id) ? 0 : 1,
            transform: fadingIds.has(job._id) ? 'translateX(-12px) scale(0.97)' : 'none',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            pointerEvents: fadingIds.has(job._id) ? 'none' : 'auto',
          }}>
            <JobCard
              job={job}
              selected={selectedJob?._id === job._id}
              saved={savedIds.has(job._id)}
              matchScore={matchData[job._id]?.matchScore}
              matchData={matchData[job._id] || null}
              onSelect={() => { setSelectedJob(job) }}
              onSave={() => handleSave(job)}
              onDislike={() => handleDislike(job)}
              disliked={dislikedIds.has(job._id)}
              isMobile={isMobile}
              applied={appliedIds.has(job._id)}
              onApply={e => { e.stopPropagation(); setSelectedJob(job); setApplyModalOpen(true) }}
            />
          </div>
        ))
      )}
    </div>
  )

  // ── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cc-bg)', fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif', position: 'relative' }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
          .adb-filter-pills::-webkit-scrollbar { display: none; }
          .adb-filter-pills { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ── Mobile: Full-screen job details overlay ── */}
        {selectedJob && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            backgroundColor: 'var(--cc-surface)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            {/* Header bar: back arrow left + close ✕ right */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px',
              height: '52px',
              backgroundColor: 'var(--cc-surface)',
              borderBottom: '1px solid var(--cc-border)',
              boxShadow: 'var(--cc-shadow)',
              flexShrink: 0,
            }}>
              {/* Left: back arrow + label */}
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--cc-blue)', fontSize: '15px', fontWeight: '600',
                  fontFamily: 'inherit', padding: '4px 0',
                }}
              >
                <ArrowLeft size={20} />
                Jobs
              </button>

              {/* Right: ✕ close button */}
              <button
                onClick={() => setSelectedJob(null)}
                aria-label="Close job details"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '1px solid var(--cc-border)',
                  backgroundColor: 'var(--cc-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '18px', lineHeight: 1,
                  color: 'var(--cc-text-2)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Job details content */}
            <div style={{ flex: 1, paddingBottom: '72px' }}>
              <JobDetails
                job={selectedJob}
                matchData={matchData[selectedJob._id] || null}
                matchLoading={matchLoading}
                saved={savedIds.has(selectedJob._id)}
                applied={appliedIds.has(selectedJob._id)}
                disliked={dislikedIds.has(selectedJob._id)}
                onApply={() => setApplyModalOpen(true)}
                onSave={() => handleSave(selectedJob)}
                onDislike={() => handleDislike(selectedJob)}
              />
            </div>
          </div>
        )}

        {/* ── Mobile: Main list view ── */}
        {/* Use the shared Navbar so the hamburger/sidebar drawer is available on mobile */}
        <Navbar />

        {/* Spacer to clear the fixed Navbar (60px tall) */}
        <div style={{ height: '60px' }} />

        {/* Search bar */}
        <div style={{ padding: '12px 16px 0' }}>
          <form onSubmit={handleSearch}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'var(--cc-surface)',
              border: '1px solid var(--cc-border)',
              borderRadius: '10px',
              padding: '0 12px',
              height: '44px',
              boxShadow: 'var(--cc-shadow)',
            }}>
              <Search size={16} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />
              <input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                placeholder="Job title, keywords, or company"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '14px', color: 'var(--cc-text-1)',
                  backgroundColor: 'transparent', fontFamily: 'inherit',
                }}
              />
              {keywordInput && (
                <button type="submit" style={{
                  flexShrink: 0, height: '30px', padding: '0 12px',
                  backgroundColor: 'var(--cc-blue)', color: 'white',
                  border: 'none', borderRadius: '6px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {searchLoading ? '…' : 'Go'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filter pills — 2-row wrap layout, overflow in bottom sheet */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          padding: '10px 16px',
          // Reserve space for the funnel button on the right by using a relative container
          position: 'relative',
          paddingRight: '52px', // leave room for the fixed funnel button
        }}>
          {/* AI Matches pill — always first */}
          <button
            onClick={handleAIMatchesPill}
            style={{
              flexShrink: 0,
              height: '32px', padding: '0 14px',
              borderRadius: '16px',
              border: `1px solid ${showAIMatches ? 'var(--cc-blue)' : 'var(--cc-border)'}`,
              backgroundColor: showAIMatches ? 'var(--cc-blue)' : 'var(--cc-surface)',
              color: showAIMatches ? 'white' : 'var(--cc-text-2)',
              fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            ✦ AI Matches
          </button>

          {/* Work mode pills — all 3 inline */}
          {WORK_MODE_PILLS.map(pill => {
            const active = filters.workMode === pill.value
            return (
              <button key={pill.value} onClick={() => handleWorkModePill(pill.value)} style={{
                flexShrink: 0, height: '32px', padding: '0 14px', borderRadius: '16px',
                border: `1px solid ${active ? 'var(--cc-blue)' : 'var(--cc-border)'}`,
                backgroundColor: active ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
                color: active ? 'var(--cc-blue)' : 'var(--cc-text-2)',
                fontSize: '13px', fontWeight: active ? '600' : '400',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                {pill.label}
              </button>
            )
          })}

          {/* Full-time pill inline — fits on row 2 */}
          {(() => {
            const pill = JOB_TYPE_PILLS[0] // full-time
            const active = filters.jobType.includes(pill.value)
            return (
              <button key={pill.value} onClick={() => handleJobTypePill(pill.value)} style={{
                flexShrink: 0, height: '32px', padding: '0 14px', borderRadius: '16px',
                border: `1px solid ${active ? 'var(--cc-blue)' : 'var(--cc-border)'}`,
                backgroundColor: active ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
                color: active ? 'var(--cc-blue)' : 'var(--cc-text-2)',
                fontSize: '13px', fontWeight: active ? '600' : '400',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                {pill.label}
              </button>
            )
          })()}

          {/* Funnel icon button — opens the existing FilterModal sidebar */}
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="More filters"
            style={{
              position: 'absolute', right: '16px', top: '10px',
              width: '36px', height: '32px', borderRadius: '16px',
              border: `1px solid ${activeFiltersCount > 0 ? 'var(--cc-blue)' : 'var(--cc-border)'}`,
              backgroundColor: activeFiltersCount > 0 ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal
              size={14}
              color={activeFiltersCount > 0 ? 'var(--cc-blue)' : 'var(--cc-text-2)'}
            />
          </button>
        </div>

        {/* Job count */}
        {!loading && (
          <div style={{ padding: '0 16px 8px', fontSize: '12px', color: 'var(--cc-text-3)' }}>
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Job list — padded bottom so content clears the nav bar */}
        {renderJobList({ padding: '0 16px', paddingBottom: '80px' })}

        {/* Bottom nav */}
        <MobileNavBar variant="applicant" />

        {/* Modals */}
        {filterOpen && <FilterModal filters={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />}
        {applyModalOpen && selectedJob && (
          <ApplyModal
            job={selectedJob}
            matchData={matchData[selectedJob._id] || null}
            onClose={() => setApplyModalOpen(false)}
            onSuccess={handleApplySuccess}
            onNoResume={() => { showToast('Build your CareerConnect resume first', 'error'); navigate('/profile?tab=resume') }}
          />
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '76px', left: '50%', transform: 'translateX(-50%)',
            padding: '10px 18px', borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            fontSize: '13px', fontWeight: '500', zIndex: 60,
            backgroundColor: toast.type === 'error' ? 'var(--cc-red)' : 'var(--cc-text-1)',
            color: 'white', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span>{toast.msg}</span>
            {toast.onUndo && (
              <button onClick={toast.onUndo} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.5)',
                color: 'white', borderRadius: '4px', padding: '2px 8px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
              }}>Undo</button>
            )}
          </div>
        )}

        {/* Help chatbot FAB — sits above the bottom nav bar */}
        <button
          onClick={() => setChatDrawerOpen(v => !v)}
          title="Help & FAQ"
          aria-label="Open help chat"
          style={{
            position: 'fixed', bottom: '76px', right: '16px', zIndex: 55,
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: chatDrawerOpen ? 'var(--cc-blue-hover)' : 'var(--cc-blue)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(37,87,167,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}
        >
          <HelpCircle size={22} />
        </button>

        {/* Chat drawer backdrop */}
        {chatDrawerOpen && (
          <div
            onClick={() => setChatDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 56,
              backgroundColor: 'var(--cc-overlay)',
            }}
          />
        )}

        {/* Chat drawer — slides up from bottom on mobile */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 57,
          height: '75vh',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          transform: chatDrawerOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: chatDrawerOpen ? 'auto' : 'none',
        }}>
          <HelpChatbot mode="drawer" onClose={() => setChatDrawerOpen(false)} />
        </div>
      </div>
    )
  }

  // ── DESKTOP LAYOUT (unchanged) ────────────────────────────────────────────
  return (
    <div className="adb-root" style={{
      minHeight: '100vh',
      background: 'var(--cc-bg-gradient)',
      fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .dashboard-blob-primary   { opacity: 0.13 !important; filter: saturate(1.4) !important; }
          .dashboard-blob-secondary { opacity: 0.07 !important; filter: saturate(1.3) !important; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes fadeInBackdrop { from{opacity:0} to{opacity:1} }
        @media (max-width: 900px) {
          .adb-panes { flex-direction: column !important; padding: 0 16px !important; }
          .adb-left  { width: 100% !important; min-width: 0 !important; }
          .adb-joblist { height: auto !important; max-height: 50vh !important; }
          .adb-right { height: 70vh !important; min-height: 400px; }
          .adb-search-form { padding: 0 16px !important; }
          .adb-search-bar  { flex-direction: column !important; height: auto !important; padding: 10px !important; gap: 8px !important; }
          .adb-search-divider { display: none !important; }
          .adb-search-loc { width: 100% !important; padding: 0 8px !important; }
          .adb-search-btn { width: 100% !important; margin: 0 !important; height: 42px !important; }
          .adb-drawer { width: 100% !important; right: 0 !important; border-radius: 16px 16px 0 0 !important; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--cc-scrollbar); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--cc-border-2); }
      `}</style>

      {/* Blobs */}
      <div className="dashboard-blob-primary" aria-hidden="true" style={{ position:'absolute', top:'-60px', left:'-80px', width:'620px', height:'560px', pointerEvents:'none', zIndex:0, opacity:0.12 }}>
        <svg viewBox="0 0 620 560" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
          <defs><radialGradient id="bg1" cx="40%" cy="38%" r="62%"><stop offset="0%" stopColor="rgba(56,189,248,1)"/><stop offset="55%" stopColor="rgba(96,165,250,0.7)"/><stop offset="100%" stopColor="rgba(147,197,253,0)"/></radialGradient></defs>
          <path d="M310 30 C430 10,570 80,590 200 C610 320,520 430,400 480 C280 530,120 510,60 400 C0 290,30 140,120 80 C180 40,240 45,310 30Z" fill="url(#bg1)"/>
        </svg>
      </div>
      <div className="dashboard-blob-secondary" aria-hidden="true" style={{ position:'absolute', bottom:'-80px', right:'-60px', width:'420px', height:'380px', pointerEvents:'none', zIndex:0, opacity:0.07 }}>
        <svg viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
          <defs><radialGradient id="bg2" cx="58%" cy="55%" r="55%"><stop offset="0%" stopColor="rgba(56,189,248,1)"/><stop offset="50%" stopColor="rgba(99,179,237,0.6)"/><stop offset="100%" stopColor="rgba(147,197,253,0)"/></radialGradient></defs>
          <path d="M200 20 C300 0,400 60,410 160 C420 260,340 360,220 370 C100 380,10 300,5 190 C0 80,80 40,200 20Z" fill="url(#bg2)"/>
        </svg>
      </div>

      <Navbar />

      <div style={{ position:'relative', zIndex:1, paddingTop:'72px' }}>
        {/* Search */}
        <div style={{ padding:'24px 0 0', display:'flex', justifyContent:'center' }}>
          <form onSubmit={handleSearch} className="adb-search-form" style={{ width:'100%', maxWidth:'860px', padding:'0 40px' }}>
            <div className="adb-search-bar" style={{
              width:'100%', backgroundColor:'var(--cc-surface)', borderRadius:'12px',
              border:'1px solid var(--cc-border)',
              boxShadow: searchFocused ? '0 0 0 2px var(--cc-blue), 0 2px 12px rgba(0,0,0,0.12)' : '0 8px 28px rgba(17,24,39,0.08)',
              display:'flex', alignItems:'center', height:'56px', overflow:'hidden', transition:'box-shadow 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', flex:1, padding:'0 16px', minWidth:0 }}>
                <Search size={18} style={{ color:'var(--cc-text-3)', flexShrink:0, marginRight:'10px' }}/>
                <input value={keywordInput} onChange={e=>setKeywordInput(e.target.value)}
                  onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                  placeholder="Job title, keywords, or company"
                  style={{ flex:1, border:'none', outline:'none', fontSize:'15px', color:'var(--cc-text-1)', backgroundColor:'transparent', fontFamily:'inherit', minWidth:0 }}
                />
              </div>
              <div className="adb-search-divider" style={{ width:'1px', height:'34px', backgroundColor:'var(--cc-border)', flexShrink:0 }}/>
              <div className="adb-search-loc" style={{ display:'flex', alignItems:'center', width:'210px', padding:'0 14px', flexShrink:0 }}>
                <MapPin size={17} style={{ color:'var(--cc-text-3)', flexShrink:0, marginRight:'9px' }}/>
                <input value={locationInput} onChange={e=>setLocationInput(e.target.value)}
                  onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                  placeholder="City or zip code"
                  style={{ flex:1, border:'none', outline:'none', fontSize:'15px', color:'var(--cc-text-1)', backgroundColor:'transparent', fontFamily:'inherit', minWidth:0 }}
                />
              </div>
              <button type="submit" disabled={searchLoading} className="adb-search-btn" style={{
                flexShrink:0, height:'48px', margin:'4px', padding:'0 26px',
                backgroundColor: searchLoading ? 'var(--cc-blue-hover)' : 'var(--cc-blue)',
                color:'white', border:'none', borderRadius:'6px',
                fontSize:'15px', fontWeight:'600', cursor: searchLoading ? 'wait' : 'pointer',
                fontFamily:'inherit', transition:'background 0.15s',
              }}
                onMouseEnter={e=>{ if(!searchLoading) e.currentTarget.style.backgroundColor='var(--cc-blue-hover)' }}
                onMouseLeave={e=>{ if(!searchLoading) e.currentTarget.style.backgroundColor='var(--cc-blue)' }}
              >
                {searchLoading ? 'Searching…' : 'Find jobs'}
              </button>
            </div>
          </form>
        </div>

        {/* Two-pane */}
        <div className="adb-panes" style={{ maxWidth:'1240px', margin:'24px auto 0', padding:'0 40px', display:'flex', gap:'20px', alignItems:'flex-start' }}>

          {/* Left — job list */}
          <div className="adb-left" style={{ width:'40%', minWidth:'300px', flexShrink:0, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div>
                <h1 style={{ fontSize:'20px', fontWeight:'700', color:'var(--cc-text-1)', margin:'0 0 2px', lineHeight:1.2 }}>Jobs for you</h1>
                {!loading && (
                  <p style={{ fontSize:'13px', color:'var(--cc-text-3)', margin:0 }}>
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}{searchQuery.location ? ` in ${searchQuery.location}` : ''}
                  </p>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <select value={sort} onChange={e=>setSort(e.target.value)} style={{
                  fontSize:'13px', color:'var(--cc-text-1)', border:'1px solid var(--cc-border)',
                  borderRadius:'6px', padding:'6px 8px', outline:'none',
                  backgroundColor:'var(--cc-surface)', cursor:'pointer', fontFamily:'inherit',
                }}>
                  {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={()=>setFilterOpen(true)} style={{
                  display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'6px',
                  border:`1px solid ${activeFiltersCount>0?'var(--cc-blue)':'var(--cc-border)'}`,
                  backgroundColor: activeFiltersCount>0 ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
                  fontSize:'13px', color: activeFiltersCount>0 ? 'var(--cc-blue)' : 'var(--cc-text-2)',
                  cursor:'pointer', fontFamily:'inherit', fontWeight:'500',
                }}>
                  <SlidersHorizontal size={14}/>
                  Filters{activeFiltersCount>0 ? ` (${activeFiltersCount})` : ''}
                </button>
              </div>
            </div>

            {renderJobList({ height: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: '4px' })}
          </div>

          {/* Right — job details */}
          <div className="adb-right" style={{
            flex:1, backgroundColor:'var(--cc-surface)', borderRadius:'12px',
            boxShadow:'var(--cc-shadow-md)',
            overflow:'hidden', display:'flex', flexDirection:'column',
            height:'calc(100vh - 160px)',
          }}>
            {selectedJob ? (
              <JobDetails
                job={selectedJob}
                matchData={matchData[selectedJob._id] || null}
                matchLoading={matchLoading}
                saved={savedIds.has(selectedJob._id)}
                applied={appliedIds.has(selectedJob._id)}
                disliked={dislikedIds.has(selectedJob._id)}
                onApply={()=>setApplyModalOpen(true)}
                onSave={()=>handleSave(selectedJob)}
                onDislike={()=>handleDislike(selectedJob)}
              />
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px' }}>
                <div>
                  <SelectJobSVG/>
                  <p style={{ fontWeight:'600', color:'var(--cc-text-1)', margin:'16px 0 4px', fontSize:'15px' }}>Select a job to view details</p>
                  <p style={{ fontSize:'13px', color:'var(--cc-text-3)', margin:0 }}>Click any job on the left to read the full description</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {filterOpen && <FilterModal filters={filters} onApply={setFilters} onClose={()=>setFilterOpen(false)}/>}
      {applyModalOpen && selectedJob && (
        <ApplyModal
          job={selectedJob}
          matchData={matchData[selectedJob._id] || null}
          onClose={()=>setApplyModalOpen(false)}
          onSuccess={handleApplySuccess}
          onNoResume={()=>{ showToast('Build your CareerConnect resume first', 'error'); navigate('/profile?tab=resume') }}
        />
      )}

      {/* Floating Help button */}
      <button
        onClick={()=>setChatDrawerOpen(v=>!v)}
        title="Help & FAQ"
        aria-label="Open help chat"
        style={{
          position:'fixed', bottom:'24px', right:'24px', zIndex:80,
          width:'52px', height:'52px', borderRadius:'50%',
          backgroundColor: chatDrawerOpen ? 'var(--cc-blue-hover)' : 'var(--cc-blue)',
          border:'none', cursor:'pointer',
          boxShadow:'0 4px 16px rgba(37,87,167,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', transition:'transform 0.2s, background 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(37,87,167,0.55)' }}
        onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(37,87,167,0.45)' }}
      >
        <HelpCircle size={24}/>
      </button>

      {/* Drawer backdrop */}
      {chatDrawerOpen && (
        <div onClick={()=>setChatDrawerOpen(false)} style={{
          position:'fixed', inset:0, zIndex:79,
          backgroundColor:'var(--cc-overlay)',
          animation:'fadeInBackdrop 0.2s ease',
        }}/>
      )}

      {/* Chat drawer */}
      <div className="adb-drawer" style={{
        position:'fixed', bottom:0, right:'24px', zIndex:80,
        width:'380px', height:'580px',
        borderRadius:'16px 16px 0 0',
        boxShadow:'0 -4px 32px rgba(0,0,0,0.18)',
        overflow:'hidden',
        transform: chatDrawerOpen ? 'translateY(0)' : 'translateY(110%)',
        transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: chatDrawerOpen ? 'auto' : 'none',
      }}>
        <HelpChatbot mode="drawer" onClose={()=>setChatDrawerOpen(false)}/>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:'88px', left:'50%', transform:'translateX(-50%)',
          padding:'12px 20px', borderRadius:'8px',
          boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
          fontSize:'14px', fontWeight:'500', zIndex:60,
          backgroundColor: toast.type==='error' ? 'var(--cc-red)' : 'var(--cc-text-1)',
          color:'white', whiteSpace:'nowrap',
          display:'flex', alignItems:'center', gap:'14px',
        }}>
          <span>{toast.msg}</span>
          {toast.onUndo && (
            <button onClick={toast.onUndo} style={{
              background:'none', border:'1px solid rgba(255,255,255,0.5)',
              color:'white', borderRadius:'4px', padding:'3px 10px',
              fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}
            >Undo</button>
          )}
        </div>
      )}
    </div>
  )
}
