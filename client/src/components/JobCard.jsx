export default function JobCard({ job }) {
  return (
    <div style={{
      background: 'white', borderRadius: '10px', border: '1px solid #E4E2E0',
      padding: '16px 18px', boxShadow: '0 6px 18px rgba(17,24,39,0.06)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1A1A2E' }}>
            {job.title}
          </h2>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#2557A7', fontWeight: '600' }}>
            {job.company}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#767676' }}>
            {job.location}
          </p>
        </div>
        <div style={{
          alignSelf: 'flex-start', background: '#F0F7FF', color: '#2557A7',
          border: '1px solid #C5D8FA', padding: '6px 10px', borderRadius: '999px',
          fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap'
        }}>
          AI match locked
        </div>
      </div>

      {job.description && (
        <p style={{
          margin: '10px 0 0', fontSize: '13px', color: '#595959',
          lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {job.description}
        </p>
      )}
    </div>
  )
}
