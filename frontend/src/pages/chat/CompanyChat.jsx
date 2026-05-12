import { useMemo, useRef, useState, useEffect } from 'react';
import { useCompanyChat } from './hooks/useCompanyChat';
import API from '../../api/axios';
import { Hash, MessageSquare, Users, X, MoreHorizontal, Copy, Reply, Trash2, Paperclip } from 'lucide-react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import ReactionsBar from './components/ReactionsBar';
import MembersSidebar from './components/MembersSidebar';
import { optimisticDelete, updateMessage, addMessage } from '../../store/slices/chatSlice';

const CHANNEL_KEY = 'company';
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

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

export default function CompanyChat() {
  const {
    user,
    messages,
    loadingHistory,
    hasMoreHistory,
    members,
    typingList,
    unreadCount,
    isOnline,
    offlineQueue,
    handleScroll,
    sendTyping,
    sendMessage,
    sendReaction,
    dispatch,
  } = useCompanyChat();

  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [contextMenuId, setContextMenuId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const meId = user?.id;

  // Mobile touch handlers
  const handleTouchStart = (msgId, isDeleted) => {
    if (isDeleted) return;
    longPressTimerRef.current = setTimeout(() => {
      setActiveMessageId(msgId);
      setContextMenuId(null);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Optimized auto-scroll
  useEffect(() => {
    const isNewMessage = messages.length > lastMessageCountRef.current;
    const isSmallIncrement = messages.length - lastMessageCountRef.current <= 3;

    if (isNewMessage && isSmallIncrement) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length !== lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }

    lastMessageCountRef.current = messages.length;
  }, [messages]);

  const handlePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleFileSelected(file);
        break;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.target === e.currentTarget) {
      setDragOver(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const msgObj = {
      type: 'message',
      message: text,
      reply_to_id: replyTo?.id || null,
      temp_id: tempId,
    };

    const optimisticMsg = {
      id: tempId,
      content: text,
      sender: {
        id: user?.id,
        username: user?.username,
        full_name: user?.full_name || user?.username,
        role: user?.role,
        profile_picture: user?.employee?.profile_picture || null,
      },
      timestamp: new Date().toISOString(),
      is_deleted: false,
      status: 'sending',
      reply_to: replyTo || null,
      reactions: {},
      attachment_url: null,
      temp_id: tempId,
    };

    dispatch(addMessage({ key: CHANNEL_KEY, message: optimisticMsg }));

    if (!sendMessage(msgObj)) {
      dispatch(updateMessage({ key: CHANNEL_KEY, message: { ...optimisticMsg, status: 'failed' } }));
    }

    setInput('');
    setReplyTo(null);
    sendTyping(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('attachment', file);
      form.append('content', input.trim());
      if (replyTo?.id) {
        form.append('reply_to_id', replyTo.id);
      }

      await API.post('/chat/company/messages/', form);
      setInput('');
      setReplyTo(null);
      sendTyping(false);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const canDelete = (msg) => {
    const senderId = msg?.sender?.id;
    return senderId && (senderId === meId || user?.role === 'admin' || user?.role === 'hr');
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg?.id || !canDelete(msg)) return;
    const id = msg.id;

    dispatch(
      optimisticDelete({
        key: CHANNEL_KEY,
        messageId: id,
        deletedBy: { id: meId, username: user?.username, role: user?.role },
      })
    );

    try {
      await API.delete(`/chat/company/messages/${id}/`);
    } catch {
      dispatch(
        updateMessage({
          key: CHANNEL_KEY,
          message: { ...msg, is_deleted: false },
        })
      );
    }
    setContextMenuId(null);
    setActiveMessageId(null);
    if (replyTo?.id === id) setReplyTo(null);
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
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.is_deleted) return;
    sendReaction(msgId, emoji);
  };

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

  const filteredMentions = useMemo(() => {
    return (members || [])
      .filter(
        (m) =>
          m.id !== meId &&
          (m.username?.toLowerCase().includes(mentionFilter) || m.full_name?.toLowerCase().includes(mentionFilter))
      )
      .slice(0, 5);
  }, [members, meId, mentionFilter]);

  // Click outside to close action toolbar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMessageId && !e.target.closest('[data-msg-actions]') && !e.target.closest('[data-msg-bubble]')) {
        setActiveMessageId(null);
        setContextMenuId(null);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setActiveMessageId(null);
        setContextMenuId(null);
      }
    };

    if (activeMessageId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [activeMessageId]);

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

  const onlineCount = members?.length || 0;

  return (
    <ErrorBoundary>
      <div
        className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A] min-w-0">
          {/* Drag overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-50 bg-emerald-500/10 backdrop-blur-sm border-4 border-dashed border-emerald-500 flex items-center justify-center pointer-events-none">
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
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
                  <span>
                    {onlineCount} member{onlineCount !== 1 ? 's' : ''}
                  </span>
                  {!isOnline && (
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Reconnecting...
                    </span>
                  )}
                  {isOnline && offlineQueue.length > 0 && (
                    <span className="text-amber-500">Sending queued ({offlineQueue.length})...</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                showMembers
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{onlineCount}</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1" onScroll={handleScroll}>
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
                const sender = msg?.sender || {};
                const isMe = sender.id === meId;
                const isDeleted = !!msg?.is_deleted;
                const isActionMenuOpen = activeMessageId === msg?.id;

                return (
                  <div key={msg.id || i}>
                    <MessageBubble
                      msg={msg}
                      isMe={isMe}
                      meId={meId}
                      onBubbleClick={(e) => {
                        if (isDeleted || e.target.closest('a') || e.target.closest('button')) return;
                        setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                        setContextMenuId(null);
                      }}
                      onTouchStart={(e) => handleTouchStart(msg.id, isDeleted)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      onImagePreview={setPreviewImage}
                      isActionMenuOpen={isActionMenuOpen}
                    >
                      {/* Action Toolbar */}
                      {!isDeleted && isActionMenuOpen && (
                        <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} z-20`} data-msg-actions>
                          <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 shadow-xl animate-fade-in">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReaction(msg.id, emoji);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-700"
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
                                <div
                                  className={`absolute top-full mt-2 ${
                                    isMe ? 'right-0' : 'left-0'
                                  } w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-fade-in`}
                                  data-msg-actions
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(msg);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReply(msg);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <Reply className="w-3.5 h-3.5" /> Reply
                                  </button>
                                  {canDelete(msg) && (
                                    <>
                                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMessage(msg);
                                          setContextMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                      >
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
                    </MessageBubble>

                    {/* Reactions */}
                    <div className={`relative mt-1 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <ReactionsBar msg={msg} meId={meId} onReaction={handleReaction} />
                    </div>
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
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {typingList.slice(0, 3).join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onTyping={onInputChange}
            onPaste={handlePaste}
            onFileSelect={handleFileSelected}
            isUploading={isUploading}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            showMentions={showMentions}
            filteredMentions={filteredMentions}
            onMentionSelect={insertMention}
            placeholder="Type a message... (Shift+Enter for newline, @ to mention)"
          />
        </div>

        {/* Members Sidebar */}
        {showMembers && <MembersSidebar members={members} meId={meId} onClose={() => setShowMembers(false)} />}

        {/* Image Preview Modal */}
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
    </ErrorBoundary>
  );
}
