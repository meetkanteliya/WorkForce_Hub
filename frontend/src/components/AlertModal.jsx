import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Reusable alert/notification modal. Use instead of alert() for consistent UX.
 * @param {boolean} open - Whether the modal is visible
 * @param {string} message - Message to display
 * @param {'error'|'success'|'warning'|'info'} variant - Visual style
 * @param {function} onClose - Called when user clicks OK or backdrop
 */
export default function AlertModal({ open, message, variant = 'error', onClose }) {
    if (!open) return null;

    const config = {
        error: {
            icon: AlertCircle,
            iconClass: 'text-rose-500',
            bgClass: 'bg-rose-100 dark:bg-rose-500/10',
            title: 'Error',
        },
        success: {
            icon: CheckCircle,
            iconClass: 'text-emerald-500',
            bgClass: 'bg-emerald-100 dark:bg-emerald-500/10',
            title: 'Success',
        },
        warning: {
            icon: AlertCircle,
            iconClass: 'text-amber-500',
            bgClass: 'bg-amber-100 dark:bg-amber-500/10',
            title: 'Warning',
        },
        info: {
            icon: Info,
            iconClass: 'text-blue-500',
            bgClass: 'bg-blue-100 dark:bg-blue-500/10',
            title: 'Notice',
        },
    };

    const { icon: Icon, iconClass, bgClass, title } = config[variant] || config.error;

    const modal = (
        <div
            className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-modal-title"
        >
            <div className="my-auto flex-shrink-0 w-full max-w-md animate-slide-up rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] shadow-xl overflow-hidden">
                <div className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${bgClass}`}>
                        <Icon className={`w-7 h-7 ${iconClass}`} strokeWidth={2} />
                    </div>
                    <h3 id="alert-modal-title" className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">
                        {message}
                    </p>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
