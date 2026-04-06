import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Async Thunks ──

/**
 * fetchSalaries – loads salary records (all or "my").
 */
export const fetchSalaries = createAsyncThunk(
    'payroll/fetchSalaries',
    async ({ tab = 'all' } = {}, { rejectWithValue }) => {
        try {
            const endpoint = tab === 'my' ? '/payroll/my/' : '/payroll/';
            const res = await API.get(endpoint);
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * createSalary – create a new salary record.
 */
export const createSalary = createAsyncThunk(
    'payroll/createSalary',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await API.post('/payroll/', {
                employee: parseInt(payload.employee),
                basic_salary: payload.basic_salary,
                bonus: payload.bonus,
                deductions: payload.deductions,
                pay_date: payload.pay_date,
            });
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data) {
                if (typeof data === 'string') return rejectWithValue(data);
                if (data.detail) return rejectWithValue(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save salary record');
        }
    }
);

/**
 * updateSalary – update an existing salary record.
 */
export const updateSalary = createAsyncThunk(
    'payroll/updateSalary',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const res = await API.put(`/payroll/${id}/`, {
                employee: parseInt(payload.employee),
                basic_salary: payload.basic_salary,
                bonus: payload.bonus,
                deductions: payload.deductions,
                pay_date: payload.pay_date,
            });
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data) {
                if (typeof data === 'string') return rejectWithValue(data);
                if (data.detail) return rejectWithValue(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save salary record');
        }
    }
);

// ── Initial State ──
const initialState = {
    list: [],
    loading: false,

    // Form state
    formLoading: false,
    formError: null,
};

// ── Slice ──
const payrollSlice = createSlice({
    name: 'payroll',
    initialState,
    reducers: {
        clearPayrollFormError(state) {
            state.formError = null;
        },
    },
    extraReducers: (builder) => {
        // fetchSalaries
        builder
            .addCase(fetchSalaries.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSalaries.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchSalaries.rejected, (state) => {
                state.loading = false;
                state.list = [];
            });

        // createSalary
        builder
            .addCase(createSalary.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(createSalary.fulfilled, (state) => {
                state.formLoading = false;
                state.formError = null;
            })
            .addCase(createSalary.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to create salary record';
            });

        // updateSalary
        builder
            .addCase(updateSalary.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(updateSalary.fulfilled, (state) => {
                state.formLoading = false;
                state.formError = null;
            })
            .addCase(updateSalary.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to update salary record';
            });
    },
});

// ── Actions ──
export const { clearPayrollFormError } = payrollSlice.actions;

// ── Selectors ──
export const selectSalaryList = (state) => state.payroll.list;
export const selectSalaryLoading = (state) => state.payroll.loading;
export const selectPayrollFormLoading = (state) => state.payroll.formLoading;
export const selectPayrollFormError = (state) => state.payroll.formError;

export default payrollSlice.reducer;
