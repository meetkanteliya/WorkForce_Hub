import { useState, useEffect, createElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    createEmployee,
    updateEmployee,
    clearFormError,
    selectEmployeeFormLoading,
    selectEmployeeFormError,
} from '../../store/slices/employeeSlice';
import { fetchDepartments, selectDepartmentList } from '../../store/slices/departmentSlice';
import API from '../../api/axios';
import { User, Mail, Phone, Building2, BriefcaseBusiness, Calendar, Lock, ShieldCheck, ChevronLeft } from 'lucide-react';

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);

    const formLoading = useSelector(selectEmployeeFormLoading);
    const formError = useSelector(selectEmployeeFormError);
    const departments = useSelector(selectDepartmentList);

    const [form, setForm] = useState({
        user_id: '',
        department: '',
        phone: '',
        designation: '',
        date_of_joining: '',
        email: '',
        username: '',
        password: '',
        role: 'employee',
        createNewUser: true,
    });

    // Clear form error on mount/unmount
    useEffect(() => {
        dispatch(clearFormError());
        return () => dispatch(clearFormError());
    }, [dispatch]);

    // Load departments & existing employee data for edit
    useEffect(() => {
        dispatch(fetchDepartments());

        if (isEdit) {
            API.get(`/employees/${id}/`).then((res) => {
                const e = res.data;
                setForm(prev => ({
                    ...prev,
                    user_id: e.user?.id || '',
                    department: typeof e.department === 'object' ? e.department?.id : e.department || '',
                    phone: e.phone || '',
                    designation: e.designation || '',
                    date_of_joining: e.date_of_joining || '',
                    email: e.user?.email || '',
                }));
            });
        }
    }, [id, dispatch, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearFormError());

        const payload = { ...form };

        if (!isEdit) {
            if (payload.createNewUser) {
                delete payload.user_id;
            } else {
                payload.user_id = parseInt(payload.user_id);
                delete payload.username;
                delete payload.password;
                delete payload.role;
            }
        } else {
            delete payload.createNewUser;
            delete payload.username;
            delete payload.password;
            delete payload.role;
        }

        payload.department = payload.department ? parseInt(payload.department) : null;

        try {
            if (isEdit) {
                await dispatch(updateEmployee({ id, payload })).unwrap();
            } else {
                await dispatch(createEmployee(payload)).unwrap();
            }
            navigate('/employees');
        } catch {
            // Error is set in Redux state via rejected thunk
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in pb-12">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/employees')}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#1A2B3C] hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">
                        {isEdit ? 'Edit Employee Profile' : 'Register New Employee'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isEdit ? 'Update existing employee records and department linkages.' : 'Create a new employee identity and optional system access.'}
                    </p>
                </div>
            </div>

            {formError && (
                <div className="mb-6 bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-sm flex items-start gap-3 border border-rose-200">
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-0.5">Validation Error</span>
                        {formError}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {!isEdit && (
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-bl-[100px] pointer-events-none" />

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                                User Account Setup
                            </h2>

                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                                <input
                                    type="checkbox"
                                    name="createNewUser"
                                    checked={form.createNewUser}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]/50 border-slate-300"
                                />
                                <span className="text-xs font-bold text-slate-600">Create New System User</span>
                            </label>
                        </div>

                        {form.createNewUser ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField icon={User} label="Username" name="username" value={form.username} onChange={handleChange} required />
                                <InputField icon={Lock} label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
                                <InputField icon={Mail} label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required />
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Role</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <select
                                            name="role"
                                            value={form.role}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none text-sm font-semibold text-slate-700 appearance-none shadow-sm"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="hr">HR</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <InputField icon={User} label="Existing User ID" name="user_id" type="number" value={form.user_id} onChange={handleChange} placeholder="Enter User ID" required />
                                <p className="text-xs text-slate-500 mt-2 font-medium bg-white px-3 py-2 rounded-lg inline-block border border-slate-200">
                                    Link this employee profile to a user account that has already been registered in the database.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-sm font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                        <BriefcaseBusiness className="w-4 h-4 text-emerald-500" />
                        Professional Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                </div>
                                <select
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none text-sm font-semibold text-slate-700 appearance-none shadow-sm"
                                >
                                    <option value="">Select department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <InputField icon={BriefcaseBusiness} label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior Developer" />
                        <InputField icon={Calendar} label="Date of Joining" name="date_of_joining" type="date" value={form.date_of_joining} onChange={handleChange} />
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-sm font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                        <Phone className="w-4 h-4 text-amber-500" />
                        Contact & Personal
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isEdit && (
                            <InputField icon={Mail} label="Corporate Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Update user email..." />
                        )}
                        <InputField icon={Phone} label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/employees')}
                        className="flex-1 py-3 px-4 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-[2] bg-[#1A2B3C] text-white py-3 px-4 rounded-xl font-bold hover:bg-[#0F172A] transition-all disabled:opacity-50 shadow-lg shadow-[#1A2B3C]/20 border border-[#1A2B3C]"
                    >
                        {formLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : isEdit ? 'Save Changes' : 'Register Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function InputField({ icon: Icon, label, name, type = "text", value, onChange, required, placeholder }) {
    return (
        <div className="space-y-1.5 focus-within:z-10 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {createElement(Icon, { className: "w-4 h-4 text-slate-400" })}
                </div>
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={(e) => {
                        if (name === 'phone' || name === 'emergency_contact_phone') {
                            const val = e.target.value;
                            if (val && !/^[0-9+() -]*$/.test(val)) return;
                            const digitsOnly = val.replace(/[^0-9]/g, '');
                            if (digitsOnly.length > 10) return;
                        }
                        onChange(e);
                    }}
                    required={required}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-semibold text-slate-700 shadow-sm"
                />
            </div>
        </div>
    );
}
