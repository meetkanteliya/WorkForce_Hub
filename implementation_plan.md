# RTK Migration — Production-Safe Incremental Plan

## Migration Philosophy

> [!IMPORTANT]
> **No big-bang rewrite.** Each phase is a standalone, shippable commit. Old code keeps working alongside RTK until a module is fully migrated. If a phase breaks something, you revert that one commit — not the whole project.

---

## Phase Roadmap

| Phase | Scope | Files Changed | Risk | Estimated Effort |
|-------|-------|--------------|------|-----------------|
| **Phase 1** | Install RTK + `store.js` + `authSlice.js` + `apiSlice.js` (employees, departments, dashboard) + bridge `useAuth()` | 5 new, 3 modified | Low | ~3 hours |
| **Phase 2** | Migrate `EmployeeList`, `EmployeeForm`, `EmployeeDetail`, `DepartmentList`, `DepartmentForm` to RTK Query | 5 modified | Medium | ~2 hours |
| **Phase 3** | Migrate Leaves module (LeaveRequestList, LeaveRequestForm, LeaveTypeList) | 3 modified | Medium | ~2 hours |
| **Phase 4** | Migrate Payroll + Profile + ChangePassword + Dashboard drill-downs | 6 modified | Low | ~1.5 hours |
| **Phase 5** | Migrate Notifications (Layout.jsx) + Chat unread badge | 2 modified | Low | ~1 hour |
| **Phase 6** | Migrate ThemeContext → themeSlice + cleanup dead code | 3 modified | Low | ~30 min |

**This plan only implements Phase 1.** Later phases are documented as a roadmap.

---

## Phase 1: Foundation + Auth + Core API Endpoints

### What changes:

| File | Action | Purpose |
|------|--------|---------|
| `src/app/store.js` | **NEW** | Redux store with all slices + middleware |
| `src/features/auth/authSlice.js` | **NEW** | Auth state: user, tokens, profilePic |
| `src/features/api/apiSlice.js` | **NEW** | RTK Query: employees, departments, dashboard |
| `src/main.jsx` | **MODIFY** | Wrap app in `<Provider>` |
| `src/context/AuthContext.jsx` | **MODIFY** | Bridge to Redux (keeps `useAuth()` API) |
| `src/api/axios.js` | **MODIFY** | Token read/refresh via Redux store |

### What does NOT change yet:
- All page components (still use `useAuth()` + manual `API.get()`)
- ThemeContext (stays as-is)
- CompanyChat (stays as-is)
- All other pages continue using old patterns

> [!TIP]
> After Phase 1, the app works **exactly as before** — but auth state now lives in Redux under the hood, and RTK Query endpoints are available for pages to adopt one-by-one in Phase 2+.

---

## 1. Complete Production Code

### 1A. `src/app/store.js`

```javascript
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../features/api/apiSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});
```

**Notes:**
- `apiSlice.middleware` is required for RTK Query caching, polling, and garbage collection to work
- `devTools` only enabled in dev mode — no performance cost in production
- No `redux-persist` — we manually sync to localStorage in the authSlice (simpler, no extra dependency)

---

### 1B. `src/features/auth/authSlice.js`

```javascript
import { createSlice } from '@reduxjs/toolkit';

// ── Safe localStorage helpers ──
const safeParse = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

// ── Initial state hydrated from localStorage ──
const initialState = {
  user: safeParse('user'),
  tokens: safeParse('tokens'),
  profilePic: null,
  isAuthenticated: !!safeParse('tokens')?.access,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called after successful login.
     * Persists to localStorage for page refresh survival.
     */
    setCredentials(state, action) {
      const { user, tokens } = action.payload;
      state.user = user;
      state.tokens = tokens;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tokens', JSON.stringify(tokens));
    },

    /**
     * Called when token refresh succeeds.
     * Updates tokens in state AND localStorage atomically.
     */
    updateTokens(state, action) {
      const newTokens = { ...state.tokens, ...action.payload };
      state.tokens = newTokens;
      localStorage.setItem('tokens', JSON.stringify(newTokens));
    },

    /**
     * Clears all auth state + localStorage.
     */
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.profilePic = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
    },

    setProfilePic(state, action) {
      state.profilePic = action.payload;
    },
  },
});

export const { setCredentials, updateTokens, logout, setProfilePic } =
  authSlice.actions;

// ── Selectors (memoized by Redux Toolkit internally) ──
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentTokens = (state) => state.auth.tokens;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectProfilePic = (state) => state.auth.profilePic;

export default authSlice.reducer;
```

