import { Link } from 'react-router-dom';
import { HomeIcon, Eye, MessageSquare, ChevronRight } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

function PropertyRow({ property, metric, basePath }) {
  const img = property.searchSnapshot?.primaryImageUrl;
  return (
    <Link to={`${basePath}/properties/${property._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/50">
      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <HomeIcon className="w-5 h-5 text-gray-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{property.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={property.status} />
          {!property.completion?.isComplete && <span className="text-xs text-amber-600">Incomplete</span>}
        </div>
      </div>
      {metric}
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </Link>
  );
}

function ListCard({ title, items, empty, renderMetric, basePath }) {
  return (
    <div className="dash-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-brand-500" />
          <h3 className="font-semibold text-ink">{title}</h3>
        </div>
        <Link to={`${basePath}/properties`} className="px-2.5 py-1 rounded-full bg-brand-100 text-[11px] font-bold uppercase tracking-wide text-ink hover:bg-brand-200">View all</Link>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">{empty}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((p) => <PropertyRow key={p._id} property={p} metric={renderMetric(p)} basePath={basePath} />)}
        </div>
      )}
    </div>
  );
}

/** Also used by the organisation dashboard; basePath points the links at its properties pages */
export default function DashboardPropertyLists({ analytics, basePath = '/user' }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ListCard
        basePath={basePath}
        title="Recently updated"
        items={analytics?.recentlyUpdated || []}
        empty="No properties yet. Create your first listing to get started."
        renderMetric={(p) => <span className="text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString('en-GB')}</span>}
      />
      <ListCard
        basePath={basePath}
        title="Most viewed"
        items={analytics?.mostViewed || []}
        empty="Views appear here once your listings are live."
        renderMetric={(p) => (
          <div className="text-xs text-gray-500 text-right space-y-0.5">
            <div className="flex items-center gap-1 justify-end"><Eye className="w-3.5 h-3.5" />{p.stats?.views ?? 0}</div>
            <div className="flex items-center gap-1 justify-end"><MessageSquare className="w-3.5 h-3.5" />{p.stats?.enquiries ?? 0}</div>
          </div>
        )}
      />
    </div>
  );
}
