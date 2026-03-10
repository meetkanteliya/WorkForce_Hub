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
    Hash,
    AtSign,
    AlertCircle
} from 'lucide-react';

export default function Profile() {
    const { user, login, setProfilePic } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [salarySummary, setSalarySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showPreview, setShowPreview] = useState(false);

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

    const handleSaveClick = (e) => {
        e.preventDefault();
        setShowSaveModal(true);
    };

    const confirmSave = async () => {
        setShowSaveModal(false);
        setSaving(true);
        try {
            const payload = {
                ...formData,
            };

            if (typeof payload.department === 'object' && payload.department !== null) {
                payload.department_id = payload.department.id;
            }
            delete payload.department;
            delete payload.user;
            delete payload.profile_picture; // Prevents generic file validation error on URL strings

            await API.patch('/employees/me/update/', payload);
            await fetchProfileData();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save profile: " + (err.response?.data?.detail || JSON.stringify(err.response?.data) || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    const cancelSave = () => {
        setShowSaveModal(false);
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
            <div className="bg-[#0B1120] rounded-2xl overflow-hidden shadow-xl border border-slate-800/60 relative">
                {/* Banner Background */}
                <div className="h-32 bg-gradient-to-r from-emerald-900/30 via-[#0B1120] to-[#0B1120] border-b border-emerald-900/20" />

                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
                    <div className="relative group -mt-12">
                        <img
                            src={avatarUrl}
                            alt={user?.username}
                            onClick={() => setShowPreview(true)}
                            className="w-28 h-28 rounded-full shadow-2xl border-4 border-[#0B1120] object-cover shrink-0 bg-[#0F172A] cursor-pointer hover:brightness-110 transition"
                        />
                        {isEditing && (
                            <label className="absolute inset-x-0 bottom-0 top-0 m-1 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
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
                                    className="w-40 accent-emerald-500"
                                />
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setCropImage(null)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                                >Cancel</button>
                                <button
                                    onClick={handleCropSave}
                                    disabled={uploading}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50"
                                >{uploading ? 'Saving...' : 'Save'}</button>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 mt-2 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{user?.username}</h1>
                        <p className="text-slate-400 font-medium mt-1 text-sm">
                            {employee?.designation || 'No designation'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#052E16] text-emerald-400 text-[11px] font-bold tracking-wide border border-emerald-900/50">
                                <ShieldCheck className="w-3 h-3" />
                                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'None'}
                            </span>
                            {employee?.employee_code && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-[11px] font-bold tracking-wide border border-slate-700/50 uppercase">
                                    <Hash className="w-3 h-3 text-slate-400" />
                                    {employee.employee_code}
                                </span>
                            )}
                            {employee?.department && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-[11px] font-bold tracking-wide border border-slate-700/50">
                                    <UserCircle className="w-3 h-3 text-slate-400" />
                                    {employee?.department_name || 'Unassigned'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 md:mt-2">
                        <button
                            onClick={handleEditToggle}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm border ${isEditing
                                ? 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                                : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/20'
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
            </div>

            {employee ? (
                <form onSubmit={handleSaveClick} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">

                    {/* User Credentials Panel */}
                    <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 relative">
                        <h2 className="text-[13px] font-bold text-slate-200 flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            System Access Credentials
                        </h2>
                        <div className="space-y-5">
                            <InfoField icon={AtSign} label="System Username" value={user?.username || '—'} isEditing={false} />
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
                                    <span className="capitalize px-2.5 py-1 rounded text-xs font-bold bg-slate-800/50 text-slate-300 border border-slate-700/50">
                                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'None'}
                                    </span>
                                }
                                isEditing={false}
                            />
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 relative">
                        <h2 className="text-[13px] font-bold text-slate-200 flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <Phone className="w-4 h-4 text-blue-500" />
                            Contact Information
                        </h2>
                        <div className="space-y-5">
                            <InfoField
                                icon={Phone} label="Phone Number" name="phone"
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
                    <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 relative">
                        {!canEditWorkInfo && isEditing && (
                            <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-slate-700 shadow-sm z-10">
                                CUSTOM
                            </div>
                        )}
                        <h2 className="text-[13px] font-bold text-slate-200 flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <BriefcaseBusiness className="w-4 h-4 text-amber-500" />
                            Professional Details
                        </h2>
                        <div className="space-y-5">
                            <InfoField
                                icon={Hash} label="Employee ID" name="employee_code"
                                value={isEditing ? formData.employee_code || '' : employee.employee_code || '—'}
                                onChange={handleChange} isEditing={isEditing && canEditWorkInfo}
                            />
                            <InfoField
                                icon={BadgeCheck} label="Current Designation" name="designation"
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
                    <div className="bg-[#0B1120] border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-start">
                        <h2 className="text-[13px] font-bold text-slate-200 flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            Emergency Contact
                        </h2>
                        <div className="space-y-5">
                            <InfoField
                                icon={UserCircle} label="Emergency Contact Name" name="emergency_contact_name"
                                value={isEditing ? formData.emergency_contact_name || '' : employee.emergency_contact_name || '—'}
                                onChange={handleChange} isEditing={isEditing}
                            />
                            <InfoField
                                icon={Phone} label="Emergency Phone Number" name="emergency_contact_phone"
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

            {/* Custom Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                                <Check className="w-8 h-8 text-emerald-500" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Save Changes</h3>
                            <p className="text-sm text-slate-500 max-w-[260px] mx-auto">
                                Are you sure you want to apply these profile changes?
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={cancelSave}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmSave}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-sm shadow-emerald-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                Yes, Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoField({ icon: Icon, label, name, value, type = "text", onChange, isEditing }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-800/40 border border-slate-700/50 text-slate-400">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 mb-0.5">{label}</p>
                {isEditing ? (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={(e) => {
                            if (name === 'phone' || name === 'emergency_contact_phone') {
                                const val = e.target.value;
                                if (val && !/^[0-9+() -]*$/.test(val)) return;

                                // Restrict to max 10 digits
                                const digitsOnly = val.replace(/[^0-9]/g, '');
                                if (digitsOnly.length > 10) return;
                            }
                            onChange(e);
                        }}
                        className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-[13px] font-semibold text-slate-200 placeholder:text-slate-600"
                    />
                ) : (
                    <div className="text-[13px] font-bold text-slate-200 truncate">{value}</div>
                )}
            </div>
        </div>
    );
}
