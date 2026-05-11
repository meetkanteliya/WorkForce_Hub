import re

with open("frontend/src/pages/payroll/SalaryList.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add selectSalaryCount and Search/Chevron/etc
code = code.replace("selectSalaryLoading,", "selectSalaryLoading,\n    selectSalaryCount,\n")
code = code.replace("import { HiOutlinePlus } from 'react-icons/hi';", "import { HiOutlinePlus } from 'react-icons/hi';\nimport { Search, ChevronDown } from 'lucide-react';\nimport { fetchDepartments, selectDepartmentList } from '../../store/slices/departmentSlice';")

# State & useEffect updates
old_state = """    const [tab, setTab] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(fetchSalaries({ tab }));
    }, [tab, dispatch]);

    const totalItems = salaries.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentSalaries = salaries.slice(startIndex, startIndex + itemsPerPage);"""

new_state = """    const [tab, setTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const totalItems = useSelector(selectSalaryCount);
    const departments = useSelector(selectDepartmentList);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        dispatch(fetchDepartments());
    }, [dispatch]);

    useEffect(() => {
        let currentPromise;
        const fetchData = () => {
            currentPromise = dispatch(fetchSalaries({ 
                tab, 
                page: currentPage, 
                department: departmentFilter, 
                search: searchQuery 
            }));
        };

        const timer = setTimeout(() => {
            fetchData();
        }, 300);

        const pollTimer = setInterval(() => {
            fetchData();
        }, 15000);

        return () => {
            clearTimeout(timer);
            clearInterval(pollTimer);
            if (currentPromise) currentPromise.abort();
        };
    }, [tab, currentPage, departmentFilter, searchQuery, dispatch]);

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;"""

code = code.replace(old_state, new_state)
code = code.replace("currentSalaries.map", "salaries.map")

# Filters UI
filters_ui = """            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => { setCurrentPage(1); setTab('all'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {hasRole('admin', 'hr', 'manager') ? 'All Records' : 'All'}
                    </button>
                    <button
                        onClick={() => { setCurrentPage(1); setTab('my'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'my' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My Salary
                    </button>
                </div>
                
                {tab === 'all' && (
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center flex-1 justify-end">
                        {hasRole('admin', 'hr') && (
                            <div className="relative min-w-[180px]">
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => { setCurrentPage(1); setDepartmentFilter(e.target.value); }}
                                    className="appearance-none w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                                >
                                    <option value="All">All Departments</option>
                                    {departments && departments.map((dept) => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}
                        <div className="relative min-w-[180px] xl:w-64">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={searchQuery}
                                onChange={(e) => { setCurrentPage(1); setSearchQuery(e.target.value); }}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
                            />
                        </div>
                    </div>
                )}
            </div>"""

code = re.sub(r'            \{\/\* Tabs \*\/}.*?                </div>\n            </div>', filters_ui, code, flags=re.DOTALL)

with open("frontend/src/pages/payroll/SalaryList.jsx", "w", encoding="utf-8") as f:
    f.write(code)

# -----------------
# SalaryForm.jsx
# -----------------
with open("frontend/src/pages/payroll/SalaryForm.jsx", "r", encoding="utf-8") as f:
    form_code = f.read()

preview_replace = """                    {/* Net salary preview */}
                    <div className={`rounded-lg p-4 ${(Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)) < 0 ? 'bg-red-50' : 'bg-indigo-50'}`}>
                        <p className={`text-sm font-medium ${(Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)) < 0 ? 'text-red-600' : 'text-indigo-600'}`}>Net Salary Preview</p>
                        <p className={`text-2xl font-bold ${(Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)) < 0 ? 'text-red-700' : 'text-indigo-700'}`}>
                            ₹{(Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit" disabled={loading || (Number(form.basic_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0)) < 0}
                            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >"""
form_code = re.sub(r'                    \{\/\* Net salary preview \*\/}.*?className="flex-1 bg-indigo-600', preview_replace, form_code, flags=re.DOTALL)

with open("frontend/src/pages/payroll/SalaryForm.jsx", "w", encoding="utf-8") as f:
    f.write(form_code)

# -----------------
# MySalary.jsx
# -----------------
with open("frontend/src/pages/payroll/MySalary.jsx", "r", encoding="utf-8") as f:
    mysalary_code = f.read()

mysalary_code = mysalary_code.replace("dayjs(salary.salary_month).format('MMMM YYYY')", "dayjs(salary.pay_date).format('MMMM YYYY')")

with open("frontend/src/pages/payroll/MySalary.jsx", "w", encoding="utf-8") as f:
    f.write(mysalary_code)

