export default function ReactionsBar({ msg, meId, onReaction }) {
  const isDeleted = !!msg?.is_deleted;
  const reactionEntries = msg?.reactions
    ? Object.entries(msg.reactions).filter(([, users]) => Array.isArray(users) && users.length > 0)
    : [];
  const hasReactions = reactionEntries.length > 0;

  if (isDeleted || !hasReactions) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {reactionEntries.map(([emoji, users]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReaction(msg.id, emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] shadow-sm transition-all ${
            users.includes(meId)
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span>{emoji}</span>
          <span className="font-semibold">{users.length}</span>
        </button>
      ))}
    </div>
  );
}
