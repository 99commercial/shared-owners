import { Target, Shield, Heart } from 'lucide-react';

export default function AboutMission() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: Target, title: 'Our Mission', desc: 'To make homeownership a reality for everyone by simplifying the shared ownership journey and connecting buyers with the right providers.', color: 'bg-blue-100 text-blue-600' },
            { icon: Shield, title: 'Our Promise', desc: 'We work only with verified, regulated housing associations and developers to ensure every listing meets the highest standards of quality and compliance.', color: 'bg-green-100 text-green-600' },
            { icon: Heart, title: 'Our Values', desc: 'Transparency, accessibility, and community are at the heart of everything we do. We believe everyone deserves a safe, affordable home.', color: 'bg-rose-100 text-rose-600' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-8">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${color} rounded-xl mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="mt-20 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Founded in 2020, SharedOwnership was born from a simple observation: the path to homeownership was unnecessarily complicated. Our founders, having navigated the shared ownership process themselves, saw an opportunity to build a platform that would simplify the journey for everyone.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, we partner with over 200 housing associations, developers, and landlords to list more than 10,000 shared ownership properties across the UK. We've helped over 50,000 people find and purchase their shared ownership homes.
          </p>
        </div>
      </div>
    </section>
  );
}
