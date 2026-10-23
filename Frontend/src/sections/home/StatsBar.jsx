export default function StatsBar() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[['10,000+', 'Properties Listed'], ['500+', 'Developments'], ['200+', 'Housing Providers'], ['50,000+', 'Happy Buyers']].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-primary-600">{val}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
