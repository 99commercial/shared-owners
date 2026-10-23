import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../Modal';

/**
 * Confirmation for destructive or account-wide actions. With `reasonLabel`, a
 * reason is collected and passed to onConfirm (required when `reasonRequired`).
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  reasonLabel,
  reasonRequired = false,
  pending = false,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const blocked = pending || (reasonRequired && !reason.trim());
  const confirmClass = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-brand-600 hover:bg-brand-700 text-white';

  return (
    <Modal title={title} onClose={pending ? () => {} : onClose}>
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">{message}</div>
      </div>

      {reasonLabel && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {reasonLabel}{reasonRequired ? ' *' : ' (optional)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="dash-input resize-none"
            placeholder="This is recorded with the action"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={onClose} disabled={pending} className="btn-brand-outline">Cancel</button>
        <button
          type="button"
          onClick={() => onConfirm(reason.trim())}
          disabled={blocked}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${confirmClass}`}
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
