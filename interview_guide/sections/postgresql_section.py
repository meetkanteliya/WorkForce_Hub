def get_postgresql_section():
    return '''
<div class="container section" id="postgresql">
<div class="section-header">
<h2>07 — PostgreSQL</h2>
<p>Joins, indexing, query optimization, transactions, ACID properties, and advanced queries.</p>
</div>

<h3>7.1 Joins (All Types)</h3>

<table>
<thead><tr><th>Join Type</th><th>Returns</th><th>Use Case</th></tr></thead>
<tbody>
<tr><td>INNER JOIN</td><td>Only matching rows from both tables</td><td>Get orders with their customers</td></tr>
<tr><td>LEFT JOIN</td><td>All from left + matching from right (NULL if no match)</td><td>All customers, even those without orders</td></tr>
<tr><td>RIGHT JOIN</td><td>All from right + matching from left</td><td>Rarely used — restructure as LEFT JOIN</td></tr>
<tr><td>FULL OUTER JOIN</td><td>All rows from both (NULLs where no match)</td><td>Finding unmatched records on both sides</td></tr>
<tr><td>CROSS JOIN</td><td>Cartesian product (every combo)</td><td>Generate combinations</td></tr>
<tr><td>SELF JOIN</td><td>Table joined with itself</td><td>Employee-manager relationships</td></tr>
</tbody>
</table>

<pre>
-- Setup tables
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- INNER JOIN: customers who have placed orders
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;

-- LEFT JOIN: all customers, with order info (NULL if no orders)
SELECT c.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.amount), 0) AS total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name;

-- Find customers with NO orders
SELECT c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- SELF JOIN: employee-manager
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
</pre>

<h3>7.2 Indexing</h3>

<div class="card concept">
<p>An <strong>index</strong> is a data structure (usually B-tree) that speeds up data retrieval. Without an index, PostgreSQL does a <strong>sequential scan</strong> (reads every row). With an index, it does an <strong>index scan</strong> (jumps directly to matching rows).</p>
<p><strong>Trade-off:</strong> Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE) because the index must be updated too.</p>
</div>

<pre>
-- B-tree index (default, most common)
CREATE INDEX idx_customers_email ON customers(email);

-- Composite index (multi-column)
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- Partial index (only index subset of rows)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- GIN index (for JSONB, arrays, full-text search)
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Expression index
CREATE INDEX idx_lower_email ON users(LOWER(email));

-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM customers WHERE email = 'john@example.com';
-- Should show "Index Scan" not "Seq Scan"
</pre>

<h3>7.3 Query Optimization</h3>

<pre>
-- Use EXPLAIN ANALYZE to see query plan
EXPLAIN ANALYZE
SELECT c.name, COUNT(o.id)
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at > '2024-01-01'
GROUP BY c.name
ORDER BY COUNT(o.id) DESC
LIMIT 10;

-- Key things to look for in EXPLAIN output:
-- Seq Scan → missing index
-- Nested Loop → may need different join strategy for large tables
-- Sort → consider adding ORDER BY column to index
-- Actual rows vs estimated rows → run ANALYZE to update statistics
</pre>

<div class="card concept">
<h4>Optimization Rules</h4>
<ul>
<li>Add indexes on columns used in WHERE, JOIN, ORDER BY</li>
<li>Use <code>EXPLAIN ANALYZE</code> to verify index usage</li>
<li>Avoid <code>SELECT *</code> — select only needed columns</li>
<li>Use <code>LIMIT</code> for pagination</li>
<li>Use <code>EXISTS</code> instead of <code>IN</code> for subqueries with large datasets</li>
<li>Avoid functions on indexed columns in WHERE: <code>WHERE LOWER(email) = ...</code> won't use a regular index</li>
<li>Run <code>VACUUM ANALYZE</code> regularly to update statistics</li>
</ul>
</div>

<h3>7.4 Transactions & ACID</h3>

<table>
<thead><tr><th>Property</th><th>Meaning</th><th>Example</th></tr></thead>
<tbody>
<tr><td><strong>Atomicity</strong></td><td>All or nothing — either all operations succeed or none</td><td>Bank transfer: debit AND credit must both happen</td></tr>
<tr><td><strong>Consistency</strong></td><td>DB goes from one valid state to another</td><td>Constraints are maintained after transaction</td></tr>
<tr><td><strong>Isolation</strong></td><td>Concurrent transactions don't interfere</td><td>Two users buying last item simultaneously</td></tr>
<tr><td><strong>Durability</strong></td><td>Once committed, data survives crashes</td><td>Data written to disk/WAL</td></tr>
</tbody>
</table>

<pre>
-- Transaction example: bank transfer
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

-- Check constraint
DO $$
BEGIN
    IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;
END $$;

COMMIT;  -- or ROLLBACK if something went wrong

-- Isolation levels
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;    -- default
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;   -- prevents non-repeatable reads
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;      -- strictest, prevents all anomalies
</pre>

<h3>7.5 Advanced Queries</h3>

<pre>
-- Window functions
SELECT name, department, salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,
    AVG(salary) OVER (PARTITION BY department) as dept_avg,
    salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees;

-- CTE (Common Table Expression)
WITH high_value_customers AS (
    SELECT customer_id, SUM(amount) as total_spent
    FROM orders
    GROUP BY customer_id
    HAVING SUM(amount) > 10000
)
SELECT c.name, hvc.total_spent
FROM customers c
JOIN high_value_customers hvc ON c.id = hvc.customer_id;

-- Recursive CTE (org chart)
WITH RECURSIVE org_chart AS (
    SELECT id, name, manager_id, 0 as depth
    FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, oc.depth + 1
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY depth;
</pre>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Draw a Venn diagram when explaining JOINs</li>
<li>Always mention EXPLAIN ANALYZE when asked about optimization</li>
<li>Know the difference between WHERE and HAVING</li>
<li>Understand isolation levels and their trade-offs</li>
<li>Practice window functions — they are asked frequently</li>
</ul>
</div>

</div>
'''
