import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, Clock, Paperclip, Users, Trash2, Search } from 'lucide-react';

function getBackendOrigin() {
  // Frontend runs on Vite (5173) while Django runs on 8000 in dev.
  // If you deploy behind one origin, set VITE_BACKEND_ORIGIN and use that.
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

function getWsOrigin() {
  const backend = getBackendOrigin();
  return backend.replace(/^http/, 'ws');
}

export default function CompanyChat() {
  const { user, tokens } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState(() => new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState({ limit: 30, offset: 0, hasMore: true });
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const readMarkRef = useRef({ lastUpToId: null, timer: null });

  const meId = user?.id;
  const isAdminHr = user?.role === 'admin' || user?.role === 'hr';

  const avatarFallback = useMemo(() => {
    const name = user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A2B3C&color=fff`;
  }, [user?.username]);

  // Load members (for presence/optional UI)
  useEffect(() => {
    if (!tokens?.access) return;
    API.get('/chat/company/members/')
      .then((res) => setMembers(res.data.results ?? res.data))
      .catch(() => setMembers([]));
  }, [tokens?.access]);

  // Load history + connect WS
  useEffect(() => {
    if (!tokens?.access) return;

    const load = async () => {
      setLoadingHistory(true);
      try {
        const res = await API.get('/chat/company/messages/', {
          params: { limit: page.limit, offset: 0, q: q || undefined },
        });
        const data = res.data?.results ?? res.data;
        const results = Array.isArray(data) ? data : [];
        // API returns newest-first for pagination; display oldest->newest
        setMessages(results.slice().reverse());
        setPage((p) => ({
          ...p,
          offset: results.length,
          hasMore: Boolean(res.data?.next) || results.length === p.limit,
        }));
      } finally {
        setLoadingHistory(false);
      }
    };

    load();

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'typing') {
        if (data.user_id && data.user_id !== meId) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (data.is_typing) next.set(data.user_id, data.full_name || 'Someone');
            else next.delete(data.user_id);
            return next;
          });
        }
        return;
      }

      if (data.type === 'employee') {
        const payload = data.payload;
        if (payload?.user_id) {
          setMembers((prev) => {
            const next = [...(prev || [])];
            const idx = next.findIndex((m) => m.id === payload.user_id);
            const mapped = {
              id: payload.user_id,
              full_name: payload.full_name,
              profile_picture: payload.profile_picture,
              is_active: payload.is_active,
            };
            if (data.event === 'left') {
              return next.filter((m) => m.id !== payload.user_id);
            }
            if (idx >= 0) next[idx] = { ...next[idx], ...mapped };
            else next.unshift(mapped);
            return next;
          });
        }
        return;
      }

      if (data.type === 'message' && data.payload) {
        setMessages((prev) => [...prev, data.payload]);

        const fromOther = data.payload?.sender?.id && data.payload.sender.id !== meId;
        const isHidden = document.visibilityState !== 'visible';
        if (fromOther && isHidden) {
          setUnreadCount((c) => c + 1);
          if ('Notification' in window) {
            if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
            if (Notification.permission === 'granted') {
              new Notification('New company message', {
                body: `${data.payload.sender.full_name}: ${data.payload.content || 'Attachment'}`,
              });
            }
          }
        }
      }

      if (data.type === 'deleted' && data.payload) {
        setMessages((prev) => prev.map((m) => (m.id === data.payload.id ? { ...m, ...data.payload } : m)));
      }

      if (data.type === 'read' && data.payload) {
        // Fast-path: update read_by_count for messages I sent up to a certain id
        const { user_id, up_to_id } = data.payload;
        if (!user_id || !up_to_id) return;
        if (user_id === meId) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (m?.sender?.id !== meId) return m;
            if (!m?.id || m.id > up_to_id) return m;
            return { ...m, read_by_count: Math.max(m.read_by_count || 0, 1) };
          })
        );
      }
    };

    ws.onclose = () => setSocket(null);
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [tokens?.access, meId, q]);

  // Scroll + reset unread when focused
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setUnreadCount(0);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const typingText = useMemo(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others are typing...`;
  }, [typingUsers]);

  const sendTyping = (isTyping) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
  };

  const onInputChange = (val) => {
    setInput(val);
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'message', message: text }));
    setInput('');
    sendTyping(false);
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const form = new FormData();
    form.append('attachment', file);
    form.append('content', '');

    try {
      // This creates the message and broadcasts it to WS listeners server-side.
      await API.post('/chat/company/messages/', form);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const fetchMore = async () => {
    if (loadingMore || loadingHistory) return;
    if (!page.hasMore) return;
    setLoadingMore(true);
    try {
      const res = await API.get('/chat/company/messages/', {
        params: { limit: page.limit, offset: page.offset, q: q || undefined },
      });
      const results = res.data?.results ?? [];
      // results are newest-first; we are prepending older messages at top:
      const older = results.slice().reverse();
      setMessages((prev) => [...older, ...prev]);
      setPage((p) => ({
        ...p,
        offset: p.offset + results.length,
        hasMore: Boolean(res.data?.next) || results.length === p.limit,
      }));
    } finally {
      setLoadingMore(false);
    }
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollTop < 80) fetchMore();
  };

  const debouncedMarkReadUpTo = (upToId) => {
    if (!upToId) return;
    if (readMarkRef.current.lastUpToId && upToId <= readMarkRef.current.lastUpToId) return;
    readMarkRef.current.lastUpToId = upToId;
    if (readMarkRef.current.timer) clearTimeout(readMarkRef.current.timer);
    readMarkRef.current.timer = setTimeout(() => {
      API.post('/chat/company/messages/mark-read/', { up_to_id: readMarkRef.current.lastUpToId }).catch(() => {});
    }, 600);
  };

  // Mark read when messages change (simple heuristic: mark up to latest message id)
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.id) debouncedMarkReadUpTo(last.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleDelete = async (msg) => {
    if (!msg?.id) return;
    const senderId = msg?.sender?.id;
    const canDelete = isAdminHr || senderId === meId;
    if (!canDelete) return;
    try {
      await API.delete(`/chat/company/messages/${msg.id}/`);
      // WS event will update all clients, but update locally immediately too.
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_deleted: true, content: '' } : m)));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-50 dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-[#0B1120]/50">
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111827] shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Company Chat
              {unreadCount > 0 && (
                <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {unreadCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {typingText || 'Everyone in the company can see this room'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-44 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Users className="w-4 h-4" />
              {members?.length || 0}
            </div>
          </div>
        </div>

        <div ref={scrollerRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingMore && (
            <div className="text-center text-xs text-slate-400">Loading older messages…</div>
          )}
          {loadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-slate-500">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-medium">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const sender = msg.sender || {};
              const isMe = sender.id === meId;
              const prev = messages[i - 1];
              const prevSenderId = prev?.sender?.id;
              const showHeader = i === 0 || prevSenderId !== sender.id;
              const pic = sender.profile_picture
                ? `${getBackendOrigin()}${sender.profile_picture}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.full_name || 'User')}&background=1A2B3C&color=fff`;
              const canDelete = isAdminHr || sender.id === meId;
              const isDeleted = Boolean(msg.is_deleted);

              return (
                <div key={msg.id || i} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && showHeader ? (
                    <img
                      src={pic}
                      alt={sender.full_name || 'User'}
                      className="w-8 h-8 rounded-full shrink-0 object-cover mt-1 bg-slate-200 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showHeader && !isMe && (
                      <span className="text-xs font-bold text-slate-500 mb-1 ml-1">
                        {sender.full_name || sender.username || 'User'}
                      </span>
                    )}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-[14px] ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 shadow-sm rounded-tl-sm'
                      }`}
                    >
                      {isDeleted ? (
                        <span className="opacity-70 italic">This message was deleted</span>
                      ) : msg.content ? (
                        msg.content
                      ) : msg.attachment_url ? (
                        <a
                          className={`${isMe ? 'text-white underline' : 'text-emerald-600 dark:text-emerald-400 underline'}`}
                          href={`${getBackendOrigin()}${msg.attachment_url}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {msg.attachment_name || 'Attachment'}
                        </a>
                      ) : (
                        <span className="opacity-70">—</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      {isMe && !isDeleted && (
                        <span className="text-[10px] text-slate-400">
                          Seen by {msg.read_by_count || 0}
                        </span>
                      )}
                      {canDelete && !isDeleted && (
                        <button
                          type="button"
                          onClick={() => handleDelete(msg)}
                          className="ml-1 inline-flex items-center gap-1 hover:text-rose-500 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <button
              type="button"
              onClick={handlePickFile}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors shrink-0"
              title="Attach a file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onBlur={() => sendTyping(false)}
              placeholder="Message everyone..."
              className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2 text-[11px] text-slate-400">
            You are chatting as <span className="font-bold text-slate-500 dark:text-slate-300">{user?.username || '—'}</span>{' '}
            <img src={avatarFallback} alt="" className="inline-block w-4 h-4 rounded-full ml-1 align-[-2px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

