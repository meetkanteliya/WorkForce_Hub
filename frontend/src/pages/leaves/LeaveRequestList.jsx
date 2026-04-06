import { useState, useEffect, createElement } from 'react';
import { createPortal } from 'react-dom';

import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, hasRole as hasRoleUtil } from '../../store/slices/authSlice';
import {
    fetchLeaveRequests,
    fetchBalances as fetchBalancesThunk,
    actionLeaveRequest,
    adjustBalance,
    selectLeaveRequests,
    selectRequestsLoading,
    selectBalances,
    selectBalanceLoading,
} from '../../store/slices/leaveSlice';
import { fetchDepartments, selectDepartmentList } from '../../store/slices/departmentSlice';
import AlertModal from '../../components/AlertModal';
import {
    Plus, CheckCircle, XCircle, Clock4, Search,
    Scale, ChevronDown, Pencil, Save, X, Eye
} from 'lucide-react';

const statusStyles = {
    pending: 'bg-amber-100/80 text-amber-700 border border-amber-200/50',
    approved: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50',
    rejected: 'bg-rose-100/80 text-rose-700 border border-rose-200/50',
};

function getBaseAllocation(leaveType) {
    const fallback = Number(leaveType?.max_days_per_year);
    return Number.isFinite(fallback) ? fallback : 0;
}

