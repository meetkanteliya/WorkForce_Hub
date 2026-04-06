import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardLeavesPending, selectDashboardLeavesPending } from '../../store/slices/dashboardSlice';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function DashboardLeavesPending() {
    const dispatch = useDispatch();
    const { list: leaves, loading } = useSelector(selectDashboardLeavesPending);

    useEffect(() => {
        dispatch(fetchDashboardLeavesPending());
    }, [dispatch]);

    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Pending Leave Requests</h1>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : leaves.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">No pending leave requests 🎉</div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaves.map((l) => (
                                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-800">{l.employee_name}</p>
                                        <p className="text-xs text-gray-400 font-mono">{l.employee_code}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.department_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.leave_type_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.start_date} → {l.end_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[180px] truncate">{l.reason || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[l.status] || ''}`}>{l.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
