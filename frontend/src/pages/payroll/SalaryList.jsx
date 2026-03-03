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

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'my' ? '/payroll/my/' : '/payroll/';
            const res = await API.get(endpoint);
            setSalaries(res.data.results ?? res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchSalaries(); }, [tab]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
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
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {hasRole('admin', 'hr', 'manager') ? 'All Records' : 'All'}
                </button>
                <button
                    onClick={() => setTab('my')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'my' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    No salary records found.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonus</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay Date</th>
                                {hasRole('admin') && (
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {salaries.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{s.employee_name || `#${s.employee}`}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.department_name || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{Number(s.basic_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-green-600 text-right">+₹{Number(s.bonus).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 text-right">-₹{Number(s.deductions).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">₹{Number(s.net_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{s.pay_date}</td>
                                    {hasRole('admin') && (
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/payroll/${s.id}/edit`}
                                                className="text-indigo-600 hover:underline text-sm font-medium"
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
            )}
        </div>
    );
}
