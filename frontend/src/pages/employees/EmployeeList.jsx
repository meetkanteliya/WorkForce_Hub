import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';

export default function EmployeeList() {
    const { hasRole } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        try {
            const res = await API.get('/employees/', { params: search ? { search } : {} });
            setEmployees(res.data.results ?? res.data);
        } catch {
            // handle
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, [search]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;
        try {
            await API.delete(`/employees/${id}/`);
            setEmployees((prev) => prev.filter((e) => e.id !== id));
        } catch {
            alert('Failed to delete employee');
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    {hasRole('admin', 'hr') && (
                        <Link
                            to="/employees/new"
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        >
                            <HiOutlinePlus className="w-4 h-4" />
                            Add Employee
                        </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : employees.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                    No employees found.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                {emp.user?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{emp.user?.username}</p>
                                                <p className="text-xs text-gray-400">{emp.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{emp.designation || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {typeof emp.department === 'object' ? emp.department?.name : emp.department || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{emp.phone || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link to={`/employees/${emp.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <HiOutlineEye className="w-4 h-4" />
                                            </Link>
                                            {hasRole('admin', 'hr') && (
                                                <Link to={`/employees/${emp.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {hasRole('admin') && (
                                                <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            )}
        </div>
    );
}
