import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ── Safe JSON parse helper ──
const safeParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

// ── Initial State (hydrated from localStorage) ──
const initialState = {
    user: safeParse(localStorage.getItem('user')),
    tokens: safeParse(localStorage.getItem('tokens')),
    profilePic: null,
    isAuthenticated: !!safeParse(localStorage.getItem('tokens'))?.access,
    loading: false,
    error: null,
};

// ── Async Thunks ──

/**
 * loginUser — performs the full login flow:
 *   1. POST /auth/login/  → get tokens
 *   2. GET  /auth/profile/ → get user data
 *   3. GET  /employees/me/ → get profile picture (non-critical)
 */
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ username, password }, { rejectWithValue }) => {
        try {
            // Step 1: login
            const res = await API.post('/auth/login/', { username, password });
            const newTokens = res.data;
            localStorage.setItem('tokens', JSON.stringify(newTokens));

            // Step 2: get user profile
            const profileRes = await API.get('/auth/profile/', {
                headers: { Authorization: `Bearer ${newTokens.access}` },
            });
            const userData = profileRes.data;
            localStorage.setItem('user', JSON.stringify(userData));

            // Step 3: get profile picture (non-critical)
            let profilePic = null;
            try {
                const empRes = await API.get('/employees/me/', {
                    headers: { Authorization: `Bearer ${newTokens.access}` },
                });
                if (empRes.data?.profile_picture) {
                    profilePic = empRes.data.profile_picture;
                }
            } catch {
                // non-critical error
            }

            return { user: userData, tokens: newTokens, profilePic };
        } catch (error) {
            // Rollback on failure
            localStorage.removeItem('tokens');
            localStorage.removeItem('user');
            return rejectWithValue(
                error.response?.data?.detail || 'Invalid credentials'
            );
        }
    }
);

/**
 * fetchProfile — loads the employee profile picture on app start.
 */
export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get('/employees/me/');
            return { profilePic: res.data?.profile_picture || null };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Slice ──
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            localStorage.removeItem('tokens');
            localStorage.removeItem('user');
            state.user = null;
            state.tokens = null;
            state.profilePic = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
        },
        setProfilePic(state, action) {
            state.profilePic = action.payload;
        },
        clearAuthError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // loginUser
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.tokens = action.payload.tokens;
                state.profilePic = action.payload.profilePic;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.tokens = null;
                state.profilePic = null;
                state.isAuthenticated = false;
                state.error = action.payload || 'Login failed';
            });

        // fetchProfile
        builder
            .addCase(fetchProfile.fulfilled, (state, action) => {
                if (action.payload.profilePic) {
                    state.profilePic = action.payload.profilePic;
                }
            });
    },
});

// ── Actions ──
export const { logout, setProfilePic, clearAuthError } = authSlice.actions;

// ── Selectors ──
export const selectUser = (state) => state.auth.user;
export const selectTokens = (state) => state.auth.tokens;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectProfilePic = (state) => state.auth.profilePic;

/**
 * hasRole — utility function (not a selector, used inline).
 * Usage: hasRole(user, 'admin', 'hr')
 */
export const hasRole = (user, ...roles) => {
    return user && roles.includes(user.role);
};

export default authSlice.reducer;
