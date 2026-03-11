import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AlertModal from '../../components/AlertModal';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineMail, HiOutlinePhone, HiOutlineFilter, HiOutlineDotsHorizontal } from 'react-icons/hi';

export default function EmployeeList() {
    const { hasRole } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [departments, setDepartments] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [designationFilter, setDesignationFilter] = useState('');
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [loading, setLoading] = useState(true);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const fetchEmployees = async () => {
        try {
            // Because filtering is done client-side now, we always want the full list
            const res = await API.get('/employees/');
            setEmployees(res.data.results ?? res.data);
        } catch {
            // handle
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchEmployees(); 
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await API.get('/departments/');
            setDepartments(res.data.results ?? res.data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    // Reset pagination to page 1 when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, departmentFilter, roleFilter, designationFilter, statusFilter, dateFrom, dateTo]);

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        setIsDeleting(true);
        try {
            await API.delete(`/employees/${employeeToDelete.id}/`);
            setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
            setEmployeeToDelete(null);
        } catch {
            setAlertMessage('Failed to delete employee');
            setAlertOpen(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClick = (emp) => {
        setEmployeeToDelete(emp);
    };

    const resetFilters = () => {
        setSearch('');
        setDepartmentFilter('');
        setRoleFilter('');
        setDesignationFilter('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
    };

    const filteredEmployees = employees.filter(emp => {
        // Search matches Name, Email, Phone, Designation
        if (search) {
            const term = search.toLowerCase();
            const matchesSearch = 
                (emp.user?.username || '').toLowerCase().includes(term) ||
                (emp.user?.email || '').toLowerCase().includes(term) ||
                (emp.phone || '').toLowerCase().includes(term) ||
                (emp.designation || '').toLowerCase().includes(term);
            if (!matchesSearch) return false;
        }

        // Department
        if (departmentFilter && emp.department_name !== departmentFilter) return false;
        
        // Role
        if (roleFilter && emp.user?.role !== roleFilter) return false;

        // Designation
        if (designationFilter && emp.designation !== designationFilter) return false;

        // Status (Active, Inactive, On Leave, Present)
        if (statusFilter) {
            if (statusFilter === 'Active' && (!emp.user?.is_active || emp.is_on_leave_today)) return false;
            if (statusFilter === 'Inactive' && emp.user?.is_active) return false;
            if (statusFilter === 'On Leave' && !emp.is_on_leave_today) return false;
            if (statusFilter === 'Present' && (!emp.user?.is_active || emp.is_on_leave_today)) return false;
        }

        // Date Joined (from/to)
        if (dateFrom && emp.date_of_joining) {
            if (new Date(emp.date_of_joining) < new Date(dateFrom)) return false;
        }
        if (dateTo && emp.date_of_joining) {
            if (new Date(emp.date_of_joining) > new Date(dateTo)) return false;
        }

        return true;
    });

    const totalItems = filteredEmployees.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Employees</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your team members and their roles</p>
                </div>
                {hasRole('admin', 'hr') && (
                    <Link
                        to="/employees/new"
                        className="flex items-center gap-2 bg-[#10B981] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors whitespace-nowrap shadow-sm border border-[#10B981]/10"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Employee
                    </Link>
                )}
            </div>

            {/* Sleek Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in w-full">
                {/* Search */}
                <div className="relative flex-grow">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-[320px] lg:w-[400px] pl-9 pr-4 py-2.5 bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                </div>
                
                {/* Department Dropdown */}
                <div className="relative min-w-[170px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <HiOutlineFilter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none text-slate-800 dark:text-white cursor-pointer transition-colors"
                    >
                        <option value="" className="bg-white dark:bg-[#111827]">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.name} className="bg-white dark:bg-[#111827]">{dept.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                {/* Status Dropdown */}
                <div className="relative min-w-[140px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none pl-4 pr-8 py-2.5 bg-white dark:bg-[#111827]/80 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none text-slate-800 dark:text-white cursor-pointer transition-colors"
                    >
                        <option value="" className="bg-white dark:bg-[#111827]">All Status</option>
                        <option value="Active" className="bg-white dark:bg-[#111827]">Active</option>
                        <option value="Present" className="bg-white dark:bg-[#111827]">Present</option>
                        <option value="On Leave" className="bg-white dark:bg-[#111827]">On Leave</option>
                        <option value="Inactive" className="bg-white dark:bg-[#111827]">Inactive</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    No employees match the applied filters.
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111827]/40 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Employee</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {currentEmployees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img
                                                    src={emp.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.username || '?')}&size=64&background=4F46E5&color=fff&bold=true&font-size=0.45`}
                                                    alt={emp.user?.username}
                                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-semibold text-slate-900 dark:text-[#f8fafc] tracking-tight">{emp.user?.username}</span>
                                                <span className="text-[13px] text-slate-500 dark:text-[#94a3b8] mt-0.5">{emp.designation || emp.department_name || 'No Role Assigned'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[13.5px] text-slate-600 dark:text-[#94a3b8]">
                                                <HiOutlineMail className="w-4 h-4 shrink-0 opacity-70" />
                                                <span className="truncate">{emp.user?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[13.5px] text-slate-600 dark:text-[#94a3b8]">
                                                <HiOutlinePhone className="w-4 h-4 shrink-0 opacity-70" />
                                                <span>{emp.phone || '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {!emp.user?.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium bg-slate-100 text-slate-700 dark:bg-[#1E293B] dark:text-[#94a3b8] dark:ring-1 dark:ring-white/10">
                                                Inactive
                                            </span>
                                        ) : emp.is_on_leave_today ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium bg-amber-100 text-amber-700 dark:bg-[#B45309]/20 dark:text-[#FBBF24] dark:ring-1 dark:ring-[#B45309]/50">
                                                On Leave
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium bg-emerald-100 text-emerald-700 dark:bg-[#059669]/20 dark:text-[#34D399] dark:ring-1 dark:ring-[#059669]/50">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right align-middle">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link to={`/employees/${emp.id}`} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                <HiOutlineEye className="w-4 h-4" />
                                            </Link>
                                            {hasRole('admin', 'hr') && (
                                                <Link to={`/employees/${emp.id}/edit`} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {hasRole('admin') && (
                                                <button onClick={() => handleDeleteClick(emp)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-transparent border-t border-gray-200 dark:border-slate-800 rounded-b-xl">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span>–<span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> employees
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

            {/* Custom Delete Confirmation Modal */}
            {employeeToDelete && createPortal(
                <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="my-auto flex-shrink-0 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-50">
                                <HiOutlineTrash className="w-8 h-8 text-rose-500" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Employee</h3>
                            <p className="text-sm text-slate-500 max-w-[260px] mx-auto">
                                Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-white">{employeeToDelete.user?.username}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setEmployeeToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-sm shadow-rose-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex items-center justify-center disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Yes, Delete'
                                )}
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
