
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import API from '../../api/axios';
import { selectUser, selectTokens } from '../../store/slices/authSlice';
import {
  fetchMessages,
  fetchMembers,
  addMessage,
  updateMessage,
  updateMessageReactions,
  optimisticDelete,
  setTypingUser,
  incrementUnread,
  selectMessages,
  selectLoadingHistory,
  selectMembers,
  selectTypingUsers,
  selectUnreadCount,
} from '../../store/slices/chatSlice';
import { Send, MessageSquare, Clock, Paperclip, Users, Trash2, Shield, Hash, X, FileText, Download, MoreHorizontal, Copy, Reply } from 'lucide-react';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

function getWsOrigin() {
  const backend = getBackendOrigin();
  return backend.replace(/^http/, 'ws');
}

const CHANNEL_KEY = 'company';

// Format message date headers
function getDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Check if attachment is an image
function isImageFile(url) {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

export default function CompanyChat() {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const tokens = useSelector(selectTokens);
  const messages = useSelector(selectMessages(CHANNEL_KEY));
  const loadingHistory = useSelector(selectLoadingHistory(CHANNEL_KEY));
  const members = useSelector(selectMembers);
  const typingUsers = useSelector(selectTypingUsers(CHANNEL_KEY));
  const unreadCount = useSelector(selectUnreadCount(CHANNEL_KEY));

  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [contextMenuId, setContextMenuId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const inputRef = useRef(null);
  const showLegacyReactionBar = false;
  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const meId = user?.id;

  const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`;

  // Load members
  useEffect(() => {
    if (!tokens?.access) return;
    dispatch(fetchMembers());
  }, [tokens?.access, dispatch]);

  // Load history + WebSocket
  useEffect(() => {
    if (!tokens?.access) return;

    dispatch(fetchMessages({ channel: 'company' }));

    const wsUrl = `${getWsOrigin()}/ws/company-chat/?token=${tokens.access}`;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "company_chat_message" && data.payload) {
          dispatch(addMessage({ key: CHANNEL_KEY, message: data.payload }));

          const fromOther = data.payload?.sender?.id !== meId;
          const isHidden = document.visibilityState !== 'visible';
          if (fromOther && isHidden) {
            dispatch(incrementUnread({ key: CHANNEL_KEY }));
          }
        }

        if (data.type === "company_typing") {
          if (data.user_id && data.user_id !== meId) {
            dispatch(setTypingUser({
              key: CHANNEL_KEY,
              userId: data.user_id,
              name: data.full_name || 'Someone',
              isTyping: data.is_typing,
            }));
          }
        }

        if (data.type === "company_message_deleted" && data.payload?.id) {
          dispatch(updateMessage({ key: CHANNEL_KEY, message: data.payload }));
        }

        if (data.type === "company_reaction_update" && data.message_id) {
          dispatch(updateMessageReactions({
            key: CHANNEL_KEY,
            messageId: data.message_id,
            reactions: data.reactions || {},
          }));
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
  }, [tokens?.access, meId, dispatch]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
  };




  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    const socket = socketRef.current;
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'message', message: text }));
    setInput('');
    sendTyping(false);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file) => {
    if (!file || !tokens?.access) return;
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
    if (!msg?.id || !canDelete(msg)) return;
    const id = msg.id;

    // Optimistic update — mark deleted and include who deleted it
    dispatch(optimisticDelete({
      key: CHANNEL_KEY,
      messageId: id,
      deletedBy: { id: meId, username: user?.username, role: user?.role },
    }));

    try {
      await API.delete(`/chat/company/messages/${id}/`);
    } catch {
      dispatch(updateMessage({
        key: CHANNEL_KEY,
        message: { ...msg, is_deleted: false },
      }));
    }
    setContextMenuId(null);
    setActiveReactionMsgId(null);
    // Clear reply if the deleted message was being replied to
    if (replyTo?.id === id) setReplyTo(null);
  };

  // Copy message text (blocked for deleted messages)
  const handleCopy = (msg) => {
    if (msg?.is_deleted) return;
    if (msg?.content) navigator.clipboard.writeText(msg.content);
    setContextMenuId(null);
  };

  // Reply to message (blocked for deleted messages)
  const handleReply = (msg) => {
    if (msg?.is_deleted) return;
    setReplyTo(msg);
    setContextMenuId(null);
    inputRef.current?.focus();
  };

  // Add emoji reaction — send via WebSocket for realtime sync
  const handleReaction = (msgId, emoji) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'reaction', message_id: msgId, emoji }));
    setActiveReactionMsgId(null);
    setContextMenuId(null);
  };

  // @mention input handling
  const onInputChange = (value) => {
    setInput(value);
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ')) {
      const query = textBeforeCursor.substring(lastAt + 1);
      if (!query.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(query.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
  };

  const insertMention = (member) => {
    const val = input;
    const lastAt = val.lastIndexOf('@');
    const name = member.username || member.full_name || 'user';
    const newText = val.substring(0, lastAt) + `@${name} ` + val.substring(lastAt + 1 + mentionFilter.length);
    setInput(newText);
    setShowMentions(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredMentions = (members || []).filter(m =>
    m.id !== meId && (m.username?.toLowerCase().includes(mentionFilter) || m.full_name?.toLowerCase().includes(mentionFilter))
  ).slice(0, 5);

  // Render content with @mention highlights
  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-bold text-emerald-300 dark:text-emerald-400 bg-emerald-500/10 px-0.5 rounded">{part}</span>;
      }
      return part;
    });
  };

  const typingList = Object.values(typingUsers);

  // Click outside to close reaction popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeReactionMsgId && !e.target.closest('[data-msg-actions]')) {
        setActiveReactionMsgId(null);
        setContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeReactionMsgId]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = '';
    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.timestamp);
      if (dateLabel !== lastDate) {
        groups.push({ type: 'date', label: dateLabel });
        lastDate = dateLabel;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }, [messages]);

  // Online member count
  const onlineCount = members?.length || 0;

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A] min-w-0">

        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#1E293B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Hash className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Company Chat
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {onlineCount} member{onlineCount !== 1 ? 's' : ''} • Everyone can see this
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${showMembers
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{onlineCount}</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
          {loadingHistory ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-emerald-500/60" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No messages yet</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                Start the conversation! Send a message to your team.
              </p>
            </div>
          ) : (
            groupedMessages.map((item, i) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${i}`} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2">
                      {item.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                );
              }

              const msg = item.data;
              const sender = msg.sender || {};
              const isMe = sender.id === meId;
              const isDeleted = !!msg.is_deleted;
              // Only the admin who deleted the message sees "deleted by admin"
              const iAmTheDeleter = isDeleted && msg.deleted_by && msg.deleted_by.id === meId && msg.deleted_by.id !== sender.id;
              const isReactionMenuOpen = activeReactionMsgId === msg.id;
              const reactionEntries = Object.entries(msg.reactions || {}).filter(([, users]) => Array.isArray(users) && users.length > 0);
              const hasReactions = reactionEntries.length > 0;

              const pic = sender.profile_picture
                ? `${getBackendOrigin()}${sender.profile_picture}`
                : avatarUrl(sender.full_name || sender.username);

              const hasAttachment = !!msg.attachment_url;
              const attachmentIsImage = isImageFile(msg.attachment_url);
              const attachmentFullUrl = msg.attachment_url ? `${getBackendOrigin()}${msg.attachment_url}` : '';

              return (
                <div
                  key={msg.id || i}
                  className={`flex gap-2.5 group relative ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {!isMe && (
                    <img
                      src={pic}
                      alt={sender.username}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900 shadow-sm"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] relative ${isMe ? 'items-end' : 'items-start'}`}
                    data-msg-actions
                    onMouseEnter={() => {
                      if (!isDeleted) setActiveReactionMsgId(msg.id);
                    }}
                    onMouseLeave={() => {
                      if (contextMenuId !== msg.id) {
                        setActiveReactionMsgId((current) => (current === msg.id ? null : current));
                      }
                    }}
                    onClick={(e) => {
                      if (isDeleted || e.target.closest('a') || e.target.closest('button')) return;
                      setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                      setContextMenuId(null);
                    }}
                  >
                    {/* Sender Name (only for others) */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {sender.full_name || sender.username || 'Unknown'}
                        </span>
                        {(sender.role === 'admin' || sender.role === 'hr') && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            <Shield className="w-2.5 h-2.5" />
                            {sender.role?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`relative px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed transition-all cursor-pointer ${
                        isDeleted
                          ? 'bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700' + (isMe ? ' rounded-tr-md' : ' rounded-tl-md')
                          : isMe
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-md shadow-md shadow-emerald-500/15'
                            : 'bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-md shadow-sm'
                      }${!isDeleted
                        ? isMe
                          ? ' hover:ring-2 hover:ring-emerald-300/50 dark:hover:ring-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/25'
                          : ' hover:ring-2 hover:ring-slate-300/60 dark:hover:ring-slate-500/40 hover:shadow-lg'
                        : ''
                      }`}
                    >
                      {!isDeleted && isReactionMenuOpen && (
                        <div
                          className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} z-20`}
                          data-msg-actions
                        >
                          <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-2 py-1 shadow-xl backdrop-blur-sm">
                            {QUICK_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-transform hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-700"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                            <div className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {contextMenuId === msg.id && (
                                <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50`} data-msg-actions>
                                  <button onClick={(e) => { e.stopPropagation(); handleCopy(msg); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <Reply className="w-3.5 h-3.5" /> Reply
                                  </button>
                                  {canDelete(msg) && (
                                    <>
                                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5" />
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg); setContextMenuId(null); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reply Quote */}
                      {msg.replyTo && (
                        <div className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-[11px] ${isMe ? 'bg-white/10 border-white/40' : 'bg-slate-50 dark:bg-slate-800 border-emerald-400'}`}>
                          <span className="font-bold">{msg.replyTo.sender?.username}</span>
                          <p className="opacity-70 truncate">{msg.replyTo.content}</p>
                        </div>
                      )}

                      {/* Message Content */}
                      {isDeleted ? (
                        <span className={`italic text-[12px] flex items-center gap-2 select-none py-0.5 ${
                          iAmTheDeleter
                            ? 'text-amber-500/70 dark:text-amber-400/60'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          <span className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                            iAmTheDeleter
                              ? 'bg-amber-100 dark:bg-amber-500/15'
                              : 'bg-slate-200/80 dark:bg-slate-700/80'
                          }`}>
                            {iAmTheDeleter
                              ? <Shield className="w-3 h-3 text-amber-500/70 dark:text-amber-400/60" />
                              : <Trash2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            }
                          </span>
                          {iAmTheDeleter
                            ? 'This message was deleted by admin'
                            : 'This message was deleted'
                          }
                        </span>
                      ) : (
                        <>
                          {msg.content && <p className="whitespace-pre-wrap break-words">{renderContent(msg.content)}</p>}

                          {/* Attachment */}
                          {hasAttachment && (
                            <div className="mt-2">
                              {attachmentIsImage ? (
                                <div className="cursor-pointer rounded-lg overflow-hidden max-w-[280px] border border-black/5" onClick={() => setPreviewImage(attachmentFullUrl)}>
                                  <img src={attachmentFullUrl} alt={msg.attachment_name || 'Image'} className="w-full h-auto max-h-[200px] object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                                </div>
                              ) : (
                                <a href={attachmentFullUrl} target="_blank" rel="noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                                    <FileText className={`w-4 h-4 ${isMe ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${isMe ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{msg.attachment_name || 'Attachment'}</p>
                                    <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>Click to download</p>
                                  </div>
                                  <Download className={`w-3.5 h-3.5 ${isMe ? 'text-white/60' : 'text-slate-400'}`} />
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Time */}
                      <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/50 justify-end' : 'text-slate-400 dark:text-slate-600'}`}>
                        <Clock className="w-2.5 h-2.5" />
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>

                    {hasReactions && (
                      <div className={`relative mt-1 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex flex-wrap gap-1">
                          {reactionEntries.map(([emoji, users]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] shadow-sm transition-all ${users.includes(meId)
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{users.length}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Click Action Bar (Emoji + 3 dots) ─── */}
                  {showLegacyReactionBar && !isDeleted && isReactionMenuOpen && (
                    <div className={`flex items-center self-center gap-0.5 ${isMe ? 'order-first' : ''}`} data-msg-actions>
                      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-1 py-0.5">
                        {/* Quick Emoji Reactions */}
                        {QUICK_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-sm hover:scale-125"
                            title={emoji}>
                            {emoji}
                          </button>
                        ))}

                        {/* Divider */}
                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                        {/* 3-dot Menu */}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === msg.id ? null : msg.id); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Context Menu Dropdown */}
                          {contextMenuId === msg.id && (
                            <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50`} data-msg-actions>
                              <button onClick={(e) => { e.stopPropagation(); handleCopy(msg); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <Reply className="w-3.5 h-3.5" /> Reply
                              </button>
                              {canDelete(msg) && (
                                <>
                                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5" />
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg); setContextMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deleted messages show no action bar — only a subtle indicator on hover */}
                  {isDeleted && isReactionMenuOpen && (
                    <div className={`flex items-center self-center ${isMe ? 'order-first' : ''}`}>
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 italic select-none px-2">
                        deleted
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingList.length > 0 && (
          <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {typingList.slice(0, 3).join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
          {/* Reply Bar */}
          {replyTo && (
            <div className="px-4 pt-3 flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-2 border-emerald-500">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Replying to {replyTo.sender?.username}</span>
                <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          )}

          <form onSubmit={handleSend} className="p-3 sm:p-4 flex items-end gap-2">
            <button type="button" onClick={handlePickFile} disabled={isUploading}
              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all disabled:opacity-50 shrink-0" title="Attach file">
              <Paperclip className="w-5 h-5" />
            </button>

            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />

            <div className="flex-1 relative">
              {/* @Mention Dropdown */}
              {showMentions && filteredMentions.length > 0 && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mention someone</div>
                  {filteredMentions.map(m => (
                    <button key={m.id} type="button" onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <img src={m.profile_picture ? `${getBackendOrigin()}${m.profile_picture}` : avatarUrl(m.full_name || m.username)}
                        className="w-6 h-6 rounded-full object-cover" alt="" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.full_name || m.username}</p>
                        <p className="text-[10px] text-slate-400">@{m.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Type a message... (use @ to mention)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl
                  text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            <button type="submit" disabled={isUploading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20
                hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 shrink-0">
              {isUploading ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (<Send className="w-5 h-5" />)}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Members Sidebar ─── */}
      {showMembers && (
        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] flex flex-col shrink-0 animate-fade-in">
          <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Members</h4>
              <p className="text-[10px] text-slate-400 font-medium">{onlineCount} total</p>
            </div>
            <button
              onClick={() => setShowMembers(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {(members || []).map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="relative">
                  <img
                    src={m.profile_picture ? `${getBackendOrigin()}${m.profile_picture}` : avatarUrl(m.full_name || m.username)}
                    alt={m.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {m.full_name || m.username}
                    {m.id === meId && <span className="text-emerald-500 ml-1">(You)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-medium">{m.role || 'member'}</p>
                </div>
                {(m.role === 'admin' || m.role === 'hr') && (
                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Image Preview Modal ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
