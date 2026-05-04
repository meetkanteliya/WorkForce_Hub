def get_python_section():
    return '''
<div class="container section" id="python">
<div class="section-header">
<h2>01 — Python (Core + Advanced)</h2>
<p>Data types, OOP, decorators, generators, async, GIL, memory management, and more.</p>
</div>

<!-- DATA TYPES & MEMORY -->
<h3>1.1 Data Types, Memory & Mutability</h3>

<div class="card concept">
<h4>Concept Explanation</h4>
<p>Python has <strong>mutable</strong> types (list, dict, set) and <strong>immutable</strong> types (int, float, str, tuple, frozenset). Mutable objects can be changed in-place; immutable objects cannot — any "change" creates a new object.</p>
<p><strong>Why it matters:</strong> Understanding mutability prevents bugs with default arguments, shared references, and unexpected side effects.</p>
<p><strong>Memory Model:</strong> Python uses <strong>reference counting</strong> + <strong>garbage collector</strong> (cycle detector). Every object has a reference count. When it drops to 0, memory is freed. The GC handles circular references.</p>
</div>

<table>
<thead><tr><th>Type</th><th>Mutable?</th><th>Ordered?</th><th>Hashable?</th><th>Example</th></tr></thead>
<tbody>
<tr><td>int</td><td>No</td><td>N/A</td><td>Yes</td><td><code>x = 42</code></td></tr>
<tr><td>float</td><td>No</td><td>N/A</td><td>Yes</td><td><code>x = 3.14</code></td></tr>
<tr><td>str</td><td>No</td><td>Yes</td><td>Yes</td><td><code>s = "hello"</code></td></tr>
<tr><td>tuple</td><td>No</td><td>Yes</td><td>Yes*</td><td><code>t = (1,2,3)</code></td></tr>
<tr><td>list</td><td>Yes</td><td>Yes</td><td>No</td><td><code>l = [1,2,3]</code></td></tr>
<tr><td>dict</td><td>Yes</td><td>Insertion</td><td>No</td><td><code>d = {"a":1}</code></td></tr>
<tr><td>set</td><td>Yes</td><td>No</td><td>No</td><td><code>s = {1,2,3}</code></td></tr>
<tr><td>frozenset</td><td>No</td><td>No</td><td>Yes</td><td><code>fs = frozenset([1,2])</code></td></tr>
</tbody>
</table>

<h4>Interview Questions & Answers</h4>

<div class="qa">
<div class="question">What is the difference between <code>is</code> and <code>==</code>?</div>
<div class="answer"><code>==</code> checks if two objects have the same <strong>value</strong>. <code>is</code> checks if they are the <strong>same object in memory</strong> (same id). Example: <code>[1,2] == [1,2]</code> is True, but <code>[1,2] is [1,2]</code> is False because they are two different list objects.</div>
</div>

<div class="qa">
<div class="question">Why should you never use a mutable default argument?</div>
<div class="answer">Default arguments are evaluated <strong>once</strong> when the function is defined, not each time the function is called. If you use a mutable default like <code>def f(x=[])</code>, all calls share the same list. Use <code>None</code> as default and create inside the function.</div>
</div>

<pre>
# BAD - mutable default argument
def append_to(element, target=[]):
    target.append(element)
    return target

print(append_to(1))  # [1]
print(append_to(2))  # [1, 2] — BUG! Expected [2]

# GOOD - use None
def append_to(element, target=None):
    if target is None:
        target = []
    target.append(element)
    return target
</pre>

<div class="qa">
<div class="question">What is string interning in Python?</div>
<div class="answer">Python caches small integers (-5 to 256) and short strings to save memory. So <code>a = 256; b = 256; a is b</code> is True. But <code>a = 257; b = 257; a is b</code> may be False. Never rely on <code>is</code> for value comparison.</div>
</div>

<div class="qa">
<div class="question">Explain shallow copy vs deep copy.</div>
<div class="answer"><strong>Shallow copy</strong> creates a new object but references the same nested objects. <strong>Deep copy</strong> creates completely independent copies of all nested objects. Use <code>copy.copy()</code> for shallow and <code>copy.deepcopy()</code> for deep.</div>
</div>

<pre>
import copy

original = [[1, 2], [3, 4]]
shallow = copy.copy(original)
deep = copy.deepcopy(original)

original[0][0] = 99
print(shallow[0][0])  # 99 — affected!
print(deep[0][0])     # 1  — independent
</pre>

<!-- OOP -->
<h3>1.2 Object-Oriented Programming (Deep)</h3>

<div class="card concept">
<h4>Core OOP Concepts</h4>
<ul>
<li><strong>Encapsulation:</strong> Bundle data + methods. Use <code>_private</code> (convention) and <code>__mangled</code> (name mangling).</li>
<li><strong>Inheritance:</strong> Child class inherits from parent. Python supports multiple inheritance.</li>
<li><strong>Polymorphism:</strong> Same interface, different behavior. Duck typing: "If it quacks like a duck..."</li>
<li><strong>Abstraction:</strong> Hide complexity. Use <code>abc.ABC</code> and <code>@abstractmethod</code>.</li>
</ul>
</div>

<pre>
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass
    
    @abstractmethod
    def perimeter(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self._width = width    # protected by convention
        self._height = height
    
    @property
    def width(self):
        return self._width
    
    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError("Width must be positive")
        self._width = value
    
    def area(self):
        return self._width * self._height
    
    def perimeter(self):
        return 2 * (self._width + self._height)

class Circle(Shape):
    def __init__(self, radius):
        self.__radius = radius  # name mangling: _Circle__radius
    
    def area(self):
        return 3.14159 * self.__radius ** 2
    
    def perimeter(self):
        return 2 * 3.14159 * self.__radius
</pre>

<div class="qa">
<div class="question">What is MRO (Method Resolution Order)?</div>
<div class="answer">MRO determines the order Python searches for methods in multiple inheritance. Python uses the <strong>C3 linearization</strong> algorithm. You can see it with <code>ClassName.__mro__</code> or <code>ClassName.mro()</code>. It goes left-to-right, depth-first, but skips duplicates.</div>
</div>

<div class="qa">
<div class="question">Difference between <code>@staticmethod</code> and <code>@classmethod</code>?</div>
<div class="answer"><code>@staticmethod</code> takes no implicit first argument — it is just a regular function inside a class. <code>@classmethod</code> takes <code>cls</code> as first argument — it can access/modify class state. Use classmethod for factory methods.</div>
</div>

<pre>
class Employee:
    raise_percent = 1.05
    
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
    
    def apply_raise(self):
        self.salary *= self.raise_percent
    
    @classmethod
    def set_raise_percent(cls, percent):
        cls.raise_percent = percent
    
    @classmethod
    def from_string(cls, emp_str):  # Factory method
        name, salary = emp_str.split('-')
        return cls(name, int(salary))
    
    @staticmethod
    def is_workday(day):
        return day.weekday() < 5

# Usage
emp = Employee.from_string("John-50000")
Employee.set_raise_percent(1.10)
</pre>

<div class="qa">
<div class="question">What are dunder/magic methods? Name the most important ones.</div>
<div class="answer">Dunder methods (double underscore) let you define how objects behave with built-in operations. Key ones: <code>__init__</code> (constructor), <code>__str__</code> (print), <code>__repr__</code> (debug), <code>__len__</code>, <code>__getitem__</code>, <code>__eq__</code>, <code>__hash__</code>, <code>__enter__/__exit__</code> (context manager), <code>__call__</code> (make object callable).</div>
</div>

<!-- DECORATORS, GENERATORS, ITERATORS -->
<h3>1.3 Decorators, Generators & Iterators</h3>

<div class="card concept">
<h4>Decorators</h4>
<p>A decorator is a function that takes another function, adds functionality, and returns it. They use the <code>@</code> syntax. Used for logging, auth, caching, timing, etc.</p>
</div>

<pre>
import functools, time

# Basic decorator with functools.wraps
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# Decorator with arguments
def retry(max_attempts=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Attempt {attempt+1} failed: {e}")
        return wrapper
    return decorator

@timer
@retry(max_attempts=3)
def fetch_data(url):
    # some operation
    pass

# Class-based decorator
class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0
    
    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"Call #{self.count}")
        return self.func(*args, **kwargs)
</pre>

<div class="card concept">
<h4>Generators & Iterators</h4>
<p><strong>Iterator:</strong> Any object with <code>__iter__</code> and <code>__next__</code>. <strong>Generator:</strong> A function with <code>yield</code> — it automatically creates an iterator. Generators are <strong>lazy</strong> — they produce values one at a time, saving memory.</p>
</div>

<pre>
# Generator function
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

# Generator expression (like list comprehension but lazy)
squares = (x**2 for x in range(1000000))  # uses almost no memory

# Custom iterator class
class Countdown:
    def __init__(self, start):
        self.start = start
    
    def __iter__(self):
        self.current = self.start
        return self
    
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

# yield from — delegate to sub-generator
def chain(*iterables):
    for it in iterables:
        yield from it

list(chain([1,2], [3,4], [5,6]))  # [1,2,3,4,5,6]
</pre>

<!-- MULTITHREADING vs MULTIPROCESSING -->
<h3>1.4 Multithreading vs Multiprocessing</h3>

<table>
<thead><tr><th>Feature</th><th>Threading</th><th>Multiprocessing</th><th>Asyncio</th></tr></thead>
<tbody>
<tr><td>Best for</td><td>I/O-bound tasks</td><td>CPU-bound tasks</td><td>I/O-bound (many connections)</td></tr>
<tr><td>GIL impact</td><td>Limited by GIL</td><td>Bypasses GIL</td><td>Single thread, no GIL issue</td></tr>
<tr><td>Memory</td><td>Shared</td><td>Separate per process</td><td>Shared</td></tr>
<tr><td>Overhead</td><td>Low</td><td>High</td><td>Very low</td></tr>
<tr><td>Communication</td><td>Easy (shared mem)</td><td>Pipes/Queues</td><td>Awaitable coroutines</td></tr>
</tbody>
</table>

<pre>
# Threading — good for I/O
import threading

def download(url):
    print(f"Downloading {url}")

threads = [threading.Thread(target=download, args=(url,))
           for url in urls]
for t in threads: t.start()
for t in threads: t.join()

# Multiprocessing — good for CPU
from multiprocessing import Pool

def heavy_computation(n):
    return sum(i*i for i in range(n))

with Pool(4) as pool:
    results = pool.map(heavy_computation, [10**6]*4)

# Asyncio — good for many I/O operations
import asyncio, aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)

asyncio.run(main())
</pre>

<div class="qa">
<div class="question">What is the GIL and why does it matter?</div>
<div class="answer">The <strong>Global Interpreter Lock (GIL)</strong> is a mutex in CPython that allows only one thread to execute Python bytecode at a time. This means multithreading does NOT speed up CPU-bound tasks. For CPU-bound work, use <code>multiprocessing</code> (separate processes, each with its own GIL) or use libraries like NumPy that release the GIL during computation.</div>
</div>

<!-- EXCEPTION HANDLING -->
<h3>1.5 Exception Handling (Advanced)</h3>

<pre>
# Complete exception handling pattern
class InsufficientFundsError(Exception):
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"Cannot withdraw {amount}. Balance: {balance}"
        )

class BankAccount:
    def __init__(self, balance):
        self.balance = balance
    
    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return self.balance

# Exception chaining
try:
    account.withdraw(1000)
except InsufficientFundsError as e:
    raise RuntimeError("Transaction failed") from e

# Full try/except/else/finally
try:
    result = risky_operation()
except ValueError as e:
    print(f"Bad value: {e}")
except (TypeError, KeyError) as e:
    print(f"Type/Key error: {e}")
except Exception as e:
    print(f"Unexpected: {e}")
    raise  # re-raise after logging
else:
    print("Success — no exception occurred")
    process(result)
finally:
    cleanup()  # ALWAYS runs
</pre>

<!-- CODING PROBLEMS -->
<h3>1.6 Python Coding Problems</h3>

<h4><span class="badge easy">Easy</span> Find duplicates in a list</h4>
<pre>
def find_duplicates(lst):
    seen = set()
    duplicates = set()
    for item in lst:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)

# Time: O(n), Space: O(n)
print(find_duplicates([1,2,3,2,4,3,5]))  # [2, 3]
</pre>

<h4><span class="badge medium">Medium</span> Group anagrams</h4>
<pre>
from collections import defaultdict

def group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        groups[key].append(s)
    return list(groups.values())

# Time: O(n * k log k) where k = max string length
print(group_anagrams(["eat","tea","tan","ate","nat","bat"]))
# [["eat","tea","ate"], ["tan","nat"], ["bat"]]
</pre>

<h4><span class="badge hard">Hard</span> LRU Cache from scratch</h4>
<pre>
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # Remove oldest
</pre>

<!-- COMMON MISTAKES -->
<div class="card warning">
<h4>⚠️ Common Mistakes</h4>
<ul>
<li>Using mutable default arguments (<code>def f(x=[])</code>)</li>
<li>Confusing <code>is</code> vs <code>==</code></li>
<li>Not using <code>functools.wraps</code> in decorators (loses function metadata)</li>
<li>Catching bare <code>except:</code> instead of <code>except Exception:</code></li>
<li>Modifying a list while iterating over it</li>
<li>Using threads for CPU-bound work (GIL blocks it)</li>
</ul>
</div>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Always mention the GIL when asked about threading</li>
<li>Know the time complexity of list vs dict vs set operations</li>
<li>Be ready to write a decorator from scratch</li>
<li>Explain generators in terms of memory efficiency</li>
<li>Use <code>collections</code> module (Counter, defaultdict, deque) — interviewers love it</li>
</ul>
</div>

</div>
'''
