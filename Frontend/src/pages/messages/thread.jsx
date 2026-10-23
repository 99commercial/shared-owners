import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, ExternalLink, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '../../services/endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { chatHomeFor, chatTime } from '../../utils/chat';
import PartyAvatar from './PartyAvatar';

const mergeMessages = (earlier, latest) => {
  const byId = new Map();
  [...earlier, ...[...(latest || [])].reverse()].forEach((message) => {
    if (message?._id) byId.set(message._id, message);
  });
  return [...byId.values()].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt) || String(a._id).localeCompare(String(b._id)));
};

export default function MessageThreadPage() {
  const { conversationId } = useParams();
  const { role } = useAuth();
  const home = chatHomeFor(role);
  const queryClient = useQueryClient();
  const scroller = useRef(null);
  const stickToBottom = useRef(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [earlier, setEarlier] = useState([]);
  const [hasEarlier, setHasEarlier] = useState(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  const conversationQuery = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => chatApi.get(conversationId).then((r) => r.data.data.conversation),
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', conversationId, 'messages'],
    queryFn: () => chatApi.messages(conversationId).then((r) => r.data.data),
    refetchInterval: 5000,
  });

  const messages = mergeMessages(earlier, messagesQuery.data?.messages);
  const canLoadEarlier = hasEarlier ?? messagesQuery.data?.hasMore;
  const chat = conversationQuery.data;
  const party = chat?.otherParty;

  useEffect(() => {
    setEarlier([]);
    setHasEarlier(null);
    setDraft('');
    stickToBottom.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (!messagesQuery.data) return;
    queryClient.invalidateQueries({ queryKey: ['chat', 'unread'] });
  }, [conversationId, messagesQuery.dataUpdatedAt, queryClient]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, conversationId]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadEarlier = async () => {
    const oldest = messages[0];
    if (!oldest || loadingEarlier) return;
    const el = scroller.current;
    const previousHeight = el?.scrollHeight || 0;
    setLoadingEarlier(true);
    stickToBottom.current = false;
    try {
      const res = await chatApi.messages(conversationId, { before: oldest._id });
      const page = [...(res.data.data.messages || [])].reverse();
      setEarlier((current) => {
        const byId = new Map();
        [...page, ...current].forEach((message) => byId.set(message._id, message));
        return [...byId.values()].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      });
      setHasEarlier(res.data.data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - previousHeight;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load earlier messages');
    } finally {
      setLoadingEarlier(false);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      setDraft('');
      stickToBottom.current = true;
      await chatApi.send(conversationId, text);
      await queryClient.invalidateQueries({ queryKey: ['chat', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'list'] });
    } catch (err) {
      setDraft(text);
      toast.error(err.response?.data?.message || 'Could not send your message');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3 sm:px-5">
          <Link to={home} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Back to messages">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {conversationQuery.isLoading ? (
            <div className="h-10 w-48 rounded-lg bg-gray-100" />
          ) : (
            <>
              <PartyAvatar party={party} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{party?.name || 'Conversation'}</p>
                {party?.companyName && (
                  <p className="flex items-center gap-1 truncate text-xs font-semibold text-brand-600">
                    <Building2 className="w-3 h-3 shrink-0" /> {party.companyName}
                  </p>
                )}
              </div>
              {chat?.property && (
                <Link
                  to={`/properties/${chat.property._id}`}
                  className="hidden min-[420px]:flex items-center gap-2 max-w-[180px] sm:max-w-[240px] xl:max-w-[280px] rounded-xl border border-gray-200 bg-gray-50 py-1 pl-1 pr-2.5 hover:border-brand-300"
                >
                  {chat.property.imageUrl
                    ? <img src={chat.property.imageUrl} alt="" className="h-8 w-10 rounded-lg object-cover" />
                    : <span className="h-8 w-10 rounded-lg bg-brand-50" />}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-ink">{chat.property.name}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-brand-600">View listing <ExternalLink className="w-2.5 h-2.5" /></span>
                  </span>
                </Link>
              )}
            </>
          )}
        </header>

        <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fb]">
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end px-4 py-4 sm:px-8">
            {canLoadEarlier && (
              <div className="mb-4 flex justify-center">
                <button type="button" onClick={loadEarlier} disabled={loadingEarlier} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-sm hover:text-brand-700 disabled:opacity-60">
                  {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}
            {messagesQuery.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>
            ) : messagesQuery.error ? (
              <p className="py-16 text-center text-sm text-red-600">{messagesQuery.error.response?.data?.message || 'Could not load messages'}</p>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-ink">No messages yet</p>
                <p className="mt-1 text-sm text-gray-500">Send a note about {chat?.property?.name || 'this property'}.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const showSender = !message.mine && previous?.sender?._id !== message.sender?._id;
                  return (
                    <div key={message._id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[min(85%,36rem)] ${message.mine ? '' : 'flex gap-2'}`}>
                        {!message.mine && (
                          <span className="mt-auto w-8 shrink-0">
                            {showSender && <PartyAvatar party={message.sender} size="sm" />}
                          </span>
                        )}
                        <div>
                          {showSender && (
                            <p className="mb-1 px-1 text-[11px] font-semibold text-gray-500">
                              {message.sender?.name}
                              {message.sender?.companyName ? ` · ${message.sender.companyName}` : ''}
                            </p>
                          )}
                          <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                            message.mine
                              ? 'rounded-br-md bg-brand-500 text-white'
                              : 'rounded-bl-md border border-gray-200/80 bg-white text-ink'
                          }`}
                          >
                            {message.text}
                            <time className={`mt-1 block text-right text-[10px] ${message.mine ? 'text-white/70' : 'text-gray-400'}`}>
                              {chatTime(message.sentAt)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="shrink-0 border-t border-gray-100 bg-white px-3 py-3 sm:px-5"
        >
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-1.5 pl-4 pr-1.5 focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder={`Message ${party?.name || ''}`.trim()}
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
    </section>
  );
}
