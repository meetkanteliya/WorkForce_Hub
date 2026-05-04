def get_react_section():
    return '''
<div class="container section" id="react">
<div class="section-header">
<h2>05 — React</h2>
<p>Functional components, hooks, lifecycle, performance optimization, and architecture.</p>
</div>

<h3>5.1 Functional Components & JSX</h3>

<pre>
// Functional component with props
function UserCard({ name, email, role = "user", onDelete }) {
    return (
        &lt;div className="user-card"&gt;
            &lt;h3&gt;{name}&lt;/h3&gt;
            &lt;p&gt;{email}&lt;/p&gt;
            &lt;span className={`badge badge-${role}`}&gt;{role}&lt;/span&gt;
            &lt;button onClick={() =&gt; onDelete(name)}&gt;Delete&lt;/button&gt;
        &lt;/div&gt;
    );
}

// Conditional rendering
function Dashboard({ user, isLoading, error }) {
    if (isLoading) return &lt;Spinner /&gt;;
    if (error) return &lt;ErrorMessage error={error} /&gt;;
    if (!user) return &lt;p&gt;No user found&lt;/p&gt;;
    
    return (
        &lt;div&gt;
            &lt;h1&gt;Welcome, {user.name}&lt;/h1&gt;
            {user.isAdmin && &lt;AdminPanel /&gt;}
            {user.notifications.length &gt; 0 
                ? &lt;NotificationList items={user.notifications} /&gt;
                : &lt;p&gt;No notifications&lt;/p&gt;
            }
        &lt;/div&gt;
    );
}

// List rendering
function TodoList({ todos }) {
    return (
        &lt;ul&gt;
            {todos.map(todo =&gt; (
                &lt;li key={todo.id}&gt;{todo.text}&lt;/li&gt;
            ))}
        &lt;/ul&gt;
    );
}
// IMPORTANT: key must be unique and stable (NOT array index for dynamic lists)
</pre>

<h3>5.2 Hooks Deep Dive</h3>

<pre>
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// ===== useState =====
function Counter() {
    const [count, setCount] = useState(0);
    
    // Functional update (when new state depends on previous)
    const increment = () =&gt; setCount(prev =&gt; prev + 1);
    
    // Lazy initialization (expensive initial value)
    const [data, setData] = useState(() =&gt; computeExpensiveValue());
    
    return &lt;button onClick={increment}&gt;{count}&lt;/button&gt;;
}

// ===== useEffect =====
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() =&gt; {
        let cancelled = false; // prevent state update on unmounted component
        
        async function fetchUser() {
            setLoading(true);
            try {
                const res = await fetch(\`/api/users/\${userId}\`);
                const data = await res.json();
                if (!cancelled) {
                    setUser(data);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) setLoading(false);
            }
        }
        fetchUser();
        
        return () =&gt; { cancelled = true; }; // cleanup
    }, [userId]); // runs when userId changes
    
    // No dependency array → runs every render
    // Empty array [] → runs once on mount
    // [dep1, dep2] → runs when dep1 or dep2 change
}

// ===== useMemo (memoize expensive computation) =====
function ExpensiveList({ items, filter }) {
    const filteredItems = useMemo(() =&gt; {
        return items.filter(item =&gt; item.category === filter)
                    .sort((a, b) =&gt; a.name.localeCompare(b.name));
    }, [items, filter]); // recompute only when items or filter changes
    
    return filteredItems.map(item =&gt; &lt;Item key={item.id} {...item} /&gt;);
}

// ===== useCallback (memoize function reference) =====
function ParentComponent() {
    const [count, setCount] = useState(0);
    
    // Without useCallback, handleClick is recreated every render
    // causing ChildComponent to re-render unnecessarily
    const handleClick = useCallback((id) =&gt; {
        console.log("Clicked:", id);
    }, []); // empty deps = never recreated
    
    return &lt;ChildComponent onClick={handleClick} /&gt;;
}
const ChildComponent = React.memo(({ onClick }) =&gt; {
    // Only re-renders if onClick reference changes
    return &lt;button onClick={() =&gt; onClick(1)}&gt;Click&lt;/button&gt;;
});

// ===== useRef =====
function TextInput() {
    const inputRef = useRef(null);
    const renderCount = useRef(0);
    
    useEffect(() =&gt; {
        renderCount.current += 1; // does NOT cause re-render
    });
    
    const focusInput = () =&gt; inputRef.current.focus();
    
    return (
        &lt;div&gt;
            &lt;input ref={inputRef} /&gt;
            &lt;button onClick={focusInput}&gt;Focus&lt;/button&gt;
            &lt;p&gt;Rendered {renderCount.current} times&lt;/p&gt;
        &lt;/div&gt;
    );
}

// ===== Custom Hook =====
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() =&gt; {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });
    
    useEffect(() =&gt; {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    
    return [value, setValue];
}
// Usage: const [theme, setTheme] = useLocalStorage('theme', 'dark');
</pre>

<h3>5.3 Performance Optimization</h3>

<table>
<thead><tr><th>Technique</th><th>What It Does</th><th>When to Use</th></tr></thead>
<tbody>
<tr><td><code>React.memo</code></td><td>Prevents re-render if props unchanged</td><td>Pure components with expensive renders</td></tr>
<tr><td><code>useMemo</code></td><td>Caches computed value</td><td>Expensive calculations</td></tr>
<tr><td><code>useCallback</code></td><td>Caches function reference</td><td>Passing callbacks to memoized children</td></tr>
<tr><td>Code Splitting</td><td><code>React.lazy + Suspense</code></td><td>Large components not needed immediately</td></tr>
<tr><td>Virtualization</td><td>Render only visible items</td><td>Long lists (react-window)</td></tr>
<tr><td>Key prop</td><td>Helps React identify list items</td><td>Always use unique, stable keys</td></tr>
</tbody>
</table>

<h3>5.4 Interview Questions</h3>

<div class="qa">
<div class="question">What is the Virtual DOM and how does it work?</div>
<div class="answer">The Virtual DOM is a lightweight JavaScript copy of the real DOM. When state changes: (1) React creates a new Virtual DOM tree, (2) Diffs it with the previous one (reconciliation), (3) Computes minimum changes needed, (4) Batches updates to the real DOM. This is faster than manipulating the real DOM directly.</div>
</div>

<div class="qa">
<div class="question">Why do we need keys in lists?</div>
<div class="answer">Keys help React identify which items changed, were added, or removed during reconciliation. Without stable keys, React may re-render entire lists unnecessarily or mix up component state. Use unique IDs, never use array index for dynamic lists.</div>
</div>

<div class="qa">
<div class="question">What is prop drilling and how to avoid it?</div>
<div class="answer">Prop drilling is passing props through many intermediate components that don't need them. Solutions: (1) React Context API for global state, (2) State management (Redux/Zustand), (3) Component composition — pass components as children instead of data.</div>
</div>

<div class="card warning">
<h4>⚠️ Common Mistakes</h4>
<ul>
<li>Overusing <code>useMemo</code>/<code>useCallback</code> — they have overhead too; profile first</li>
<li>Missing dependency array values in <code>useEffect</code> (stale closures)</li>
<li>Directly mutating state: <code>state.push(item)</code> instead of <code>setState([...state, item])</code></li>
<li>Using index as key in dynamic lists</li>
<li>Fetching data in useEffect without cleanup (race conditions)</li>
</ul>
</div>

</div>
'''
