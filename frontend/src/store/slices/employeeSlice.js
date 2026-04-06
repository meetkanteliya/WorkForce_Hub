import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Async Thunks ──

/**
 * fetchEmployees – loads paginated, filterable employee list.
 */
export const fetchEmployees = createAsyncThunk(
    'employees/fetchEmployees',
    async ({ page = 1, search, department, status } = {}, { rejectWithValue }) => {
        try {
            const params = {
                page,
                search: search || undefined,
                department: department || undefined,
                status: status || undefined,
            };
            const res = await API.get('/employees/', { params });
            const results = res.data?.results ?? res.data;
            return {
                employees: Array.isArray(results) ? results : [],
                meta: {
                    count: res.data.count ?? 0,
                    next: res.data.next ?? null,
                    previous: res.data.previous ?? null,
                },
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * fetchEmployee – loads a single employee by ID.
 */
export const fetchEmployee = createAsyncThunk(
    'employees/fetchEmployee',
    async (id, { rejectWithValue }) => {
        try {
            const res = await API.get(`/employees/${id}/`);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * createEmployee – creates a new employee record.
 */
export const createEmployee = createAsyncThunk(
    'employees/createEmployee',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await API.post('/employees/', payload);
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                if (data.detail) return rejectWithValue(data.detail);
                if (Array.isArray(data)) return rejectWithValue(data[0]);
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save employee data. Please try again.');
        }
    }
);

/**
 * updateEmployee – updates an existing employee record.
 */
export const updateEmployee = createAsyncThunk(
    'employees/updateEmployee',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const res = await API.put(`/employees/${id}/`, payload);
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data && typeof data === 'object') {
                if (data.detail) return rejectWithValue(data.detail);
                if (Array.isArray(data)) return rejectWithValue(data[0]);
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save employee data. Please try again.');
        }
    }
);

/**
 * deleteEmployee – deletes an employee by ID.
 */
export const deleteEmployee = createAsyncThunk(
    'employees/deleteEmployee',
    async (id, { rejectWithValue }) => {
        try {
            await API.delete(`/employees/${id}/`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete employee');
        }
    }
);

// ── Initial State ──
const initialState = {
    // List
    list: [],
    meta: { count: 0, next: null, previous: null },
    loading: false,

    // Detail
    detail: null,
    detailLoading: false,

    // Form (create/update)
    formLoading: false,
    formError: null,

    // Delete
    deleteLoading: false,
};

// ── Slice ──
const employeeSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        clearFormError(state) {
            state.formError = null;
        },
        clearDetail(state) {
            state.detail = null;
        },
        /**
         * removeFromList – optimistically remove from local list after delete.
         */
        removeFromList(state, action) {
            state.list = state.list.filter((e) => e.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        // fetchEmployees
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.employees;
                state.meta = action.payload.meta;
            })
            .addCase(fetchEmployees.rejected, (state) => {
                state.loading = false;
                state.list = [];
                state.meta = { count: 0, next: null, previous: null };
            });

        // fetchEmployee (detail)
        builder
            .addCase(fetchEmployee.pending, (state) => {
                state.detailLoading = true;
                state.detail = null;
            })
            .addCase(fetchEmployee.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.detail = action.payload;
            })
            .addCase(fetchEmployee.rejected, (state) => {
                state.detailLoading = false;
                state.detail = null;
            });

        // createEmployee
        builder
            .addCase(createEmployee.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(createEmployee.fulfilled, (state) => {
                state.formLoading = false;
                state.formError = null;
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to create employee';
            });

        // updateEmployee
        builder
            .addCase(updateEmployee.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(updateEmployee.fulfilled, (state) => {
                state.formLoading = false;
                state.formError = null;
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to update employee';
            });

        // deleteEmployee
        builder
            .addCase(deleteEmployee.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.list = state.list.filter((e) => e.id !== action.payload);
            })
            .addCase(deleteEmployee.rejected, (state) => {
                state.deleteLoading = false;
            });
    },
});

// ── Actions ──
export const { clearFormError, clearDetail, removeFromList } = employeeSlice.actions;

// ── Selectors ──
export const selectEmployeeList = (state) => state.employees.list;
export const selectEmployeeMeta = (state) => state.employees.meta;
export const selectEmployeeLoading = (state) => state.employees.loading;
export const selectEmployeeDetail = (state) => state.employees.detail;
export const selectEmployeeDetailLoading = (state) => state.employees.detailLoading;
export const selectEmployeeFormLoading = (state) => state.employees.formLoading;
export const selectEmployeeFormError = (state) => state.employees.formError;
export const selectEmployeeDeleteLoading = (state) => state.employees.deleteLoading;

export default employeeSlice.reducer;
