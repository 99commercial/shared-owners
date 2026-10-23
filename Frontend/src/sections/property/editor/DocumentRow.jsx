import { Trash2, FileText, ExternalLink } from 'lucide-react';
import { TextInput } from '../../../components/FormFields';

/** One linked document (URL + display name); value comes from formUtils.toDocRow */
export default function DocumentRow({ label, required, doc, onChange, onRemove, readOnly }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-brand-700 flex items-center gap-1">
            Open <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {onRemove && !readOnly && (
          <button type="button" onClick={onRemove} className={`${doc.url ? '' : 'ml-auto'} p-1 text-gray-400 hover:text-red-600`}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-2">
          <TextInput value={doc.url} onChange={(v) => onChange({ ...doc, url: v })} placeholder="https://… document URL (PDF, JPEG or PNG)" />
        </div>
        <TextInput value={doc.fileName} onChange={(v) => onChange({ ...doc, fileName: v })} placeholder="Display name" />
      </div>
    </div>
  );
}
