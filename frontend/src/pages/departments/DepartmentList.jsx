import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, hasRole as hasRoleUtil } from '../../store/slices/authSlice';
import {
    fetchDepartments,
    deleteDepartment,
    selectDepartmentList,
    selectDepartmentLoading,
} from '../../store/slices/departmentSlice';
import AlertModal from '../../components/AlertModal';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DepartmentList() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const hasRole = (...roles) => hasRoleUtil(user, ...roles);

    const departments = useSelector(selectDepartmentList);
    const loading = useSelector(selectDepartmentLoading);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(fetchDepartments());
    }, [dispatch]);

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
            await dispatch(deleteDepartment(departmentToDelete.id)).unwrap();
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
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage organizational departments</p>
                </div>
                {hasRole('admin', 'hr') && (
                    <Link to="/departments/new" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        <HiOutlinePlus className="w-5 h-5" />
                        Add Department
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                            {hasRole('admin', 'hr') && (
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentDepartments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-gray-500">No departments found.</td>
                            </tr>
                        ) : (
                            currentDepartments.map((dept) => (
                                <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-gray-800">{dept.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{dept.description || '—'}</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/employees?department=${dept.name}`}
                                            className="text-sm text-indigo-600 hover:underline font-medium"
                                        >
                                            {dept.employee_count ?? '—'} members
                                        </Link>
                                    </td>
                                    {hasRole('admin', 'hr') && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/departments/${dept.id}/edit`}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <HiOutlinePencil className="w-5 h-5" />
                                                </Link>
                                                <button onClick={() => handleDelete(dept.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <HiOutlineTrash className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 text-sm rounded-md ${
                                        currentPage === page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {departmentToDelete && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setDepartmentToDelete(null)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Department?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <strong>{departmentToDelete.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDepartmentToDelete(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">
                                Delete
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
