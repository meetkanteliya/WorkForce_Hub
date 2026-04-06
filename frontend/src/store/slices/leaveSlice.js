import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Async Thunks ──

/**
 * fetchLeaveRequests – loads leave requests (all or "my").
 */
export const fetchLeaveRequests = createAsyncThunk(
    'leaves/fetchLeaveRequests',
    async ({ tab = 'all' } = {}, { rejectWithValue }) => {
        try {
            const endpoint = tab === 'my' ? '/leaves/requests/my/' : '/leaves/requests/';
            const res = await API.get(endpoint);
            const data = res.data.results ?? res.data;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * actionLeaveRequest – approve or reject a leave request.
 */
export const actionLeaveRequest = createAsyncThunk(
    'leaves/actionLeaveRequest',
    async ({ id, action }, { rejectWithValue }) => {
        try {
            await API.patch(`/leaves/requests/${id}/${action}/`);
            return { id, status: action === 'approve' ? 'approved' : 'rejected' };
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || `Failed to ${action} leave`);
        }
    }
);

/**
 * createLeaveRequest – submit a new leave request.
 */
export const createLeaveRequest = createAsyncThunk(
    'leaves/createLeaveRequest',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await API.post('/leaves/requests/', {
                ...payload,
                leave_type: parseInt(payload.leave_type),
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
            return rejectWithValue('Failed to apply for leave');
        }
    }
);

/**
 * fetchLeaveTypes – loads all leave types.
 */
export const fetchLeaveTypes = createAsyncThunk(
    'leaves/fetchLeaveTypes',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/leaves/types/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * createLeaveType – create a new leave type.
 */
export const createLeaveType = createAsyncThunk(
    'leaves/createLeaveType',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await API.post('/leaves/types/', {
                name: payload.name,
                max_days_per_year: parseInt(payload.max_days_per_year),
            });
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to create');
        }
    }
);

/**
 * fetchBalances – loads all leave balances (admin/hr).
 */
export const fetchBalances = createAsyncThunk(
    'leaves/fetchBalances',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/leaves/balances/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * fetchMyBalances – loads current user's leave balances.
 */
export const fetchMyBalances = createAsyncThunk(
    'leaves/fetchMyBalances',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/leaves/balances/my/');
            return res.data.results ?? res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * adjustBalance – adjust an employee's leave balance.
 */
export const adjustBalance = createAsyncThunk(
    'leaves/adjustBalance',
    async ({ balanceId, payload }, { rejectWithValue }) => {
        try {
            const res = await API.patch(`/leaves/balances/${balanceId}/adjust/`, payload);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to adjust balance');
        }
    }
);

// ── Initial State ──
const initialState = {
    // Requests
    requests: [],
    requestsLoading: false,

    // Leave types
    types: [],
    typesLoading: false,

    // Balances (all employees – admin view)
    balances: [],
    balanceLoading: false,

    // My balances (current user)
    myBalances: [],

    // Form state (create leave request)
    formLoading: false,
    formError: null,

    // Leave type create
    typeFormLoading: false,
    typeFormError: null,
};

// ── Slice ──
const leaveSlice = createSlice({
    name: 'leaves',
    initialState,
    reducers: {
        clearLeaveFormError(state) {
            state.formError = null;
        },
        clearTypeFormError(state) {
            state.typeFormError = null;
        },
        /**
         * updateRequestStatus – optimistically update a request's status in list.
         */
        updateRequestStatus(state, action) {
            const { id, status } = action.payload;
            const idx = state.requests.findIndex((r) => r.id === id);
            if (idx !== -1) {
                state.requests[idx] = { ...state.requests[idx], status };
            }
        },
        /**
         * updateBalance – update a single balance in the list after adjustment.
         */
        updateBalance(state, action) {
            const updated = action.payload;
            const idx = state.balances.findIndex((b) => b.id === updated.id);
            if (idx !== -1) {
                state.balances[idx] = updated;
            }
        },
    },
    extraReducers: (builder) => {
        // fetchLeaveRequests
        builder
            .addCase(fetchLeaveRequests.pending, (state) => {
                state.requestsLoading = true;
            })
            .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
                state.requestsLoading = false;
                state.requests = action.payload;
            })
            .addCase(fetchLeaveRequests.rejected, (state) => {
                state.requestsLoading = false;
                state.requests = [];
            });

        // actionLeaveRequest
        builder
            .addCase(actionLeaveRequest.fulfilled, (state, action) => {
                const { id, status } = action.payload;
                const idx = state.requests.findIndex((r) => r.id === id);
                if (idx !== -1) {
                    state.requests[idx] = { ...state.requests[idx], status };
                }
            });

        // createLeaveRequest
        builder
            .addCase(createLeaveRequest.pending, (state) => {
                state.formLoading = true;
                state.formError = null;
            })
            .addCase(createLeaveRequest.fulfilled, (state) => {
                state.formLoading = false;
                state.formError = null;
            })
            .addCase(createLeaveRequest.rejected, (state, action) => {
                state.formLoading = false;
                state.formError = action.payload || 'Failed to apply for leave';
            });

        // fetchLeaveTypes
        builder
            .addCase(fetchLeaveTypes.pending, (state) => {
                state.typesLoading = true;
            })
            .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
                state.typesLoading = false;
                state.types = action.payload;
            })
            .addCase(fetchLeaveTypes.rejected, (state) => {
                state.typesLoading = false;
                state.types = [];
            });

        // createLeaveType
        builder
            .addCase(createLeaveType.pending, (state) => {
                state.typeFormLoading = true;
                state.typeFormError = null;
            })
            .addCase(createLeaveType.fulfilled, (state, action) => {
                state.typeFormLoading = false;
                state.types.push(action.payload);
            })
            .addCase(createLeaveType.rejected, (state, action) => {
                state.typeFormLoading = false;
                state.typeFormError = action.payload || 'Failed to create leave type';
            });

        // fetchBalances
        builder
            .addCase(fetchBalances.pending, (state) => {
                state.balanceLoading = true;
            })
            .addCase(fetchBalances.fulfilled, (state, action) => {
                state.balanceLoading = false;
                state.balances = action.payload;
            })
            .addCase(fetchBalances.rejected, (state) => {
                state.balanceLoading = false;
                state.balances = [];
            });

        // fetchMyBalances
        builder
            .addCase(fetchMyBalances.fulfilled, (state, action) => {
                state.myBalances = action.payload;
            });

        // adjustBalance
        builder
            .addCase(adjustBalance.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.balances.findIndex((b) => b.id === updated.id);
                if (idx !== -1) {
                    state.balances[idx] = updated;
                }
            });
    },
});

// ── Actions ──
export const {
    clearLeaveFormError,
    clearTypeFormError,
    updateRequestStatus,
    updateBalance,
} = leaveSlice.actions;

// ── Selectors ──
export const selectLeaveRequests = (state) => state.leaves.requests;
export const selectRequestsLoading = (state) => state.leaves.requestsLoading;
export const selectLeaveTypes = (state) => state.leaves.types;
export const selectTypesLoading = (state) => state.leaves.typesLoading;
export const selectBalances = (state) => state.leaves.balances;
export const selectBalanceLoading = (state) => state.leaves.balanceLoading;
export const selectMyBalances = (state) => state.leaves.myBalances;
export const selectLeaveFormLoading = (state) => state.leaves.formLoading;
export const selectLeaveFormError = (state) => state.leaves.formError;
export const selectTypeFormLoading = (state) => state.leaves.typeFormLoading;
export const selectTypeFormError = (state) => state.leaves.typeFormError;

export default leaveSlice.reducer;
