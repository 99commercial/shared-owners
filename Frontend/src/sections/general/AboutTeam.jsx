const TEAM = [
  { name: 'Sarah Johnson', role: 'CEO & Co-founder', initials: 'SJ' },
  { name: 'Marcus Chen', role: 'CTO', initials: 'MC' },
  { name: 'Priya Patel', role: 'Head of Partnerships', initials: 'PP' },
  { name: 'Tom Williams', role: 'Head of Product', initials: 'TW' },
];

export default function AboutTeam() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {TEAM.map((m, idx) => (
            <div key={m.name} className="card p-6 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold ${['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700'][idx % 4]}`}>
                {m.initials}
              </div>
              <h4 className="font-bold text-gray-900">{m.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
