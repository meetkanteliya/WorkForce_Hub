import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AlertModal from '../../components/AlertModal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DepartmentList() {
    const { hasRole } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

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
        const dept = departments.find((d) => d.id === id);
        setDepartmentToDelete(dept ? { id, name: dept.name } : { id, name: 'this department' });
    };

    const confirmDelete = async () => {
        if (!departmentToDelete) return;
        try {
            await API.delete(`/departments/${departmentToDelete.id}/`);
            setDepartments((prev) => prev.filter((d) => d.id !== departmentToDelete.id));
            if (currentDepartments.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            setDepartmentToDelete(null);
        } catch {
            setAlertMessage('Failed to delete department');
            setAlertOpen(true);
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

            {/* Delete confirmation modal */}
            {departmentToDelete && createPortal(
                <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && setDepartmentToDelete(null)}>
                    <div className="my-auto flex-shrink-0 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
                                <HiOutlineTrash className="w-8 h-8 text-rose-500" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Department</h3>
                            <p className="text-sm text-slate-500 max-w-[260px] mx-auto">
                                Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">{departmentToDelete.name}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setDepartmentToDelete(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-sm shadow-rose-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex items-center justify-center"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <AlertModal open={alertOpen} message={alertMessage} variant="error" onClose={() => setAlertOpen(false)} />
        </div>
    );
}
