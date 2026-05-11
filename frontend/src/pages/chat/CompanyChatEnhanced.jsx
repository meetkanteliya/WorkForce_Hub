import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import API from '../../api/axios';
import { selectUser, selectTokens } from '../../store/slices/authSlice';
import {
  fetchMessages,
  fetchMembers,
  addMessage,
  updateMessage,
  optimisticDelete,
  setTypingUser,
  incrementUnread,
  selectMessages,
  selectLoadingHistory,
  selectMembers,
  selectTypingUsers,
  selectUnreadCount,
} from '../../store/slices/chatSlice';
import {
  Send, MessageSquare, Clock, Paperclip, Users, Trash2, Shield, Hash, X,
  FileText, Download, MoreHorizontal, Copy, Reply, Smile, Edit2, Pin, PinOff,
  Search, Image as ImageIcon, Video, Music, File, Archive, Table, Check, CheckCheck
} from 'lucide-react';
import {
  getDateLabel, isImageFile, isVideoFile, isAudioFile, isPdfFile,
  getFileIcon, formatFileSize, playNotificationSound, showDesktopNotification,
  getAvatarUrl, validateFile, debounce
} from '../../utils/chatUtils';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

function getWsOrigin() {
  const backend = getBackendOrigin();
  return backend.replace(/^http/, 'ws');
}

const CHANNEL_KEY = 'company';
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥', '🎉', '✨'];

export default function CompanyChatEnhanced() {
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
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [contextMenuId, setContextMenuId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [reactionOverrides, setReactionOverrides] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const meId = user?.id;
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  // Load members
  useEffect(() => {
    if (!tokens?.access) return;
    dispatch(fetchMembers());
  }, [tokens?.access, dispatch]);

  // Load pinned messages
  const loadPinnedMessages = async () => {
    try {
      const res = await API.get('/chat/company/messages/pinned/');
      setPinnedMessages(res.data || []);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    }
  };

  useEffect(() => {
    if (tokens?.access) {
      loadPinnedMessages();
    }
  }, [tokens?.access]);

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
          if (fromOther) {
            if (isHidden) {
              dispatch(incrementUnread({ key: CHANNEL_KEY }));
              playNotificationSound();
              showDesktopNotification(
                `${data.payload.sender?.full_name || data.payload.sender?.username}`,
                data.payload.content || 'Sent an attachment',
                data.payload.sender?.profile_picture
              );
            }
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

        if (data.type === "company_message_edited" && data.payload?.id) {
          dispatch(updateMessage({ key: CHANNEL_KEY, message: data.payload }));
        }

        if (data.type === "company_message_pinned" && data.payload?.id) {
          dispatch(updateMessage({ key: CHANNEL_KEY, message: data.payload }));
          loadPinnedMessages();
        }

        if (data.type === "company_reaction_update" && data.message_id) {
          setReactionOverrides(prev => ({
            ...prev,
            [data.message_id]: data.reactions || {},
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
    
    const payload = { type: 'message', message: text };
    if (replyTo) {
      payload.reply_to = replyTo.id;
    }
    
    socket.send(JSON.stringify(payload));
    setInput('');
    setReplyTo(null);
    sendTyping(false);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file) => {
    if (!file || !tokens?.access) return;
    
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("attachment", file);
      form.append("content", input.trim());
      if (replyTo) {
        form.append("reply_to", replyTo.id);
      }
      await API.post("/chat/company/messages/", form);
      setInput("");
      setReplyTo(null);
      sendTyping(false);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag and drop file upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const canDelete = (msg) => {
    const senderId = msg?.sender?.id;
    return senderId && (senderId === meId || isAdminOrHr);
  };

  const canEdit = (msg) => {
    return msg?.sender?.id === meId && !msg?.is_deleted;
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg?.id || !canDelete(msg)) return;
    const id = msg.id;

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
    setHoveredMsgId(null);
    if (replyTo?.id === id) setReplyTo(null);
  };

  const handleEditMessage = async () => {
    if (!editingMsg || !input.trim()) return;
    
    try {
      const res = await API.put(`/chat/company/messages/${editingMsg.id}/edit/`, {
        content: input.trim()
      });
      dispatch(updateMessage({ key: CHANNEL_KEY, message: res.data }));
      setEditingMsg(null);
      setInput('');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to edit message');
    }
  };

  const startEdit = (msg) => {
    if (!canEdit(msg)) return;
    setEditingMsg(msg);
    setInput(msg.content);
    setContextMenuId(null);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setInput('');
  };

  const handlePinMessage = async (msg) => {
    if (!isAdminOrHr || msg?.is_deleted) return;
    
    try {
      const action = msg.is_pinned ? 'unpin' : 'pin';
      const res = await API.post(`/chat/company/messages/${msg.id}/pin/`, { action });
      dispatch(updateMessage({ key: CHANNEL_KEY, message: res.data }));
      loadPinnedMessages();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to pin message');
    }
    setContextMenuId(null);
  };

  const handleCopy = (msg) => {
    if (msg?.is_deleted) return;
    if (msg?.content) navigator.clipboard.writeText(msg.content);
    setContextMenuId(null);
  };

  const handleReply = (msg) => {
    if (msg?.is_deleted) return;
    setReplyTo(msg);
    setContextMenuId(null);
    inputRef.current?.focus();
  };

  const handleReaction = (msgId, emoji) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'reaction', message_id: msgId, emoji }));
    setHoveredMsgId(null);
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

  // Click outside to close action bar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hoveredMsgId && !e.target.closest('[data-msg-actions]')) {
        setHoveredMsgId(null);
        setContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hoveredMsgId]);

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(msg =>
      msg.content?.toLowerCase().includes(query) ||
      msg.sender?.username?.toLowerCase().includes(query) ||
      msg.sender?.full_name?.toLowerCase().includes(query) ||
      msg.attachment_name?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = '';
    filteredMessages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.timestamp);
      if (dateLabel !== lastDate) {
        groups.push({ type: 'date', label: dateLabel });
        lastDate = dateLabel;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }, [filteredMessages]);

  const onlineCount = members?.length || 0;

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">

      {/* ─── Main Chat Area ─── */}
      <div 
        className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A] min-w-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-50 bg-emerald-500/10 backdrop-blur-sm border-4 border-dashed border-emerald-500 flex items-center justify-center">
            <div className="text-center">
              <Paperclip className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Drop file to upload</p>
            </div>
          </div>
        )}

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

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${showSearch
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              title="Search messages"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Pinned messages button */}
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinned(!showPinned)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${showPinned
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
              >
                <Pin className="w-4 h-4" />
                <span className="hidden sm:inline">{pinnedMessages.length}</span>
              </button>
            )}

            {/* Members button */}
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
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pinned messages bar */}
        {showPinned && pinnedMessages.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-500/5">
            <div className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-2">
                    <span className="font-semibold">{msg.sender?.full_name || msg.sender?.username}:</span> {msg.content?.substring(0, 100)}
                    {msg.content?.length > 100 && '...'}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowPinned(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area - CONTINUED IN NEXT PART */}
