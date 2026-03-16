import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineArrowLeft, HiOutlineEye } from 'react-icons/hi';

export default function DashboardDepartments() {
    const { id } = useParams();
    const [departments, setDepartments] = useState([]);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                if (id) {
                    const res = await API.get(`/dashboard/departments/${id}/`);
                    setDetail(res.data);
                } else {
                    const res = await API.get('/dashboard/departments/');
                    setDepartments(res.data.results ?? res.data);
                }
            } catch (err) {
                console.error('[DashboardDepartments] Failed to load', err);
            } finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    // Detail view
    if (id && detail) {
        return (
            <div className="animate-fade-in">
                <Link to="/dashboard/departments" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Back to Departments
                </Link>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                    <h1 className="text-2xl font-bold">{detail.name}</h1>
                    <p className="text-indigo-100 mt-1 text-sm">{detail.description || 'No description'}</p>
                    <span className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium">{detail.employee_count} employees</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Designation</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(detail.employees || []).map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{emp.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{emp.employee_code || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{emp.designation || '—'}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-50 text-indigo-600">{emp.role}</span></td>
                                    <td className="px-6 py-4 text-right"><Link to={`/employees/${emp.id}`} className="text-indigo-500 hover:text-indigo-700"><HiOutlineEye className="w-5 h-5 inline" /></Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="animate-fade-in">
            <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-4 font-medium">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">All Departments</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {departments.map((dept, i) => (
                    <Link key={dept.id} to={`/dashboard/departments/${dept.id}`}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover-lift animate-fade-in group"
                        style={{ animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">{dept.name[0]}</div>
                            <span className="text-2xl font-extrabold text-gray-800">{dept.employee_count}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{dept.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{dept.description || 'No description'}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
