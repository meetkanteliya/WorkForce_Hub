def get_redux_section():
    return '''
<div class="container section" id="redux">
<div class="section-header">
<h2>06 — Redux</h2>
<p>Store, reducers, actions, middleware, Redux Toolkit, and when to use Redux.</p>
</div>

<h3>6.1 Core Concepts</h3>

<div class="card concept">
<p><strong>Redux</strong> is a predictable state container. It has three principles:</p>
<ol>
<li><strong>Single source of truth:</strong> Entire app state in one store</li>
<li><strong>State is read-only:</strong> Only way to change is by dispatching actions</li>
<li><strong>Changes via pure functions:</strong> Reducers are pure functions (state + action → new state)</li>
</ol>
<p><strong>Flow:</strong> Component dispatches Action → Middleware (optional) → Reducer processes → Store updates → Component re-renders</p>
</div>

<pre>
// ===== CLASSIC REDUX (for understanding) =====

// Action Types
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';

// Action Creators
const increment = (amount = 1) =&gt; ({ type: INCREMENT, payload: amount });
const decrement = (amount = 1) =&gt; ({ type: DECREMENT, payload: amount });

// Reducer (pure function — no side effects!)
const initialState = { value: 0 };

function counterReducer(state = initialState, action) {
    switch (action.type) {
        case INCREMENT:
            return { ...state, value: state.value + action.payload };
        case DECREMENT:
            return { ...state, value: state.value - action.payload };
        default:
            return state;
    }
}
</pre>

<h3>6.2 Redux Toolkit (Modern Redux)</h3>

<pre>
// Redux Toolkit — the recommended way to write Redux
import { createSlice, configureStore, createAsyncThunk } from '@reduxjs/toolkit';

// createSlice = actions + reducer in one
const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0, status: 'idle' },
    reducers: {
        increment: (state) =&gt; { state.value += 1; },  // Immer allows "mutation"
        decrement: (state) =&gt; { state.value -= 1; },
        incrementByAmount: (state, action) =&gt; {
            state.value += action.payload;
        },
        reset: (state) =&gt; { state.value = 0; }
    }
});

// Async thunk for API calls
const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, { rejectWithValue }) =&gt; {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed');
            return await response.json();
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState: { list: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) =&gt; {
        builder
            .addCase(fetchUsers.pending, (state) =&gt; {
                state.status = 'loading';
            })
            .addCase(fetchUsers.fulfilled, (state, action) =&gt; {
                state.status = 'succeeded';
                state.list = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) =&gt; {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

// Configure store
const store = configureStore({
    reducer: {
        counter: counterSlice.reducer,
        users: usersSlice.reducer,
    }
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
</pre>

<h3>6.3 Using Redux in React Components</h3>

<pre>
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, fetchUsers } from './store';

function Counter() {
    const count = useSelector((state) =&gt; state.counter.value);
    const dispatch = useDispatch();
    
    return (
        &lt;div&gt;
            &lt;p&gt;Count: {count}&lt;/p&gt;
            &lt;button onClick={() =&gt; dispatch(increment())}&gt;+&lt;/button&gt;
            &lt;button onClick={() =&gt; dispatch(decrement())}&gt;-&lt;/button&gt;
        &lt;/div&gt;
    );
}

function UserList() {
    const { list, status, error } = useSelector((state) =&gt; state.users);
    const dispatch = useDispatch();
    
    useEffect(() =&gt; {
        if (status === 'idle') dispatch(fetchUsers());
    }, [status, dispatch]);
    
    if (status === 'loading') return &lt;Spinner /&gt;;
    if (status === 'failed') return &lt;p&gt;Error: {error}&lt;/p&gt;;
    
    return list.map(user =&gt; &lt;UserCard key={user.id} user={user} /&gt;);
}
</pre>

<h3>6.4 When to Use Redux vs Not</h3>

<table>
<thead><tr><th>Use Redux When</th><th>Don't Use Redux When</th></tr></thead>
<tbody>
<tr><td>Many components need same state</td><td>State is local to one component</td></tr>
<tr><td>Complex state update logic</td><td>Simple state (toggle, form input)</td></tr>
<tr><td>State needs to be inspectable/debuggable</td><td>Small app with few components</td></tr>
<tr><td>Caching server data across pages</td><td>Only fetching data (use React Query)</td></tr>
<tr><td>Undo/redo functionality needed</td><td>State doesn't change often</td></tr>
</tbody>
</table>

<div class="qa">
<div class="question">What is middleware in Redux? Give an example.</div>
<div class="answer">Middleware sits between dispatching an action and the reducer. It can intercept, modify, delay, or replace actions. Common uses: logging, async operations (thunk), analytics. Redux Thunk allows you to dispatch functions (not just objects) for async logic.</div>
</div>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Always mention Redux Toolkit — classic Redux is considered legacy</li>
<li>Know alternatives: Zustand (simpler), Jotai (atomic), React Query (server state)</li>
<li>Explain the unidirectional data flow clearly</li>
<li>Understand Immer (used internally by RTK) — it allows "mutating" syntax while producing immutable updates</li>
</ul>
</div>

</div>
'''
