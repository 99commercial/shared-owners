import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Archive, CheckCheck, Globe, Inbox, Loader2, Mail, MailOpen, Phone, Reply, Save, Search, Trash2, User,
} from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import PageHero from '../../../components/PageHero';
import { Pagination } from '../../../components/admin/DataTable';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import Dropdown from '../../../components/Dropdown';
import { CONTACT_STATUS_OPTIONS, CONTACT_STATUS_STYLES } from '../../../data/adminOptions';
import { accountName, formatDateTime, timeAgo } from '../../../utils/format';

function NoteEditor({ query, pending, onSave }) {
  const [note, setNote] = useState(query.adminNote || '');
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Internal note</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000} className="dash-input resize-y" placeholder="Only admins can see this — e.g. who followed up and what was agreed" />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          {query.handledBy ? `Last handled by ${accountName(query.handledBy)} · ${timeAgo(query.handledAt)}` : 'Not handled yet'}
        </span>
        <button type="button" disabled={note === (query.adminNote || '') || pending} onClick={() => onSave(note)} className="btn-brand-outline disabled:opacity-40">
          <Save className="w-4 h-4" /> Save note
        </button>
      </div>
    </div>
  );
}

function QueryDetail({ id, onClosed }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: q, isLoading, error } = useQuery({
    queryKey: ['admin', 'contact-query', id],
    queryFn: () => adminApi.getContactQuery(id).then((r) => r.data.data.query),
  });

  // Opening a new query marks it read on the server, so the inbox counts change
  const loadedId = q?._id;
  useEffect(() => {
    if (!loadedId) return;
    queryClient.invalidateQueries({ queryKey: ['admin', 'contact-queries'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  }, [loadedId, queryClient]);

  const update = useMutation({
    mutationFn: (body) => adminApi.updateContactQuery(id, body),
    onSuccess: (res, body) => {
      queryClient.setQueryData(['admin', 'contact-query', id], res.data.data.query);
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact-queries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(body.adminNote !== undefined ? 'Note saved' : 'Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update the query'),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteContactQuery(id),
    onSuccess: () => {
      toast.success('Query deleted');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onClosed();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete the query'),
  });

  if (isLoading) return <div className="py-24 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /></div>;
  if (error) return <p className="p-10 text-center text-sm text-red-600">{error.response?.data?.message || 'Could not load this query'}</p>;

  const mailto = `mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.subject}`)}&body=${encodeURIComponent(`\n\n---\nOn ${formatDateTime(q.createdAt)}, ${q.name} wrote:\n${q.message}`)}`;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink break-words">{q.subject}</h2>
            <p className="text-xs text-gray-500 mt-1">Received {formatDateTime(q.createdAt)}</p>
          </div>
          <Dropdown
            aria-label="Status"
            value={q.status}
            onChange={(status) => update.mutate({ status })}
            options={CONTACT_STATUS_OPTIONS}
            className="w-36"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-2 mt-4 text-sm">
          <div className="flex items-center gap-2 min-w-0"><User className="w-4 h-4 text-brand-600 shrink-0" /><span className="truncate">{q.name}</span></div>
          <a href={`mailto:${q.email}`} className="flex items-center gap-2 min-w-0 text-brand-700 hover:underline"><Mail className="w-4 h-4 shrink-0" /><span className="truncate">{q.email}</span></a>
          {q.phone ? (
            <a href={`tel:${q.phone}`} className="flex items-center gap-2 min-w-0 text-brand-700 hover:underline"><Phone className="w-4 h-4 shrink-0" /><span className="truncate">{q.phone}</span></a>
          ) : <span className="flex items-center gap-2 text-gray-400"><Phone className="w-4 h-4" />No phone</span>}
        </div>
      </div>

      <div className="px-6 py-5 flex-1 overflow-y-auto space-y-6">
        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{q.message}</p>

        <div className="flex flex-wrap gap-2">
          <a href={mailto} onClick={() => q.status !== 'replied' && update.mutate({ status: 'replied' })} className="btn-brand">
            <Reply className="w-4 h-4" /> Reply by email
          </a>
          {q.status !== 'replied' && (
            <button type="button" onClick={() => update.mutate({ status: 'replied' })} className="btn-brand-outline"><CheckCheck className="w-4 h-4" /> Mark replied</button>
          )}
          {q.status !== 'archived' && (
            <button type="button" onClick={() => update.mutate({ status: 'archived' })} className="btn-brand-outline"><Archive className="w-4 h-4" /> Archive</button>
          )}
          {q.status !== 'new' && (
            <button type="button" onClick={() => update.mutate({ status: 'new' })} className="btn-brand-outline"><Mail className="w-4 h-4" /> Mark unread</button>
          )}
        </div>

        <NoteEditor key={q._id} query={q} pending={update.isPending} onSave={(adminNote) => update.mutate({ adminNote })} />

        <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-4">
          {q.ip && <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Sent from <span className="font-mono">{q.ip}</span></div>}
          {q.userAgent && <div className="truncate" title={q.userAgent}>{q.userAgent}</div>}
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
        <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline">
          <Trash2 className="w-3.5 h-3.5" /> Delete query
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this query?"
          message={`The message from ${q.name} is deleted permanently.`}
          pending={remove.isPending}
          onConfirm={() => remove.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function AdminQueriesPage() {
  const [params, setParams] = useSearchParams();
  const list = useListParams({ filters: ['status'], defaultLimit: 25 });
  const openId = params.get('open');
  const setOpen = (id) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('open', id);
      else next.delete('open');
      return next;
    }, { replace: true });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'contact-queries', list.query],
    queryFn: () => adminApi.getContactQueries(list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const items = data?.items || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Content"
        title="Contact queries"
        subtitle="Messages sent through the Contact Us page"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Contact queries' }]}
        tabs={[
          { key: 'all', label: `All (${total})` },
          ...CONTACT_STATUS_OPTIONS.map((s) => ({ key: s.value, label: `${s.label} (${counts[s.value] || 0})` })),
        ]}
        activeTab={list.filters.status || 'all'}
        onTabChange={(key) => list.setFilter('status', key === 'all' ? '' : key)}
      />

      <div className="dash-card overflow-hidden grid lg:grid-cols-5 min-h-[640px]">
        <div className={`lg:col-span-2 border-r border-gray-100 flex flex-col ${openId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-100">
            <div className="relative has-icon">
              <Search className="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={list.search} onChange={(e) => list.setSearch(e.target.value)} placeholder="Search name, email, subject or message…" className="dash-input" />
            </div>
          </div>
          <ul className={`flex-1 overflow-y-auto divide-y divide-gray-100 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
            {isLoading ? (
              <li className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /></li>
            ) : items.length === 0 ? (
              <li className="py-16 text-center text-sm text-gray-400"><Inbox className="w-9 h-9 text-gray-300 mx-auto mb-2" />No messages here</li>
            ) : items.map((q) => {
              const unread = q.status === 'new';
              return (
                <li key={q._id}>
                  <button
                    type="button"
                    onClick={() => setOpen(q._id)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 ${openId === q._id ? 'bg-brand-50/70 border-l-4 border-brand-500 pl-3' : ''}`}
                  >
                    {unread ? <Mail className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" /> : <MailOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${unread ? 'font-bold text-ink' : 'font-medium text-gray-700'}`}>{q.name}</span>
                        <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(q.createdAt)}</span>
                      </div>
                      <div className={`text-sm truncate ${unread ? 'font-semibold text-ink' : 'text-gray-600'}`}>{q.subject}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 truncate flex-1">{q.message}</span>
                        {!unread && <span className={`badge text-[10px] ${CONTACT_STATUS_STYLES[q.status]}`}>{q.status}</span>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} />
        </div>

        <div className={`lg:col-span-3 ${openId ? 'block' : 'hidden lg:block'}`}>
          {openId ? (
            <div className="h-full flex flex-col">
              <button type="button" onClick={() => setOpen(null)} className="lg:hidden px-6 pt-4 text-xs font-semibold text-brand-700 text-left">← Back to inbox</button>
              <QueryDetail key={openId} id={openId} onClosed={() => setOpen(null)} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 text-gray-400">
              <Inbox className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm">Select a message to read it.</p>
              <p className="text-xs mt-1">Opening a new message marks it as read.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
