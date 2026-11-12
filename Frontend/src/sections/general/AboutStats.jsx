export default function AboutStats() {
  return (
    <section className="py-16 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          {[['2020', 'Year Founded'], ['200+', 'Partner Organisations'], ['10,000+', 'Active Listings'], ['50,000+', 'Homes Found']].map(([val, label]) => (
            <div key={label}>
              <div className="text-4xl font-bold mb-1 text-brand-500">{val}</div>
              <div className="text-white/70 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
