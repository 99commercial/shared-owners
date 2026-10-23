import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Bath, BedDouble, Building2, CalendarDays, Car, CheckCircle2, ClipboardList, FileText,
  HelpCircle, Home, Info, Landmark, Layers, Loader2, Megaphone, PawPrint, PoundSterling, Ruler,
  ScrollText, Sofa, Sparkles, Tag, Wrench,
} from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import {
  ACCESSIBILITY_STANDARDS, BROADBAND, ELIGIBILITY_CRITERIA, PETS_ALLOWED, SINGLE_DOCUMENTS, formatMoney, labelize,
} from '../../../data/propertyOptions';
import {
  AVAILABILITY_BADGE, ELIGIBILITY_VALUE, addressLine, bedroomsLabel, floorLabel, shareValue, unitSizeLabel, yesNo,
} from '../../../utils/listing';
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

const optionLabel = (options, value) => options.find((o) => o.value === value)?.label || labelize(value);
const labels = (values) => (values || []).map(labelize);
const SHARED_SCHEMES = ['shared_ownership', 'shared_ownership_resale', 'older_persons_shared_ownership', 'home_ownership_long_term_disabilities'];

/** Pricing rows for the scheme; `monthly` sums the regular costs a shared owner pays besides the mortgage */
const buildPricing = (scheme, pricing, minShare) => {
  const fmv = pricing.fullMarketValue;
  const rows = [{ label: 'Full market value', value: fmv && formatMoney(fmv) }];
  let monthly = null;

  if (SHARED_SCHEMES.includes(scheme) || (!scheme && minShare)) {
    const share = shareValue(fmv, minShare);
    rows.push(
      { label: 'Minimum share', value: minShare && `${minShare}%` },
      { label: `Price of a ${minShare || '—'}% share`, value: share && formatMoney(share) },
      { label: 'Monthly rent on the unsold share', value: pricing.monthlyRentAtMinShare != null && formatMoney(pricing.monthlyRentAtMinShare) },
    );
    monthly = (pricing.monthlyRentAtMinShare || 0) + (pricing.serviceChargeMonthly || 0) + (pricing.groundRentAnnual || 0) / 12;
  } else if (scheme === 'rent_to_buy') {
    rows.push({ label: 'Monthly rent', value: pricing.monthlyRent != null && formatMoney(pricing.monthlyRent) });
    monthly = (pricing.monthlyRent || 0) + (pricing.serviceChargeMonthly || 0);
  } else if (pricing.discountPercentage) {
    rows.push(
      { label: 'Discount', value: `${pricing.discountPercentage}%` },
      { label: 'You pay', value: fmv && formatMoney(Math.round(fmv * (1 - pricing.discountPercentage / 100))) },
    );
  }
  rows.push(
    { label: 'Service charge', value: pricing.serviceChargeMonthly != null && `${formatMoney(pricing.serviceChargeMonthly)} / month` },
    { label: 'Ground rent', value: pricing.groundRentAnnual != null && `${formatMoney(pricing.groundRentAnnual)} / year` },
  );
  return { rows: rows.filter((r) => r.value), monthly: monthly ? Math.round(monthly * 100) / 100 : null };
};

