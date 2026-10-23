import { Search, Home, Zap } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">How Shared Ownership Works</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Get onto the property ladder with a smaller deposit and mortgage</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: Search, title: 'Find a property', desc: 'Browse shared ownership homes across the UK. Filter by location, price, and type.', color: 'bg-blue-100 text-blue-600' },
            { icon: Home, title: 'Buy your share', desc: 'Purchase between 10%–75% of the property. Pay rent on the remaining share.', color: 'bg-green-100 text-green-600' },
            { icon: Zap, title: 'Staircase up', desc: 'Buy more shares over time until you own 100% of your home. Build equity as you go.', color: 'bg-purple-100 text-purple-600' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 ${color} rounded-2xl mb-4`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
