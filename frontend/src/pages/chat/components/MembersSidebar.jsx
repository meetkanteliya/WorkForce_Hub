import { X, Shield, Users } from 'lucide-react';

function getBackendOrigin() {
  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';
}

const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`;

export default function MembersSidebar({ members = [], meId, onClose }) {
  const onlineCount = members.length;

  return (
    <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] flex flex-col shrink-0 animate-fade-in">
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Members</h4>
          <p className="text-[10px] text-slate-400 font-medium">{onlineCount} total</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <div className="relative">
              <img
                src={
                  m.profile_picture
                    ? `${getBackendOrigin()}${m.profile_picture}`
                    : avatarUrl(m.full_name || m.username)
                }
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
              <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-medium">
                {m.role || 'member'}
              </p>
            </div>
            {(m.role === 'admin' || m.role === 'hr') && (
              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
