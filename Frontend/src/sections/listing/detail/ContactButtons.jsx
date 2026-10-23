import { Mail, Phone } from 'lucide-react';
import { enquiryMailto, telHref } from '../../../utils/listing';
import MessageButton from './MessageButton';

/** Call / email buttons for the listing's contact; `tone` = 'dark' on navy panels */
export default function ContactButtons({ contact, subject, name, tone = 'light', propertyId }) {
  const listingUrl = typeof window !== 'undefined' ? window.location.href : '';
  if (!contact?.phone && !contact?.email && !propertyId) {
    return <p className={`text-sm ${tone === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>Contact details will be added soon.</p>;
  }
  return (
    <div className="grid gap-2.5">
      {contact?.phone && (
        <a href={telHref(contact.phone)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600">
          <Phone className="w-4 h-4" /> Call {contact.phone}
        </a>
      )}
      {contact?.email && (
        <a
          href={enquiryMailto(contact.email, { subject, listingUrl, name })}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
            tone === 'dark' ? 'bg-white text-ink hover:bg-brand-50' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" /> Email enquiry
        </a>
      )}
      {propertyId && <MessageButton propertyId={propertyId} tone={tone} />}
    </div>
  );
}
