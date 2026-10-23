import { Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { fileSize } from '../../../utils/listing';

/** items: [{ label, file?: { url, fileName, mimeType, sizeBytes }, url? }] — entries without a file or url are skipped */
export default function DocumentsList({ items }) {
  const shown = items.filter((item) => item.file?.url || item.url);
  if (!shown.length) return <p className="text-sm text-gray-400">No documents have been uploaded for this listing.</p>;

  return (
    <ul className="divide-y divide-gray-100">
      {shown.map(({ label, file, url }, i) => {
        const href = file?.url || url;
        const isImage = file?.mimeType?.startsWith('image/');
        const meta = file
          ? [file.mimeType === 'application/pdf' ? 'PDF' : isImage ? 'Image' : null, fileSize(file.sizeBytes)].filter(Boolean).join(' · ')
          : 'External link';
        const Icon = isImage ? ImageIcon : FileText;
        return (
          <li key={`${label}-${i}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="shrink-0 w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{label}</p>
              <p className="text-xs text-gray-500 truncate">{file?.fileName ? `${file.fileName}${meta ? ` · ${meta}` : ''}` : meta}</p>
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white hover:bg-brand-600"
            >
              {file ? <><Download className="w-3.5 h-3.5" /> View</> : <><ExternalLink className="w-3.5 h-3.5" /> Open</>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
