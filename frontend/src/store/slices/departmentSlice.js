import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Async Thunks ──

/**
 * fetchDepartments – loads all departments.
 */
export const fetchDepartments = createAsyncThunk(
    'departments/fetchDepartments',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/departments/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * fetchDepartment – loads a single department by ID (for edit form).
 */
export const fetchDepartment = createAsyncThunk(
    'departments/fetchDepartment',
    async (id, { rejectWithValue }) => {
        try {
            const res = await API.get(`/departments/${id}/`);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * createDepartment – creates a new department.
 */
export const createDepartment = createAsyncThunk(
    'departments/createDepartment',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await API.post('/departments/', payload);
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data) {
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save department');
        }
    }
);

/**
 * updateDepartment – updates an existing department.
 */
export const updateDepartment = createAsyncThunk(
    'departments/updateDepartment',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            const res = await API.put(`/departments/${id}/`, payload);
            return res.data;
        } catch (error) {
            const data = error.response?.data;
            if (data) {
                const messages = Object.entries(data).map(
                    ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                );
                return rejectWithValue(messages.join(' | '));
            }
            return rejectWithValue('Failed to save department');
        }
    }
);

/**
 * deleteDepartment – deletes a department by ID.
 */
export const deleteDepartment = createAsyncThunk(
    'departments/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            await API.delete(`/departments/${id}/`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete department');
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
const departmentSlice = createSlice({
    name: 'departments',
    initialState,
    reducers: {
        clearDeptFormError(state) {
            state.formError = null;
        },
    },
    extraReducers: (builder) => {
        // fetchDepartments
        builder
            .addCase(fetchDepartments.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchDepartments.rejected, (state) => {
                state.loading = false;
                state.list = [];
            });

        // createDepartment
        builder
            .addCase(createDepartment.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.formLoading = false;
                state.list.push(action.payload);
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to create department';
            });

        // updateDepartment
        builder
            .addCase(updateDepartment.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.formLoading = false;
                const idx = state.list.findIndex((d) => d.id === action.payload.id);
                if (idx !== -1) state.list[idx] = action.payload;
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to update department';
            });

        // deleteDepartment
        builder
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.list = state.list.filter((d) => d.id !== action.payload);
            });
    },
});

// ── Actions ──
export const { clearDeptFormError } = departmentSlice.actions;

// ── Selectors ──
export const selectDepartmentList = (state) => state.departments.list;
export const selectDepartmentLoading = (state) => state.departments.loading;
export const selectDeptFormLoading = (state) => state.departments.formLoading;
export const selectDeptFormError = (state) => state.departments.formError;

export default departmentSlice.reducer;
