import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchLeaveTypes,
    fetchMyBalances,
    createLeaveRequest,
    clearLeaveFormError,
    selectLeaveTypes,
    selectMyBalances,
    selectLeaveFormLoading,
    selectLeaveFormError,
} from '../../store/slices/leaveSlice';
import dayjs from 'dayjs';

export default function LeaveRequestForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const leaveTypes = useSelector(selectLeaveTypes);
    const balances = useSelector(selectMyBalances);
    const loading = useSelector(selectLeaveFormLoading);
    const error = useSelector(selectLeaveFormError);

    const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' });

    useEffect(() => {
        dispatch(fetchLeaveTypes());
        dispatch(fetchMyBalances());
        dispatch(clearLeaveFormError());
        return () => dispatch(clearLeaveFormError());
    }, [dispatch]);

    // Provide quick lookup for balances based on leave_type ID
    const balanceMap = useMemo(() => {
        const map = {};
        balances.forEach((b) => {
            map[b.leave_type.id] = b;
        });
        return map;
    }, [balances]);

    // Calculate days requested instantly
    const daysRequested = useMemo(() => {
        if (!form.start_date || !form.end_date) return 0;
        const start = dayjs(form.start_date);
        const end = dayjs(form.end_date);
        const diff = end.diff(start, 'day') + 1; // inclusive
        return diff > 0 ? diff : 0;
    }, [form.start_date, form.end_date]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearLeaveFormError());

        if (daysRequested <= 0) {
            // Use local validation for this edge case
            return;
        }

        const selectedBalance = balanceMap[form.leave_type];
        if (selectedBalance) {
            const available = selectedBalance.allocated_days - selectedBalance.used_days;
            if (daysRequested > available) {
                // This is client-side validation; we don't need to dispatch for it
                return;
            }
        }

        try {
            await dispatch(createLeaveRequest(form)).unwrap();
            navigate('/leaves');
        } catch {
            // Error set in Redux state
        }
    };

    // Client-side validation messages (separate from server errors)
    const clientError = useMemo(() => {
        if (daysRequested <= 0 && form.start_date && form.end_date) {
            return "End date must be the same as or after the start date.";
        }
        const selectedBalance = balanceMap[form.leave_type];
        if (selectedBalance && daysRequested > 0) {
            const available = selectedBalance.allocated_days - selectedBalance.used_days;
            if (daysRequested > available) {
                return `Insufficient balance. You only have ${available} days available for this leave type.`;
            }
        }
        return null;
    }, [form.leave_type, daysRequested, balanceMap, form.start_date, form.end_date]);

    const displayError = error || clientError;

    return (
        <div className="max-w-3xl mx-auto animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Apply for Leave</h1>

                    {displayError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2 border border-red-100">
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            <span>{displayError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leave Type</label>
                            <select
                                value={form.leave_type}
                                onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                                required
                            >
                                <option value="">Select leave type</option>
                                {leaveTypes.map((t) => {
                                    const b = balanceMap[t.id];
                                    const available = b ? b.allocated_days - b.used_days : t.max_days_per_year;
                                    return (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({available} days available)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800"
                                    required
                                />
                            </div>
                        </div>

                        {daysRequested > 0 && (
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl text-sm font-medium border border-indigo-100 flex justify-between items-center">
                                <span>Duration requested:</span>
                                <span className="text-lg font-bold">{daysRequested} {daysRequested === 1 ? 'day' : 'days'}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason</label>
                            <textarea
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-gray-800 placeholder-gray-400"
                                placeholder="Please provide a brief reason for your leave request..."
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading || !!clientError}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 cursor-pointer"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/leaves')}
                                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Sidebar with Balance Info */}
            <div className="md:col-span-1 space-y-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <h3 className="text-lg font-bold mb-4 relative z-10">Your Balances</h3>

                    {balances.length === 0 ? (
                        <p className="text-indigo-100 text-sm relative z-10">No balances loaded.</p>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            {balances.map(b => {
                                const available = b.allocated_days - b.used_days;
                                const isLow = available <= 2;
                                return (
                                    <div key={b.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold">{b.leave_type.name}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-red-400/20 text-red-100' : 'bg-green-400/20 text-green-100'}`}>
                                                {available} remaining
                                            </span>
                                        </div>
                                        <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isLow ? 'bg-red-400' : 'bg-green-400'}`}
                                                style={{ width: `${(available / b.allocated_days) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
