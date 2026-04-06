import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Async Thunks ──

/** Fetch recent activity feed */
export const fetchDashboardActivity = createAsyncThunk(
    'dashboard/fetchActivity',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/dashboard/activity/');
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch department list (analytics view) */
export const fetchDashboardDepartments = createAsyncThunk(
    'dashboard/fetchDepartments',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/dashboard/departments/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch single department detail (analytics view) */
export const fetchDashboardDepartmentDetail = createAsyncThunk(
    'dashboard/fetchDepartmentDetail',
    async (id, { rejectWithValue }) => {
        try {
            const res = await API.get(`/dashboard/departments/${id}/`);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch employee directory (dashboard analytics view with pagination) */
export const fetchDashboardEmployees = createAsyncThunk(
    'dashboard/fetchEmployees',
    async ({ page = 1, search = '', role = '' } = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams({ page });
            if (search) params.set('search', search);
            if (role) params.set('role', role);
            const res = await API.get(`/dashboard/employees/?${params}`);
            return {
                employees: res.data.results ?? res.data,
                meta: { count: res.data.count || 0, next: res.data.next, previous: res.data.previous },
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch leave overview (status counts, by type, recent requests) */
export const fetchDashboardLeaveOverview = createAsyncThunk(
    'dashboard/fetchLeaveOverview',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/dashboard/leaves/overview/');
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch pending leave requests */
export const fetchDashboardLeavesPending = createAsyncThunk(
    'dashboard/fetchLeavesPending',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/dashboard/leaves/pending/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/** Fetch payroll overview (totals, by department, recent payouts) */
export const fetchDashboardPayroll = createAsyncThunk(
    'dashboard/fetchPayroll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/dashboard/payroll/overview/');
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Initial State ──
const initialState = {
    activity: { data: [], loading: false },
    departments: { list: [], detail: null, loading: false },
    employees: { list: [], meta: { count: 0, next: null, previous: null }, loading: false },
    leaveOverview: { data: null, loading: false },
    leavesPending: { list: [], loading: false },
    payroll: { data: null, loading: false },
};

// ── Slice ──
const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDepartmentDetail(state) {
            state.departments.detail = null;
        },
    },
    extraReducers: (builder) => {
        // Activity
        builder
            .addCase(fetchDashboardActivity.pending, (s) => { s.activity.loading = true; })
            .addCase(fetchDashboardActivity.fulfilled, (s, a) => { s.activity.loading = false; s.activity.data = a.payload; })
            .addCase(fetchDashboardActivity.rejected, (s) => { s.activity.loading = false; s.activity.data = []; });

        // Departments list
        builder
            .addCase(fetchDashboardDepartments.pending, (s) => { s.departments.loading = true; })
            .addCase(fetchDashboardDepartments.fulfilled, (s, a) => { s.departments.loading = false; s.departments.list = a.payload; })
            .addCase(fetchDashboardDepartments.rejected, (s) => { s.departments.loading = false; s.departments.list = []; });

        // Department detail
        builder
            .addCase(fetchDashboardDepartmentDetail.pending, (s) => { s.departments.loading = true; s.departments.detail = null; })
            .addCase(fetchDashboardDepartmentDetail.fulfilled, (s, a) => { s.departments.loading = false; s.departments.detail = a.payload; })
            .addCase(fetchDashboardDepartmentDetail.rejected, (s) => { s.departments.loading = false; });

        // Employees
        builder
            .addCase(fetchDashboardEmployees.pending, (s) => { s.employees.loading = true; })
            .addCase(fetchDashboardEmployees.fulfilled, (s, a) => {
                s.employees.loading = false;
                s.employees.list = a.payload.employees;
                s.employees.meta = a.payload.meta;
            })
            .addCase(fetchDashboardEmployees.rejected, (s) => { s.employees.loading = false; s.employees.list = []; });

        // Leave overview
        builder
            .addCase(fetchDashboardLeaveOverview.pending, (s) => { s.leaveOverview.loading = true; })
            .addCase(fetchDashboardLeaveOverview.fulfilled, (s, a) => { s.leaveOverview.loading = false; s.leaveOverview.data = a.payload; })
            .addCase(fetchDashboardLeaveOverview.rejected, (s) => { s.leaveOverview.loading = false; });

        // Leaves pending
        builder
            .addCase(fetchDashboardLeavesPending.pending, (s) => { s.leavesPending.loading = true; })
            .addCase(fetchDashboardLeavesPending.fulfilled, (s, a) => { s.leavesPending.loading = false; s.leavesPending.list = a.payload; })
            .addCase(fetchDashboardLeavesPending.rejected, (s) => { s.leavesPending.loading = false; s.leavesPending.list = []; });

        // Payroll overview
        builder
            .addCase(fetchDashboardPayroll.pending, (s) => { s.payroll.loading = true; })
            .addCase(fetchDashboardPayroll.fulfilled, (s, a) => { s.payroll.loading = false; s.payroll.data = a.payload; })
            .addCase(fetchDashboardPayroll.rejected, (s) => { s.payroll.loading = false; });
    },
});

// ── Actions ──
export const { clearDepartmentDetail } = dashboardSlice.actions;

// ── Selectors ──
export const selectDashboardActivity = (state) => state.dashboard.activity;
export const selectDashboardDepartments = (state) => state.dashboard.departments;
export const selectDashboardEmployees = (state) => state.dashboard.employees;
export const selectDashboardLeaveOverview = (state) => state.dashboard.leaveOverview;
export const selectDashboardLeavesPending = (state) => state.dashboard.leavesPending;
export const selectDashboardPayroll = (state) => state.dashboard.payroll;

export default dashboardSlice.reducer;
