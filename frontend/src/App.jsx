import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, fetchProfile } from './store/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import DepartmentList from './pages/departments/DepartmentList';
import DepartmentForm from './pages/departments/DepartmentForm';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import LeaveTypeList from './pages/leaves/LeaveTypeList';
import LeaveRequestList from './pages/leaves/LeaveRequestList';
import LeaveRequestForm from './pages/leaves/LeaveRequestForm';
import SalaryList from './pages/payroll/SalaryList';
import SalaryForm from './pages/payroll/SalaryForm';
import MySalary from './pages/payroll/MySalary';
import DashboardEmployees from './pages/dashboard/DashboardEmployees';
import DashboardDepartments from './pages/dashboard/DashboardDepartments';
import DashboardLeavesPending from './pages/dashboard/DashboardLeavesPending';
import DashboardLeaveOverview from './pages/dashboard/DashboardLeaveOverview';
import DashboardPayroll from './pages/dashboard/DashboardPayroll';
import DashboardActivity from './pages/dashboard/DashboardActivity';
import CompanyChat from './pages/chat/CompanyChat';

// Initializes app-level side effects (e.g. fetch profile pic on load)
function AppInitializer({ children }) {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(selectIsAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchProfile());
        }
    }, [isAuthenticated, dispatch]);

    // Sync dark mode class on mount
    useEffect(() => {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInitializer>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/chat" element={<CompanyChat />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/change-password" element={<ChangePassword />} />

                        {/* Departments */}
                        <Route path="/departments" element={<ProtectedRoute roles={['admin', 'hr']}><DepartmentList /></ProtectedRoute>} />
                        <Route path="/departments/new" element={<ProtectedRoute roles={['admin']}><DepartmentForm /></ProtectedRoute>} />
                        <Route path="/departments/:id/edit" element={<ProtectedRoute roles={['admin']}><DepartmentForm /></ProtectedRoute>} />

                        {/* Employees */}
                        <Route path="/employees" element={<ProtectedRoute roles={['admin', 'hr', 'manager']}><EmployeeList /></ProtectedRoute>} />
                        <Route path="/employees/new" element={<ProtectedRoute roles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>} />
                        <Route path="/employees/:id" element={<EmployeeDetail />} />
                        <Route path="/employees/:id/edit" element={<ProtectedRoute roles={['admin', 'hr']}><EmployeeForm /></ProtectedRoute>} />

                        {/* Leaves */}
                        <Route path="/leaves" element={<LeaveRequestList />} />
                        <Route path="/leaves/types" element={<LeaveTypeList />} />
                        <Route path="/leaves/apply" element={<LeaveRequestForm />} />

                        {/* Payroll */}
                        <Route path="/payroll" element={<ProtectedRoute roles={['admin', 'hr']}><SalaryList /></ProtectedRoute>} />
                        <Route path="/payroll/new" element={<ProtectedRoute roles={['admin']}><SalaryForm /></ProtectedRoute>} />
                        <Route path="/payroll/:id/edit" element={<ProtectedRoute roles={['admin']}><SalaryForm /></ProtectedRoute>} />
                        <Route path="/my-salary" element={<ProtectedRoute roles={['employee', 'hr', 'manager']}><MySalary /></ProtectedRoute>} />

                        {/* Dashboard Drill-down Pages (Admin & HR) */}
                        <Route path="/dashboard/employees" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardEmployees /></ProtectedRoute>} />
                        <Route path="/dashboard/departments" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardDepartments /></ProtectedRoute>} />
                        <Route path="/dashboard/departments/:id" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardDepartments /></ProtectedRoute>} />
                        <Route path="/dashboard/leaves-pending" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardLeavesPending /></ProtectedRoute>} />
                        <Route path="/dashboard/leave-overview" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardLeaveOverview /></ProtectedRoute>} />
                        <Route path="/dashboard/payroll" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardPayroll /></ProtectedRoute>} />
                        <Route path="/dashboard/activity" element={<ProtectedRoute roles={['admin', 'hr']}><DashboardActivity /></ProtectedRoute>} />
                    </Route>

                    {/* Back-compat: old protected root redirects */}
                    <Route path="/app" element={<Navigate to="/dashboard" replace />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppInitializer>
        </BrowserRouter>
    );
}
