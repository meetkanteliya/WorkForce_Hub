import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
    { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { to: '/departments', label: 'Departments', icon: Building2, roles: null },
    { to: '/leaves', label: 'Leaves', icon: CalendarClock, roles: null },
    { to: '/payroll', label: 'Payroll', icon: WalletCards, roles: ['admin', 'hr', 'manager'] },
    { to: '/my-salary', label: 'My Salary', icon: WalletCards, roles: null },
    { to: '/profile', label: 'Profile', icon: UserCircle2, roles: null },
    { to: '/change-password', label: 'Change Password', icon: KeyRound, roles: null },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
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
        profile: 'My Profile',
        'change-password': 'Change Password',
    };

    const currentPage = location.pathname.split('/')[1] || 'dashboard';

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
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
                    {filteredNav.map((item, idx) => {
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
                            <div className="w-8 h-8 rounded bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] font-bold text-xs ring-1 ring-[#2563EB]/30">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</p>
                                <p className="text-[11px] text-slate-500 capitalize font-medium">{user?.role || 'Guest'}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
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
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors -ml-1.5"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center text-sm">
                            <span className="text-slate-400 hidden sm:inline-block">WorkForce Hub</span>
                            <span className="mx-2 text-slate-300 hidden sm:inline-block">/</span>
                            <h2 className="font-semibold text-slate-800">
                                {pageTitle[currentPage] || currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-64 pl-9 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm transition-colors"
                                placeholder="Search..."
                            />
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] font-semibold text-emerald-700 tracking-wide">JWT SECURED</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
