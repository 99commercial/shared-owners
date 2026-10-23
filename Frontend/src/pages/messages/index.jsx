import { Link, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, MessageCircle } from 'lucide-react';
import { chatApi } from '../../services/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { chatHomeFor, chatTime } from '../../utils/chat';
import PartyAvatar from './PartyAvatar';

function ConversationList({ activeId }) {
  const { role } = useAuth();
  const home = chatHomeFor(role);
  const { data, isLoading, error } = useQuery({
    queryKey: ['chat', 'list'],
    queryFn: () => chatApi.list({ limit: 50 }).then((r) => r.data.data),
    refetchInterval: 15000,
  });
  const items = data?.items || [];
  const unread = items.reduce((sum, chat) => sum + (chat.unreadCount > 0 ? 1 : 0), 0);

  return (
    <>
      <header className="shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4">
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold text-ink">Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {isLoading ? 'Loading conversations' : unread ? `${unread} unread` : 'Property conversations'}
          </p>
        </div>
        {!isLoading && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">{items.length}</span>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-red-600">
          {error.response?.data?.message || 'Could not load your messages'}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MessageCircle className="w-6 h-6" />
          </span>
          <p className="font-bold text-ink">No conversations yet</p>
          <p className="mt-1 max-w-xs text-sm text-gray-500">Open a property and choose Message to start a conversation with the seller.</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {items.map((chat) => {
            const party = chat.otherParty || {};
            const hasUnread = chat.unreadCount > 0;
            const active = chat._id === activeId;
            return (
              <li key={chat._id}>
                <Link
                  to={`${home}/${chat._id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/70 ${
                    active ? 'bg-brand-50' : hasUnread ? 'bg-brand-50/30' : ''
                  }`}
                >
                  <span className="relative shrink-0">
                    <PartyAvatar party={party} />
                    {hasUnread && !active && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold text-ink">{party.name}</span>
                      <time className={`shrink-0 text-[11px] ${hasUnread ? 'font-bold text-brand-600' : 'text-gray-400'}`}>
                        {chatTime(chat.lastMessage?.sentAt || chat.updatedAt)}
                      </time>
                    </span>
                    {party.companyName && (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-brand-600">
                        <Building2 className="w-3 h-3 shrink-0" /> {party.companyName}
                      </span>
                    )}
                    <span className="mt-0.5 block truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">{chat.property?.name}</span>
                    <span className={`block truncate text-sm ${hasUnread ? 'font-semibold text-ink' : 'text-gray-500'}`}>
                      {chat.lastMessage ? `${chat.lastMessage.mine ? 'You: ' : ''}${chat.lastMessage.text}` : 'No messages yet'}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function MessagesHome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center bg-[#f4f7fb]">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
        <MessageCircle className="w-6 h-6" />
      </span>
      <p className="font-bold text-ink">Select a conversation</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">Choose someone from the list to read and reply.</p>
    </div>
  );
}

/** Full-width inbox. The list and the open chat sit side by side from the large breakpoint up. */
export default function MessagesLayout() {
  const { conversationId } = useParams();
  const open = Boolean(conversationId);

  return (
    <div className="h-[calc(100dvh-4rem)] p-3 sm:p-4 lg:p-5">
      <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <aside className={`${open ? 'hidden lg:flex' : 'flex'} h-full w-full lg:w-[320px] xl:w-[360px] shrink-0 flex-col lg:border-r lg:border-gray-100`}>
          <ConversationList activeId={conversationId} />
        </aside>
        <div className={`${open ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
