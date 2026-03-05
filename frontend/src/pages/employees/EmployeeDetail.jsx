import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    Mail,
    Phone,
    Building2,
    Calendar,
    MapPin,
    BadgeCheck,
    ShieldCheck,
    Edit2,
    ChevronLeft,
    BriefcaseBusiness,
    UserCircle
} from 'lucide-react';

export default function EmployeeDetail() {
    const { id } = useParams();
    const { hasRole } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get(`/employees/${id}/`)
            .then((res) => setEmployee(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="max-w-4xl mx-auto glass-panel p-12 text-center rounded-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-[#1A2B3C]">Employee Not Found</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">The employee record you are looking for does not exist or you do not have permission to view it.</p>
                <Link to="/employees" className="mt-6 px-6 py-2.5 bg-[#1A2B3C] text-white rounded-lg font-bold hover:bg-[#0F172A] transition-colors shadow-lg shadow-[#1A2B3C]/20 border border-[#1A2B3C]">
                    Return to Directory
                </Link>
            </div>
        );
    }

    const username = employee.user?.username || 'Unknown User';
    const email = employee.user?.email || 'No email registered';
    const avatarUrl = employee?.profile_picture
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=128&background=1A2B3C&color=fff&bold=true&font-size=0.4`;

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
            {/* Nav & Header Area */}
            <div className="flex items-center justify-between mb-8">
                <Link to="/employees" className="flex items-center gap-2 p-2 pr-4 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#1A2B3C] hover:bg-slate-50 transition-colors shadow-sm font-semibold text-sm">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Directory
                </Link>

                {hasRole('admin', 'hr') && (
                    <Link
                        to={`/employees/${id}/edit`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#1A2B3C] rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm"
                        title="Edit Employee"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Record
                    </Link>
                )}
            </div>

            {/* Identity Card */}
            <div className="glass-navy rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-[#1A2B3C]/10 border border-[#1A2B3C]/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    <img
                        src={avatarUrl}
                        alt={username}
                        className="w-28 h-28 rounded-2xl shadow-xl border-2 border-white/10 object-cover shrink-0 bg-[#0F172A]"
                    />
                    <div className="text-center md:text-left flex-1 min-w-0 flex flex-col justify-center h-full pt-1">
                        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{username}</h1>
                        <p className="text-[#93C5FD] font-semibold mt-1 text-lg flex items-center justify-center md:justify-start gap-2">
                            <BriefcaseBusiness className="w-4 h-4" />
                            {employee.designation || 'No Designation Assigned'}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-emerald-400">
                                <ShieldCheck className="w-4 h-4" />
                                Role: {employee.user?.role || 'None'}
                            </span>
                            {employee.employee_code && (
                                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-wider text-slate-200">
                                    <BadgeCheck className="w-4 h-4 text-[#60A5FA]" />
                                    ID: {employee.employee_code}
                                </span>
                            )}
                            {employee.department && (
                                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-wider text-slate-200">
                                    <Building2 className="w-4 h-4 text-amber-400" />
                                    Dept: {employee.department_name || 'Unassigned'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Credentials (Added) */}
                <div className="glass-panel rounded-2xl p-6 md:col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-slate-400" />
                    </div>
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        System Access Credentials
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        <InfoRow icon={UserCircle} label="System Username" value={username} />
                        <InfoRow icon={Mail} label="Registered Email" value={email} />
                        <InfoRow
                            icon={ShieldCheck}
                            label="Access Level"
                            value={
                                <span className="capitalize px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    {employee.user?.role || 'Unassigned'}
                                </span>
                            }
                        />
                    </div>
                </div>

                {/* Personal Information */}
                <div className="glass-panel rounded-2xl p-6 hover-lift relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-bl-[100px] pointer-events-none" />
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                        <Mail className="w-4 h-4 text-[#2563EB]" />
                        Contact Information
                    </h2>
                    <div className="space-y-6 relative z-10">
                        <InfoRow icon={Phone} label="Contact Phone" value={employee.phone || '—'} />
                        <InfoRow icon={MapPin} label="Residential Address" value={employee.address || '—'} />
                        <InfoRow icon={MapPin} label="City / Region" value={employee.city || '—'} />
                    </div>
                </div>

                {/* Work Information */}
                <div className="glass-panel rounded-2xl p-6 hover-lift relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                        <BriefcaseBusiness className="w-4 h-4 text-emerald-500" />
                        Professional Details
                    </h2>
                    <div className="space-y-6 relative z-10">
                        <InfoRow icon={BadgeCheck} label="Employee ID" value={employee.employee_code || '—'} />
                        <InfoRow icon={BriefcaseBusiness} label="Current Designation" value={employee.designation || '—'} />
                        <InfoRow icon={Building2} label="Assigned Department" value={
                            employee.department_name || '—'
                        } />
                        <InfoRow icon={Calendar} label="Date of Joining" value={employee.date_of_joining || '—'} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="glass-panel rounded-2xl p-6 hover-lift md:col-span-2 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/5 transform skew-x-[-20deg] pointer-events-none translate-x-12" />
                    <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                        <Phone className="w-4 h-4 text-rose-500" />
                        Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                        <InfoRow icon={UserCircle} label="Contact Name" value={employee.emergency_contact_name || '—'} />
                        <InfoRow icon={Phone} label="Contact Phone Number" value={employee.emergency_contact_phone || '—'} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] transition-colors border border-slate-100 group-hover:border-[#2563EB]/20 shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <div className="text-sm font-semibold text-[#1A2B3C] truncate">{value}</div>
            </div>
        </div>
    );
}
