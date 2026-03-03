import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus } from 'react-icons/hi';

export default function LeaveTypeList() {
    const { hasRole } = useAuth();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', max_days_per_year: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchTypes = async () => {
        try {
            const res = await API.get('/leaves/types/');
            setTypes(res.data.results ?? res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchTypes(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const res = await API.post('/leaves/types/', {
                name: form.name,
                max_days_per_year: parseInt(form.max_days_per_year),
            });
            setTypes((prev) => [...prev, res.data]);
            setForm({ name: '', max_days_per_year: '' });
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Leave Types</h1>
                {hasRole('admin', 'hr') && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Type
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                    {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-3 text-sm">{error}</div>}
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text" placeholder="Leave type name" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            required
                        />
                        <input
                            type="number" placeholder="Max days/year" value={form.max_days_per_year}
                            onChange={(e) => setForm({ ...form, max_days_per_year: e.target.value })}
                            className="w-full sm:w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            required min="1"
                        />
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Create'}
                        </button>
                    </form>
                </div>
            )}

            {types.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No leave types found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {types.map((t) => (
                        <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-800">{t.name}</h3>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">{t.max_days_per_year}</p>
                            <p className="text-xs text-gray-400">days per year</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
