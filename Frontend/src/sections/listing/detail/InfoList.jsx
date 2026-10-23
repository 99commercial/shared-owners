/** Label / value rows in two columns; entries without a value are skipped */
export default function InfoList({ items }) {
  const shown = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '' && !(Array.isArray(item.value) && !item.value.length));
  if (!shown.length) return null;
  return (
    <dl className="grid sm:grid-cols-2 gap-x-8">
      {shown.map(({ label, value }) => (
        <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-dashed border-gray-200">
          <dt className="text-sm text-gray-500">{label}</dt>
          <dd className="text-sm font-semibold text-ink text-right">
            {Array.isArray(value) ? (
              <span className="flex flex-wrap justify-end gap-1">
                {value.map((v) => <span key={v} className="px-2 py-0.5 rounded-md bg-brand-50 text-xs font-semibold text-brand-700">{v}</span>)}
              </span>
            ) : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
