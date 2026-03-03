import { useState } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.new_password !== form.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await API.put('/auth/change-password/', {
                old_password: form.old_password,
                new_password: form.new_password,
            });
            setSuccess('Password changed successfully! Redirecting...');
            setForm({ old_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => navigate('/profile'), 1500);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                setError(messages.join(' | '));
            } else {
                setError('Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={form.old_password}
                            onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={form.new_password}
                            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={form.confirm_password}
                            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
