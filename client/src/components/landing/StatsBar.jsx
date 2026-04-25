const stats = [
  { value: '50,000+', label: 'Active Jobs' },
  { value: '12,000+', label: 'Companies Hiring' },
  { value: '200,000+', label: 'Job Seekers' },
  { value: '94%', label: 'Match Accuracy' },
]

export default function StatsBar() {
  return (
    <section className="bg-[#2557A7] py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-sm text-blue-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
