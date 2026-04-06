import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSalaries, selectSalaryList, selectSalaryLoading } from '../../store/slices/payrollSlice';
import { HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineTrendingUp, HiOutlineTrendingDown } from 'react-icons/hi';
import dayjs from 'dayjs';

export default function MySalary() {
    const dispatch = useDispatch();
    const salaries = useSelector(selectSalaryList);
    const loading = useSelector(selectSalaryLoading);

    useEffect(() => {
        dispatch(fetchSalaries({ tab: 'my' }));
    }, [dispatch]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (salaries.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-2xl mx-auto mt-10">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineCurrencyDollar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Salary Records Found</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    There are currently no salary slips available for your account. Please contact the HR department if you believe this is a mistake.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Salary Slips</h1>
                    <p className="text-sm text-gray-500 mt-1">View your monthly payout history and details</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <HiOutlineCurrencyDollar className="w-6 h-6 text-indigo-600" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salaries.map((salary) => (
                    <div key={salary.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover-lift transition-all">
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <HiOutlineCalendar className="w-5 h-5 text-indigo-500" />
                                <span className="font-bold text-gray-800">
                                    {dayjs(salary.salary_month).format('MMMM YYYY')}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                Paid
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center pb-4 border-b border-gray-50">
                                <p className="text-sm text-gray-500 font-medium mb-1">Net Salary</p>
                                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    ₹{parseFloat(salary.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Basic
                                    </span>
                                    <span className="font-semibold text-gray-700">₹{parseFloat(salary.basic_salary).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <HiOutlineTrendingUp className="w-3.5 h-3.5 text-green-500" /> Bonus
                                    </span>
                                    <span className="font-semibold text-green-600">+₹{parseFloat(salary.bonus).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <HiOutlineTrendingDown className="w-3.5 h-3.5 text-red-500" /> Deductions
                                    </span>
                                    <span className="font-semibold text-red-500">-₹{parseFloat(salary.deductions).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
