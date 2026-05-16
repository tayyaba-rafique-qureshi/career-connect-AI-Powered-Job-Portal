import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchJobs, searchJobs } from '../services/jobService'
import JobCard from '../components/JobCard'

export default function JobList() {
  const [searchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const query = useMemo(() => ({
    keyword: searchParams.get('q')?.trim() || '',
    location: searchParams.get('loc')?.trim() || ''
  }), [searchParams])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (query.keyword || query.location) {
          const results = await searchJobs({ title: query.keyword, location: query.location })
          setJobs(results)
        } else {
          const results = await fetchJobs({ status: 'active' })
          setJobs(results)
        }
      } catch (err) {
        console.error('[guest jobs]', err)
        setError('Unable to load jobs right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [query])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', padding: '96px 24px 48px' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 6px' }}>Search jobs</h1>
          <p style={{ fontSize: '14px', color: '#595959', margin: 0 }}>
            {query.keyword || query.location
              ? `Showing results for “${query.keyword || 'All roles'}”${query.location ? ` in ${query.location}` : ''}.`
              : 'Browse the latest openings across top employers.'}
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', padding: '14px 16px', borderRadius: '10px',
          background: 'linear-gradient(120deg, #E8F0FE, #F7FAFF)',
          border: '1px solid #C5D8FA', marginBottom: '20px', flexWrap: 'wrap'
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: '600', color: '#1A1A2E', fontSize: '14px' }}>
              Unlock AI skill matching
            </p>
            <p style={{ margin: 0, color: '#595959', fontSize: '12px' }}>
              Sign up and upload your resume to see instant AI match scores.
            </p>
          </div>
          <Link
            to="/register"
            style={{
              background: '#2557A7', color: 'white', textDecoration: 'none',
              padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600'
            }}
          >
            Sign up free
          </Link>
        </div>

        {error && (
          <div style={{
            background: '#FEECEA', color: '#D93025', border: '1px solid #F5C6C2',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#595959', fontSize: '14px' }}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={{ color: '#595959', fontSize: '14px' }}>No jobs found.</div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {jobs.map(job => <JobCard key={job._id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  )
}
