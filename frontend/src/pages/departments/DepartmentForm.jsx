import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    createDepartment,
    updateDepartment,
    clearDeptFormError,
    selectDeptFormLoading,
    selectDeptFormError,
} from '../../store/slices/departmentSlice';
import API from '../../api/axios';

export default function DepartmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);

    const loading = useSelector(selectDeptFormLoading);
    const error = useSelector(selectDeptFormError);

    const [form, setForm] = useState({ name: '', description: '' });

    useEffect(() => {
        dispatch(clearDeptFormError());
        return () => dispatch(clearDeptFormError());
    }, [dispatch]);

    useEffect(() => {
        if (isEdit) {
            API.get(`/departments/${id}/`).then((res) => {
                setForm({ name: res.data.name, description: res.data.description || '' });
            });
        }
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearDeptFormError());

        try {
            if (isEdit) {
                await dispatch(updateDepartment({ id, payload: form })).unwrap();
            } else {
                await dispatch(createDepartment(form)).unwrap();
            }
            navigate('/departments');
        } catch {
            // Error handled by Redux state
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                {isEdit ? 'Edit Department' : 'New Department'}
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/departments')}
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
