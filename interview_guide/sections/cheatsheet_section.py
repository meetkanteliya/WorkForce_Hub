def get_cheatsheet_section():
    return '''
<div class="container section" id="cheatsheets">
<div class="section-header">
<h2>12 — Cheat Sheets & Quick Revision</h2>
<p>Top 50 must-remember concepts and quick reference tables.</p>
</div>

<h3>Python Cheat Sheet</h3>
<table>
<thead><tr><th>Concept</th><th>Key Point</th></tr></thead>
<tbody>
<tr><td>Mutable vs Immutable</td><td>list/dict/set are mutable; int/str/tuple are immutable</td></tr>
<tr><td>GIL</td><td>Only one thread runs Python bytecode at a time; use multiprocessing for CPU-bound</td></tr>
<tr><td>Decorator</td><td>Function that wraps another function; use @functools.wraps</td></tr>
<tr><td>Generator</td><td>Uses yield, lazy evaluation, memory efficient</td></tr>
<tr><td>List Comprehension</td><td><code>[x*2 for x in range(10) if x%2==0]</code></td></tr>
<tr><td>*args, **kwargs</td><td>*args = tuple of positional args; **kwargs = dict of keyword args</td></tr>
<tr><td>Context Manager</td><td><code>with</code> statement; __enter__ and __exit__ methods</td></tr>
<tr><td>@property</td><td>Make methods behave like attributes; getter/setter</td></tr>
<tr><td>collections</td><td>Counter, defaultdict, deque, namedtuple, OrderedDict</td></tr>
<tr><td>deepcopy vs copy</td><td>copy = shared nested refs; deepcopy = fully independent</td></tr>
</tbody>
</table>

<h3>JavaScript Cheat Sheet</h3>
<table>
<thead><tr><th>Concept</th><th>Key Point</th></tr></thead>
<tbody>
<tr><td>Event Loop</td><td>Call Stack → Microtasks (Promise) → Macrotasks (setTimeout)</td></tr>
<tr><td>Closure</td><td>Function retains access to outer scope after outer returns</td></tr>
<tr><td>this</td><td>Regular func: caller object. Arrow func: inherited from outer scope</td></tr>
<tr><td>== vs ===</td><td>== coerces types; === strict equality. Always use ===</td></tr>
<tr><td>var/let/const</td><td>var: function-scoped. let/const: block-scoped. const: no reassign</td></tr>
<tr><td>Spread/Rest</td><td><code>...arr</code> spreads; <code>(...args)</code> collects</td></tr>
<tr><td>Destructuring</td><td><code>const {a, b} = obj;</code> or <code>const [x, y] = arr;</code></td></tr>
<tr><td>Map vs Object</td><td>Map: any key type, ordered, has size. Object: string/symbol keys</td></tr>
<tr><td>Nullish coalescing</td><td><code>x ?? 'default'</code> — only for null/undefined (not 0 or '')</td></tr>
<tr><td>Optional chaining</td><td><code>obj?.prop?.method?.()</code> — no error if null/undefined</td></tr>
</tbody>
</table>

<h3>React Cheat Sheet</h3>
<table>
<thead><tr><th>Hook</th><th>Purpose</th><th>When to Use</th></tr></thead>
<tbody>
<tr><td>useState</td><td>Local component state</td><td>Any state that triggers re-render</td></tr>
<tr><td>useEffect</td><td>Side effects (API, subscriptions)</td><td>Fetch data, event listeners, timers</td></tr>
<tr><td>useMemo</td><td>Memoize expensive value</td><td>Heavy computation, filtering/sorting</td></tr>
<tr><td>useCallback</td><td>Memoize function reference</td><td>Passing callbacks to React.memo children</td></tr>
<tr><td>useRef</td><td>Mutable ref (no re-render)</td><td>DOM access, previous value, render count</td></tr>
<tr><td>useContext</td><td>Consume context value</td><td>Theme, auth, locale — global state</td></tr>
<tr><td>useReducer</td><td>Complex state logic</td><td>Multiple related state values</td></tr>
</tbody>
</table>

<h3>SQL Quick Reference</h3>
<table>
<thead><tr><th>Operation</th><th>Syntax</th></tr></thead>
<tbody>
<tr><td>Filter</td><td><code>WHERE column = value</code></td></tr>
<tr><td>Sort</td><td><code>ORDER BY column DESC</code></td></tr>
<tr><td>Group + Filter</td><td><code>GROUP BY col HAVING COUNT(*) > 5</code></td></tr>
<tr><td>Join</td><td><code>JOIN table2 ON t1.id = t2.fk_id</code></td></tr>
<tr><td>Subquery</td><td><code>WHERE id IN (SELECT ...)</code></td></tr>
<tr><td>Window</td><td><code>RANK() OVER (PARTITION BY ... ORDER BY ...)</code></td></tr>
<tr><td>CTE</td><td><code>WITH name AS (SELECT ...) SELECT * FROM name</code></td></tr>
<tr><td>Upsert</td><td><code>INSERT ... ON CONFLICT DO UPDATE</code></td></tr>
</tbody>
</table>

<h3>MongoDB Quick Reference</h3>
<table>
<thead><tr><th>Operation</th><th>Syntax</th></tr></thead>
<tbody>
<tr><td>Find</td><td><code>db.col.find({age: {$gte: 18}})</code></td></tr>
<tr><td>Update</td><td><code>db.col.updateOne({_id}, {$set: {name: "X"}})</code></td></tr>
<tr><td>Aggregate</td><td><code>db.col.aggregate([{$match}, {$group}, {$sort}])</code></td></tr>
<tr><td>Index</td><td><code>db.col.createIndex({field: 1})</code></td></tr>
<tr><td>Lookup (JOIN)</td><td><code>{$lookup: {from, localField, foreignField, as}}</code></td></tr>
<tr><td>Text Search</td><td><code>{$text: {$search: "keyword"}}</code></td></tr>
</tbody>
</table>

<h3>HTTP Status Codes</h3>
<table>
<thead><tr><th>Code</th><th>Meaning</th><th>When</th></tr></thead>
<tbody>
<tr><td>200</td><td>OK</td><td>Successful GET/PUT/PATCH</td></tr>
<tr><td>201</td><td>Created</td><td>Successful POST (resource created)</td></tr>
<tr><td>204</td><td>No Content</td><td>Successful DELETE</td></tr>
<tr><td>400</td><td>Bad Request</td><td>Invalid input/validation error</td></tr>
<tr><td>401</td><td>Unauthorized</td><td>Not authenticated</td></tr>
<tr><td>403</td><td>Forbidden</td><td>Authenticated but no permission</td></tr>
<tr><td>404</td><td>Not Found</td><td>Resource doesn't exist</td></tr>
<tr><td>409</td><td>Conflict</td><td>Duplicate resource</td></tr>
<tr><td>422</td><td>Unprocessable</td><td>Valid syntax but semantic error</td></tr>
<tr><td>429</td><td>Too Many Requests</td><td>Rate limited</td></tr>
<tr><td>500</td><td>Server Error</td><td>Unhandled exception</td></tr>
</tbody>
</table>

<h3>Top 50 Must-Remember Concepts</h3>

<div class="cheat-grid">
<div class="cheat-item"><h5>1. Big O Notation</h5><p>O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)</p></div>
<div class="cheat-item"><h5>2. ACID</h5><p>Atomicity, Consistency, Isolation, Durability</p></div>
<div class="cheat-item"><h5>3. REST Principles</h5><p>Stateless, Resource-based, HTTP methods, JSON</p></div>
<div class="cheat-item"><h5>4. CAP Theorem</h5><p>Choose 2: Consistency, Availability, Partition tolerance</p></div>
<div class="cheat-item"><h5>5. SOLID Principles</h5><p>Single Resp, Open/Closed, Liskov, Interface Seg, Dep Inversion</p></div>
<div class="cheat-item"><h5>6. DRY</h5><p>Don't Repeat Yourself — extract common code</p></div>
<div class="cheat-item"><h5>7. JWT Structure</h5><p>Header.Payload.Signature (Base64 encoded)</p></div>
<div class="cheat-item"><h5>8. SQL vs NoSQL</h5><p>SQL: relations, ACID. NoSQL: flexible, scalable</p></div>
<div class="cheat-item"><h5>9. Indexing</h5><p>B-tree speeds reads, slows writes. Use on WHERE/JOIN cols</p></div>
<div class="cheat-item"><h5>10. N+1 Problem</h5><p>Fix: select_related (FK) / prefetch_related (M2M)</p></div>
<div class="cheat-item"><h5>11. Event Loop</h5><p>Stack → Microtasks → Macrotasks</p></div>
<div class="cheat-item"><h5>12. Virtual DOM</h5><p>Diff old/new VDOM, batch update real DOM</p></div>
<div class="cheat-item"><h5>13. Closure</h5><p>Function remembers its outer scope variables</p></div>
<div class="cheat-item"><h5>14. Hoisting</h5><p>var: undefined. let/const: TDZ. function: fully hoisted</p></div>
<div class="cheat-item"><h5>15. GIL</h5><p>CPython: 1 thread at a time. Use multiprocessing for CPU</p></div>
<div class="cheat-item"><h5>16. ORM</h5><p>Maps objects to DB tables. Django ORM, SQLAlchemy</p></div>
<div class="cheat-item"><h5>17. Middleware</h5><p>Code that runs before/after every request</p></div>
<div class="cheat-item"><h5>18. CORS</h5><p>Browser security: controls cross-origin requests</p></div>
<div class="cheat-item"><h5>19. WebSocket</h5><p>Persistent bidirectional connection for real-time</p></div>
<div class="cheat-item"><h5>20. Docker</h5><p>Containerize app + deps. Consistent environments</p></div>
<div class="cheat-item"><h5>21. CI/CD</h5><p>Auto build, test, deploy on every code push</p></div>
<div class="cheat-item"><h5>22. Load Balancer</h5><p>Distributes traffic across servers</p></div>
<div class="cheat-item"><h5>23. Caching</h5><p>Redis/Memcached for hot data. TTL for expiry</p></div>
<div class="cheat-item"><h5>24. Message Queue</h5><p>Async processing: RabbitMQ, Kafka, Redis</p></div>
<div class="cheat-item"><h5>25. Microservices</h5><p>Independent services, own DB, API communication</p></div>
<div class="cheat-item"><h5>26. Two Pointers</h5><p>Pattern for sorted arrays. O(n) instead of O(n²)</p></div>
<div class="cheat-item"><h5>27. Sliding Window</h5><p>Fixed/variable window for substring/subarray problems</p></div>
<div class="cheat-item"><h5>28. Binary Search</h5><p>O(log n) search on sorted data</p></div>
<div class="cheat-item"><h5>29. HashMap</h5><p>O(1) lookup. Counter, defaultdict in Python</p></div>
<div class="cheat-item"><h5>30. BFS vs DFS</h5><p>BFS: level order (queue). DFS: depth first (stack/recursion)</p></div>
<div class="cheat-item"><h5>31. Recursion</h5><p>Base case + recursive case. Watch stack overflow</p></div>
<div class="cheat-item"><h5>32. Memoization</h5><p>Cache results of expensive calls. @lru_cache</p></div>
<div class="cheat-item"><h5>33. Pydantic</h5><p>Data validation via type hints. Used by FastAPI</p></div>
<div class="cheat-item"><h5>34. ASGI vs WSGI</h5><p>ASGI: async. WSGI: sync. FastAPI=ASGI, Django=WSGI (mostly)</p></div>
<div class="cheat-item"><h5>35. React.memo</h5><p>Skip re-render if props unchanged</p></div>
<div class="cheat-item"><h5>36. Redux Flow</h5><p>Dispatch Action → Reducer → New State → Re-render</p></div>
<div class="cheat-item"><h5>37. Aggregation Pipeline</h5><p>MongoDB: $match → $group → $sort → $project</p></div>
<div class="cheat-item"><h5>38. Window Functions</h5><p>SQL: RANK, ROW_NUMBER, LAG, LEAD over partitions</p></div>
<div class="cheat-item"><h5>39. Transactions</h5><p>BEGIN → operations → COMMIT/ROLLBACK</p></div>
<div class="cheat-item"><h5>40. Race Condition</h5><p>Concurrent access → unpredictable results. Fix: locks</p></div>
<div class="cheat-item"><h5>41. Idempotency</h5><p>Same request = same result. GET/PUT/DELETE are idempotent</p></div>
<div class="cheat-item"><h5>42. SSR vs CSR</h5><p>SSR: server renders HTML. CSR: browser renders with JS</p></div>
<div class="cheat-item"><h5>43. OAuth 2.0</h5><p>Authorization framework: auth code, client credentials flows</p></div>
<div class="cheat-item"><h5>44. Rate Limiting</h5><p>Prevent abuse: Token Bucket, Sliding Window algorithms</p></div>
<div class="cheat-item"><h5>45. Debounce vs Throttle</h5><p>Debounce: wait for pause. Throttle: limit frequency</p></div>
<div class="cheat-item"><h5>46. SQL Injection</h5><p>Fix: parameterized queries, never concat user input</p></div>
<div class="cheat-item"><h5>47. XSS</h5><p>Fix: escape output, Content-Security-Policy, sanitize input</p></div>
<div class="cheat-item"><h5>48. Normalization</h5><p>Reduce redundancy: 1NF, 2NF, 3NF. Split into related tables</p></div>
<div class="cheat-item"><h5>49. Horizontal Scaling</h5><p>Add more servers. Requires stateless design</p></div>
<div class="cheat-item"><h5>50. Git Rebase vs Merge</h5><p>Rebase: linear history. Merge: preserves branches</p></div>
</div>

<h3>DSA Pattern Recognition</h3>
<table>
<thead><tr><th>If You See...</th><th>Think About...</th><th>Data Structure</th></tr></thead>
<tbody>
<tr><td>Find pair with sum</td><td>Two Pointers / HashMap</td><td>Set / Dict</td></tr>
<tr><td>Contiguous subarray</td><td>Sliding Window / Prefix Sum</td><td>Array</td></tr>
<tr><td>Find k-th largest</td><td>Heap / Quick Select</td><td>Heap</td></tr>
<tr><td>Tree traversal</td><td>BFS (queue) / DFS (recursion)</td><td>Queue / Stack</td></tr>
<tr><td>Shortest path</td><td>BFS (unweighted) / Dijkstra</td><td>Queue / Heap</td></tr>
<tr><td>Generate all combinations</td><td>Backtracking</td><td>Recursion</td></tr>
<tr><td>Overlapping subproblems</td><td>Dynamic Programming</td><td>Array / Dict</td></tr>
<tr><td>Sorted + search</td><td>Binary Search</td><td>Array</td></tr>
<tr><td>Matching brackets/pairs</td><td>Stack</td><td>Stack</td></tr>
<tr><td>Top/bottom K elements</td><td>Heap / Sorting</td><td>Heap</td></tr>
</tbody>
</table>

</div>
'''
