import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { labelize } from '../../../data/propertyOptions';
import { telHref } from '../../../utils/listing';
import ContactButtons from './ContactButtons';

/** Sticky sidebar card: who is selling and how to reach them */
export default function ContactCard({ contact, subject, name, reference, propertyId }) {
  if (!contact) return null;
  const isOrg = contact.kind === 'organisation';
  const website = contact.website && /^https?:\/\//i.test(contact.website) ? contact.website : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="bg-slate-900 px-5 py-5 text-white">
        <span className="inline-block rounded-md bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          {isOrg ? labelize(contact.type) || 'Housing provider' : 'Private seller'}
        </span>
        <div className="flex items-center gap-3 mt-3">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            {contact.logoUrl
              ? <img src={contact.logoUrl} alt="" className="w-full h-full object-contain" />
              : isOrg ? <Building2 className="w-6 h-6 text-brand-500" /> : <User className="w-6 h-6 text-brand-500" />}
          </span>
          <div className="min-w-0">
            <p className="font-bold leading-tight truncate">{contact.name}</p>
            <p className="text-xs text-white/60 mt-0.5">Listed on SharedOwnership</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Direct contact</p>
          <ul className="space-y-2 text-sm">
            {contact.phone && (
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-brand-500" /><a href={telHref(contact.phone)} className="font-semibold text-ink hover:text-brand-600">{contact.phone}</a></li>
            )}
            {contact.email && (
              <li className="flex items-center gap-2.5 min-w-0"><Mail className="w-4 h-4 shrink-0 text-brand-500" /><a href={`mailto:${contact.email}`} className="font-semibold text-ink hover:text-brand-600 truncate">{contact.email}</a></li>
            )}
            {website && (
              <li className="flex items-center gap-2.5 min-w-0"><Globe className="w-4 h-4 shrink-0 text-brand-500" /><a href={website} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-brand-600 truncate">{website.replace(/^https?:\/\//i, '')}</a></li>
            )}
          </ul>
        </div>

        <ContactButtons contact={contact} subject={subject} name={name} propertyId={propertyId} />

        {isOrg && contact.slug && (
          <Link to={`/companies/${contact.slug}`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            View provider profile <ArrowRight className="w-4 h-4" />
          </Link>
        )}

        <div className="flex gap-2.5 rounded-xl bg-brand-50 p-3 text-xs text-gray-600">
          <ShieldCheck className="w-4 h-4 shrink-0 text-brand-500" />
          <p>{reference ? <>Quote reference <b className="text-ink">{reference}</b> when you get in touch. </> : null}Never send money before viewing a home and checking the provider.</p>
        </div>
      </div>
    </div>
  );
}
