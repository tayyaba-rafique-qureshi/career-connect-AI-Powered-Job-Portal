const companies = ['Systems Ltd', 'Netsol Technologies', 'Arbisoft', 'Techlogix', 'Contour Software', '10Pearls', 'Folio3', 'Tkxel']

export default function TrustBar() {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-center text-sm text-[#595959] mb-8 font-medium">Trusted by top companies in Pakistan</p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {companies.map(c => (
            <span key={c} className="text-sm font-semibold text-gray-400 hover:text-[#2557A7] transition-colors cursor-default">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
