import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DepartmentList() {
    const { hasRole } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDepartments = async () => {
        try {
            const res = await API.get('/departments/');
            setDepartments(res.data.results ?? res.data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDepartments(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await API.delete(`/departments/${id}/`);
            setDepartments((prev) => prev.filter((d) => d.id !== id));
        } catch {
            alert('Failed to delete department');
        }
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
                <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
                {hasRole('admin') && (
                    <Link
                        to="/departments/new"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Department
                    </Link>
                )}
            </div>

            {departments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    No departments found.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                {hasRole('admin') && (
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {departments.map((dept) => (
                                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">#{dept.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{dept.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{dept.description || '—'}</td>
                                    {hasRole('admin') && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/departments/${dept.id}/edit`}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
