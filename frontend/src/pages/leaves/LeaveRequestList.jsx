import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    Plus, CheckCircle, XCircle, Clock4, Search,
    Scale, ChevronDown, Pencil, Save, X, Users
} from 'lucide-react';

const statusStyles = {
    pending: 'bg-amber-100/80 text-amber-700 border border-amber-200/50',
    approved: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50',
    rejected: 'bg-rose-100/80 text-rose-700 border border-rose-200/50',
};

export default function LeaveRequestList() {
    const { hasRole } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(searchParams.get('tab') || 'all');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    // Balance management state
    const [balances, setBalances] = useState([]);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ allocated_days: 0, used_days: 0 });
    const [balanceSearch, setBalanceSearch] = useState('');

    // ─── Fetch leave requests ───
    const fetchRequests = async (currentTab) => {
        setLoading(true);
        try {
            const endpoint = currentTab === 'my' ? '/leaves/requests/my/' : '/leaves/requests/';
            const res = await API.get(endpoint);
            const data = res.data.results ?? res.data;
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[LeaveRequestList] Error:', err);
            setRequests([]);
        } finally { setLoading(false); }
    };

    // ─── Fetch balances (admin/hr only) ───
    const fetchBalances = async () => {
        setBalanceLoading(true);
        try {
            const res = await API.get('/leaves/balances/');
            setBalances(res.data.results ?? res.data);
        } catch { } finally { setBalanceLoading(false); }
    };

    useEffect(() => {
        if (tab === 'balances') {
            fetchBalances();
        } else {
            fetchRequests(tab);
        }
    }, [tab]);

    // Sync URL params
    useEffect(() => {
        const params = {};
        if (tab !== 'all') params.tab = tab;
        if (statusFilter !== 'all') params.status = statusFilter;
        setSearchParams(params, { replace: true });
    }, [tab, statusFilter]);

    const handleAction = async (id, action) => {
        try {
            await API.patch(`/leaves/requests/${id}/${action}/`);
            setRequests((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r))
            );
        } catch (err) {
            const detail = err.response?.data?.detail;
            alert(detail || `Failed to ${action} leave`);
        }
    };

    const handleAdjust = async (id) => {
        try {
            const res = await API.patch(`/leaves/balances/${id}/adjust/`, editForm);
            setBalances((prev) =>
                prev.map((b) => (b.id === id ? res.data : b))
            );
            setEditingId(null);
        } catch {
            alert('Failed to adjust balance');
        }
    };

    const startEdit = (b) => {
        setEditingId(b.id);
        setEditForm({ allocated_days: b.allocated_days, used_days: b.used_days });
    };

    // ─── Filtered requests ───
    const filteredRequests = requests
        .filter(req => statusFilter === 'all' || req.status === statusFilter)
        .filter(req =>
            (req.employee || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.leave_type_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

    // ─── Filtered balances ───
    const filteredBalances = balances.filter(b =>
        (b.employee_name || '').toLowerCase().includes(balanceSearch.toLowerCase()) ||
        (b.leave_type?.name || '').toLowerCase().includes(balanceSearch.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">Leave Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Review, approve, and track employee absence requests.</p>
                </div>
                {!hasRole('admin') && (
                    <Link
                        to="/leaves/apply"
                        className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Apply for Leave
                    </Link>
                )}
            </div>

            {/* Tabs & Filters */}
            <div className="glass-panel flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-xl">
                <div className="flex gap-1.5 bg-slate-100/80 rounded-lg p-1 w-full sm:w-auto">
                    <TabButton active={tab === 'all'} onClick={() => { setTab('all'); setStatusFilter('all'); }}>
                        {hasRole('admin', 'hr', 'manager') ? 'All Requests' : 'All'}
                    </TabButton>
                    {!hasRole('admin') && (
                        <TabButton active={tab === 'my'} onClick={() => { setTab('my'); setStatusFilter('all'); }}>
                            My Leaves
                        </TabButton>
                    )}
                    {hasRole('admin', 'hr') && (
                        <TabButton active={tab === 'balances'} onClick={() => setTab('balances')}>
                            <Scale className="w-3.5 h-3.5 mr-1.5 inline-block" />
                            Leave Balances
                        </TabButton>
                    )}
                </div>

                {tab !== 'balances' ? (
                    <div className="flex gap-3 items-center w-full sm:w-auto">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {/* Search */}
                        <div className="relative flex-1 sm:w-56">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-slate-800 font-medium"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="relative flex-1 sm:w-64">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search employee or type..."
                            value={balanceSearch}
                            onChange={(e) => setBalanceSearch(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-slate-800 font-medium"
                        />
                    </div>
                )}
            </div>

            {/* ─── BALANCES TAB ─── */}
            {tab === 'balances' ? (
                balanceLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredBalances.length === 0 ? (
                    <EmptyState icon={Scale} title="No Balance Records" subtitle="No leave balance records found." />
                ) : (
                    <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <TH>Employee</TH>
                                        <TH>Department</TH>
                                        <TH>Leave Type</TH>
                                        <TH>Allocated</TH>
                                        <TH>Used</TH>
                                        <TH>Remaining</TH>
                                        <TH className="text-right">Actions</TH>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredBalances.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={b.employee_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.employee_name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                                        alt={b.employee_name}
                                                        className="w-8 h-8 rounded object-cover bg-[#1A2B3C] shrink-0"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-800">{b.employee_name}</span>
                                                        <p className="text-[10px] text-slate-400 font-mono">{b.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{b.department_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                                    {b.leave_type?.name}
                                                </span>
                                            </td>

                                            {editingId === b.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <input type="number" value={editForm.allocated_days}
                                                            onChange={(e) => setEditForm({ ...editForm, allocated_days: e.target.value })}
                                                            className="w-20 px-2 py-1.5 border border-[#2563EB] rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input type="number" value={editForm.used_days}
                                                            onChange={(e) => setEditForm({ ...editForm, used_days: e.target.value })}
                                                            className="w-20 px-2 py-1.5 border border-[#2563EB] rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                                        {Math.max(0, editForm.allocated_days - editForm.used_days)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleAdjust(b.id)}
                                                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200/50 transition-colors"
                                                                title="Save"><Save className="w-4 h-4" /></button>
                                                            <button onClick={() => setEditingId(null)}
                                                                className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200/50 transition-colors"
                                                                title="Cancel"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{b.allocated_days}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-amber-600">{b.used_days}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-sm font-bold ${b.remaining_days <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {b.remaining_days}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => startEdit(b)}
                                                            className="p-1.5 text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/50 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Adjust Balance"><Pencil className="w-4 h-4" /></button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                /* ─── REQUESTS TAB ─── */
                loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <EmptyState icon={Clock4} title="No Leave Requests" subtitle="No leave requests matching your current filters." />
                ) : (
                    <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <TH>Employee</TH>
                                        <TH>Leave Type</TH>
                                        <TH>Duration</TH>
                                        <TH>Reason</TH>
                                        <TH>Status</TH>
                                        {hasRole('admin', 'hr', 'manager') && tab === 'all' && (
                                            <TH className="text-right">Actions</TH>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={req.employee_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.employee || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                                        alt={req.employee}
                                                        className="w-8 h-8 rounded object-cover bg-[#1A2B3C] shrink-0"
                                                    />
                                                    <span className="text-sm font-semibold text-slate-800">{req.employee}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                                    {req.leave_type_name || req.leave_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700">{req.start_date}</span>
                                                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">to {req.end_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] text-slate-500 font-medium line-clamp-2 leading-snug max-w-[250px]">
                                                    {req.reason || 'No reason provided'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${statusStyles[req.status] || ''}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'approved' ? 'bg-emerald-500' :
                                                        req.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                                                        }`}></span>
                                                    {req.status}
                                                </span>
                                            </td>
                                            {hasRole('admin', 'hr', 'manager') && tab === 'all' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleAction(req.id, 'approve')}
                                                                className="flex items-center justify-center w-8 h-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-200/50"
                                                                title="Approve"><CheckCircle className="w-5 h-5" strokeWidth={2.5} /></button>
                                                            <button onClick={() => handleAction(req.id, 'reject')}
                                                                className="flex items-center justify-center w-8 h-8 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/50"
                                                                title="Reject"><XCircle className="w-5 h-5" strokeWidth={2.5} /></button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

// ─── Helper Components ───

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wider transition-all ${active
                ? 'bg-white text-[#1A2B3C] shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            {children}
        </button>
    );
}

function TH({ children, className = '' }) {
    return (
        <th className={`px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap ${className}`}>
            {children}
        </th>
    );
}

function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-[#1A2B3C]">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
    );
}
