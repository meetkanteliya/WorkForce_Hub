import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import {
    HiOutlineArrowLeft,
    HiOutlineCalendar,
    HiOutlineCurrencyDollar,
    HiOutlineUserAdd,
    HiOutlineBriefcase,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineCog,
} from 'react-icons/hi';

const iconMap = {
    leave_request: HiOutlineCalendar,
    leave_approved: HiOutlineCheckCircle,
    leave_rejected: HiOutlineXCircle,
    salary_paid: HiOutlineCurrencyDollar,
    employee_added: HiOutlineUserAdd,
    profile_updated: HiOutlineCog,
};

const colorMap = {
    leave_request: 'text-amber-500 bg-amber-50',
    leave_approved: 'text-emerald-500 bg-emerald-50',
    leave_rejected: 'text-rose-500 bg-rose-50',
    salary_paid: 'text-violet-500 bg-violet-50',
    employee_added: 'text-blue-500 bg-blue-50',
    profile_updated: 'text-slate-500 bg-slate-50',
};

const badgeMap = {
    leave_request: { text: 'Requested', cls: 'bg-amber-100 text-amber-700' },
    leave_approved: { text: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
    leave_rejected: { text: 'Rejected', cls: 'bg-rose-100 text-rose-700' },
    salary_paid: { text: 'Payroll', cls: 'bg-violet-100 text-violet-700' },
    employee_added: { text: 'New Hire', cls: 'bg-blue-100 text-blue-700' },
    profile_updated: { text: 'Updated', cls: 'bg-slate-100 text-slate-600' },
};

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
                    {activities.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <HiOutlineBriefcase className="w-8 h-8 text-slate-200" />
                            <span className="text-sm font-medium">No activity recorded yet.</span>
                        </div>
                    ) : (
                        activities.map((act, i) => {
                            const Icon = iconMap[act.action_type] || HiOutlineBriefcase;
                            const color = colorMap[act.action_type] || 'text-gray-500 bg-gray-50';
                            const badge = badgeMap[act.action_type] || { text: act.action_type, cls: 'bg-slate-100 text-slate-500' };
                            return (
                                <div key={act.id || i} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{act.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {act.actor_name && <span className="text-gray-500 font-semibold">{act.actor_name}</span>}
                                                {act.actor_name && ' · '}
                                                {new Date(act.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${badge.cls}`}>
                                        {badge.text}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
