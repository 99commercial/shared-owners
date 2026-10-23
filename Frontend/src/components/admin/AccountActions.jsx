import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, ExternalLink, Power, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import useOpenAccount from '../../hooks/useOpenAccount';
import { accountName } from '../../utils/format';

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

/**
 * View / open account in a new tab / activate-deactivate / delete for any
 * account. Each handler is optional; pass the API call that performs it.
 * `invalidate` lists query keys to refresh after a change.
 */
export default function AccountActions({
  account,
  viewTo,
  compact = false,
  onImpersonate,
  onSetActive,
  onDelete,
  deleteMessage,
  deactivateMessage,
  askDeleteReason = false,
  invalidate = [['admin']],
  onDeleted,
}) {
  const queryClient = useQueryClient();
  const openAccount = useOpenAccount();
  const [confirm, setConfirm] = useState(null);
  const name = accountName(account);
  const refresh = () => invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  const statusMutation = useMutation({
    mutationFn: (isActive) => onSetActive(isActive),
    onSuccess: (_, isActive) => {
      toast.success(isActive ? `${name} reactivated` : `${name} deactivated and signed out`);
      setConfirm(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update the account')),
  });

  const deleteMutation = useMutation({
    mutationFn: (reason) => onDelete(reason),
    onSuccess: () => {
      toast.success(`${name} deleted`);
      setConfirm(null);
      refresh();
      onDeleted?.();
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not delete the account')),
  });

  const active = account?.isActive !== false;
  const iconButton = 'p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const fullButton = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className={`flex items-center ${compact ? 'justify-end gap-0.5' : 'flex-wrap gap-2'}`} onClick={(e) => e.stopPropagation()}>
      {viewTo && (compact ? (
        <Link to={viewTo} title="View details" className={`${iconButton} text-gray-500 hover:bg-brand-50 hover:text-brand-700`}>
          <Eye className="w-4 h-4" />
        </Link>
      ) : (
        <Link to={viewTo} className={`${fullButton} border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-700`}>
          <Eye className="w-4 h-4" /> View details
        </Link>
      ))}

      {onImpersonate && (
        <button
          type="button"
          disabled={!active}
          onClick={() => openAccount(onImpersonate, name)}
          title={active ? 'Open this account in a new tab' : 'Reactivate the account to open it'}
          className={compact
            ? `${iconButton} text-gray-500 hover:bg-violet-50 hover:text-violet-700`
            : `${fullButton} border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100`}
        >
          <ExternalLink className="w-4 h-4" />
          {!compact && 'Open account'}
        </button>
      )}

      {onSetActive && (
        <button
          type="button"
          disabled={statusMutation.isPending}
          onClick={() => (active ? setConfirm('deactivate') : statusMutation.mutate(true))}
          title={active ? 'Deactivate' : 'Reactivate'}
          className={compact
            ? `${iconButton} ${active ? 'text-gray-500 hover:bg-amber-50 hover:text-amber-700' : 'text-green-600 hover:bg-green-50'}`
            : `${fullButton} ${active ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
        >
          <Power className="w-4 h-4" />
          {!compact && (active ? 'Deactivate' : 'Reactivate')}
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => setConfirm('delete')}
          title="Delete"
          className={compact
            ? `${iconButton} text-gray-500 hover:bg-red-50 hover:text-red-600`
            : `${fullButton} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          <Trash2 className="w-4 h-4" />
          {!compact && 'Delete'}
        </button>
      )}

      {confirm === 'deactivate' && (
        <ConfirmDialog
          title={`Deactivate ${name}?`}
          message={deactivateMessage || 'They are signed out everywhere and cannot sign in until the account is reactivated. Nothing is deleted.'}
          confirmLabel="Deactivate"
          tone="warning"
          pending={statusMutation.isPending}
          onConfirm={() => statusMutation.mutate(false)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title={`Delete ${name}?`}
          message={deleteMessage || 'This permanently removes the account and everything it owns. It cannot be undone.'}
          confirmLabel="Delete permanently"
          reasonLabel={askDeleteReason ? 'Reason' : undefined}
          pending={deleteMutation.isPending}
          onConfirm={(reason) => deleteMutation.mutate(reason)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
