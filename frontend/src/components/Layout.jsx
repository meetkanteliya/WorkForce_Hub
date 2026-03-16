import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import {
    LayoutDashboard,
    Users,
    Building2,
    CalendarClock,
    WalletCards,
    UserCircle2,
    LogOut,
    Menu,
    X,
    KeyRound,
    Bell,
    CheckCheck,
    Trash2,
    Sun,
    Moon,
    MessageSquare,
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
    { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'hr'] },
    { to: '/leaves', label: 'Leaves', icon: CalendarClock, roles: null },
    { to: '/payroll', label: 'Payroll', icon: WalletCards, roles: ['admin', 'hr'] },
    { to: '/my-salary', label: 'My Salary', icon: WalletCards, roles: ['employee', 'manager', 'hr'] },
    { to: '/chat', label: 'Team Chat', icon: MessageSquare, roles: null },
    { to: '/profile', label: 'Profile', icon: UserCircle2, roles: null },
    { to: '/change-password', label: 'Change Password', icon: KeyRound, roles: null },
];

export default function Layout() {
    const { user, logout, profilePic } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    // Logout Modal state
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await API.get('/dashboard/notifications/');
            setNotifications(res.data.results || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error('[Layout] Failed to fetch notifications', err);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.patch(`/dashboard/notifications/${id}/read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('[Layout] Failed to mark notification read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.patch('/dashboard/notifications/read-all/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('[Layout] Failed to mark all notifications read', err);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await API.delete('/dashboard/notifications/clear-all/');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('[Layout] Failed to clear notifications', err);
        }
    };


    const filteredNav = navItems.filter(
        (item) => !item.roles || item.roles.includes(user?.role)
    );

    const pageTitle = {
        dashboard: 'Dashboard',
        employees: 'Employees',
        departments: 'Departments',
        leaves: 'Leave Management',
        payroll: 'Payroll',
        chat: 'Team Chat',
        profile: 'My Profile',
        'change-password': 'Change Password',
    };

    const currentPage = location.pathname.split('/')[1] || 'dashboard';

    return (
        <div className={`flex h-screen ${isDarkMode ? 'bg-[#0F172A] text-slate-200' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#1A2B3C]/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#1A2B3C] text-slate-200
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                {/* Brand */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#2563EB] rounded flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
                            <span className="text-white text-sm font-bold tracking-tight">WH</span>
                        </div>
                        <span className="text-base font-semibold text-white tracking-wide">WorkForce Hub</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-6 px-4 overflow-y-auto space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">Menu</p>
                    {filteredNav.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                    ${active
                                        ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} strokeWidth={active ? 2 : 1.5} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User card */}
                <div className="p-4 border-t border-white/5 mt-auto">
                    <div className="bg-black/20 rounded-lg p-3 mb-2 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                            <img
                                src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&size=64&background=2563EB&color=fff&bold=true&font-size=0.45`}
                                alt={user?.username}
                                className="w-8 h-8 rounded object-cover bg-[#2563EB]/20 ring-1 ring-[#2563EB]/30 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</p>
                                <p className="text-[11px] text-slate-500 capitalize font-medium">{user?.role || 'Guest'}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogoutClick}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top bar */}
                <header className={`h-16 ${isDarkMode ? 'bg-[#1E293B]/80 border-slate-700' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-10 shrink-0 transition-colors duration-300`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg transition-colors -ml-1.5"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center text-sm">
                            <span className="text-slate-400 dark:text-slate-400 hidden sm:inline-block">WorkForce Hub</span>
                            <span className="mx-2 text-slate-300 dark:text-slate-600 hidden sm:inline-block">/</span>
                            <h2 className="font-semibold text-slate-800 dark:text-white">
                                {pageTitle[currentPage] || currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg transition-colors"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in dark:bg-[#111827] dark:border-slate-700">
                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 dark:bg-[#0F172A] dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                                        <div className="flex items-center gap-3">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                                                >
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    Mark all read
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={clearAllNotifications}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    All Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 dark:text-slate-400">
                                                <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                                <p className="text-sm font-medium">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => { if (!n.is_read) markAsRead(n.id); if (n.link) { navigate(n.link); setNotifOpen(false); } }}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] ${!n.is_read ? 'bg-blue-50/40 dark:bg-emerald-500/10' : ''}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-[#2563EB] dark:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] leading-snug ${!n.is_read ? 'font-semibold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                                            {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`relative p-2 rounded-lg transition-all duration-300 overflow-hidden ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <div className="relative w-5 h-5">
                                <Sun className={`absolute inset-0 w-5 h-5 transition-transform duration-500 ease-out ${isDarkMode ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                                <Moon className={`absolute inset-0 w-5 h-5 transition-transform duration-500 ease-out ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`} />
                            </div>
                        </button>

                        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md dark:bg-emerald-500/10 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">JWT SECURED</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-50'} transition-colors duration-300`}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Custom Logout Modal */}
            {showLogoutModal && createPortal(
                <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="my-auto flex-shrink-0 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
                                <LogOut className="w-8 h-8 text-rose-500" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sign Out</h3>
                            <p className="text-sm text-slate-500 max-w-[260px] mx-auto">
                                Are you sure you want to log out of your WorkForce Hub account?
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0F172A] flex gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={cancelLogout}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-sm shadow-rose-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            >
                                Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
