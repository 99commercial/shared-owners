import { STATUS_STYLES, labelize } from '../data/propertyOptions';

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {labelize(status)}
    </span>
  );
}
