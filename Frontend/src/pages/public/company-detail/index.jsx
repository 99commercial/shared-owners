import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Mail, Globe, ArrowLeft, Home, Loader2 } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';

const TYPE_LABELS = { housing_association: 'Housing Association', developer: 'Developer', landlord: 'Landlord', agent: 'Agent' };
const TYPE_COLORS = { housing_association: 'bg-blue-100 text-blue-700', developer: 'bg-purple-100 text-purple-700', landlord: 'bg-green-100 text-green-700' };

export default function CompanyDetailPage() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['public-organisation', slug],
    queryFn: () => commonApi.getOrganisation(slug).then(r => r.data.data),
  });

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  if (!data?.organisation) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Organisation not found</h2>
        <Link to="/companies" className="btn-primary mt-4 inline-flex">Back to Companies</Link>
      </div>
    );
  }

  const org = data.organisation;
  const p = org.organisationProfile || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/companies" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                {p.logoUrl
                  ? <img src={p.logoUrl} alt={p.name} className="w-16 h-16 object-contain rounded-xl" />
                  : <Building2 className="w-10 h-10 text-blue-400" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
                {p.type && <span className={`badge mt-2 ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[p.type] || p.type}</span>}
              </div>
            </div>
            {p.description && <p className="text-gray-600 mt-6 leading-relaxed">{p.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <Home className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{data.propertyCount ?? 0}</div>
              <div className="text-sm text-gray-500">Live Properties</div>
            </div>
            <div className="card p-5 text-center">
              <Building2 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{p.type ? TYPE_LABELS[p.type] : '—'}</div>
              <div className="text-sm text-gray-500">Organisation Type</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <ul className="space-y-3">
              {p.contactEmail && (
                <li className="flex items-start gap-3 text-sm"><Mail className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" /><a href={`mailto:${p.contactEmail}`} className="text-primary-600 hover:underline">{p.contactEmail}</a></li>
              )}
              {org.email && !p.contactEmail && (
                <li className="flex items-start gap-3 text-sm"><Mail className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" /><a href={`mailto:${org.email}`} className="text-primary-600 hover:underline">{org.email}</a></li>
              )}
              {p.phone && (
                <li className="flex items-start gap-3 text-sm"><Phone className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" /><span>{p.phone}</span></li>
              )}
              {p.website && (
                <li className="flex items-start gap-3 text-sm"><Globe className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" /><a href={p.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">{p.website.replace('https://', '')}</a></li>
              )}
              {p.address?.city && (
                <li className="flex items-start gap-3 text-sm"><MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{[p.address.line1, p.address.city, p.address.postcode].filter(Boolean).join(', ')}</span></li>
              )}
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Browse Properties</h3>
            <p className="text-sm text-gray-500 mb-4">View all available properties from {p.name}</p>
            <Link to="/properties" className="btn-primary w-full text-center block text-sm flex justify-center">Browse Properties</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
