export default function StatsCard({ label, value, icon: Icon, color = 'bg-primary-100 text-primary-600', change }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {change && <div className="text-xs text-green-600 mt-1">{change}</div>}
    </div>
  );
}
