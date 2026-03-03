import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, CheckCircle, XCircle, Clock4, Filter, Search } from 'lucide-react';

const statusStyles = {
    pending: 'bg-amber-100/80 text-amber-700 border border-amber-200/50',
    approved: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50',
    rejected: 'bg-rose-100/80 text-rose-700 border border-rose-200/50',
};

export default function LeaveRequestList() {
    const { hasRole } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all'); // all | my
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'my' ? '/leaves/requests/my/' : '/leaves/requests/';
            const res = await API.get(endpoint);
            setRequests(res.data.results ?? res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, [tab]);

    const handleAction = async (id, action) => {
        try {
            await API.patch(`/leaves/requests/${id}/${action}/`);
            setRequests((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r))
            );
        } catch {
            alert(`Failed to ${action} leave`);
        }
    };

    const filteredRequests = requests.filter(req =>
        (req.employee || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.leave_type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">Leave Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Review, approve, and track employee absence requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/leaves/apply"
                        className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Apply for Leave
                    </Link>
                </div>
            </div>

            {/* Filters and Controls Strip */}
            <div className="glass-panel flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-xl">
                {/* Tabs */}
                <div className="flex gap-1.5 bg-slate-100/80 rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setTab('all')}
                        className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wider transition-all ${tab === 'all'
                                ? 'bg-white text-[#1A2B3C] shadow-sm ring-1 ring-slate-200/50'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {hasRole('admin', 'hr', 'manager') ? 'All Requests' : 'All'}
                    </button>
                    <button
                        onClick={() => setTab('my')}
                        className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wider transition-all ${tab === 'my'
                                ? 'bg-white text-[#1A2B3C] shadow-sm ring-1 ring-slate-200/50'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My Leaves
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search employee or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm transition-colors text-slate-800 font-medium"
                    />
                </div>
            </div>

            {/* Data Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Clock4 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A2B3C]">No Leave Requests</h3>
                    <p className="text-sm text-slate-500 mt-1">There are no leave requests matching your current filters.</p>
                </div>
            ) : (
                <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Leave Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    {hasRole('admin', 'hr', 'manager') && tab === 'all' && (
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-[#1A2B3C] text-white flex items-center justify-center text-xs font-bold">
                                                    {(req.employee || 'U')[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800">{req.employee}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                                {req.leave_type}
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
                                                        <button
                                                            onClick={() => handleAction(req.id, 'approve')}
                                                            className="flex items-center justify-center w-8 h-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-200/50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'reject')}
                                                            className="flex items-center justify-center w-8 h-8 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/50"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" strokeWidth={2.5} />
                                                        </button>
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
            )}
        </div>
    );
}
