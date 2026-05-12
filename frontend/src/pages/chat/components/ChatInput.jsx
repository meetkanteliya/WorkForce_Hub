import { useRef, useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  onTyping,
  onPaste,
  onFileSelect,
  isUploading = false,
  replyTo = null,
  onClearReply,
  showMentions = false,
  filteredMentions = [],
  onMentionSelect,
  placeholder = 'Type a message...',
}) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isUploading) return;
    onSend(e);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (onTyping) onTyping(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`;

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
      {/* Reply Bar */}
      {replyTo && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-2 border-emerald-500">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Replying to {replyTo.sender?.username}
            </span>
            <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 sm:p-4 flex items-end gap-2">
        {onFileSelect && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all disabled:opacity-50 shrink-0"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFileSelect(e.target.files?.[0])}
            />
          </>
        )}

        <div className="flex-1 relative">
          {/* @Mention Dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mention someone
              </div>
              {filteredMentions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onMentionSelect(m);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <img
                    src={
                      m.profile_picture
                        ? `${getBackendOrigin()}${m.profile_picture}`
                        : avatarUrl(m.full_name || m.username)
                    }
                    className="w-6 h-6 rounded-full object-cover"
                    alt=""
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {m.full_name || m.username}
                    </p>
                    <p className="text-[10px] text-slate-400">@{m.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl
              text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none overflow-y-auto"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || !input.trim()}
          className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20
            hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 shrink-0"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
