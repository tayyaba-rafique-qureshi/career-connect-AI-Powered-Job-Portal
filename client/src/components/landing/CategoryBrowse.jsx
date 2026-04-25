import { Link } from 'react-router-dom'

const categories = [
  { icon: '💻', label: 'Software & IT', count: '8,400+' },
  { icon: '🎨', label: 'Design & Creative', count: '3,200+' },
  { icon: '📊', label: 'Data & Analytics', count: '2,800+' },
  { icon: '📱', label: 'Mobile Development', count: '1,900+' },
  { icon: '☁️', label: 'Cloud & DevOps', count: '2,100+' },
  { icon: '💼', label: 'Management', count: '4,500+' },
  { icon: '📣', label: 'Marketing', count: '3,700+' },
  { icon: '🏦', label: 'Finance', count: '2,300+' },
]

export default function CategoryBrowse() {
  return (
    <section className="py-20 bg-[#F3F2F1]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#2557A7] uppercase tracking-widest mb-2">Browse by Category</p>
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Explore Jobs by Field</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Link to="/register" key={cat.label}
              className="bg-white rounded-xl p-5 flex items-center gap-4 border border-gray-100 hover:border-[#2557A7] hover:shadow-md transition-all group">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <p className="font-semibold text-sm text-[#1A1A2E] group-hover:text-[#2557A7] transition-colors">{cat.label}</p>
                <p className="text-xs text-[#595959]">{cat.count} jobs</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
