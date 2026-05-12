import { Clock, Shield, Trash2, FileText, Download } from 'lucide-react';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

function isImageFile(url) {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}

function renderContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, l_idx) => {
    const parts = line.split(/(@\w+)/g);
    return (
      <span key={l_idx}>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span
                key={i}
                className="font-bold text-emerald-300 dark:text-emerald-400 bg-emerald-500/10 px-0.5 rounded"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
        {l_idx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function MessageBubble({
  msg,
  isMe,
  meId,
  showAvatar = true,
  onBubbleClick,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onImagePreview,
  isActionMenuOpen,
  children, // For action toolbar
}) {
  const sender = msg?.sender || {};
  const isDeleted = !!msg?.is_deleted;
  const iAmTheDeleter =
    isDeleted && msg?.deleted_by && msg.deleted_by.id === meId && msg.deleted_by.id !== sender.id;

  const pic = sender.profile_picture
    ? `${getBackendOrigin()}${sender.profile_picture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        sender.full_name || sender.username || 'User'
      )}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`;

  const hasAttachment = !!msg?.attachment_url;
  const attachmentIsImage = hasAttachment && isImageFile(msg.attachment_url);
  const attachmentFullUrl = msg?.attachment_url
    ? `${getBackendOrigin()}${msg.attachment_url}`
    : '';

  return (
    <div
      data-msg-id={msg.id}
      className={`flex gap-2.5 group relative ${isMe ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isMe && showAvatar && (
        <img
          src={pic}
          alt={sender.username}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900 shadow-sm"
        />
      )}

      {/* Message Bubble */}
      <div className={`max-w-[75%] sm:max-w-[65%] relative ${isMe ? 'items-end' : 'items-start'}`} data-msg-bubble>
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
          onClick={onBubbleClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
          className={`relative px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed transition-all ${
            isDeleted
              ? 'cursor-default bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700' +
                (isMe ? ' rounded-tr-md' : ' rounded-tl-md')
              : 'cursor-pointer ' +
                (isMe
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-md shadow-md shadow-emerald-500/15'
                  : 'bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-md shadow-sm')
          }${
            !isDeleted && isActionMenuOpen
              ? isMe
                ? ' ring-2 ring-emerald-300 dark:ring-emerald-400/50 shadow-lg shadow-emerald-500/25'
                : ' ring-2 ring-slate-300 dark:ring-slate-500/50 shadow-lg'
              : !isDeleted
              ? isMe
                ? ' hover:ring-2 hover:ring-emerald-300/50 dark:hover:ring-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/25'
                : ' hover:ring-2 hover:ring-slate-300/60 dark:hover:ring-slate-500/40 hover:shadow-lg'
              : ''
          }`}
        >
          {/* Action Toolbar (passed as children) */}
          {children}

          {/* Reply Quote */}
          {msg.reply_to && msg.reply_to.sender && (
            <div
              className={`mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 text-[11px] ${
                isMe
                  ? 'bg-white/10 border-white/40'
                  : 'bg-slate-50 dark:bg-slate-800 border-emerald-400'
              }`}
            >
              <span className="font-bold">
                {msg.reply_to.sender.username || msg.reply_to.sender.full_name || 'Unknown'}
              </span>
              <p className="opacity-70 truncate">
                {msg.reply_to.is_deleted ? '[deleted]' : msg.reply_to.content || ''}
              </p>
            </div>
          )}

          {/* Message Content */}
          {isDeleted ? (
            <span
              className={`italic text-[12px] flex items-center gap-2 select-none py-0.5 ${
                iAmTheDeleter
                  ? 'text-amber-500/70 dark:text-amber-400/60'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                  iAmTheDeleter
                    ? 'bg-amber-100 dark:bg-amber-500/15'
                    : 'bg-slate-200/80 dark:bg-slate-700/80'
                }`}
              >
                {iAmTheDeleter ? (
                  <Shield className="w-3 h-3 text-amber-500/70 dark:text-amber-400/60" />
                ) : (
                  <Trash2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                )}
              </span>
              {iAmTheDeleter ? 'This message was deleted by admin' : 'This message was deleted'}
            </span>
          ) : (
            <>
              {msg.content && <p className="whitespace-pre-wrap break-words">{renderContent(msg.content)}</p>}

              {/* Attachment */}
              {hasAttachment && (
                <div className="mt-2">
                  {attachmentIsImage ? (
                    <div
                      className="cursor-pointer rounded-lg overflow-hidden max-w-[280px] border border-black/5"
                      onClick={() => onImagePreview(attachmentFullUrl)}
                    >
                      <img
                        src={attachmentFullUrl}
                        alt={msg.attachment_name || 'Image'}
                        className="w-full h-auto max-h-[200px] object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <a
                      href={attachmentFullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isMe
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isMe ? 'bg-white/20' : 'bg-emerald-50 dark:bg-emerald-500/10'
                        }`}
                      >
                        <FileText
                          className={`w-4 h-4 ${
                            isMe ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isMe ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {msg.attachment_name || 'Attachment'}
                        </p>
                        <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                          Click to download
                        </p>
                      </div>
                      <Download
                        className={`w-3.5 h-3.5 ${isMe ? 'text-white/60' : 'text-slate-400'}`}
                      />
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {/* Time */}
          <div
            className={`text-[9px] mt-1 flex items-center gap-1 ${
              isMe ? 'text-white/50 justify-end' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            {msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
            {isMe && !isDeleted && (
              <span className="ml-1 font-bold">
                {msg.status === 'sending' ? '• Sending' : msg.status === 'failed' ? '• Pending' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
