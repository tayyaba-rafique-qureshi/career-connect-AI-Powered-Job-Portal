export default function JobCard({ job }) {
  return (
    <div className="job-card">
      <h2>{job.title}</h2>
      <p>{job.company}</p>
      <p>{job.description}</p>
      <span>{job.location}</span>
    </div>
  )
}
