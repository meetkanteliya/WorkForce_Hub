import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardLeaveOverview, selectDashboardLeaveOverview } from '../../store/slices/dashboardSlice';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function DashboardLeaveOverview() {
    const dispatch = useDispatch();
    const { data, loading } = useSelector(selectDashboardLeaveOverview);

    useEffect(() => {
        dispatch(fetchDashboardLeaveOverview());
    }, [dispatch]);

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    const statusColors = { pending: 'from-amber-500 to-orange-500', approved: 'from-emerald-500 to-green-500', rejected: 'from-rose-500 to-red-500' };

    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Leave Overview</h1>

            {/* Status cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {Object.entries(data?.status_counts || {}).map(([status, count]) => (
                    <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider capitalize">{status}</p>
                        <div className="flex items-end gap-3 mt-1">
                            <span className="text-3xl font-extrabold text-gray-800">{count}</span>
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusColors[status]} mb-2`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* By Leave Type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">By Leave Type</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Max Days</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-yellow-600 uppercase">Pending</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-green-600 uppercase">Approved</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-red-600 uppercase">Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(data?.by_type || []).map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{t.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{t.max_days_per_year}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-center">{t.total_requests}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-yellow-600 text-center">{t.pending}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-center">{t.approved}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-center">{t.rejected}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Requests</h2>
                <div className="space-y-3">
                    {(data?.recent_requests || []).map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{r.employee_name} <span className="text-gray-400">—</span> {r.leave_type_name}</p>
                                <p className="text-xs text-gray-400">{r.start_date} → {r.end_date}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${r.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>{r.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
