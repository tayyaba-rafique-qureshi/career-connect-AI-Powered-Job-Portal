import { useEffect, useState } from 'react'
import { fetchJobs } from '../services/jobService'

export function useJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { jobs, loading, error }
}
