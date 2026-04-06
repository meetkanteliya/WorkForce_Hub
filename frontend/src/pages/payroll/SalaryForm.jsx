import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    createSalary,
    updateSalary,
    clearPayrollFormError,
    selectPayrollFormLoading,
    selectPayrollFormError,
} from '../../store/slices/payrollSlice';
import { fetchEmployees, selectEmployeeList } from '../../store/slices/employeeSlice';
import API from '../../api/axios';

export default function SalaryForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);

    const loading = useSelector(selectPayrollFormLoading);
    const error = useSelector(selectPayrollFormError);
    const employees = useSelector(selectEmployeeList);

    const [form, setForm] = useState({
        employee: '',
        basic_salary: '',
        bonus: '0',
        deductions: '0',
        pay_date: '',
    });

    useEffect(() => {
        dispatch(clearPayrollFormError());
        dispatch(fetchEmployees());
        return () => dispatch(clearPayrollFormError());
    }, [dispatch]);

    useEffect(() => {
        if (isEdit) {
            API.get(`/payroll/${id}/`).then((res) => {
                const s = res.data;
                setForm({
                    employee: s.employee,
                    basic_salary: s.basic_salary,
                    bonus: s.bonus,
                    deductions: s.deductions,
                    pay_date: s.pay_date,
                });
            });
        }
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearPayrollFormError());

        try {
            if (isEdit) {
                await dispatch(updateSalary({ id, payload: form })).unwrap();
            } else {
                await dispatch(createSalary(form)).unwrap();
            }
            navigate('/payroll');
        } catch {
            // Error handled by Redux state
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                {isEdit ? 'Edit Salary Record' : 'New Salary Record'}
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                        <select
                            value={form.employee}
                            onChange={(e) => setForm({ ...form, employee: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        >
                            <option value="">Select employee</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.user?.username} — {emp.designation || 'No designation'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (₹)</label>
                        <input
                            type="number" step="0.01" value={form.basic_salary}
                            onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required min="0"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus (₹)</label>
                            <input
                                type="number" step="0.01" value={form.bonus}
                                onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
                            <input
                                type="number" step="0.01" value={form.deductions}
                                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
                        <input
                            type="date" value={form.pay_date}
                            onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>

                    {/* Net salary preview */}
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-indigo-600 font-medium">Net Salary Preview</p>
                        <p className="text-2xl font-bold text-indigo-700">
                            ₹{(Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                        </button>
                        <button
                            type="button" onClick={() => navigate('/payroll')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
