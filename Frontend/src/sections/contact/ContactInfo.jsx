import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactInfo() {
  return (
    <div className="space-y-6">
      <div className="card p-8">
        <h3 className="font-bold text-gray-900 text-lg mb-6">Contact Details</h3>
        <ul className="space-y-5">
          {[
            { icon: Mail, label: 'Email', value: 'hello@sharedownership.co.uk', href: 'mailto:hello@sharedownership.co.uk' },
            { icon: Phone, label: 'Phone', value: '0800 123 4567', href: 'tel:08001234567' },
            { icon: MapPin, label: 'Address', value: '12 Tower Street, London EC2A 1AB', href: null },
            { icon: Clock, label: 'Office Hours', value: 'Mon–Fri: 9am–6pm\nSat: 10am–3pm', href: null },
          ].map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
                {href ? (
                  <a href={href} className="text-sm text-gray-800 hover:text-primary-600 mt-0.5 block">{value}</a>
                ) : (
                  <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-line">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary-50 rounded-2xl p-6">
        <h4 className="font-semibold text-primary-900 mb-2">Are you a housing provider?</h4>
        <p className="text-sm text-primary-700 mb-4">List your properties and reach thousands of buyers looking for shared ownership homes.</p>
        <a href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800">
          Register as Organisation →
        </a>
      </div>
    </div>
  );
}
