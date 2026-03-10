import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus } from 'react-icons/hi';

export default function SalaryList() {
    const { hasRole } = useAuth();
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'my' ? '/payroll/my/' : '/payroll/';
            const res = await API.get(endpoint);
            setSalaries(res.data.results ?? res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchSalaries(); 
        setCurrentPage(1);
    }, [tab]);

    const totalItems = salaries.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentSalaries = salaries.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payroll</h1>
                {hasRole('admin') && (
                    <Link
                        to="/payroll/new"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Salary Record
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {hasRole('admin', 'hr', 'manager') ? 'All Records' : 'All'}
                </button>
                <button
                    onClick={() => setTab('my')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'my' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    My Salary
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : salaries.length === 0 ? (
                <div className="bg-white dark:bg-[#111827]/40 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                    No salary records found.
                </div>
            ) : (
                <div className="glass-panel dark:bg-[#111827]/40 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shell-panel shadow-sm flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Basic</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bonus</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deductions</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Salary</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pay Date</th>
                                    {hasRole('admin') && (
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {currentSalaries.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">{s.employee_name || `#${s.employee}`}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.department_name || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-right">₹{Number(s.basic_salary).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-green-600 dark:text-emerald-400 text-right">+₹{Number(s.bonus).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-red-600 dark:text-rose-400 text-right">-₹{Number(s.deductions).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white text-right">₹{Number(s.net_salary).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.pay_date}</td>
                                        {hasRole('admin') && (
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to={`/payroll/${s.id}/edit`}
                                                    className="text-indigo-600 dark:text-[#10B981] hover:underline text-sm font-medium"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-transparent border-t border-gray-200 dark:border-slate-800 rounded-b-xl">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span>–<span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> records
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
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                            currentPage === page 
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
                    )}
                </div>
            )}
        </div>
    );
}
