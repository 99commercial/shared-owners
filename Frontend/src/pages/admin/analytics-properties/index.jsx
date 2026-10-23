import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, BedDouble, CheckCircle2, Clock, Crown, Eye, HomeIcon, Landmark, MapPin, MessageSquare,
  PoundSterling, Percent, PieChart, Sparkles, TrendingUp, Trophy, Users,
} from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useRange from '../../../hooks/useRange';
import PageHero from '../../../components/PageHero';
import Panel from '../../../components/admin/Panel';
import KpiCard from '../../../components/admin/KpiCard';
import RangeTabs from '../../../components/admin/RangeTabs';
import ListingRow from '../../../components/admin/ListingRow';
import { BarList, Donut, SplitBar, TrendChart } from '../../../components/admin/Charts';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import { CHART_COLORS, STATUS_COLORS } from '../../../data/adminOptions';
import { PROPERTY_STATUS_VALUES, formatMoney, labelize } from '../../../data/propertyOptions';
import { accountName, formatCompact, formatNumber, percent } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const toItems = (rows, labelFor = labelize) =>
  rows.map((r, i) => ({ label: labelFor(r.value), value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }));

function ListingList({ items, metric, empty }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-gray-400">{empty}</p>;
  return (
    <div className="divide-y divide-gray-100">
      {items.map((p) => <ListingRow key={p._id} listing={p} metric={metric} to={`/admin/properties?open=${p._id}`} />)}
    </div>
  );
}

export default function AdminPropertyAnalyticsPage() {
  const { days, setDays, label } = useRange();
  const { data: a, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin', 'analytics', 'properties', days],
    queryFn: () => adminApi.getPropertyAnalytics({ days }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const hero = (
    <PageHero
      label="Analytics"
      title="Properties"
      subtitle="Listings from individual users and organisations"
      breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Analytics' }, { label: 'Properties' }]}
      action={<RangeTabs value={days} onChange={setDays} />}
    />
  );

  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageError error={error} /></div>;

  const t = a.totals;
  const waiting = a.waitingForAdminApproval;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
      {hero}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={HomeIcon} label="All properties" value={formatNumber(t.total)} hint={`+${formatNumber(t.newInRange)} in ${label}`} to="/admin/properties" />
        <KpiCard icon={CheckCircle2} tone="green" label="Live" value={formatNumber(t.live)} hint={`${percent(t.live, t.total)}% of all listings`} to="/admin/properties?status=live" />
        <KpiCard icon={Clock} tone="amber" label="Awaiting approval" value={formatNumber((waiting.create || 0) + (waiting.edit || 0))} hint={`${waiting.create || 0} new · ${waiting.edit || 0} edits`} to="/admin/approvals" />
        <KpiCard icon={AlertTriangle} tone="rose" label="Incomplete" value={formatNumber(t.incomplete)} hint="Required sections missing" />
        <KpiCard icon={Eye} tone="cyan" label="Total views" value={formatCompact(t.views)} hint={`${formatNumber(t.enquiries)} enquiries`} />
        <KpiCard icon={Percent} tone="violet" label="Enquiry rate" value={`${t.enquiryRate}%`} hint="Enquiries per view" />
        <KpiCard icon={PoundSterling} tone="green" label="Avg. full market value" value={t.averageFullMarketValue ? formatMoney(t.averageFullMarketValue) : '—'} hint={t.averageMinimumShare ? `Avg. minimum share ${t.averageMinimumShare}%` : 'Where a price is set'} />
        <KpiCard icon={Crown} tone="amber" label="Premium" value={formatNumber(t.premium)} hint={`${formatNumber(t.inDevelopment)} inside developments`} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Panel title="New listings per day" subtitle={`By owner type, last ${label}`} icon={TrendingUp} className="xl:col-span-2">
          <TrendChart
            data={a.createdByDay}
            type="bar"
            series={[
              { key: 'user', label: 'Individual users', color: '#2563eb' },
              { key: 'organisation', label: 'Organisations', color: '#7c3aed' },
            ]}
          />
        </Panel>
        <Panel title="Status" icon={PieChart}>
          <Donut
            items={PROPERTY_STATUS_VALUES.map((s) => ({ label: labelize(s), value: a.byStatus[s] || 0, color: STATUS_COLORS[s] }))}
            centerLabel="Listings"
          />
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Owner type</div>
            <SplitBar
              items={[
                { label: 'Individual users', value: a.byOwnerType.user || 0, color: '#2563eb' },
                { label: 'Organisations', value: a.byOwnerType.organisation || 0, color: '#7c3aed' },
              ]}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Published per day" subtitle="Listings that went live" icon={Sparkles}>
        <TrendChart data={a.publishedByDay} series={[{ key: 'published', label: 'Published', color: '#16a34a' }]} height={160} />
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Scheme type" icon={PieChart}><Donut items={toItems(a.bySchemeType)} centerLabel="Listings" /></Panel>
        <Panel title="Availability" icon={CheckCircle2}><Donut items={toItems(a.byAvailability)} centerLabel="Listings" /></Panel>
        <Panel title="Property type" icon={HomeIcon}><BarList items={toItems(a.byPropertyType)} /></Panel>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Panel title="Price bands" subtitle="Full market value" icon={PoundSterling}><BarList items={toItems(a.priceBands, (v) => v)} color="#16a34a" /></Panel>
        <Panel title="Bedrooms" icon={BedDouble}><BarList items={toItems(a.byBedrooms, (v) => v)} color="#0891b2" /></Panel>
        <Panel title="Top towns & cities" icon={MapPin}><BarList items={toItems(a.topTowns, (v) => v)} color="#f59e0b" /></Panel>
        <Panel title="Top local authorities" icon={Landmark}><BarList items={toItems(a.topAuthorities, (v) => v)} color="#7c3aed" /></Panel>
      </div>

      <Panel title="Owners with the most listings" icon={Users} bodyClassName="">
        {a.topOwners.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No listings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2.5 font-bold">Owner</th>
                  <th className="px-3 py-2.5 font-bold">Type</th>
                  <th className="px-3 py-2.5 font-bold text-right">Listings</th>
                  <th className="px-3 py-2.5 font-bold text-right">Live</th>
                  <th className="px-5 py-2.5 font-bold text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {a.topOwners.map((row) => {
                  const path = adminAccountPath(row.owner);
                  return (
                    <tr key={row.owner._id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5">
                        {path ? <Link to={path} className="font-semibold text-ink hover:text-brand-700">{accountName(row.owner)}</Link> : accountName(row.owner)}
                        <div className="text-xs text-gray-500">{row.owner.email}</div>
                      </td>
                      <td className="px-3 py-2.5"><span className="badge bg-gray-100 text-gray-600">{labelize(row.ownerType)}</span></td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink">{formatNumber(row.listings)}</td>
                      <td className="px-3 py-2.5 text-right text-green-600 font-semibold">{formatNumber(row.live)}</td>
                      <td className="px-5 py-2.5 text-right text-gray-600">{formatNumber(row.views)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid xl:grid-cols-3 gap-6">
        <Panel title="Most viewed" icon={Trophy} bodyClassName=""><ListingList items={a.mostViewed} metric="views" empty="No views yet" /></Panel>
        <Panel title="Most enquired" icon={MessageSquare} bodyClassName=""><ListingList items={a.mostEnquired} metric="enquiries" empty="No enquiries yet" /></Panel>
        <Panel title="Newest listings" icon={Sparkles} bodyClassName=""><ListingList items={a.recent} metric="created" empty="No listings yet" /></Panel>
      </div>
    </div>
  );
}
