def get_mock_interview_section():
    return '''
<div class="container section" id="mock-interview">
<div class="section-header">
<h2>10 — Mock Interview (50+ Real Questions with Answers)</h2>
<p>Mixed questions from all topics — exactly what companies ask.</p>
</div>

<h3>Python Questions</h3>

<div class="qa"><div class="question">1. What are Python decorators and when would you use them?</div>
<div class="answer">Decorators are functions that wrap other functions to add behavior without modifying the original. Used for logging, authentication, caching, rate limiting, and input validation. They use the @syntax and take a function as argument, return a wrapper function.</div></div>

<div class="qa"><div class="question">2. Explain the GIL. How do you achieve parallelism in Python?</div>
<div class="answer">The GIL (Global Interpreter Lock) allows only one thread to execute Python bytecode at a time. For CPU-bound parallelism, use multiprocessing (separate processes, each with own GIL). For I/O-bound concurrency, use threading or asyncio. Libraries like NumPy release the GIL for C operations.</div></div>

<div class="qa"><div class="question">3. What is the difference between a list and a tuple?</div>
<div class="answer">Lists are mutable (can be changed), tuples are immutable (cannot be changed after creation). Tuples are slightly faster, use less memory, and can be used as dictionary keys. Use tuples for fixed collections, lists for dynamic ones.</div></div>

<div class="qa"><div class="question">4. How does Python manage memory?</div>
<div class="answer">Python uses reference counting (each object tracks how many references point to it) plus a cyclic garbage collector for circular references. When reference count hits 0, memory is freed. The gc module handles cycles. Python also uses memory pools (pymalloc) for small objects.</div></div>

<div class="qa"><div class="question">5. What are context managers? Give an example.</div>
<div class="answer">Context managers handle setup and cleanup using with statement. They implement __enter__ and __exit__ methods. Common use: file handling, database connections, locks. Example: with open("file.txt") as f automatically closes the file even if an exception occurs.</div></div>

<h3>FastAPI / Django Questions</h3>

<div class="qa"><div class="question">6. How does dependency injection work in FastAPI?</div>
<div class="answer">FastAPI uses the Depends() function. You declare a dependency as a function parameter with Depends(dependency_function). FastAPI calls the dependency function, injects its return value. Dependencies can be nested, cached, and use yield for cleanup. Used for DB sessions, auth, permissions.</div></div>

<div class="qa"><div class="question">7. What is the N+1 query problem? How to fix it in Django?</div>
<div class="answer">N+1 occurs when you fetch N objects and each triggers an additional query for related data. Fix: use select_related() for ForeignKey (SQL JOIN in one query) or prefetch_related() for ManyToMany (2 queries, Python-side join). This reduces N+1 queries to 1 or 2.</div></div>

<div class="qa"><div class="question">8. Django middleware vs FastAPI middleware — differences?</div>
<div class="answer">Django middleware is class-based with hooks (process_request, process_view, process_response, process_exception). FastAPI middleware is function-based using @app.middleware("http") and is async-native. Both execute on every request/response cycle. Django middleware order matters in settings.py.</div></div>

<div class="qa"><div class="question">9. How do you handle authentication in FastAPI?</div>
<div class="answer">Common approach: JWT tokens. Use python-jose for JWT encoding/decoding. Create a dependency that extracts the token from Authorization header, verifies it, and returns the user. Use OAuth2PasswordBearer for token extraction. Hash passwords with bcrypt via passlib.</div></div>

<div class="qa"><div class="question">10. What are Django signals? When should you avoid them?</div>
<div class="answer">Signals allow decoupled notifications when actions occur (post_save, pre_delete, etc.). Avoid when: logic is tightly coupled to the model (use model methods instead), when you need transactional guarantees, or when the signal chain becomes too complex to debug.</div></div>

<h3>JavaScript Questions</h3>

<div class="qa"><div class="question">11. Explain the JavaScript event loop.</div>
<div class="answer">JS is single-threaded. The event loop processes: (1) Call Stack (sync code), (2) Microtask Queue (Promise.then, queueMicrotask), (3) Macrotask Queue (setTimeout, setInterval, I/O). After each macrotask, ALL microtasks are processed before the next macrotask.</div></div>

<div class="qa"><div class="question">12. What is a closure? Give a practical example.</div>
<div class="answer">A closure is a function that retains access to its outer scope variables even after the outer function returns. Practical use: creating private variables, function factories, memoization. Example: counter function that returns increment/decrement methods with a private count variable.</div></div>

<div class="qa"><div class="question">13. What is the difference between var, let, and const?</div>
<div class="answer">var: function-scoped, hoisted with undefined, can redeclare. let: block-scoped, hoisted but in TDZ (ReferenceError if accessed early), cannot redeclare. const: like let but cannot be reassigned (the binding is immutable, but object contents can change).</div></div>

<div class="qa"><div class="question">14. Explain prototypal inheritance in JavaScript.</div>
<div class="answer">Every JS object has a hidden [[Prototype]] link to another object. When accessing a property, JS walks up the prototype chain until it finds it or reaches null. Constructor.prototype sets the prototype for instances. ES6 classes are syntactic sugar over this mechanism.</div></div>

<div class="qa"><div class="question">15. What is the difference between Promise.all, Promise.allSettled, and Promise.race?</div>
<div class="answer">Promise.all: resolves when ALL promises resolve, rejects immediately if ANY rejects. Promise.allSettled: waits for ALL to settle (resolve or reject), never rejects. Promise.race: resolves/rejects as soon as the FIRST promise settles. Use .all for dependent operations, .allSettled for independent ones, .race for timeouts.</div></div>

<h3>React / Redux Questions</h3>

<div class="qa"><div class="question">16. What is the Virtual DOM? Why is it faster?</div>
<div class="answer">The Virtual DOM is a lightweight JS representation of the real DOM. On state change, React creates a new VDOM, diffs it with the previous one (reconciliation), and applies only the minimal changes to the real DOM. This batched approach is faster than direct DOM manipulation.</div></div>

<div class="qa"><div class="question">17. When would you use useMemo vs useCallback?</div>
<div class="answer">useMemo memoizes a computed VALUE (expensive calculations). useCallback memoizes a FUNCTION reference (prevents recreating callbacks). Use useCallback when passing callbacks to React.memo-wrapped child components. Use useMemo for expensive filtering/sorting.</div></div>

<div class="qa"><div class="question">18. Explain React component lifecycle with hooks.</div>
<div class="answer">Mount: useState initializer runs, then useEffect with [] runs. Update: component re-renders, useEffect cleanup runs, then useEffect body runs. Unmount: useEffect cleanup runs. useEffect with [] = componentDidMount. useEffect return = componentWillUnmount.</div></div>

<div class="qa"><div class="question">19. What is prop drilling and how to solve it?</div>
<div class="answer">Prop drilling is passing props through many intermediate components. Solutions: (1) React Context API for theme/auth/locale. (2) State management (Redux, Zustand). (3) Component composition — render children/slots pattern. (4) Custom hooks for shared logic.</div></div>

<div class="qa"><div class="question">20. Redux Toolkit vs classic Redux — what changed?</div>
<div class="answer">RTK: createSlice combines actions + reducer. Uses Immer for immutable updates with mutable syntax. createAsyncThunk for async. configureStore with good defaults. Classic Redux: manual action types, action creators, switch statements, spread operators for immutability. RTK is now the standard.</div></div>

<h3>Database Questions</h3>

<div class="qa"><div class="question">21. Explain ACID properties with an example.</div>
<div class="answer">Atomicity: bank transfer — both debit and credit happen or neither. Consistency: after transfer, total money is same. Isolation: two people transferring from same account don't interfere. Durability: after commit, data survives server crash.</div></div>

<div class="qa"><div class="question">22. What is database indexing? When should you NOT use it?</div>
<div class="answer">An index is a data structure (B-tree) for fast lookups. Don't use on: columns rarely queried, tables with frequent writes (index maintenance overhead), small tables (seq scan is fine), columns with low cardinality (boolean — only 2 values).</div></div>

<div class="qa"><div class="question">23. Explain normalization vs denormalization.</div>
<div class="answer">Normalization: split data into related tables to reduce redundancy (1NF, 2NF, 3NF). Denormalization: combine tables for faster reads (duplicate data). SQL databases prefer normalization. NoSQL often uses denormalization. Trade-off: data integrity vs read performance.</div></div>

<div class="qa"><div class="question">24. MongoDB: embed vs reference — when to use which?</div>
<div class="answer">Embed when: data is always accessed together, 1:1 or 1:few relationship, data rarely changes independently. Reference when: 1:many or many:many, data accessed independently, document would exceed 16MB, data changes frequently.</div></div>

<div class="qa"><div class="question">25. What is a SQL injection? How to prevent it?</div>
<div class="answer">SQL injection is inserting malicious SQL through user input. Example: input "'; DROP TABLE users; --". Prevention: always use parameterized queries/prepared statements, never concatenate user input into SQL strings. ORMs like Django ORM and SQLAlchemy handle this automatically.</div></div>

<h3>General / Architecture Questions</h3>

<div class="qa"><div class="question">26. REST vs GraphQL — when to use which?</div>
<div class="answer">REST: resource-based URLs, fixed response shape, simple caching (HTTP), good for CRUD. GraphQL: single endpoint, client specifies exact data needed (no over/under-fetching), good for complex UIs with varied data needs. REST for simple APIs, GraphQL for complex frontends.</div></div>

<div class="qa"><div class="question">27. What is CORS and why does it exist?</div>
<div class="answer">Cross-Origin Resource Sharing is a security mechanism. Browsers block requests from one origin to another by default. CORS headers (Access-Control-Allow-Origin) tell the browser which origins are allowed. It prevents malicious sites from making requests to your API using a user's cookies.</div></div>

<div class="qa"><div class="question">28. Explain JWT authentication flow.</div>
<div class="answer">1. User sends credentials (login). 2. Server verifies, creates JWT (header.payload.signature). 3. Server sends JWT to client. 4. Client stores JWT (httpOnly cookie or localStorage). 5. Client sends JWT in Authorization header for each request. 6. Server verifies signature, extracts user info.</div></div>

<div class="qa"><div class="question">29. What is the difference between authentication and authorization?</div>
<div class="answer">Authentication: "Who are you?" — verifying identity (login, JWT, OAuth). Authorization: "What can you do?" — checking permissions (admin vs user, RBAC). Authentication happens first, then authorization.</div></div>

<div class="qa"><div class="question">30. Explain microservices vs monolith.</div>
<div class="answer">Monolith: single codebase, single deployment, shared database. Microservices: separate services, independent deployment, each owns its database. Start with monolith (simpler), move to microservices when team grows and services need to scale independently.</div></div>

<div class="qa"><div class="question">31. What is caching? Name caching strategies.</div>
<div class="answer">Caching stores frequently accessed data in fast storage. Strategies: (1) Cache-aside: app checks cache first, fetches from DB on miss. (2) Write-through: write to cache and DB simultaneously. (3) Write-behind: write to cache, async write to DB. (4) TTL-based: auto-expire after time.</div></div>

<div class="qa"><div class="question">32. What is a message queue? Why use one?</div>
<div class="answer">A message queue (RabbitMQ, Kafka, Redis) decouples producers from consumers. Producer sends message to queue, consumer processes it asynchronously. Use for: email sending, image processing, order processing — any task that can be done later without blocking the user.</div></div>

<div class="qa"><div class="question">33. Explain the CAP theorem simply.</div>
<div class="answer">In a distributed system, you can only guarantee 2 of 3: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network failures). Since partitions are unavoidable, you choose between CP (consistency) or AP (availability).</div></div>

<div class="qa"><div class="question">34. What is a load balancer?</div>
<div class="answer">A load balancer distributes incoming requests across multiple servers. Algorithms: Round Robin, Least Connections, IP Hash. Benefits: higher availability, better performance, horizontal scaling. Examples: Nginx, HAProxy, AWS ALB.</div></div>

<div class="qa"><div class="question">35. HTTP status codes — name the important ones.</div>
<div class="answer">200 OK, 201 Created, 204 No Content. 301 Moved Permanently, 302 Found (redirect). 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests. 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable.</div></div>

<h3>More Rapid-Fire Questions (36-55)</h3>

<div class="qa"><div class="question">36. What is a race condition?</div>
<div class="answer">When two processes access shared data simultaneously and the result depends on execution order. Fix: locks, mutexes, atomic operations, or database transactions.</div></div>

<div class="qa"><div class="question">37. Explain Docker in simple terms.</div>
<div class="answer">Docker packages your app + dependencies into a container that runs the same everywhere. Dockerfile defines the image. docker-compose manages multi-container apps. Containers are lighter than VMs — they share the host OS kernel.</div></div>

<div class="qa"><div class="question">38. What is CI/CD?</div>
<div class="answer">CI (Continuous Integration): automatically build and test code on every push. CD (Continuous Deployment/Delivery): automatically deploy to staging/production after tests pass. Tools: GitHub Actions, GitLab CI, Jenkins.</div></div>

<div class="qa"><div class="question">39. Git: rebase vs merge?</div>
<div class="answer">Merge creates a merge commit, preserves history. Rebase replays commits on top of another branch, creates linear history. Use merge for shared branches, rebase for feature branches before merging. Never rebase public/shared branches.</div></div>

<div class="qa"><div class="question">40. What is an API rate limiter and how to implement it?</div>
<div class="answer">Rate limiter restricts the number of requests a client can make. Algorithms: Token Bucket, Sliding Window, Fixed Window. Implementation: use Redis to track request counts per user/IP with TTL. Return 429 Too Many Requests when limit exceeded.</div></div>

<div class="qa"><div class="question">41. What is WebSocket? When to use over HTTP?</div>
<div class="answer">WebSocket is a persistent, bidirectional protocol. Unlike HTTP (request-response), WebSocket maintains an open connection. Use for: real-time chat, live updates, gaming, stock tickers — anything requiring instant server-to-client push.</div></div>

<div class="qa"><div class="question">42. Explain the difference between cookies, localStorage, and sessionStorage.</div>
<div class="answer">Cookies: sent with every HTTP request, 4KB limit, can set expiry, accessible by server. localStorage: 5-10MB, persists until cleared, client-only. sessionStorage: like localStorage but cleared when tab closes. Use cookies for auth tokens, localStorage for preferences.</div></div>

<div class="qa"><div class="question">43. What is SOLID in OOP?</div>
<div class="answer">S: Single Responsibility — one class, one job. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subclasses should be substitutable. I: Interface Segregation — many specific interfaces over one general. D: Dependency Inversion — depend on abstractions, not implementations.</div></div>

<div class="qa"><div class="question">44. What are environment variables? Why use them?</div>
<div class="answer">Environment variables store configuration outside code: API keys, database URLs, secrets. They prevent hardcoding sensitive data, allow different configs per environment (dev/staging/prod), and keep secrets out of version control. Use .env files locally, secrets managers in production.</div></div>

<div class="qa"><div class="question">45. Explain the difference between SQL JOIN types with a one-line example each.</div>
<div class="answer">INNER: only matching rows from both. LEFT: all from left, NULLs for unmatched right. RIGHT: all from right, NULLs for unmatched left. FULL OUTER: all from both, NULLs where no match. CROSS: every combination (cartesian product).</div></div>

<div class="qa"><div class="question">46. What is the purpose of __init__.py in Python?</div>
<div class="answer">It marks a directory as a Python package, allowing imports. Can be empty or contain initialization code. In Python 3.3+, it is optional for namespace packages, but still recommended for explicit packages. Used to define __all__ for controlling star imports.</div></div>

<div class="qa"><div class="question">47. What is debouncing and throttling in JavaScript?</div>
<div class="answer">Debounce: wait until user STOPS triggering for X ms, then execute once (search input). Throttle: execute at most once per X ms (scroll handler). Debounce delays execution, throttle limits frequency.</div></div>

<div class="qa"><div class="question">48. How does React handle forms? Controlled vs uncontrolled?</div>
<div class="answer">Controlled: React state drives the input value (onChange updates state, value from state). Uncontrolled: DOM manages its own state, use useRef to access. Controlled is recommended — gives React full control over form data.</div></div>

<div class="qa"><div class="question">49. What is the difference between PUT and PATCH?</div>
<div class="answer">PUT replaces the entire resource (send all fields). PATCH partially updates the resource (send only changed fields). PUT is idempotent. In practice, most APIs use PATCH for updates.</div></div>

<div class="qa"><div class="question">50. What happens when you type a URL in the browser?</div>
<div class="answer">1. DNS lookup (domain → IP). 2. TCP connection (3-way handshake). 3. TLS handshake (if HTTPS). 4. HTTP request sent. 5. Server processes, returns response. 6. Browser parses HTML → builds DOM. 7. Fetches CSS/JS → builds CSSOM. 8. Renders page (layout → paint → composite).</div></div>

<div class="qa"><div class="question">51. What is database connection pooling?</div>
<div class="answer">Maintaining a pool of reusable database connections instead of opening/closing for each request. Reduces overhead of establishing connections. Tools: SQLAlchemy (pool_size), Django (CONN_MAX_AGE), PgBouncer for PostgreSQL.</div></div>

<div class="qa"><div class="question">52. Explain the concept of idempotency in REST APIs.</div>
<div class="answer">An idempotent operation produces the same result regardless of how many times it is called. GET, PUT, DELETE are idempotent. POST is NOT idempotent (creates new resource each time). Important for retry logic and reliability.</div></div>

<div class="qa"><div class="question">53. What is server-side rendering (SSR) vs client-side rendering (CSR)?</div>
<div class="answer">SSR: server generates full HTML, sends to browser (better SEO, faster first paint). CSR: browser downloads JS, renders in client (better interactivity after load). Next.js supports both. Use SSR for content sites, CSR for dashboards/SPAs.</div></div>

<div class="qa"><div class="question">54. How do you handle errors in a production API?</div>
<div class="answer">Use structured error responses (status code + error message + error code). Log errors with context (request ID, user, stack trace). Use centralized error handling middleware. Never expose internal errors to clients. Use monitoring (Sentry, Datadog).</div></div>

<div class="qa"><div class="question">55. What is the difference between horizontal and vertical scaling?</div>
<div class="answer">Vertical: upgrade the existing server (more CPU, RAM). Horizontal: add more servers behind a load balancer. Vertical has limits and is expensive. Horizontal is more resilient and cost-effective but requires stateless design.</div></div>

</div>
'''
