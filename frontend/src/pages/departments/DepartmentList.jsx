import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DepartmentList() {
    const { hasRole } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const totalItems = departments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentDepartments = departments.slice(startIndex, startIndex + itemsPerPage);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await API.delete(`/departments/${id}/`);
            setDepartments((prev) => prev.filter((d) => d.id !== id));
            // Edge case: if last item on page deleted
            if (currentDepartments.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
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
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Departments</h1>
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
                <div className="bg-white dark:bg-[#111827]/40 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center text-gray-500 dark:text-slate-400">
                    No departments found.
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111827]/40 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                    {hasRole('admin') && (
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                                {currentDepartments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">#{dept.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">{dept.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{dept.description || '—'}</td>
                                        {hasRole('admin') && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/departments/${dept.id}/edit`}
                                                        className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-[#10B981] hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-rose-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-transparent border-t border-gray-200 dark:border-slate-800 rounded-b-xl">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span>–<span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> departments
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                            currentPage === page 
                                                ? 'bg-[#10B981] text-white border border-[#10B981]' 
                                                : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
