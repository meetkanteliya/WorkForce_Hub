import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
    Users,
    UserCheck,
    Clock,
    Building2,
    CalendarCheck,
    CalendarDays,
    CalendarX2,
    AlertCircle,
    UserPlus,
    Activity,
    CheckCircle2,
    XCircle,
    Settings,
    ShieldCheck,
    ChevronRight,
    MinusCircle,
    RefreshCw,
    Wifi
} from 'lucide-react';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export default function Dashboard() {
    const { user, hasRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [mockData, setMockData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef(null);

    const fetchDashboardData = useCallback(async (silent = false) => {
        if (hasRole('admin', 'hr')) {
            try {
                if (!silent) setLoading(true);
                else setIsRefreshing(true);
                const res = await API.get('/dashboard/summary/');
                setData(res.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
        } else {
            setTimeout(() => {
                if (hasRole('manager')) {
                    setMockData({
                        type: 'manager',
                        team: [
                            { id: 1, name: 'John Doe', role: 'employee', login: '09:00 AM', logout: '06:30 PM', hoursWorked: 9.5, assignedLeaves: 20, usedLeaves: 5 },
                            { id: 2, name: 'Jane Smith', role: 'employee', login: '09:15 AM', logout: '05:15 PM', hoursWorked: 8.0, assignedLeaves: 20, usedLeaves: 2 },
                            { id: 3, name: 'Mike Ross', role: 'employee', login: '08:45 AM', logout: '07:45 PM', hoursWorked: 11.0, assignedLeaves: 20, usedLeaves: 10 },
                            { id: 4, name: 'Sarah Jane', role: 'manager', login: '09:30 AM', logout: '---', hoursWorked: 6.5, assignedLeaves: 24, usedLeaves: 4 },
                        ]
                    });
                } else {
                    setMockData({
                        type: 'employee',
                        assignedLeaves: 20,
                        usedLeaves: 4,
                        today: {
                            login: '09:00 AM',
                            logout: '06:15 PM',
                            hoursWorked: 9.25,
                        }
                    });
                }
                setLoading(false);
            }, 500);
        }
    }, [hasRole]);

    // Initial fetch + live polling
    useEffect(() => {
        fetchDashboardData(false);

        if (hasRole('admin', 'hr')) {
            intervalRef.current = setInterval(() => {
                fetchDashboardData(true);
            }, POLL_INTERVAL_MS);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchDashboardData, hasRole]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2563EB] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (hasRole('admin', 'hr') && data) {
        return <AdminDashboard data={data} user={user} isRefreshing={isRefreshing} onRefresh={() => fetchDashboardData(true)} />;
    }

    if (mockData?.type === 'manager') {
        return <ManagerDashboard team={mockData.team} user={user} />;
    }

    if (mockData?.type === 'employee') {
        return <EmployeeDashboard data={mockData} user={user} />;
    }

    return null;
}

// ──────────────────────────────────────────────────────────────────────
// ADMIN / HR DASHBOARD — Professional, Live-Updating
// ──────────────────────────────────────────────────────────────────────

function AdminDashboard({ data, user, isRefreshing, onRefresh }) {
    const roleLabel = user?.role === 'hr' ? 'HR' : 'Admin';
    const lastUpdated = data.last_updated
        ? new Date(data.last_updated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : null;

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-12">

            {/* Header with Live Status */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">{roleLabel} Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time system overview and executive controls.</p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live
                    </span>
                    {lastUpdated && (
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 hover:text-[#2563EB] transition-colors cursor-pointer"
                            title="Click to refresh now"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Updated {lastUpdated}
                        </button>
                    )}
                </div>
            </div>

            {/* 1. TOP KPI CARDS */}
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Core Metrics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <KPICard icon={Users} label="Total Staff" value={data.total_employees} />
                <KPICard icon={UserCheck} label="Working Today" value={data.present_today} color="text-emerald-600" highlight="emerald" />
                <KPICard icon={CalendarX2} label="On Leave" value={data.employees_on_leave_today} color="text-amber-600" highlight="amber" />
                <KPICard icon={AlertCircle} label="Pending Req" value={data.pending_requests_total} color="text-rose-600" highlight="rose" />
                <KPICard icon={Building2} label="Departments" value={data.total_departments} />
            </div>

            {/* 2. ATTENDANCE & LEAVE OVERVIEW + ORG SNAPSHOT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

                {/* Attendance & Leave Overview */}
                <div className="xl:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Today's Attendance
                    </h2>
                    <div className="space-y-4 flex-1">
                        <MetricRow label="Total Employees" value={data.total_employees} />
                        <MetricRow label="Working Today" value={data.present_today} highlight="text-emerald-600" />
                        <div className="h-px bg-slate-100 my-2" />
                        <MetricRow label="On Leave Today" value={data.employees_on_leave_today} highlight="text-amber-600" />
                        <MetricRow label="Upcoming Leaves (7d)" value={data.upcoming_leaves} />
                        <MetricRow label="Pending Requests" value={data.pending_requests_total} highlight="text-rose-600" />
                    </div>

                    {/* Working vs Absent Mini Visual */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workforce Status</span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                            {data.total_employees > 0 && (
                                <>
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-700"
                                        style={{ width: `${(data.present_today / data.total_employees) * 100}%` }}
                                        title={`Working: ${data.present_today}`}
                                    />
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-700"
                                        style={{ width: `${(data.employees_on_leave_today / data.total_employees) * 100}%` }}
                                        title={`On Leave: ${data.employees_on_leave_today}`}
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-slate-500">Working ({data.present_today})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                <span className="text-slate-500">On Leave ({data.employees_on_leave_today})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Snapshot + Leave Counts */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Leave Status Counts */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-5">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            Leave Status
                        </h2>
                        <div className="space-y-4">
                            <Link to="/leaves?status=pending" className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 hover:ring-2 hover:ring-amber-200 transition-all cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-amber-800">Pending</span>
                                </div>
                                <span className="text-xl font-black text-amber-700">{data.leave_counts?.pending ?? 0}</span>
                            </Link>
                            <Link to="/leaves?status=approved" className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:ring-2 hover:ring-emerald-200 transition-all cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-800">Approved</span>
                                </div>
                                <span className="text-xl font-black text-emerald-700">{data.leave_counts?.approved ?? 0}</span>
                            </Link>
                            <Link to="/leaves?status=rejected" className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100 hover:ring-2 hover:ring-rose-200 transition-all cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-rose-600" />
                                    <span className="text-sm font-semibold text-rose-800">Rejected</span>
                                </div>
                                <span className="text-xl font-black text-rose-700">{data.leave_counts?.rejected ?? 0}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Organization Snapshot */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-5">
                            <Users className="w-4 h-4 text-[#2563EB]" />
                            Organization
                        </h2>

                        <div className="space-y-5">
                            {/* Role Distribution Bar */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Role</span>
                                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mt-2">
                                    {Object.entries(data.role_distribution || {}).map(([role, count]) => {
                                        const total = Object.values(data.role_distribution).reduce((a, b) => a + b, 0);
                                        const pct = total ? (count / total) * 100 : 0;
                                        const colors = { admin: 'bg-[#1A2B3C]', hr: 'bg-emerald-500', manager: 'bg-amber-500', employee: 'bg-[#2563EB]' };
                                        return <div key={role} style={{ width: `${pct}%` }} className={`${colors[role] || 'bg-slate-400'} h-full`} title={`${role}: ${count}`} />;
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {Object.entries(data.role_distribution || {}).map(([role, count]) => {
                                        const colors = { admin: 'text-[#1A2B3C]', hr: 'text-emerald-600', manager: 'text-amber-600', employee: 'text-[#2563EB]' };
                                        return (
                                            <div key={role} className="flex items-center gap-1.5 text-[10px] font-semibold capitalize">
                                                <div className={`w-2 h-2 rounded-full ${colors[role]?.replace('text-', 'bg-') || 'bg-slate-400'}`} />
                                                <span className="text-slate-600">{role} <span className="text-slate-400">({count})</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Additions */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Joiners</span>
                                    <span className="text-xs font-bold text-[#2563EB]">{data.new_joiners_this_month} this month</span>
                                </div>
                                <div className="space-y-2.5">
                                    {(data.recently_added_employees || []).slice(0, 4).map((emp) => (
                                        <div key={emp.id} className="flex items-center gap-3">
                                            <img
                                                src={emp.profile_picture ? `/media/${emp.profile_picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user__username)}&size=56&background=F1F5F9&color=64748B&bold=true&font-size=0.45`}
                                                alt={emp.user__username}
                                                className="w-7 h-7 rounded-full object-cover bg-slate-100 shrink-0"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-[#1A2B3C]">{emp.user__username}</p>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">{emp.department__name || 'Unassigned'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM ROW: Audit Log + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Audit Log */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            Audit Log
                        </h2>
                        <Link to="/dashboard/activity" className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1">
                            View All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-1 max-h-[340px] overflow-y-auto custom-scrollbar pr-2">
                        {(data.recent_activity || []).length > 0 ? (
                            data.recent_activity.map((act, i) => (
                                <div key={act.id || i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                    <AuditIcon type={act.action_type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 leading-snug">{act.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {act.actor_name && <span className="text-slate-500 font-semibold">{act.actor_name}</span>}
                                                {act.actor_name && ' · '}
                                                {new Date(act.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <AuditBadge type={act.action_type} />
                                </div>
                            ))
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Activity className="w-8 h-8 text-slate-200" />
                                <span className="text-sm font-medium">No activity recorded yet.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#1A2B3C] border border-[#1A2B3C] rounded-xl p-5 shadow-lg text-white flex flex-col">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-5">
                        <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        <QuickActionLink to="/employees/new" icon={UserPlus} label="Add New Employee" />
                        <QuickActionLink to="/departments/new" icon={Building2} label="Create Department" />
                        <QuickActionLink to="/employees" icon={ShieldCheck} label="Manage Roles & Access" />
                        <QuickActionLink to="/leaves" icon={CalendarDays} label="Review Leave Queue" />
                        <QuickActionLink to="/settings" icon={Settings} label="System Settings" />
                    </div>
                </div>

            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD
// ──────────────────────────────────────────────────────────────────────

function EmployeeDashboard({ data }) {
    const remainingLeaves = data.assignedLeaves - data.usedLeaves;
    const progressPercent = Math.min((data.today.hoursWorked / 8) * 100, 100);
    const overtimeHours = Math.max(0, data.today.hoursWorked - 8);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">My Timesheet & Leave</h1>
                <p className="text-sm text-slate-500 mt-1">Track your daily hours and leave balances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. LEAVE BALANCE VIEW */}
                <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                        <CalendarCheck className="w-4 h-4 text-[#2563EB]" />
                        Leave Balances
                    </h2>
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assigned (By Admin)</p>
                            <span className="text-3xl font-black text-[#1A2B3C]">{data.assignedLeaves}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="text-center w-1/2 border-r border-slate-200">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used</p>
                                <span className="text-lg font-bold text-amber-600">{data.usedLeaves}</span>
                            </div>
                            <div className="text-center w-1/2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                                <span className="text-lg font-bold text-emerald-600">{remainingLeaves}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mx-auto mt-auto flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full w-fit border border-slate-100">
                            <MinusCircle className="w-3 h-3 text-slate-400" />
                            Leave balances are strictly assigned by Admin.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-6">
                    {/* 2. WORK HOURS TRACKING */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                        {overtimeHours > 0 && (
                            <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-bl-xl flex items-center gap-1 border-b border-l border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 8 Hours Completed
                            </div>
                        )}
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Clock className="w-4 h-4 text-[#2563EB]" />
                            Today's Work Hours
                        </h2>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Punch In</p>
                                <span className="text-lg font-bold text-[#1A2B3C]">{data.today.login}</span>
                            </div>
                            <div className="flex-1 px-8 text-center text-slate-300">
                                <div className="h-px bg-slate-200 w-full relative">
                                    <Activity className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 bg-white px-1" />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Punch Out</p>
                                <span className="text-lg font-bold text-[#1A2B3C]">{data.today.logout}</span>
                            </div>
                        </div>

                        <div className="mb-2 flex justify-between items-end">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Daily 8-Hour Goal</span>
                            <span className="text-lg font-black text-[#1A2B3C]">{data.today.hoursWorked.toFixed(2)} / 8.00 <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">hrs</span></span>
                        </div>

                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 w-full relative">
                            <div
                                className={`h-full transition-all duration-1000 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {overtimeHours > 0 && (
                            <div className="mt-4 flex gap-3">
                                {overtimeHours >= 2 && (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200">
                                        +2 Hours OT
                                    </span>
                                )}
                                {overtimeHours >= 4 && (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider bg-rose-50 text-rose-700 border-rose-200">
                                        +4 Hours OT
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. DAILY STATUS SUMMARY */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
                        <div className="grid grid-cols-4 divide-x divide-slate-200">
                            <div className="px-4 text-center first:pl-0 last:pr-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                <span className="text-sm font-bold tracking-tight text-[#1A2B3C]">{new Date().toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="px-4 text-center first:pl-0 last:pr-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                <span className="text-sm font-bold tracking-tight text-[#1A2B3C]">{data.today.hoursWorked.toFixed(2)}h</span>
                            </div>
                            <div className="px-4 text-center first:pl-0 last:pr-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Regular</p>
                                <span className="text-sm font-bold tracking-tight text-emerald-600">{Math.min(data.today.hoursWorked, 8).toFixed(2)}h</span>
                            </div>
                            <div className="px-4 text-center first:pl-0 last:pr-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overtime</p>
                                <span className="text-sm font-bold tracking-tight text-amber-600">{overtimeHours.toFixed(2)}h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// MANAGER & HR DASHBOARD
// ──────────────────────────────────────────────────────────────────────

function ManagerDashboard({ team }) {
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">Team Operations</h1>
                    <p className="text-sm text-slate-500 mt-1">Supervise team leave balances and track daily working hours.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* 1. TEAM LEAVE OVERVIEW */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-5">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        Team Leave Status
                    </h2>

                    <div className="space-y-4">
                        {team.map(member => {
                            const remaining = member.assignedLeaves - member.usedLeaves;
                            const pct = (member.usedLeaves / member.assignedLeaves) * 100;
                            return (
                                <div key={`leave-${member.id}`} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-[#1A2B3C]">{member.name}</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-white border border-slate-200">
                                            {remaining} left
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-full relative">
                                        <div
                                            className={`h-full ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{member.usedLeaves} Used</span>
                                        <span>{member.assignedLeaves} Assigned</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. TEAM HOURS TRACKING */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                        <Clock className="w-4 h-4 text-[#2563EB]" />
                        Daily Hours Tracking
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                                    <th className="pb-3 font-semibold px-2">Employee</th>
                                    <th className="pb-3 font-semibold px-2">Punch In</th>
                                    <th className="pb-3 font-semibold px-2">Punch Out</th>
                                    <th className="pb-3 font-semibold px-2 w-1/3">8-Hour Progress</th>
                                    <th className="pb-3 font-semibold px-2 text-right">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map((member) => {
                                    const progressPercent = Math.min((member.hoursWorked / 8) * 100, 100);
                                    const overTime = Math.max(0, member.hoursWorked - 8);
                                    const isComplete = progressPercent >= 100;

                                    return (
                                        <tr key={member.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-2">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[#1A2B3C] flex items-center gap-1.5">
                                                        {member.name}
                                                        {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="8 Hours Completed" />}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-slate-700 font-medium text-xs">{member.login}</td>
                                            <td className="py-4 px-2 text-slate-700 font-medium text-xs">{member.logout}</td>
                                            <td className="py-4 px-2">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 w-full">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                    {overTime > 0 && (
                                                        <div className="flex gap-1">
                                                            {overTime >= 2 && <span className="text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 rounded uppercase">+2h OT</span>}
                                                            {overTime >= 4 && <span className="text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 rounded uppercase">+4h OT</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <span className={`font-black text-lg tracking-tight ${overTime > 0 ? 'text-amber-600' : 'text-[#1A2B3C]'}`}>
                                                    {member.hoursWorked.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: IconComponent, color = "text-[#1A2B3C]", highlight }) {
    const bgMap = {
        emerald: 'bg-emerald-50 border-emerald-100',
        amber: 'bg-amber-50 border-amber-100',
        rose: 'bg-rose-50 border-rose-100',
    };
    const bgClass = highlight ? bgMap[highlight] : 'bg-white border-slate-200';
    return (
        <div className={`${bgClass} border rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                <IconComponent className="w-4 h-4 text-slate-300" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${color}`}>{value ?? 0}</span>
        </div>
    );
}

function MetricRow({ label, value, highlight }) {
    return (
        <div className="flex justify-between items-center py-1.5">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <span className={`text-sm font-bold ${highlight || 'text-[#1A2B3C]'}`}>{value ?? 0}</span>
        </div>
    );
}

function QuickActionLink({ to, icon: IconComponent, label }) {
    return (
        <Link to={to} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
            <IconComponent className="w-4 h-4 text-slate-400 group-hover:text-white" />
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">{label}</span>
        </Link>
    );
}

// Audit log action type → icon
function AuditIcon({ type }) {
    const config = {
        leave_request: { color: 'text-amber-500 bg-amber-50 border-amber-100', Icon: CalendarDays },
        leave_approved: { color: 'text-emerald-500 bg-emerald-50 border-emerald-100', Icon: CheckCircle2 },
        leave_rejected: { color: 'text-rose-500 bg-rose-50 border-rose-100', Icon: XCircle },
        employee_added: { color: 'text-blue-500 bg-blue-50 border-blue-100', Icon: UserPlus },
        salary_paid: { color: 'text-violet-500 bg-violet-50 border-violet-100', Icon: Building2 },
        profile_updated: { color: 'text-slate-500 bg-slate-50 border-slate-200', Icon: Settings },
    };
    const { color, Icon } = config[type] || { color: 'text-slate-400 bg-slate-50 border-slate-200', Icon: Activity };
    return (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${color}`}>
            <Icon className="w-4 h-4" />
        </div>
    );
}

// Audit log action type → badge
function AuditBadge({ type }) {
    const labels = {
        leave_request: { text: 'Requested', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        leave_approved: { text: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        leave_rejected: { text: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
        employee_added: { text: 'New Hire', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
        salary_paid: { text: 'Payroll', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
        profile_updated: { text: 'Updated', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    };
    const badge = labels[type] || { text: type, cls: 'bg-slate-50 text-slate-500 border-slate-200' };
    return (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${badge.cls}`}>
            {badge.text}
        </span>
    );
}
