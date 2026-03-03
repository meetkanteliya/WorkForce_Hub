import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineCurrencyDollar, HiOutlineUserAdd, HiOutlineBriefcase } from 'react-icons/hi';

const iconMap = { leave_request: HiOutlineCalendar, salary_paid: HiOutlineCurrencyDollar, new_employee: HiOutlineUserAdd };
const colorMap = { leave_request: 'text-amber-500 bg-amber-50', salary_paid: 'text-violet-500 bg-violet-50', new_employee: 'text-emerald-500 bg-emerald-50' };

export default function DashboardActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/dashboard/activity/')
            .then((res) => setActivities(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h1>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="space-y-4">
                    {activities.map((act, i) => {
                        const Icon = iconMap[act.type] || HiOutlineBriefcase;
                        const color = colorMap[act.type] || 'text-gray-500 bg-gray-50';
                        return (
                            <div key={i} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{act.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{act.detail}</p>
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        {new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {act.status && (
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${act.status === 'approved' ? 'bg-green-100 text-green-600' :
                                            act.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                'bg-yellow-100 text-yellow-600'
                                        }`}>{act.status}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
