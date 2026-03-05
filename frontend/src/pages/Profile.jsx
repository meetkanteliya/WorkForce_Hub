import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import {
    Mail,
    Phone,
    Building2,
    Calendar,
    MapPin,
    BadgeCheck,
    ShieldCheck,
    Edit2,
    Check,
    X,
    Wallet,
    BriefcaseBusiness,
    UserCircle,
    Camera,
} from 'lucide-react';

export default function Profile() {
    const { user, login, setProfilePic } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [salarySummary, setSalarySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchProfileData = async () => {
        try {
            const [empRes, payrollRes] = await Promise.all([
                API.get('/employees/me/'),
                API.get('/payroll/my/').catch(() => ({ data: [] }))
            ]);

            setEmployee(empRes.data);
            setFormData(empRes.data);

            const payslips = payrollRes.data;
            if (payslips && payslips.length > 0) {
                // Get most recent payslip
                setSalarySummary(payslips[0]);
            }
        } catch (err) {
            console.error("Failed to fetch profile data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleEditToggle = () => {
        if (isEditing) {
            setFormData(employee);
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                email: formData.user?.email,
            };

            if (typeof payload.department === 'object' && payload.department !== null) {
                payload.department_id = payload.department.id;
                delete payload.department;
            }
            delete payload.user;

            await API.patch('/employees/me/update/', payload);
            await fetchProfileData();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save profile: " + (err.response?.data?.detail || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    // ─── Crop state (must be before any conditional returns!) ───
    const [cropImage, setCropImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [uploading, setUploading] = useState(false);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const avatarUrl = employee?.profile_picture
        ? employee.profile_picture
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&size=128&background=1A2B3C&color=fff&bold=true&font-size=0.4`;
    const canEditWorkInfo = user?.role !== 'employee';

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCropImage(reader.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const getCroppedBlob = (imageSrc, pixelCrop) => {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = pixelCrop.width;
                canvas.height = pixelCrop.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    image,
                    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
                    0, 0, pixelCrop.width, pixelCrop.height
                );
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
            };
            image.src = imageSrc;
        });
    };

    const handleCropSave = async () => {
        if (!cropImage || !croppedAreaPixels) return;
        setUploading(true);
        try {
            const blob = await getCroppedBlob(cropImage, croppedAreaPixels);
            const formData = new FormData();
            formData.append('profile_picture', blob, 'profile.jpg');
            await API.patch('/employees/me/update/', formData);
            await fetchProfileData();
            // Sync profile picture globally (sidebar etc.)
            const empRes = await API.get('/employees/me/');
            if (empRes.data?.profile_picture) setProfilePic(empRes.data.profile_picture);
            setCropImage(null);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload picture');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
            {/* Header / Self-Service Identity Card */}
            <div className="glass-navy rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-[#1A2B3C]/10 border border-[#1A2B3C]/10">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-white/10 pb-8 mb-8">
                    <div className="relative group">
                        <img
                            src={avatarUrl}
                            alt={user?.username}
                            onClick={() => setShowPreview(true)}
                            className="w-28 h-28 rounded-2xl shadow-xl border-2 border-white/10 object-cover shrink-0 bg-[#0F172A] cursor-pointer hover:brightness-110 transition"
                        />
                        {isEditing && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Edit2 className="w-5 h-5 text-white" />
                                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </label>
                        )}
                    </div>

                    {/* Full-size Image Preview */}
                    {showPreview && (
                        <div
                            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center cursor-pointer animate-fade-in"
                            onClick={() => setShowPreview(false)}
                        >
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <img
                                    src={avatarUrl}
                                    alt={user?.username}
                                    className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
                                />
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Crop Modal */}
                    {cropImage && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fade-in">
                            <div className="relative w-[90vw] max-w-md h-[70vh] max-h-[400px]">
                                <Cropper
                                    image={cropImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <input
                                    type="range" min={1} max={3} step={0.05} value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-40 accent-[#2563EB]"
                                />
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setCropImage(null)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                                >Cancel</button>
                                <button
                                    onClick={handleCropSave}
                                    disabled={uploading}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-lg shadow-[#2563EB]/30 transition-all disabled:opacity-50"
                                >{uploading ? 'Saving...' : 'Save'}</button>
                            </div>
                        </div>
                    )}
                    <div className="text-center md:text-left flex-1 min-w-0 flex flex-col justify-center h-full pt-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{user?.username}</h1>
                                <p className="text-[#93C5FD] font-semibold mt-1 text-lg flex items-center justify-center md:justify-start gap-2">
                                    <BriefcaseBusiness className="w-4 h-4" />
                                    {employee?.designation || 'No designation'}
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center md:justify-end">
                                <button
                                    onClick={handleEditToggle}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm border ${isEditing
                                        ? 'bg-white text-[#1A2B3C] border-white'
                                        : 'bg-[#1A2B3C] hover:bg-[#0F172A] text-white border-white/10'
                                        }`}
                                >
                                    {isEditing ? (
                                        <><X className="w-4 h-4" /> Cancel</>
                                    ) : (
                                        <><Edit2 className="w-4 h-4" /> Edit Profile</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-wider text-emerald-400">
                                <ShieldCheck className="w-4 h-4" />
                                Role: {user?.role || 'None'}
                            </span>
                            {employee?.employee_code && (
                                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-wider text-slate-200">
                                    <BadgeCheck className="w-4 h-4 text-[#60A5FA]" />
                                    ID: {employee.employee_code}
                                </span>
                            )}
                            {employee?.department && (
                                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold tracking-wider text-slate-200">
                                    <Building2 className="w-4 h-4 text-amber-400" />
                                    Dept: {employee?.department_name || 'Unassigned'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Salary Summary Strip */}
                <div className="bg-[#0F172A]/50 rounded-xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#2563EB]/20 flex items-center justify-center shrink-0">
                            <Wallet className="w-5 h-5 text-[#60A5FA]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">My Salary Summary</p>
                            {salarySummary ? (
                                <p className="text-sm font-medium text-slate-300">
                                    Latest payslip: <span className="text-white font-semibold">{salarySummary.month} {salarySummary.year}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400">No recent salary data available.</p>
                            )}
                        </div>
                    </div>
                    {salarySummary && (
                        <div className="flex items-center gap-6">
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-400">Net Pay</p>
                                    <p className="text-2xl font-black text-emerald-400 tracking-tight leading-none mt-1">
                                        ₹{Number(salarySummary.net_salary).toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
                            </div>
                            <Link
                                to="/my-salary"
                                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold text-white transition-colors border border-white/10 shadow-sm"
                            >
                                View All
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {employee ? (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">

                    {/* User Credentials Panel */}
                    <div className="glass-panel rounded-2xl p-6 md:col-span-2 relative overflow-hidden group hover-lift">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck className="w-24 h-24 text-slate-400" />
                        </div>
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                            System Access Credentials
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                            <InfoField icon={UserCircle} label="System Username" value={user?.username || '—'} isEditing={false} />
                            <InfoField
                                icon={Mail}
                                label="Registered Email"
                                name="email"
                                value={isEditing ? formData.email || formData.user?.email || '' : user?.email || '—'}
                                onChange={handleChange}
                                isEditing={isEditing}
                            />
                            <InfoField
                                icon={ShieldCheck}
                                label="Access Level"
                                value={
                                    <span className="capitalize px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-[#1A2B3C] border border-slate-200 shadow-sm shadow-slate-200/50">
                                        {user?.role || 'Unassigned'}
                                    </span>
                                }
                                isEditing={false}
                            />
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="glass-panel rounded-2xl p-6 hover-lift relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Phone className="w-4 h-4 text-amber-500" />
                            Contact Information
                        </h2>
                        <div className="space-y-6">
                            <InfoField
                                icon={Phone} label="Contact Phone" name="phone"
                                value={isEditing ? formData.phone || '' : employee.phone || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                            <InfoField
                                icon={MapPin} label="Residential Address" name="address"
                                value={isEditing ? formData.address || '' : employee.address || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                            <InfoField
                                icon={MapPin} label="City / Region" name="city"
                                value={isEditing ? formData.city || '' : employee.city || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className="glass-panel rounded-2xl p-6 hover-lift relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
                        {!canEditWorkInfo && isEditing && (
                            <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-4 py-2 rounded-bl-xl border-b border-l border-slate-200 shadow-sm">
                                LOCKED BY HR
                            </div>
                        )}
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <BriefcaseBusiness className="w-4 h-4 text-emerald-500" />
                            Professional Details
                        </h2>
                        <div className="space-y-6">
                            <InfoField
                                icon={BadgeCheck} label="Employee ID" name="employee_code"
                                value={isEditing ? formData.employee_code || '' : employee.employee_code || '—'}
                                onChange={handleChange} isEditing={isEditing && canEditWorkInfo}
                            />
                            <InfoField
                                icon={BriefcaseBusiness} label="Current Designation" name="designation"
                                value={isEditing ? formData.designation || '' : employee.designation || '—'}
                                onChange={handleChange} isEditing={isEditing && canEditWorkInfo}
                            />
                            <InfoField
                                icon={Building2} label="Assigned Department" name="department"
                                value={
                                    typeof employee.department === 'object' ? employee.department?.name : employee.department || '—'
                                }
                                isEditing={false}
                            />
                            <InfoField
                                icon={Calendar} label="Date of Joining" name="date_of_joining" type="date"
                                value={isEditing ? formData.date_of_joining || '' : employee.date_of_joining || '—'}
                                onChange={handleChange} isEditing={isEditing && canEditWorkInfo}
                            />
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="glass-panel rounded-2xl p-6 hover-lift md:col-span-2 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/5 transform skew-x-[-20deg] pointer-events-none translate-x-12" />
                        <h2 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Phone className="w-4 h-4 text-rose-500" />
                            Emergency Contact
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <InfoField
                                icon={UserCircle} label="Contact Name" name="emergency_contact_name"
                                value={isEditing ? formData.emergency_contact_name || '' : employee.emergency_contact_name || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                            <InfoField
                                icon={Phone} label="Contact Phone Number" name="emergency_contact_phone"
                                value={isEditing ? formData.emergency_contact_phone || '' : employee.emergency_contact_phone || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                        </div>
                    </div>

                    {/* Fixed Save Bar */}
                    {isEditing && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 lg:pl-64 flex justify-end gap-3 px-6 animate-slide-up">
                            <button
                                type="button"
                                onClick={handleEditToggle}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-transparent"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-[#1A2B3C] hover:bg-[#0F172A] shadow-lg shadow-[#1A2B3C]/20 border border-[#1A2B3C] transition-all focus:ring-4 focus:ring-[#1A2B3C]/10 target:scale-[0.98]"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" strokeWidth={3} /> Save Profile Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 text-amber-800 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Onboarding Incomplete</h4>
                        <p className="text-sm font-medium leading-relaxed">
                            No active employee record is linked to your account. Please contact Human Resources or your Administrator to finalize your onboarding process.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoField({ icon: Icon, label, name, value, type = "text", onChange, isEditing }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className={`mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${isEditing ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20' : 'bg-slate-50 text-slate-400 group-hover:bg-[#2563EB]/10 group-hover:text-[#2563EB] border-slate-100 group-hover:border-[#2563EB]/20'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                {isEditing ? (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all text-sm font-bold text-[#1A2B3C] shadow-sm placeholder:font-medium placeholder:text-slate-400"
                    />
                ) : (
                    <div className="text-sm font-bold text-[#1A2B3C] truncate">{value}</div>
                )}
            </div>
        </div>
    );
}
