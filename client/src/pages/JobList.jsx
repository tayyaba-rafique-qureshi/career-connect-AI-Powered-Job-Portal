import { useEffect, useState } from 'react'
import { fetchJobs } from '../services/jobService'
import JobCard from '../components/JobCard'

export default function JobList() {
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    fetchJobs().then(setJobs)
  }, [])

  return (
    <div>
      <h1>Available Jobs</h1>
      {jobs.map(job => <JobCard key={job._id} job={job} />)}
    </div>
  )
}