**Design decisions:**
- **localStorage sync inside reducers:** Yes, this is technically a side effect in a reducer, but RTK explicitly allows this pattern for simple persistence. The alternative (`redux-persist` or a listener middleware) adds complexity for zero benefit here.
- **No async thunks for login:** Login stays in AuthContext's bridge (Phase 1) or gets moved to a thunk in Phase 2. This slice is pure state management.
- **`updateTokens` is separate from `setCredentials`:** This is critical — the refresh interceptor calls `updateTokens` without touching `user`, preventing a race where user data gets overwritten during a background refresh.

---

### 1C. `src/features/api/apiSlice.js`

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ── Mutex for token refresh (prevents race conditions) ──
let refreshPromise = null;

/**
 * Custom baseQuery that:
 * 1. Attaches JWT token from Redux store
 * 2. On 401, refreshes the token ONCE (with mutex to prevent races)
 * 3. On refresh failure, logs out
 */
const baseQueryWithAuth = async (args, api, extraOptions) => {
  // ── Step 1: Attempt the request with current token ──
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.tokens?.access;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

  let result = await rawBaseQuery(args, api, extraOptions);

  // ── Step 2: If 401, try token refresh ──
  if (result?.error?.status === 401) {
    const { tokens } = api.getState().auth;

    if (!tokens?.refresh) {
      // No refresh token — force logout
      api.dispatch({ type: 'auth/logout' });
      if (typeof window !== 'undefined') window.location.href = '/login';
      return result;
    }

    // ── Mutex: only one refresh at a time ──
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/token/refresh/',
              method: 'POST',
              body: { refresh: tokens.refresh },
            },
            api,
            extraOptions
          );

          if (refreshResult?.data) {
            // Success — update tokens in Redux + localStorage
            api.dispatch({
              type: 'auth/updateTokens',
              payload: {
                access: refreshResult.data.access,
                ...(refreshResult.data.refresh && {
                  refresh: refreshResult.data.refresh,
                }),
              },
            });
            return true;
          } else {
            // Refresh failed (e.g. refresh token expired)
            api.dispatch({ type: 'auth/logout' });
            if (typeof window !== 'undefined')
              window.location.href = '/login';
            return false;
          }
        } catch {
          api.dispatch({ type: 'auth/logout' });
          if (typeof window !== 'undefined') window.location.href = '/login';
          return false;
        }
      })();
    }

    const refreshSuccess = await refreshPromise;
    refreshPromise = null; // Reset mutex

    if (refreshSuccess) {
      // ── Step 3: Retry the original request with new token ──
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// ═══════════════════════════════════════════════════════
// RTK Query API Slice — Phase 1 Endpoints Only
// ═══════════════════════════════════════════════════════

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,

  // Tag types for cache invalidation
  tagTypes: ['Employee', 'Department', 'Dashboard'],

  endpoints: (builder) => ({

    // ── Dashboard ──
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary/',
      providesTags: ['Dashboard'],
      // Transform: API returns nested data, pass through as-is
      transformResponse: (response) => response,
    }),

    // ── Employees ──
    getEmployees: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.department) searchParams.set('department', params.department);
        if (params?.status) searchParams.set('status', params.status);
        const qs = searchParams.toString();
        return `/employees/${qs ? `?${qs}` : ''}`;
      },
      // "results" is the array, but we also need count/next/previous
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Employee', id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    getEmployee: builder.query({
      query: (id) => `/employees/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/employees/',
        method: 'POST',
        body,
      }),
      // Creating an employee invalidates the list AND dashboard counts
      invalidatesTags: [
        { type: 'Employee', id: 'LIST' },
        'Dashboard',
      ],
    }),

    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}/`,
        method: 'DELETE',
      }),
      // Deleting invalidates list + dashboard (total count changes)
      invalidatesTags: [
        { type: 'Employee', id: 'LIST' },
        'Dashboard',
      ],
    }),

    // ── Departments ──
    getDepartments: builder.query({
      query: () => '/departments/',
      // Handle both paginated `{ results: [...] }` and raw array
      transformResponse: (response) => response.results ?? response,
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'Department', id })),
              { type: 'Department', id: 'LIST' },
            ]
          : [{ type: 'Department', id: 'LIST' }],
    }),

    getDepartment: builder.query({
      query: (id) => `/departments/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Department', id }],
    }),

    createDepartment: builder.mutation({
      query: (body) => ({
        url: '/departments/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Department', id: 'LIST' },
        'Dashboard',
      ],
    }),

    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Department', id },
        { type: 'Department', id: 'LIST' },
      ],
    }),

    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Department', id: 'LIST' },
        'Dashboard',
      ],
    }),
  }),
});

// ── Auto-generated hooks ──
export const {
  useGetDashboardSummaryQuery,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = apiSlice;
```

---

## 2. Token Refresh — Race Condition Prevention

The `baseQueryWithAuth` above uses a **mutex pattern**:

```
Request A fails 401  ─┐
Request B fails 401  ─┤  Only ONE refresh call fires
Request C fails 401  ─┘  A, B, C all await the same Promise
                         ↓
                   refreshPromise resolves
                         ↓
                   All three requests retry with new token
```

**How it works:**
1. First 401 sets `refreshPromise = fetch(refresh endpoint)`
2. Concurrent 401s find `refreshPromise` already set → they `await` it instead of calling refresh again
3. After resolution, `refreshPromise = null` (reset for next cycle)

**Edge cases handled:**
- **Refresh token expired:** Dispatches `logout`, redirects to `/login`
- **Network failure during refresh:** Same logout + redirect
- **Concurrent requests:** Mutex ensures only 1 refresh call, all waiters get the new token

---

## 3. API Error Handling Strategy

### Global errors (handled by `baseQueryWithAuth`):
| Error | Action |
|-------|--------|
| `401 Unauthorized` | Attempt token refresh → retry. If refresh fails → logout + redirect |
| `403 Forbidden` | Passed to component (role mismatch — show error UI) |
| `500 Server Error` | Passed to component |
| Network failure | RTK Query sets `isError: true`, component shows retry option |

### Per-component errors (handled by the page):
```jsx
// RTK Query gives you granular error state:
const { data, error, isLoading, isFetching, isError, refetch } = useGetEmployeesQuery({ page: 1 });

// For mutations:
const [deleteEmployee, { isLoading: isDeleting, error: deleteError }] = useDeleteEmployeeMutation();
```

### UI/UX loading states:

| RTK Query state | What it means | UI recommendation |
|----------------|---------------|-------------------|
| `isLoading: true` | **First** fetch (no cached data) | Show skeleton/spinner |
| `isFetching: true` | Background refetch (cached data exists) | Show data + subtle "updating" indicator |
| `isLoading: false, isFetching: false` | Stable data | Show data |
| `isError: true` | Request failed | Show error banner + "Retry" button via `refetch()` |

> [!IMPORTANT]
> The key insight: `isLoading` is only `true` on the **first** load. On subsequent renders (e.g. navigating back to a page), RTK Query serves the cached data instantly (`isLoading: false`) and refetches in the background (`isFetching: true`). This makes page transitions feel instant — a major UX upgrade over the current `useState(true)` pattern.

---

## 4. RTK Query Caching — How It Actually Works

### When RTK Query refetches:

| Scenario | Behavior |
|----------|----------|
| Component mounts with cached data | **Serves cache immediately**, then refetches in background if data is older than `keepUnusedDataFor` (default: 60s) |
| Component mounts, no cache | Full fetch, shows `isLoading: true` |
| Query args change (e.g. `page: 1` → `page: 2`) | New cache entry, full fetch for new args |
| After a mutation with `invalidatesTags` | All queries providing those tags refetch automatically |
| `refetchOnMountOrArgChange: true` | Always refetch on mount (even if cache exists) |
| `pollingInterval: 30000` | Refetches every 30s while component is mounted |
| Window regains focus | Refetch if `refetchOnFocus: true` is set |

### How `invalidatesTags` works — real example:

```
1. EmployeeList renders → calls useGetEmployeesQuery()
   → provides tags: [{ type: 'Employee', id: 1 }, { type: 'Employee', id: 2 }, { type: 'Employee', id: 'LIST' }]

2. User deletes employee #2 → calls deleteEmployee(2)
   → invalidates tags: [{ type: 'Employee', id: 'LIST' }, 'Dashboard']

3. RTK Query sees 'Employee/LIST' is invalidated
   → automatically re-runs useGetEmployeesQuery()
   → EmployeeList re-renders with fresh data (without employee #2)

4. RTK Query sees 'Dashboard' is invalidated
   → if Dashboard is currently mounted, its useGetDashboardSummaryQuery() re-fetches
   → Dashboard total_employees count updates automatically
   → if Dashboard is NOT mounted, nothing happens (lazy invalidation)
```

> [!TIP]
> Tags are only re-fetched if a component is **currently subscribed** to that query. If you navigate away from the Dashboard before deleting an employee, the Dashboard query is unsubscribed. When you navigate back, RTK Query sees the cache is invalidated and fetches fresh data automatically.

### Cache garbage collection:
- `keepUnusedDataFor: 60` (default) — cached data for unmounted components is kept for 60s
- After 60s with no subscribers, the cache entry is deleted
- This means: navigate away for < 60s → instant load. Navigate away for > 60s → fresh fetch.

---

## 5. Chat Architecture — What Stays Where

| State | Location | Reason |
|-------|----------|--------|
| `messages[]` | **Local `useState`** in CompanyChat | Messages arrive via WebSocket push — RTK Query can't manage WS streams. You'd need `onCacheEntryAdded` which is complex and fragile. |
| `input` (text field) | **Local `useState`** | Form state — no reason to globalize |
| `typingUsers` Map | **Local `useState`** | Ephemeral UI state, only relevant when chat is open |
| `socketRef` | **Local `useRef`** | DOM/WS reference — can't be serialized in Redux |
| `unreadCount` | **Redux `chatSlice`** | This is the ONLY piece that needs to be global — Layout sidebar needs it for the badge |
| `members[]` | **RTK Query** (Phase 5) | REST endpoint, cacheable, shared with other components |
| `loadingHistory` | **Local `useState`** | Transient UI state |

### How the unread badge works (Phase 5):

```
CompanyChat mounts → dispatch(resetUnread())  // clear badge
WebSocket receives message while tab is hidden → dispatch(incrementUnread())
Layout.jsx sidebar reads: useSelector(state => state.chat.unreadCount)
```

The `chatSlice` is intentionally tiny:
```javascript
const chatSlice = createSlice({
  name: 'chat',
  initialState: { unreadCount: 0 },
  reducers: {
    incrementUnread: (state) => { state.unreadCount += 1; },
    resetUnread: (state) => { state.unreadCount = 0; },
  },
});
```

---

## 6. Performance Best Practices

### Preventing unnecessary re-renders:

**Problem:** `useSelector(state => state.auth)` returns the entire auth object — any change to any field triggers a re-render of every component using this selector.

**Solution:** Use granular selectors:
```jsx
// ❌ Bad — re-renders on ANY auth state change
const auth = useSelector(state => state.auth);

// ✅ Good — only re-renders when `user` specifically changes
const user = useSelector(selectCurrentUser);
const isAuthenticated = useSelector(selectIsAuthenticated);
```

### RTK Query auto-optimization:
- RTK Query hooks use **structural sharing** — if a refetch returns identical data, React won't re-render
- Each `useQuery` hook only subscribes to its specific cache entry
- Multiple components using `useGetDepartmentsQuery()` share **one** network request and **one** cache entry

### When to use `createEntityAdapter`:
> [!NOTE]
> **Not recommended for Phase 1.** `createEntityAdapter` is useful when you need to:
> - Normalize nested data (e.g. employees containing department objects)
> - Perform frequent lookups by ID in a large list (1000+ items)
> - Do optimistic updates on individual items in a list
>
> Your current data sizes (< 100 employees/departments) don't justify the added complexity. If the dataset grows past 500+ items, add it then.

### RTK Query `selectFromResult` (advanced):
```jsx
// Only re-render when the specific employee changes, not the whole list
const { employee } = useGetEmployeesQuery(undefined, {
  selectFromResult: ({ data }) => ({
    employee: data?.results?.find(e => e.id === targetId),
  }),
});
```

---

## 7. Rollback Strategy

### Git-based rollback:

```bash
# Before starting Phase 1, create a branch:
git checkout -b feature/rtk-migration

# Each phase = 1 commit
git add -A && git commit -m "Phase 1: RTK foundation + auth + core API"

# If Phase 1 breaks something:
git checkout main   # instant rollback

# If Phase 1 works but Phase 2 breaks:
git revert HEAD     # revert Phase 2, keep Phase 1
```

### Coexistence guarantee:
Phase 1 is designed so that **old code and new code work simultaneously**:

| Old Pattern | Still Works? | Why |
|-------------|-------------|-----|
| `useAuth().user` | ✅ | Bridge hook reads from Redux |
| `useAuth().login()` | ✅ | Bridge dispatches to Redux |
| `API.get('/employees/')` | ✅ | Axios instance unchanged, reads tokens from Redux |
| `useGetEmployeesQuery()` | ✅ NEW | RTK Query — available but optional |
| `ThemeContext` | ✅ | Untouched in Phase 1 |
| `CompanyChat` WebSocket | ✅ | Untouched in Phase 1 |

> [!CAUTION]
> The only **irreversible** change in Phase 1 is that `AuthContext` becomes a bridge to Redux. If you need to fully revert, restore the original `AuthContext.jsx` and remove the `<Provider>` from `main.jsx`. That's it — 2 files.

---

## 8. Modifications to Existing Files (Phase 1)

### 8A. `src/main.jsx` — Add Provider

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

### 8B. `src/context/AuthContext.jsx` — Bridge to Redux

The old `useAuth()` API is preserved. Internally it reads/writes Redux state:

```jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setCredentials,
  logout as logoutAction,
  setProfilePic as setProfilePicAction,
  selectCurrentUser,
  selectCurrentTokens,
  selectIsAuthenticated,
  selectProfilePic,
} from '../features/auth/authSlice';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const tokens = useSelector(selectCurrentTokens);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const profilePic = useSelector(selectProfilePic);

  // Fetch profile picture on app load (same as before)
  useEffect(() => {
    if (isAuthenticated) {
      API.get('/employees/me/')
        .then((res) => {
          if (res.data?.profile_picture) {
            dispatch(setProfilePicAction(res.data.profile_picture));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, dispatch]);

  // LOGIN — same multi-step flow as before
  const login = async (username, password) => {
    try {
      // Step 1: Get tokens
      const res = await API.post('/auth/login/', { username, password });
      const newTokens = res.data;

      // Temporarily store tokens so the next API call can use them
      localStorage.setItem('tokens', JSON.stringify(newTokens));

      // Step 2: Get user profile
      const profileRes = await API.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${newTokens.access}` },
      });
      const userData = profileRes.data;

      // Step 3: Commit to Redux (this also persists to localStorage)
      dispatch(setCredentials({ user: userData, tokens: newTokens }));

      // Step 4: Fetch profile picture (non-critical)
      try {
        const empRes = await API.get('/employees/me/', {
          headers: { Authorization: `Bearer ${newTokens.access}` },
        });
        if (empRes.data?.profile_picture) {
          dispatch(setProfilePicAction(empRes.data.profile_picture));
        }
      } catch {
        // non-critical
      }

      return userData;
    } catch (error) {
      // Rollback
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      dispatch(logoutAction());
      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    dispatch(logoutAction());
    navigate('/');
  };

  // Role checker
  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        loading: false,
        login,
        logout,
        hasRole,
        profilePic,
        setProfilePic: (pic) => dispatch(setProfilePicAction(pic)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 8C. `src/api/axios.js` — Read tokens from Redux store

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Late-bind the store to avoid circular imports ──
let storeRef = null;
export const injectStore = (_store) => {
  storeRef = _store;
};

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  let token = null;

  // Prefer Redux store, fallback to localStorage (during app boot)
  if (storeRef) {
    token = storeRef.getState().auth.tokens?.access;
  } else {
    try {
      const stored = localStorage.getItem('tokens');
      token = stored ? JSON.parse(stored)?.access : null;
    } catch {
      token = null;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let browser set Content-Type with boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Handle 401 — try to refresh token, else logout
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      let tokens = null;

      if (storeRef) {
        tokens = storeRef.getState().auth.tokens;
      } else {
        try {
          const stored = localStorage.getItem('tokens');
          tokens = stored ? JSON.parse(stored) : null;
        } catch {
          tokens = null;
        }
      }

      if (tokens?.refresh) {
        try {
          const res = await axios.post('/api/auth/token/refresh/', {
            refresh: tokens.refresh,
          });

          const newTokens = {
            ...tokens,
            access: res.data.access,
            ...(res.data.refresh && { refresh: res.data.refresh }),
          };

          // Update Redux store if available
          if (storeRef) {
            const { updateTokens } = await import(
              '../features/auth/authSlice'
            );
            storeRef.dispatch(updateTokens(newTokens));
          }

          // Also update localStorage (interceptor reads from here on boot)
          localStorage.setItem('tokens', JSON.stringify(newTokens));

          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return API(originalRequest);
        } catch {
          if (storeRef) {
            const { logout } = await import('../features/auth/authSlice');
            storeRef.dispatch(logout());
          }
          localStorage.removeItem('tokens');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
```

### 8D. Update `src/app/store.js` to inject into axios

```javascript
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../features/api/apiSlice';
import authReducer from '../features/auth/authSlice';
import { injectStore } from '../api/axios';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

// Inject store into axios to break circular dependency
injectStore(store);
```

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Should I proceed with implementing Phase 1 only (the 5 new + 3 modified files listed above)? No page components will be changed yet — they'll continue using `useAuth()` and `API.get()` as before.

> [!IMPORTANT]
> **Q2:** For Phase 2 (migrating EmployeeList/DepartmentList), do you want me to migrate one page as a reference pattern first, so you can review before I do the rest?
