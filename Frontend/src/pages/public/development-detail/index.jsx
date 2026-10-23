import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Building2, CheckCircle2, FileText, Home, Info, Landmark, Loader2, MapPin, PieChart,
  PoundSterling, Sparkles, Tag,
} from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import { AVAILABILITY, formatMoney, labelize } from '../../../data/propertyOptions';
import { addressLine, bedroomsRange } from '../../../utils/listing';
import { formatDate } from '../../../utils/format';
import DetailHeader from '../../../sections/listing/detail/DetailHeader';
import Gallery from '../../../sections/listing/detail/Gallery';
import DetailCard from '../../../sections/listing/detail/DetailCard';
import FactGrid from '../../../sections/listing/detail/FactGrid';
import InfoList from '../../../sections/listing/detail/InfoList';
import HtmlContent from '../../../sections/listing/detail/HtmlContent';
import MediaCard from '../../../sections/listing/detail/MediaCard';
import LocationCard from '../../../sections/listing/detail/LocationCard';
import DocumentsList from '../../../sections/listing/detail/DocumentsList';
import ContactCard from '../../../sections/listing/detail/ContactCard';
import ContactButtons from '../../../sections/listing/detail/ContactButtons';
import PropertyCard from '../../../sections/property/PropertyCard';

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-32 text-center">
      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h1 className="text-2xl font-bold text-ink">This development is no longer listed</h1>
      <p className="text-gray-500 mt-2">It may be fully sold or temporarily unavailable.</p>
      <Link to="/developments" className="btn-brand mt-6">Browse all developments</Link>
    </div>
  );
}

