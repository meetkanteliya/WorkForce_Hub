def get_javascript_section():
    return '''
<div class="container section" id="javascript">
<div class="section-header">
<h2>04 — JavaScript (Core + Advanced)</h2>
<p>Execution context, closures, hoisting, event loop, promises, async/await, prototypes.</p>
</div>

<h3>4.1 Execution Context & Hoisting</h3>

<div class="card concept">
<p><strong>Execution Context</strong> is the environment where JavaScript code runs. There are 3 types: <strong>Global</strong> (default), <strong>Function</strong> (created on each function call), and <strong>Eval</strong>. Each context has two phases:</p>
<ol>
<li><strong>Creation Phase:</strong> Memory is allocated. <code>var</code> declarations are hoisted with value <code>undefined</code>. <code>let/const</code> are hoisted but in a "Temporal Dead Zone" (TDZ). Function declarations are hoisted completely.</li>
<li><strong>Execution Phase:</strong> Code runs line by line, values are assigned.</li>
</ol>
</div>

<pre>
console.log(a);        // undefined (var is hoisted with undefined)
console.log(b);        // ReferenceError (let is in TDZ)
console.log(myFunc()); // "hello" (function declaration is fully hoisted)

var a = 10;
let b = 20;

function myFunc() { return "hello"; }

// Function expression is NOT fully hoisted
console.log(myExpr()); // TypeError: myExpr is not a function
var myExpr = function() { return "hi"; };
</pre>

<h3>4.2 Closures</h3>

<div class="card concept">
<p>A <strong>closure</strong> is a function that remembers variables from its outer scope even after the outer function has returned. Every function in JavaScript forms a closure.</p>
</div>

<pre>
// Basic closure
function createCounter() {
    let count = 0;  // enclosed variable
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}
const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2
// 'count' is private — cannot be accessed directly

// Classic interview problem: closure in a loop
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// Prints: 3, 3, 3 (var is function-scoped, shared)

// Fix 1: use let (block-scoped)
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// Prints: 0, 1, 2

// Fix 2: IIFE (old way)
for (var i = 0; i < 3; i++) {
    (function(j) {
        setTimeout(() => console.log(j), 100);
    })(i);
}
// Prints: 0, 1, 2

// Practical closure: function factory
function multiplier(factor) {
    return (number) => number * factor;
}
const double = multiplier(2);
const triple = multiplier(3);
double(5);  // 10
triple(5);  // 15
</pre>

<h3>4.3 Event Loop (VERY IMPORTANT)</h3>

<div class="card concept">
<p>JavaScript is <strong>single-threaded</strong> but non-blocking via the <strong>event loop</strong>. The event loop continuously checks: Call Stack → Microtask Queue → Macrotask Queue.</p>
<ul>
<li><strong>Call Stack:</strong> Executes synchronous code</li>
<li><strong>Microtask Queue:</strong> Promise callbacks (<code>.then</code>), <code>queueMicrotask</code>, <code>MutationObserver</code></li>
<li><strong>Macrotask Queue:</strong> <code>setTimeout</code>, <code>setInterval</code>, I/O, UI rendering</li>
</ul>
<p><strong>Priority:</strong> Call Stack → ALL Microtasks → ONE Macrotask → ALL Microtasks → ...</p>
</div>

<pre>
console.log("1");                           // Sync → Call Stack

setTimeout(() => console.log("2"), 0);      // Macrotask Queue

Promise.resolve().then(() => console.log("3")); // Microtask Queue

console.log("4");                           // Sync → Call Stack

// Output: 1, 4, 3, 2
// Explanation:
// 1. "1" — sync, runs immediately
// 2. setTimeout → goes to Macrotask Queue
// 3. Promise.then → goes to Microtask Queue
// 4. "4" — sync, runs immediately
// 5. Call stack empty → check Microtasks → "3"
// 6. Microtasks empty → check Macrotasks → "2"

// More complex example
console.log("start");

setTimeout(() => {
    console.log("timeout 1");
    Promise.resolve().then(() => console.log("promise inside timeout"));
}, 0);

Promise.resolve().then(() => {
    console.log("promise 1");
    setTimeout(() => console.log("timeout inside promise"), 0);
});

console.log("end");

// Output: start, end, promise 1, timeout 1, promise inside timeout, timeout inside promise
</pre>

<h3>4.4 Promises & Async/Await</h3>

<pre>
// Promise states: pending → fulfilled OR rejected
const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url) resolve({ data: "success" });
            else reject(new Error("No URL provided"));
        }, 1000);
    });
};

// Promise chaining
fetchData("/api/users")
    .then(result => fetchData(`/api/users/${result.id}`))
    .then(user => console.log(user))
    .catch(err => console.error(err))
    .finally(() => console.log("Done"));

// Promise.all — wait for ALL (fails fast on any rejection)
const [users, posts, comments] = await Promise.all([
    fetch("/users"),
    fetch("/posts"),
    fetch("/comments")
]);

// Promise.allSettled — wait for ALL (never rejects)
const results = await Promise.allSettled([
    fetch("/api1"),
    fetch("/api2"),  // even if this fails
    fetch("/api3")
]);
// results: [{status:"fulfilled", value:...}, {status:"rejected", reason:...}, ...]

// Promise.race — first to settle wins
const result = await Promise.race([
    fetch("/api"),
    new Promise((_, reject) => setTimeout(() => reject("Timeout"), 5000))
]);

// Async/Await — syntactic sugar over Promises
async function getUserPosts(userId) {
    try {
        const user = await fetch(`/users/${userId}`);
        const userData = await user.json();
        const posts = await fetch(`/posts?userId=${userData.id}`);
        return await posts.json();
    } catch (error) {
        console.error("Failed:", error);
        throw error;
    }
}
</pre>

<h3>4.5 Prototypes & Inheritance</h3>

<pre>
// Prototype chain
function Person(name) {
    this.name = name;
}
Person.prototype.greet = function() {
    return `Hi, I'm ${this.name}`;
};

const john = new Person("John");
john.greet(); // "Hi, I'm John"
// john → Person.prototype → Object.prototype → null

// ES6 class (syntactic sugar over prototypes)
class Animal {
    #sound; // private field
    
    constructor(name, sound) {
        this.name = name;
        this.#sound = sound;
    }
    
    speak() {
        return `${this.name} says ${this.#sound}`;
    }
    
    static create(name, sound) {
        return new Animal(name, sound);
    }
}

class Dog extends Animal {
    constructor(name) {
        super(name, "Woof");
    }
    
    fetch(item) {
        return `${this.name} fetches ${item}`;
    }
}

// this keyword
const obj = {
    name: "Alice",
    regular: function() { return this.name; },     // "Alice"
    arrow: () => this.name,                          // undefined (inherits outer this)
};

// bind, call, apply
function introduce(greeting) {
    return `${greeting}, I'm ${this.name}`;
}
const user = { name: "Bob" };
introduce.call(user, "Hello");      // "Hello, I'm Bob"
introduce.apply(user, ["Hello"]);   // "Hello, I'm Bob"
const bound = introduce.bind(user);
bound("Hello");                     // "Hello, I'm Bob"
</pre>

<h3>4.6 Interview Questions</h3>

<div class="qa">
<div class="question">What is the difference between <code>==</code> and <code>===</code>?</div>
<div class="answer"><code>==</code> compares with type coercion (converts types before comparing). <code>===</code> compares without type coercion (strict equality). Always use <code>===</code>. Example: <code>"5" == 5</code> is true, <code>"5" === 5</code> is false.</div>
</div>

<div class="qa">
<div class="question">What is the difference between <code>null</code> and <code>undefined</code>?</div>
<div class="answer"><code>undefined</code> means a variable is declared but not assigned. <code>null</code> is an intentional absence of value (assigned by programmer). <code>typeof undefined</code> is "undefined". <code>typeof null</code> is "object" (JS bug).</div>
</div>

<div class="qa">
<div class="question">Explain <code>var</code> vs <code>let</code> vs <code>const</code>.</div>
<div class="answer"><code>var</code>: function-scoped, hoisted with <code>undefined</code>, can be redeclared. <code>let</code>: block-scoped, hoisted but in TDZ, cannot be redeclared. <code>const</code>: like <code>let</code> but cannot be reassigned (but object properties can still be mutated).</div>
</div>

<div class="card warning">
<h4>⚠️ Common Mistakes</h4>
<ul>
<li>Not understanding <code>this</code> in arrow vs regular functions</li>
<li>Using <code>==</code> instead of <code>===</code></li>
<li>Not knowing the event loop order (microtasks before macrotasks)</li>
<li>Forgetting that <code>const</code> objects can still be mutated</li>
<li>Confusing closure behavior in loops with <code>var</code></li>
</ul>
</div>

</div>
'''
