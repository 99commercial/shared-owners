import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import Dropdown from '../Dropdown';

/**
 * columns = [{ key, label, className?, render(row) }]. `empty` is shown when
 * there are no rows (a node, or a string).
 */
export function DataTable({ columns, rows = [], rowKey = '_id', loading, fetching, empty, minWidth = 880, onRowClick }) {
  return (
    <div className={`overflow-x-auto ${fetching && !loading ? 'opacity-60 transition-opacity' : ''}`}>
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap ${col.headClassName || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr><td colSpan={columns.length} className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto" /></td></tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-14 text-center">
                {typeof empty === 'string' || !empty ? (
                  <>
                    <Inbox className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">{empty || 'Nothing here yet'}</p>
                  </>
                ) : empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`hover:bg-brand-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Table footer: rows per page, "1–10 of 42", previous / next */
export function Pagination({ pagination, page, limit, onPage, onLimit, sizes = [10, 25, 50] }) {
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
      {onLimit && (
        <div className="flex items-center gap-1">
          Rows per page:
          <Dropdown variant="inline" aria-label="Rows per page" value={String(limit)} onChange={(v) => onLimit(Number(v))} options={sizes.map(String)} />
        </div>
      )}
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Previous page">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Next page">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
