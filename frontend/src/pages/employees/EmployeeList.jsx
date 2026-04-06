
import { useState, useEffect, useCallback, createElement } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, hasRole as hasRoleUtil } from '../../store/slices/authSlice';
import {
    fetchEmployees,
    deleteEmployee,
    selectEmployeeList,
    selectEmployeeMeta,
    selectEmployeeLoading,
    selectEmployeeDeleteLoading,
} from '../../store/slices/employeeSlice';
import { fetchDepartments, selectDepartmentList } from '../../store/slices/departmentSlice';
import AlertModal from '../../components/AlertModal';
import {
    Plus,
    Search,
    ChevronDown, 
    Pencil,
    Trash,
    Eye,
    Mail,
    Phone,
    Users,
    Filter
} from 'lucide-react';

export default function EmployeeList() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const hasRole = (...roles) => hasRoleUtil(user, ...roles);

    const employees = useSelector(selectEmployeeList);
    const meta = useSelector(selectEmployeeMeta);
    const loading = useSelector(selectEmployeeLoading);
    const isDeleting = useSelector(selectEmployeeDeleteLoading);
    const departments = useSelector(selectDepartmentList);

    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [page, setPage] = useState(1);

    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Fetch employees when filters/page change
    useEffect(() => {
        dispatch(fetchEmployees({ page, search, department: departmentFilter, status: statusFilter }));
    }, [dispatch, page, search, departmentFilter, statusFilter]);

    // Fetch departments for filter dropdown (once)
    useEffect(() => {
        dispatch(fetchDepartments());
    }, [dispatch]);

    const confirmDelete = async () => {
        if (!employeeToDelete) return;
        try {
            await dispatch(deleteEmployee(employeeToDelete.id)).unwrap();
            setEmployeeToDelete(null);
        } catch {
            setAlertMessage('Failed to delete employee');
            setAlertOpen(true);
        }
    };

    const handleDeleteClick = (emp) => {
        setEmployeeToDelete(emp);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(meta.count / itemsPerPage) || 1;
    const startIndex = (page - 1) * itemsPerPage;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A2B3C] dark:text-white tracking-tight">Employees</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your workforce credentials and roles.</p>
                </div>
                {hasRole('admin', 'hr') && (
                    <Link
                        to="/employees/new"
                        className="flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1D4ED8] shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Add Employee
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="glass-panel dark:bg-[#111827]/40 flex flex-wrap gap-3 justify-between items-center p-3 rounded-xl border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] xl:w-80">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search employees by name, email or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-slate-800 dark:text-white font-medium"
                        />
                    </div>

                    {/* Department Filter */}
                    <div className="relative min-w-[180px] shrink-0">
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Role Filter - simplified for now */}
                    <div className="relative min-w-[140px] shrink-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="present">Present</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : employees.length === 0 ? (
                <EmptyState icon={Users} title="No Employees Found" subtitle="Try adjusting your search or filters to find what you're looking for." />
            ) : (
                <div className="glass-panel dark:bg-[#111827]/40 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50">
                                    <TH>Employee</TH>
                                    <TH>Contact Information</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Actions</TH>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-transparent">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={emp.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.username || '?')}&size=64&background=1A2B3C&color=fff&bold=true&font-size=0.45`}
                                                    alt={emp.user?.username}
                                                    className="w-10 h-10 rounded-lg object-cover bg-[#1A2B3C] shrink-0"
                                                />
                                                <div>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-white block">{emp.user?.username}</span>
                                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{emp.designation || 'Staff'} • {emp.department_name || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                    {emp.user?.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    {emp.phone || '—'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                                emp.is_active !== false 
                                                ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50' 
                                                : 'bg-slate-100/80 text-slate-700 border border-slate-200/50'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {emp.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/employees/${emp.id}`}
                                                    className="flex items-center justify-center w-8 h-8 text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                    title="View Profile">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {hasRole('admin', 'hr') && (
                                                    <Link to={`/employees/${emp.id}/edit`}
                                                        className="flex items-center justify-center w-8 h-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                                                        title="Edit">
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {hasRole('admin') && (
                                                    <button onClick={() => handleDeleteClick(emp)}
                                                        className="flex items-center justify-center w-8 h-8 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                                                        title="Delete">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <PaginationFooter
                        totalItems={meta.count}
                        currentPage={page}
                        itemsPerPage={itemsPerPage}
                        setCurrentPage={setPage}
                        totalPages={totalPages}
                        startIndex={startIndex}
                    />
                </div>
            )}

            {/* Delete Modal */}
            {employeeToDelete && createPortal(
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => e.target === e.currentTarget && setEmployeeToDelete(null)}
                >
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4 mb-4 text-rose-600">
                            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                                <Trash className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Employee?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">{employeeToDelete.user?.username}</span>? All associated records will be removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEmployeeToDelete(null)}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <AlertModal
                open={alertOpen}
                message={alertMessage}
                variant="error"
                onClose={() => setAlertOpen(false)}
            />
        </div>
    );
}

// ─── Helper Components ───

function TH({ children, className = '' }) {
    return (
        <th className={`px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap ${className}`}>
            {children}
        </th>
    );
}

function EmptyState({ icon: Icon, title, subtitle }) {
    return (
        <div className="glass-panel dark:bg-[#111827]/40 rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                {createElement(Icon, { className: "w-8 h-8 text-slate-400" })}
            </div>
            <h3 className="text-lg font-bold text-[#1A2B3C] dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
    );
}

function PaginationFooter({ totalItems, currentPage, itemsPerPage, setCurrentPage, totalPages, startIndex }) {
    if (totalItems === 0) return null;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white dark:bg-transparent border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span>–<span className="font-semibold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
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
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPage === page
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
    );
}