/** Available homes inside the development, filterable by availability */
function HomesSection({ properties }) {
  const [availability, setAvailability] = useState('');
  const counts = useMemo(() => properties.reduce((acc, p) => {
    const key = p.searchSnapshot?.availability;
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [properties]);
  const shown = availability ? properties.filter((p) => p.searchSnapshot?.availability === availability) : properties;
  const tabs = [{ value: '', label: 'All', count: properties.length }, ...AVAILABILITY.filter((a) => counts[a]).map((a) => ({ value: a, label: labelize(a), count: counts[a] }))];

  return (
    <DetailCard title={`Homes in this development (${properties.length})`} icon={Home} id="homes">
      {properties.length === 0 ? (
        <p className="text-sm text-gray-500">No homes have been released yet. Contact the provider to register your interest.</p>
      ) : (
        <>
          {tabs.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {tabs.map((t) => (
                <button
                  key={t.value || 'all'}
                  type="button"
                  onClick={() => setAvailability(t.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${availability === t.value ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {t.label} <span className="opacity-70">({t.count})</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-5">
            {shown.map((p) => <PropertyCard key={p._id} property={p} />)}
          </div>
        </>
      )}
    </DetailCard>
  );
}

export default function DevelopmentDetailPage() {
  const { developmentId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'development', developmentId],
    queryFn: () => commonApi.getDevelopment(developmentId).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  });
  const development = data?.development;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [developmentId]);
  useEffect(() => {
    if (development) document.title = `${development.name} — Shared Ownership`;
  }, [development]);

  if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  if (error || !development) return <NotFound />;

  const { contact, properties = [] } = data;
  const homes = development.homes || {};
  const details = development.details || {};
  const docs = development.documents || {};
  const subject = `Enquiry: ${development.name}`;
  const priceRange = homes.priceFrom
    ? homes.priceTo && homes.priceTo !== homes.priceFrom
      ? `${formatMoney(homes.priceFrom)} – ${formatMoney(homes.priceTo)}`
      : formatMoney(homes.priceFrom)
    : null;

  const highlights = [
    { icon: Building2, label: 'Housing provider', value: contact?.name },
    { icon: Tag, label: 'Development type', value: labelize(development.developmentType) },
    { icon: Home, label: 'Homes listed', value: homes.homes || null },
    { icon: CheckCircle2, label: 'Available now', value: homes.homes ? homes.available : null },
    { icon: PoundSterling, label: 'Price range', value: priceRange },
    { icon: PieChart, label: 'Shares from', value: homes.minShare && `${homes.minShare}%` },
    { icon: BedDouble, label: 'Bedrooms', value: bedroomsRange(homes.bedroomsMin, homes.bedroomsMax) },
    { icon: Landmark, label: 'Local authority', value: development.address?.localAuthority },
    { icon: MapPin, label: 'Town / city', value: development.address?.townCity },
  ];

  const documents = [
    ...(docs.brochures || []).map((file, i) => ({ label: docs.brochures.length > 1 ? `Brochure ${i + 1}` : 'Brochure', file })),
    { label: 'Site plan', file: docs.sitePlan },
    { label: 'Price list', file: docs.priceList },
  ];

  return (
    <div className="bg-gray-50 pb-16">
      <div className="px-4 sm:px-6 lg:px-10 pt-6 space-y-6">
        <DetailHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Developments', to: '/developments' }, { label: development.name }]}
          badges={[
            { label: homes.available ? `${homes.available} available` : homes.homes ? 'Fully reserved' : 'Coming soon', className: homes.available ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white' },
            development.developmentType && { label: labelize(development.developmentType), className: 'bg-brand-500 text-white' },
            development.isPremium && { label: 'Featured', className: 'bg-amber-400 text-amber-950' },
          ]}
          title={development.name}
          address={addressLine(development.address, { full: true })}
          stats={[
            { label: 'Homes listed', value: homes.homes || '—', hint: homes.homes ? `${homes.available} available now` : 'Register your interest' },
            { label: 'Prices from', value: homes.priceFrom ? formatMoney(homes.priceFrom) : 'TBC', hint: homes.minShare ? `shares from ${homes.minShare}%` : null },
            { label: 'Bedrooms', value: bedroomsRange(homes.bedroomsMin, homes.bedroomsMax) || '—' },
          ]}
          aside={(
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">New development</p>
                <p className="text-3xl font-extrabold mt-1">{homes.priceFrom ? `From ${formatMoney(homes.priceFrom)}` : 'Prices coming soon'}</p>
                <p className="text-sm text-white/70 mt-1">{contact?.name ? <>By <b className="text-white">{contact.name}</b></> : 'Shared ownership homes'}</p>
              </div>
              {properties.length > 0 && (
                <a href="#homes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">
                  <Home className="w-4 h-4" /> See {properties.length} home{properties.length === 1 ? '' : 's'}
                </a>
              )}
              <ContactButtons contact={contact} subject={subject} name={development.name} tone="dark" />
            </>
          )}
        />

        <Gallery images={development.gallery || []} title={development.name} label={labelize(development.developmentType) || 'Development'} />

        <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <DetailCard title="Development highlights" icon={Sparkles}>
              <FactGrid items={highlights} />
            </DetailCard>

            <DetailCard title="About the development" icon={Info}>
              {development.summaryText && <p className="text-lg font-semibold text-ink leading-relaxed mb-4">{development.summaryText}</p>}
              {details.description
                ? <HtmlContent html={details.description} />
                : !development.summaryText && <p className="text-sm text-gray-400">The provider hasn't added a description yet.</p>}
            </DetailCard>

            <HomesSection properties={properties} />

            <MediaCard {...details} />

            <LocationCard id={development._id} address={development.address} location={development.location} title={development.name} />

            <DetailCard title="Brochures & plans" icon={FileText} id="documents">
              <DocumentsList items={documents} />
            </DetailCard>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <ContactCard contact={contact} subject={subject} name={development.name} />
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <p className="text-sm font-extrabold text-ink mb-3">Development details</p>
              <InfoList items={[
                { label: 'Postcode', value: development.address?.postcode },
                { label: 'Listed', value: development.publishedAt && formatDate(development.publishedAt) },
                { label: 'Last updated', value: development.updatedAt && formatDate(development.updatedAt) },
              ]} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
