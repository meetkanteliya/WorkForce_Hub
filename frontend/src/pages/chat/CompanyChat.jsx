
import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, Clock, Paperclip, Users, Trash2 } from 'lucide-react';

function getBackendOrigin() {
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
  const socketRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(() => new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(() => new Set());

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const meId = user?.id;

  const avatarFallback = useMemo(() => {
    const name = user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A2B3C&color=fff`;
  }, [user?.username]);

  // Load members
  useEffect(() => {
    if (!tokens?.access) return;

    API.get('/chat/company/members/')
      .then((res) => setMembers(res.data.results ?? res.data))
      .catch(() => setMembers([]));

  }, [tokens?.access]);

  // Load history + WebSocket
  useEffect(() => {

    if (!tokens?.access) return;

    const loadHistory = async () => {

      setLoadingHistory(true);

      try {
        const res = await API.get('/chat/company/messages/');
        const data = res.data?.results ?? res.data;
        const results = Array.isArray(data) ? data : [];
        setMessages(results.slice().reverse());
      } finally {
        setLoadingHistory(false);
      }

    };

    loadHistory();

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;

    const connectWebSocket = () => {

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {

        const data = JSON.parse(event.data);

        if (data.type === "company_chat_message" && data.payload) {

          setMessages((prev) => {
            if (prev.some((m) => m.id === data.payload.id)) {
              return prev;
            }
            return [...prev, data.payload];
          });

          const fromOther = data.payload?.sender?.id !== meId;
          const isHidden = document.visibilityState !== 'visible';

          if (fromOther && isHidden) {
            setUnreadCount((c) => c + 1);
          }

        }

        if (data.type === "company_typing") {

          if (data.user_id && data.user_id !== meId) {

            setTypingUsers((prev) => {

              const next = new Map(prev);

              if (data.is_typing) {
                next.set(data.user_id, data.full_name || 'Someone');
              } else {
                next.delete(data.user_id);
              }

              return next;

            });

          }

        }

        if (data.type === "company_message_deleted" && data.payload?.id) {
          setMessages((prev) => prev.map((m) => (m.id === data.payload.id ? data.payload : m)));
        }

      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {

        reconnectAttemptsRef.current += 1;

        const delay = Math.min(5000, reconnectAttemptsRef.current * 1000);

        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);

      };

    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) socketRef.current.close();
    };

  }, [tokens?.access, meId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendTyping = (isTyping) => {

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'typing',
      is_typing: isTyping
    }));

  };

  const onInputChange = (value) => {

    setInput(value);

    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);

  };

  const handleSend = (e) => {

    e.preventDefault();

    const text = input.trim();

    const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'message',
      message: text
    }));

    setInput('');
    sendTyping(false);

  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    if (!tokens?.access) return;

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("attachment", file);
      form.append("content", input.trim());
      await API.post("/chat/company/messages/", form);
      setInput("");
      sendTyping(false);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canDelete = (msg) => {
    const senderId = msg?.sender?.id;
    return senderId && (senderId === meId || user?.role === 'admin' || user?.role === 'hr');
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg?.id) return;
    if (!canDelete(msg)) return;

    const id = msg.id;
    const snapshot = messages;

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_deleted: true } : m)));

    try {
      await API.delete(`/chat/company/messages/${id}/delete/`);
    } catch {
      setMessages(snapshot);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (

    <div className="flex h-[calc(100vh-120px)] bg-slate-50 rounded-2xl border shadow-sm overflow-hidden">

      <div className="flex-1 flex flex-col">

        <div className="h-16 px-6 border-b flex items-center justify-between bg-white">

          <h3 className="text-base font-bold flex items-center gap-2">

            <MessageSquare className="w-5 h-5 text-emerald-500" />

            Company Chat

            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {unreadCount}
              </span>
            )}

          </h3>

          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4" />
            {members?.length || 0}
          </div>

        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {loadingHistory ? (

            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>

          ) : messages.length === 0 ? (

            <div className="text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3" />
              No messages yet
            </div>

          ) : (

            messages.map((msg, i) => {

              const sender = msg.sender || {};
              const isMe = sender.id === meId;
              const isDeleted = !!msg.is_deleted;
              const deleting = deletingIds.has(msg.id);

              const pic = sender.profile_picture
                ? `${getBackendOrigin()}${sender.profile_picture}`
                : avatarFallback;

              return (

                <div key={msg.id || i} className={`flex gap-3 ${isMe ? 'justify-end' : ''}`}>

                  {!isMe && (
                    <img src={pic} className="w-8 h-8 rounded-full object-cover" />
                  )}

                  <div className={`px-4 py-2 rounded-xl text-sm relative ${isMe ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>

                    <div className="pr-10">
                      {isDeleted ? (
                        <span className="italic opacity-80">Message deleted</span>
                      ) : (
                        msg.content
                      )}
                      {!!msg.attachment_url && (
                        <div className="mt-2">
                          <a
                            className={`${isMe ? 'text-white underline' : 'text-emerald-700 underline'}`}
                            href={`${getBackendOrigin()}${msg.attachment_url}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {msg.attachment_name || 'Attachment'}
                          </a>
                        </div>
                      )}
                    </div>

                    {canDelete(msg) && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        disabled={deleting}
                        className={`absolute top-2 right-2 p-1 rounded ${isMe ? 'hover:bg-white/10' : 'hover:bg-slate-50'} disabled:opacity-50`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>

                  </div>

                </div>

              );

            })

          )}

          <div ref={messagesEndRef} />

        </div>

        {typingUsers.size > 0 && (
          <div className="px-6 py-2 text-xs text-slate-500 bg-white border-t">
            {Array.from(typingUsers.values()).slice(0, 3).join(', ')} typing...
          </div>
        )}

        <div className="p-4 border-t flex gap-2">

          <button
            type="button"
            onClick={handlePickFile}
            disabled={isUploading}
            className="p-3 rounded-xl border"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Message everyone..."
            className="flex-1 border rounded-xl px-4 py-2"
          />

          <button
            onClick={handleSend}
            disabled={isUploading}
            className="p-3 bg-emerald-600 text-white rounded-xl disabled:opacity-60"
          >
            <Send className="w-5 h-5" />
          </button>

        </div>

      </div>

    </div>

  );

}

