import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineArrowLeft, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

export default function DashboardEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ count: 0, next: null, previous: null });

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page });
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            const res = await API.get(`/dashboard/employees/?${params}`);
            setEmployees(res.data.results ?? res.data);
            setMeta({ count: res.data.count || 0, next: res.data.next, previous: res.data.previous });
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally { 
            setLoading(false); 
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchEmployees(); }, [page, roleFilter]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchEmployees(); };

    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">All Employees</h1>
                <div className="flex gap-2 items-center">
                    <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="hr">HR</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                    </select>
                    <form onSubmit={handleSearch} className="flex">
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                            className="px-3 py-2 border border-gray-200 rounded-l-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-40" />
                        <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-r-xl hover:bg-indigo-700 transition-colors">
                            <HiOutlineSearch className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Designation</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={emp.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.username || '?')}&size=64&background=6366F1&color=fff&bold=true&font-size=0.45`}
                                                    alt={emp.username}
                                                    className="w-8 h-8 rounded-lg object-cover bg-indigo-100 shrink-0"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{emp.username}</p>
                                                    <p className="text-xs text-gray-400">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{emp.employee_code || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{emp.designation || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{emp.department_name}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-50 text-indigo-600">{emp.role}</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{emp.date_of_joining || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/employees/${emp.id}`} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                                                <HiOutlineEye className="w-5 h-5 inline" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                        <span>{meta.count} employee{meta.count !== 1 ? 's' : ''} total</span>
                        <div className="flex gap-2">
                            <button disabled={!meta.previous} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Prev</button>
                            <button disabled={!meta.next} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