export default function LeaveRequestList() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const hasRole = (...roles) => hasRoleUtil(user, ...roles);
    const [searchParams, setSearchParams] = useSearchParams();

    // Redux state
    const requests = useSelector(selectLeaveRequests);
    const loading = useSelector(selectRequestsLoading);
    const balances = useSelector(selectBalances);
    const balanceLoading = useSelector(selectBalanceLoading);
    const departments = useSelector(selectDepartmentList);

    const [tab, setTab] = useState(searchParams.get('tab') || (hasRole('admin', 'hr') ? 'all' : 'my'));
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');

    // Balance edit state (local UI)
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ allocated_days: 0, used_days: 0 });
    const [balanceSearch, setBalanceSearch] = useState('');

    // ─── Modal State ───
    const [selectedEmployeeBalances, setSelectedEmployeeBalances] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState('error');

    // ─── Pagination ───
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [tab, statusFilter, searchQuery, balanceSearch, departmentFilter]);

    // ─── Fetch data via Redux ───
    useEffect(() => {
        if (tab === 'balances') {
            dispatch(fetchBalancesThunk());
        } else {
            dispatch(fetchLeaveRequests({ tab }));
        }
    }, [tab, dispatch]);

    // Fetch departments for filters (once)
    useEffect(() => {
        dispatch(fetchDepartments());
    }, [dispatch]);

    // Sync URL params
    useEffect(() => {
        const params = {};
        if (tab !== 'all') params.tab = tab;
        if (statusFilter !== 'all') params.status = statusFilter;
        setSearchParams(params, { replace: true });
    }, [tab, statusFilter]);

    const handleAction = async (id, action) => {
        try {
            await dispatch(actionLeaveRequest({ id, action })).unwrap();
        } catch (err) {
            setAlertMessage(err || `Failed to ${action} leave`);
            setAlertVariant('error');
            setAlertOpen(true);
        }
    };

    const handleAdjust = async (balance) => {
        try {
            const allocatedNext = Number(editForm.allocated_days);
            const base = getBaseAllocation(balance?.leave_type);
            const maxAllowed = base + 3;

            if (Number.isFinite(allocatedNext) && allocatedNext > maxAllowed) {
                setAlertMessage("Maximum extra leave limit exceeded. Only +3 additional leaves allowed.");
                setAlertVariant('warning');
                setAlertOpen(true);
                return;
            }

            const payload = {
                allocated_days: allocatedNext,
                used_days: Number(editForm.used_days)
            };
            const res = await dispatch(adjustBalance({ balanceId: balance.id, payload })).unwrap();

            // If the modal is open, update the selectedEmployeeBalances state
            if (selectedEmployeeBalances) {
                setSelectedEmployeeBalances(prev =>
                    prev.map(b => b.id === balance.id ? res : b)
                );
            }

            setEditingId(null);
        } catch (err) {
            setAlertMessage(err || 'Failed to adjust balance');
            setAlertVariant('error');
            setAlertOpen(true);
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
        )

        .filter(req => {
            if (departmentFilter === 'All') return true;
            return (req.employee_department || 'Unassigned') === departmentFilter;
        });

    // ─── Filtered balances ───
    const searchFilteredBalances = balances.filter(b =>
        (b.employee_name || '').toLowerCase().includes(balanceSearch.toLowerCase()) ||
        (b.department_name || '').toLowerCase().includes(balanceSearch.toLowerCase())
    ).filter(b => {
        if (departmentFilter === 'All') return true;
        return (b.department_name || 'Unassigned') === departmentFilter;
    });

    // Group the balances by employee for the main table
    const groupedBalances = {};
    searchFilteredBalances.forEach(b => {
        // employee_code can be empty/null, causing all such users to collapse into one row!
        // We use employee_name (or employee id if available)
        const key = b.employee_id || b.employee_code || b.employee_name;
        if (!groupedBalances[key]) {
            groupedBalances[key] = {
                employee_id: key,
                employee_name: b.employee_name,
                employee_code: b.employee_code,
                employee_profile_picture: b.employee_profile_picture,
                department_name: b.department_name,
                total_allocated: 0,
                total_used: 0,
                total_remaining: 0,
                records: []
            };
        }
        // Prevent duplicate leave types for the same employee
        const existingRecordIndex = groupedBalances[key].records.findIndex(
            r => r.leave_type?.id === b.leave_type?.id
        );

        if (existingRecordIndex === -1) {
            groupedBalances[key].total_allocated += parseFloat(b.allocated_days) || 0;
            groupedBalances[key].total_used += parseFloat(b.used_days) || 0;
            groupedBalances[key].total_remaining += parseFloat(b.remaining_days) || 0;
            groupedBalances[key].records.push(b);
        } else {
            // Keep the latest record only (assuming higher ID means later or just take the new one)
            if (b.id > groupedBalances[key].records[existingRecordIndex].id) {
                // Subtract old
                const oldRec = groupedBalances[key].records[existingRecordIndex];
                groupedBalances[key].total_allocated -= parseFloat(oldRec.allocated_days) || 0;
                groupedBalances[key].total_used -= parseFloat(oldRec.used_days) || 0;
                groupedBalances[key].total_remaining -= parseFloat(oldRec.remaining_days) || 0;

                // Add new
                groupedBalances[key].total_allocated += parseFloat(b.allocated_days) || 0;
                groupedBalances[key].total_used += parseFloat(b.used_days) || 0;
                groupedBalances[key].total_remaining += parseFloat(b.remaining_days) || 0;

                // Replace
                groupedBalances[key].records[existingRecordIndex] = b;
            }
        }
    });

    const aggregatedBalancesArray = Object.values(groupedBalances).sort((a, b) => a.employee_name.localeCompare(b.employee_name));

    // ─── Paginated lists ───
    const totalRequests = filteredRequests.length;
    const requestsTotalPages = Math.ceil(totalRequests / itemsPerPage) || 1;
    const requestsStartIndex = (currentPage - 1) * itemsPerPage;
    const currentRequests = filteredRequests.slice(requestsStartIndex, requestsStartIndex + itemsPerPage);

    const totalBalances = aggregatedBalancesArray.length;
    const balancesTotalPages = Math.ceil(totalBalances / itemsPerPage) || 1;
    const balancesStartIndex = (currentPage - 1) * itemsPerPage;
    const currentBalances = aggregatedBalancesArray.slice(balancesStartIndex, balancesStartIndex + itemsPerPage);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] dark:text-white tracking-tight">Leave Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review, approve, and track employee absence requests.</p>
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
            <div className="glass-panel dark:bg-[#111827]/40 flex flex-wrap gap-3 justify-between items-center p-3 rounded-xl border-slate-200 dark:border-slate-800">
                {/* Tabs */}
                <div className="flex flex-nowrap gap-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg p-1 w-full xl:w-auto overflow-x-auto no-scrollbar shrink-0">
                    <TabButton active={tab === 'all'} onClick={() => { setTab('all'); setStatusFilter('all'); }}>
                        {hasRole('admin', 'hr', 'manager') ? 'All Requests' : 'All Requests'}
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

                {/* Filters */}
                {tab !== 'balances' ? (
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full xl:w-auto flex-1 xl:flex-none justify-end">
                        {/* Status Filter */}
                        <div className="relative min-w-[140px] shrink-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {/* Department Filter */}
                        {hasRole('admin', 'hr', 'manager') && (
                            <div className="relative min-w-[180px] shrink-0">
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative flex-1 min-w-[150px] shrink-0 xl:w-56">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-slate-800 dark:text-white font-medium"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full xl:w-auto flex-1 xl:flex-none justify-end">
                        {/* Department Filter for Balances */}
                        <div className="relative min-w-[180px] shrink-0">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                            >
                                <option value="All">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {/* Search for Balances */}
                        <div className="relative flex-1 min-w-[180px] shrink-0 xl:w-64">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search employee or department..."
                                value={balanceSearch}
                                onChange={(e) => setBalanceSearch(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-slate-800 dark:text-white font-medium"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ─── BALANCES TAB ─── */}
            {tab === 'balances' ? (
                balanceLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : aggregatedBalancesArray.length === 0 ? (
                    <EmptyState icon={Scale} title="No Balance Records" subtitle="No leave balance records found." />
                ) : (
                    <div className="glass-panel dark:bg-[#111827]/40 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                                        <TH>Employee</TH>
                                        <TH>Department</TH>
                                        <TH>Total Leaves</TH>
                                        <TH>Used Leaves</TH>
                                        <TH>Remaining</TH>
                                        <TH className="text-right">Action</TH>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-transparent">
                                    {currentBalances.map((group) => (
                                        <tr key={group.employee_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={group.employee_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.employee_name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                                        alt={group.employee_name}
                                                        className="w-8 h-8 rounded object-cover bg-[#1A2B3C] shrink-0"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{group.employee_name}</span>
                                                        <p className="text-[10px] text-slate-400 font-mono">{group.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{group.department_name || '—'}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{group.total_allocated}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-amber-600 dark:text-amber-400">{group.total_used}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-bold ${group.total_remaining <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {group.total_remaining}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedEmployeeBalances(group.records)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/50 transition-colors"
                                                    title="View Details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationFooter
                            totalItems={totalBalances}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={balancesTotalPages}
                            startIndex={balancesStartIndex}
                        />
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
                    <div className="glass-panel dark:bg-[#111827]/40 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
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
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-transparent">
                                    {currentRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={req.employee_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.employee || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                                        alt={req.employee}
                                                        className="w-8 h-8 rounded object-cover bg-[#1A2B3C] shrink-0"
                                                    />
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{req.employee}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                                    {req.leave_type_name || req.leave_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{req.start_date}</span>
                                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">to {req.end_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-snug max-w-[250px]">
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
                        <PaginationFooter
                            totalItems={totalRequests}
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={requestsTotalPages}
                            startIndex={requestsStartIndex}
                        />
                    </div>
                )
            )}

            {/* ─── MODAL: Employee Leave Details (portaled so always centered in viewport) ─── */}
            {selectedEmployeeBalances && createPortal(
                <div
                    className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => e.target === e.currentTarget && (setSelectedEmployeeBalances(null), setEditingId(null))}
                >
                    <div className="my-auto flex-shrink-0 w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedEmployeeBalances[0]?.employee_profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployeeBalances[0]?.employee_name || 'U')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                        {selectedEmployeeBalances[0]?.employee_name}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {selectedEmployeeBalances[0]?.department_name || 'No Dept'} • {selectedEmployeeBalances[0]?.employee_code}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedEmployeeBalances(null);
                                    setEditingId(null);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-6 flex-1">
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                            <TH>Leave Type</TH>
                                            <TH>Allocated</TH>
                                            <TH>Used</TH>
                                            <TH>Remaining</TH>
                                            <TH className="text-right">Actions</TH>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-transparent">
                                        {selectedEmployeeBalances.map((b) => (
                                            <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                                        {b.leave_type?.name}
                                                    </span>
                                                </td>

                                                {editingId === b.id ? (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <input type="number" value={editForm.allocated_days}
                                                                onChange={(e) => setEditForm({ ...editForm, allocated_days: e.target.value })}
                                                                className="w-20 px-2 py-1.5 border border-[#2563EB] dark:bg-[#1E293B] dark:text-white rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input type="number" value={editForm.used_days}
                                                                onChange={(e) => setEditForm({ ...editForm, used_days: e.target.value })}
                                                                className="w-20 px-2 py-1.5 border border-[#2563EB] dark:bg-[#1E293B] dark:text-white rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                                            {Math.max(0, editForm.allocated_days - editForm.used_days)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => handleAdjust(b)}
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
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{b.allocated_days}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-amber-600 dark:text-amber-400">{b.used_days}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-bold ${b.remaining_days <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                {b.remaining_days}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => startEdit(b)}
                                                                className="p-1.5 text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/50 transition-colors"
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
                    </div>
                </div>,
                document.body
            )}

            <AlertModal
                open={alertOpen}
                message={alertMessage}
                variant={alertVariant}
                onClose={() => setAlertOpen(false)}
            />
        </div>
    );
}

// ─── Helper Components ───

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wider transition-all ${active
                ? 'bg-white dark:bg-[#1E293B] text-[#1A2B3C] dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
        >
            {children}
        </button>
    );
}

function TH({ children, className = '' }) {
    return (
        <th className={`px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap ${className}`}>
            {children}
        </th>
    );
}

function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="glass-panel dark:bg-[#111827]/40 rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                {createElement(Icon, { className: "w-8 h-8 text-slate-400" })}
            </div>
            <h3 className="text-lg font-bold text-[#1A2B3C] dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
    );
}

function PaginationFooter({ totalItems, currentPage, itemsPerPage, setCurrentPage, totalPages, startIndex }) {
    if (totalItems === 0) return null;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-transparent border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span>–<span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPage === page
                            ? 'bg-[#10B981] text-white border border-[#10B981]'
                            : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
