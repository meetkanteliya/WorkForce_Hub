import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function DashboardPayroll() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/dashboard/payroll/overview/')
            .then((res) => setData(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Payroll Overview</h1>

            {/* Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Net', value: data?.totals?.net, color: 'from-indigo-500 to-purple-500' },
                    { label: 'Total Basic', value: data?.totals?.basic, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Total Bonus', value: data?.totals?.bonus, color: 'from-emerald-500 to-green-500' },
                    { label: 'Deductions', value: data?.totals?.deductions, color: 'from-rose-500 to-red-500' },
                    { label: 'Average Net', value: data?.totals?.average_net, color: 'from-amber-500 to-orange-500' },
                ].map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                        <p className="text-lg font-extrabold text-gray-800 mt-1">₹{Number(card.value || 0).toLocaleString()}</p>
                        <div className={`w-full h-1 rounded-full bg-gradient-to-r ${card.color} mt-2 opacity-60`} />
                    </div>
                ))}
            </div>

            {/* Department breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">By Department</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Headcount</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Average</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(data?.by_department || []).map((d) => (
                                <tr key={d.department} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{d.department}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{d.headcount}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">₹{Number(d.total).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{Number(d.average).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent payouts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Payouts</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Basic</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-green-600 uppercase">Bonus</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-red-600 uppercase">Deductions</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Net</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(data?.recent_payouts || []).map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.employee_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.department_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{Number(p.basic_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-green-600 text-right">+₹{Number(p.bonus).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-red-500 text-right">-₹{Number(p.deductions).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">₹{Number(p.net_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{p.pay_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
