import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Building2, CheckCircle2, Crown, HomeIcon, Image, Landmark, Layers, Link2, MapPin, PieChart, Sparkles, TrendingUp,
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
import { DEVELOPMENT_STATUS_VALUES } from '../../../data/developmentOptions';
import { STATUS_STYLES, labelize } from '../../../data/propertyOptions';
import { accountName, formatNumber, percent } from '../../../utils/format';
import { adminAccountPath } from '../../../utils/adminPaths';

const toItems = (rows, labelFor = labelize) =>
  rows.map((r, i) => ({ label: labelFor(r.value), value: r.count, color: CHART_COLORS[i % CHART_COLORS.length] }));

export default function AdminDevelopmentAnalyticsPage() {
  const { days, setDays, label } = useRange();
  const { data: a, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin', 'analytics', 'developments', days],
    queryFn: () => adminApi.getDevelopmentAnalytics({ days }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const hero = (
    <PageHero
      label="Analytics"
      title="Developments"
      subtitle="Schemes created by organisations and the homes listed inside them"
      breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Analytics' }, { label: 'Developments' }]}
      action={<RangeTabs value={days} onChange={setDays} />}
    />
  );

  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8">{hero}<PageError error={error} /></div>;

  const t = a.totals;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
      {hero}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Landmark} label="All developments" value={formatNumber(t.total)} hint={`+${formatNumber(t.newInRange)} in ${label}`} to="/admin/developments" />
        <KpiCard icon={CheckCircle2} tone="green" label="Live" value={formatNumber(t.live)} hint={`${percent(t.live, t.total)}% of developments`} to="/admin/developments?status=live" />
        <KpiCard icon={Link2} tone="violet" label="Homes in developments" value={formatNumber(t.linkedProperties)} hint={`${t.averagePropertiesPerDevelopment} per development on average`} />
        <KpiCard icon={HomeIcon} tone="cyan" label="Standalone org homes" value={formatNumber(t.standaloneOrganisationProperties)} hint="Organisation listings not in a development" />
        <KpiCard icon={Crown} tone="amber" label="Premium" value={formatNumber(t.premium)} hint="Featured developments" />
        <KpiCard icon={Building2} tone="rose" label="Homes for Londoners" value={formatNumber(t.homesForLondoners)} hint="Syndicated developments" />
        <KpiCard icon={Image} tone="slate" label="With images" value={formatNumber(t.withImages)} hint={`${percent(t.withImages, t.total)}% have a main image`} />
        <KpiCard icon={Layers} tone="brand" label="Development types" value={formatNumber(a.byType.length)} hint="Distinct types in use" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Panel title="New developments per day" subtitle={`Last ${label}`} icon={TrendingUp} className="xl:col-span-2">
          <TrendChart data={a.createdByDay} type="bar" series={[{ key: 'developments', label: 'Developments', color: '#f59e0b' }]} />
        </Panel>
        <Panel title="Status" icon={PieChart}>
          <Donut
            items={DEVELOPMENT_STATUS_VALUES.map((s) => ({ label: labelize(s), value: a.byStatus[s] || 0, color: STATUS_COLORS[s] }))}
            centerLabel="Developments"
          />
          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Organisation homes</div>
            <SplitBar
              items={[
                { label: 'In a development', value: t.linkedProperties, color: '#7c3aed' },
                { label: 'Standalone', value: t.standaloneOrganisationProperties, color: '#0891b2' },
              ]}
            />
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Development type" icon={Layers}><Donut items={toItems(a.byType)} centerLabel="Developments" /></Panel>
        <Panel title="Top towns & cities" icon={MapPin}><BarList items={toItems(a.topTowns, (v) => v)} color="#f59e0b" /></Panel>
        <Panel title="Top local authorities" icon={Landmark}><BarList items={toItems(a.topAuthorities, (v) => v)} color="#7c3aed" /></Panel>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Panel title="Organisations with the most developments" icon={Building2}>
          <BarList
            items={a.topOwners.map((row) => ({
              key: row.owner._id,
              label: accountName(row.owner),
              value: row.developments,
              sub: `${row.live} live`,
              to: adminAccountPath(row.owner) ? `${adminAccountPath(row.owner)}?tab=developments` : undefined,
            }))}
            color="#7c3aed"
            empty="No developments yet"
          />
        </Panel>
        <Panel title="Developments with the most homes" icon={HomeIcon} bodyClassName="">
          {a.mostProperties.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No homes are linked to developments yet</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {a.mostProperties.map((row) => (
                <li key={row.development._id}>
                  <Link to={`/admin/properties?development=${row.development._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink truncate group-hover:text-brand-700">{row.development.name || 'Removed development'}</div>
                      <div className="text-xs text-gray-500 truncate">{row.development.address?.townCity || '—'}</div>
                    </div>
                    {row.development.status && (
                      <span className={`badge ${STATUS_STYLES[row.development.status]}`}>{labelize(row.development.status)}</span>
                    )}
                    <div className="text-right w-20 shrink-0">
                      <div className="text-sm font-bold text-ink">{formatNumber(row.properties)}</div>
                      <div className="text-[11px] text-green-600">{row.live} live</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Newest developments" icon={Sparkles} bodyClassName="">
        {a.recent.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No developments yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {a.recent.map((dev) => (
              <ListingRow key={dev._id} listing={dev} kind="development" owner={dev.owner} to={`/admin/developments?open=${dev._id}`} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
