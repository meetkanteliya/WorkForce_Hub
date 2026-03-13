
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AlertModal from '../../components/AlertModal';
import {
    HiOutlinePlus,
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineFilter
} from 'react-icons/hi';

export default function EmployeeList() {

    const { hasRole } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [searchParams] = useSearchParams();

    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [designationFilter, setDesignationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [loading, setLoading] = useState(true);

    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // backend pagination
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({
        count: 0,
        next: null,
        previous: null
    });

    const fetchEmployees = async () => {

        setLoading(true);

        try {

            const params = {
                page,
                search: search || undefined,
                department: departmentFilter || undefined,
                role: roleFilter || undefined,
                designation: designationFilter || undefined,
                status: statusFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            };

            const res = await API.get('/employees/', { params });

            const results = res.data?.results ?? res.data;

            setEmployees(results);

            setMeta({
                count: res.data.count,
                next: res.data.next,
                previous: res.data.previous
            });

        } catch (err) {

            console.error('Failed to fetch employees:', err);

        } finally {

            setLoading(false);

        }

    };

    const fetchDepartments = async () => {

        try {

            const res = await API.get('/departments/');

            setDepartments(res.data.results ?? res.data);

        } catch (err) {

            console.error('Failed to fetch departments:', err);

        }

    };

    useEffect(() => {

        fetchEmployees();

    }, [page, search, departmentFilter, roleFilter, designationFilter, statusFilter, dateFrom, dateTo]);

    useEffect(() => {

        fetchDepartments();

    }, []);

    const confirmDelete = async () => {

        if (!employeeToDelete) return;

        setIsDeleting(true);

        try {

            await API.delete(`/employees/${employeeToDelete.id}/`);

            setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));

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

    const totalPages = Math.ceil(meta.count / 10) || 1;

    return (

        <div>

            <div className="flex justify-between mb-6">

                <h1 className="text-2xl font-bold">Employees</h1>

                {hasRole('admin', 'hr') && (

                    <Link
                        to="/employees/new"
                        className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        Add Employee
                    </Link>

                )}

            </div>

            {/* search bar */}

            <div className="flex gap-3 mb-6">

                <div className="relative">

                    <HiOutlineSearch className="absolute left-3 top-3 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border rounded-lg"
                    />

                </div>

                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >

                    <option value="">All Departments</option>

                    {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                    ))}

                </select>

            </div>

            {loading ? (

                <div className="flex justify-center py-10">

                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />

                </div>

            ) : employees.length === 0 ? (

                <div className="text-center py-10 text-gray-500">

                    No employees found

                </div>

            ) : (

                <div className="bg-white rounded-xl border shadow-sm">

                    <table className="w-full">

                        <thead className="bg-gray-50 border-b">

                            <tr>

                                <th className="text-left px-6 py-3 text-xs font-semibold">Employee</th>

                                <th className="text-left px-6 py-3 text-xs font-semibold">Contact</th>

                                <th className="text-right px-6 py-3 text-xs font-semibold"></th>

                            </tr>

                        </thead>

                        <tbody className="divide-y">

                            {employees.map(emp => (

                                <tr key={emp.id} className="hover:bg-gray-50">

                                    <td className="px-6 py-4">

                                        <div className="flex items-center gap-3">

                                            <img
                                                src={emp.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.username || '?')}`}
                                                className="w-10 h-10 rounded-full"
                                            />

                                            <div>

                                                <p className="font-semibold">{emp.user?.username}</p>

                                                <p className="text-sm text-gray-500">{emp.designation}</p>

                                            </div>

                                        </div>

                                    </td>

                                    <td className="px-6 py-4">

                                        <div className="flex flex-col">

                                            <span className="flex items-center gap-2 text-sm">
                                                <HiOutlineMail /> {emp.user?.email}
                                            </span>

                                            <span className="flex items-center gap-2 text-sm">
                                                <HiOutlinePhone /> {emp.phone || '—'}
                                            </span>

                                        </div>

                                    </td>

                                    <td className="px-6 py-4 text-right">

                                        <div className="flex justify-end gap-2">

                                            <Link to={`/employees/${emp.id}`}>
                                                <HiOutlineEye className="w-4 h-4" />
                                            </Link>

                                            {hasRole('admin', 'hr') && (
                                                <Link to={`/employees/${emp.id}/edit`}>
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </Link>
                                            )}

                                            {hasRole('admin') && (
                                                <button onClick={() => handleDeleteClick(emp)}>
                                                    <HiOutlineTrash className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                    {/* pagination */}

                    <div className="flex justify-between px-6 py-4 border-t">

                        <button
                            disabled={!meta.previous}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-gray-500">

                            Page {page} of {totalPages}

                        </span>

                        <button
                            disabled={!meta.next}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded"
                        >
                            Next
                        </button>

                    </div>

                </div>

            )}

            {/* Delete Modal */}

            {employeeToDelete && createPortal(

                <div className="fixed inset-0 flex items-center justify-center bg-black/40">

                    <div className="bg-white rounded-xl p-6">

                        <h3 className="text-lg font-semibold mb-4">Delete Employee?</h3>

                        <div className="flex gap-3">

                            <button
                                onClick={() => setEmployeeToDelete(null)}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded"
                            >
                                Delete
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