/** First three facts for the header tiles, depending on the scheme */
const headerStats = (scheme, pricing, minShare, bedrooms, availability) => {
  const fmv = pricing.fullMarketValue;
  const stats = [{ label: 'Full market value', value: fmv ? formatMoney(fmv) : 'POA' }];
  if (pricing.discountPercentage) {
    stats.push({ label: 'Discount', value: `${pricing.discountPercentage}%`, hint: fmv ? `${formatMoney(Math.round(fmv * (1 - pricing.discountPercentage / 100)))} to pay` : null });
  } else if (scheme === 'rent_to_buy') {
    stats.push({ label: 'Monthly rent', value: pricing.monthlyRent != null ? formatMoney(pricing.monthlyRent) : '—' });
  } else {
    const share = shareValue(fmv, minShare);
    stats.push({ label: 'Shares from', value: minShare ? `${minShare}%` : '—', hint: share ? `${formatMoney(share)} for the share` : null });
  }
  stats.push(bedrooms !== undefined && bedrooms !== null
    ? { label: 'Bedrooms', value: bedroomsLabel(bedrooms) }
    : { label: 'Availability', value: labelize(availability) || '—' });
  return stats;
};

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-32 text-center">
      <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h1 className="text-2xl font-bold text-ink">This home is no longer listed</h1>
      <p className="text-gray-500 mt-2">It may have been sold or taken off the market.</p>
      <Link to="/properties" className="btn-brand mt-6">Browse all properties</Link>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { propertyId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'property', propertyId],
    queryFn: () => commonApi.getProperty(propertyId).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  });
  const property = data?.property;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [propertyId]);
  useEffect(() => {
    if (property) document.title = `${property.name} — Shared Ownership`;
  }, [property]);

  if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  if (error || !property) return <NotFound />;

  const { contact, related = [] } = data;
  const snap = property.searchSnapshot || {};
  const d = property.details || {};
  const desc = property.description || {};
  const pricing = { ...d.pricing, fullMarketValue: d.pricing?.fullMarketValue ?? snap.fullMarketValue };
  const scheme = d.schemeType || snap.schemeType;
  const availability = d.availability || snap.availability;
  const minShare = d.minimumSharePercentage ?? snap.minimumSharePercentage;
  const bedrooms = desc.bedrooms ?? snap.bedrooms;
  const { rows: pricingRows, monthly } = buildPricing(scheme, pricing, minShare);
  const subject = `Enquiry: ${property.name}${property.reference ? ` (Ref ${property.reference})` : ''}`;
  const share = shareValue(pricing.fullMarketValue, minShare);
  const eligibility = property.eligibility || {};
  const docs = property.documents || {};

  const highlights = [
    { icon: Home, label: 'Property type', value: labelize(d.propertyType || snap.propertyType) },
    { icon: BedDouble, label: 'Bedrooms', value: bedroomsLabel(bedrooms) },
    { icon: Bath, label: 'Bathrooms', value: desc.bathrooms ?? null },
    { icon: Ruler, label: 'Internal size', value: unitSizeLabel(d.unitSize) },
    { icon: ScrollText, label: 'Tenure', value: d.tenure && `${labelize(d.tenure)}${d.leaseYearsRemaining ? ` · ${d.leaseYearsRemaining} yrs` : ''}` },
    { icon: Layers, label: 'Floor', value: floorLabel(d.floor) },
    { icon: Landmark, label: 'Council tax', value: d.councilTaxBand && `Band ${d.councilTaxBand}` },
    { icon: CalendarDays, label: 'Year built', value: d.yearBuilt },
    { icon: Car, label: 'Parking', value: labelize(d.parking) },
    { icon: Sofa, label: 'Furnishing', value: labelize(d.furnished) },
    { icon: PawPrint, label: 'Pets', value: desc.petsAllowed && optionLabel(PETS_ALLOWED, desc.petsAllowed) },
    { icon: Tag, label: 'Availability', value: labelize(availability) },
  ];

  const features = [
    { label: 'Outside space', value: labels(d.outsideSpace) },
    { label: 'Accessibility features', value: labels(d.accessibleMeasures) },
    { label: 'Accessibility standard', value: desc.accessibility && optionLabel(ACCESSIBILITY_STANDARDS, desc.accessibility) },
    { label: 'Communal lift', value: yesNo(d.communalLift) },
    { label: 'Total rooms', value: d.totalRooms },
    { label: 'Washing machine', value: labelize(d.washingMachine) },
    { label: 'Dishwasher', value: labelize(d.dishwasher) },
    { label: 'Fridge freezer', value: labelize(d.fridgeFreezer) },
    { label: 'Heating', value: d.heatingDetails },
    { label: 'Broadband', value: d.broadband && optionLabel(BROADBAND, d.broadband) },
    { label: 'Electricity', value: labelize(d.electricitySupply) },
    { label: 'Water', value: labelize(d.waterSupply) },
    { label: 'Sewerage', value: labelize(d.sewerageSupply) },
    { label: 'Listed status', value: labelize(d.listedStatus) },
    { label: 'Flooded in last 5 years', value: yesNo(d.floodedInLast5Years) },
  ];

  const documents = [
    ...(docs.brochures || []).map((file, i) => ({ label: docs.brochures.length > 1 ? `Brochure ${i + 1}` : 'Brochure', file })),
    ...SINGLE_DOCUMENTS.map(({ key, label }) => ({ label, file: docs[key] })),
    { label: 'Key information (online)', url: docs.keyInformationUrl },
  ];

  return (
    <div className="bg-gray-50 pb-16">
      <div className="px-4 sm:px-6 lg:px-10 pt-6 space-y-6">
        <DetailHeader
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Properties', to: '/properties' }, { label: property.name }]}
          badges={[
            availability && { label: labelize(availability), className: AVAILABILITY_BADGE[availability] },
            scheme && { label: labelize(scheme), className: 'bg-brand-500 text-white' },
            property.reference && { label: `Ref ${property.reference}` },
            property.isPremium && { label: 'Featured', className: 'bg-amber-400 text-amber-950' },
          ]}
          title={property.name}
          address={addressLine(property.address, { full: true })}
          stats={headerStats(scheme, pricing, minShare, bedrooms, availability)}
          aside={(
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{labelize(scheme) || 'For sale'}</p>
                <p className="text-3xl font-extrabold mt-1">{pricing.fullMarketValue ? formatMoney(pricing.fullMarketValue) : 'Price on application'}</p>
                <p className="text-sm text-white/70 mt-1">
                  {share ? <>Buy a {minShare}% share for <b className="text-white">{formatMoney(share)}</b></> : 'Full market value'}
                </p>
                {monthly ? <p className="text-xs text-white/60 mt-1">About {formatMoney(monthly)} / month in rent and charges</p> : null}
              </div>
              <ContactButtons contact={contact} subject={subject} name={property.name} tone="dark" propertyId={property._id} />
            </>
          )}
        />

        {property.announcement && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
            <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{property.announcement}</p>
          </div>
        )}

        <Gallery images={property.gallery || []} title={property.name} label={labelize(d.propertyType || snap.propertyType)} />

        <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <DetailCard title="Property highlights" icon={Sparkles}>
              <FactGrid items={highlights} />
            </DetailCard>

            <DetailCard title="Property overview" icon={Info}>
              <div className={`grid gap-6 ${desc.keyFeatures ? 'md:grid-cols-[1fr_260px]' : ''}`}>
                <div className="min-w-0">
                  {desc.summary && <p className="text-lg font-semibold text-ink leading-relaxed mb-4">{desc.summary}</p>}
                  {desc.description ? <HtmlContent html={desc.description} /> : !desc.summary && <p className="text-sm text-gray-400">No description yet.</p>}
                </div>
                {desc.keyFeatures && (
                  <aside className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 self-start">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-ink mb-2"><CheckCircle2 className="w-4 h-4 text-brand-500" /> Key features</p>
                    <HtmlContent html={desc.keyFeatures} className="text-sm" />
                  </aside>
                )}
              </div>
            </DetailCard>

            <section className="rounded-2xl overflow-hidden bg-slate-900 text-white shadow-sm" id="pricing">
              <header className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/10">
                <h2 className="flex items-center gap-2.5 text-base font-extrabold"><span className="w-1 h-5 rounded-full bg-brand-400" /><PoundSterling className="w-4 h-4 text-brand-300" /> Scheme & pricing</h2>
                <span className="rounded-md bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{labelize(scheme) || 'For sale'}</span>
              </header>
              <div className="p-5 sm:p-6 grid md:grid-cols-[1fr_240px] gap-6">
                <dl className="divide-y divide-white/10">
                  {pricingRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-sm text-white/70">{row.label}</dt>
                      <dd className="text-sm font-bold">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 self-start">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{share ? `${minShare}% share price` : 'Full market value'}</p>
                  <p className="text-3xl font-extrabold mt-1">{formatMoney(share || pricing.fullMarketValue)}</p>
                  {monthly ? <p className="text-xs text-white/80 mt-2">+ about <b>{formatMoney(monthly)}</b> a month in rent and charges</p> : null}
                </div>
              </div>
              <p className="px-5 sm:px-6 pb-5 text-[11px] text-white/50">Figures are provided by the seller and may change. Always confirm costs with the provider and an independent mortgage adviser.</p>
            </section>

            {(eligibility.criteriaText || eligibility.criteria?.length > 0) && (
              <DetailCard title="Who can buy" icon={ClipboardList} id="eligibility">
                {eligibility.criteria?.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                    {eligibility.criteria.map((c) => {
                      const meta = ELIGIBILITY_CRITERIA.find((e) => e.type === c.type);
                      return (
                        <div key={c.type} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                          <span className="text-sm text-gray-600">{meta?.label || labelize(c.type)}</span>
                          <span className="text-sm font-bold text-ink text-right">{(ELIGIBILITY_VALUE[meta?.kind] || String)(c.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <HtmlContent html={eligibility.criteriaText} className="text-sm" />
              </DetailCard>
            )}

            {d.rooms?.length > 0 && (
              <DetailCard title="Rooms & dimensions" icon={Ruler} bodyClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <tr><th className="px-5 sm:px-6 py-3">Room</th><th className="px-4 py-3">Dimensions</th><th className="px-5 sm:px-6 py-3">Notes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {d.rooms.map((room) => (
                        <tr key={room._id || room.name}>
                          <td className="px-5 sm:px-6 py-3 font-semibold text-ink">{room.name}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{room.length && room.width ? `${room.length} × ${room.width} ${room.unit || 'm'}` : '—'}</td>
                          <td className="px-5 sm:px-6 py-3 text-gray-500">{room.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DetailCard>
            )}

            <DetailCard title="Features & material information" icon={Wrench}>
              <InfoList items={features} />
              {d.materials && (
                <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Construction & materials</p>
                  <HtmlContent html={d.materials} className="text-sm" />
                </div>
              )}
            </DetailCard>

            <MediaCard {...(property.videoTour || {})} />

            <LocationCard id={property._id} address={property.address} location={property.location} title={property.name} />

            <DetailCard title="Documents & attachments" icon={FileText} id="documents">
              <DocumentsList items={documents} />
            </DetailCard>

            {d.faqs?.length > 0 && (
              <DetailCard title="Frequently asked questions" icon={HelpCircle}>
                <div className="space-y-2">
                  {d.faqs.map((faq) => (
                    <details key={faq._id || faq.question} className="group rounded-xl border border-gray-200 bg-white open:border-brand-200 open:bg-brand-50/40">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink">
                        {faq.question}
                        <span className="text-brand-500 text-lg leading-none transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-line">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </DetailCard>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <ContactCard contact={contact} subject={subject} name={property.name} reference={property.reference} propertyId={property._id} />

            {property.development && (
              <Link to={`/developments/${property.development._id}`} className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:border-brand-300">
                {property.development.primaryImageUrl && <img src={property.development.primaryImageUrl} alt="" className="w-full h-28 object-cover" />}
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1"><Building2 className="w-3 h-3" /> Part of a development</p>
                  <p className="font-bold text-ink mt-1">{property.development.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{addressLine(property.development.address)}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-brand-600 group-hover:gap-2 transition-all">See all homes in this development <ArrowRight className="w-3.5 h-3.5" /></span>
                </div>
              </Link>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <p className="text-sm font-extrabold text-ink mb-3">Listing details</p>
              <InfoList items={[
                { label: 'Reference', value: property.reference },
                { label: 'Listed', value: property.publishedAt && formatDate(property.publishedAt) },
                { label: 'Last updated', value: property.updatedAt && formatDate(property.updatedAt) },
                { label: 'Seller', value: property.ownerType === 'organisation' ? 'Housing provider' : 'Private seller' },
              ]} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="pt-4">
            <div className="flex items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-ink">{property.development ? 'More homes in this development' : 'Similar homes nearby'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Other listings you may like</p>
              </div>
              <Link to="/properties" className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">View all <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {related.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
