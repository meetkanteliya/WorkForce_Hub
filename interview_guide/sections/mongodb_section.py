def get_mongodb_section():
    return '''
<div class="container section" id="mongodb">
<div class="section-header">
<h2>08 — MongoDB</h2>
<p>Schema design, aggregation pipeline, indexing, SQL vs NoSQL, and performance tuning.</p>
</div>

<h3>8.1 Schema Design</h3>

<div class="card concept">
<p>MongoDB is a <strong>document database</strong>. Data is stored as <strong>BSON documents</strong> (JSON-like). Unlike SQL, there is no fixed schema — documents in a collection can have different fields.</p>
<p><strong>Key design decision:</strong> Embed (denormalize) vs Reference (normalize).</p>
</div>

<table>
<thead><tr><th>Approach</th><th>When to Use</th><th>Example</th></tr></thead>
<tbody>
<tr><td><strong>Embed</strong> (nested)</td><td>1:1 or 1:few, data accessed together, data doesn't change often</td><td>User → address, blog → comments (few)</td></tr>
<tr><td><strong>Reference</strong> (separate)</td><td>1:many or many:many, data accessed independently, frequently updated</td><td>User → orders (many), product → categories</td></tr>
</tbody>
</table>

<pre>
// Embedded design — user with address
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "orders": [
    { "product": "Laptop", "amount": 999.99, "date": ISODate("2024-01-15") },
    { "product": "Mouse", "amount": 29.99, "date": ISODate("2024-02-10") }
  ]
}

// Referenced design — separate collections
// users collection
{ "_id": ObjectId("user1"), "name": "John", "email": "john@example.com" }

// orders collection
{ "_id": ObjectId("order1"), "user_id": ObjectId("user1"), "product": "Laptop", "amount": 999.99 }
</pre>

<h3>8.2 CRUD Operations</h3>

<pre>
// Insert
db.users.insertOne({ name: "Alice", age: 30, tags: ["developer"] });
db.users.insertMany([{ name: "Bob" }, { name: "Charlie" }]);

// Find
db.users.find({ age: { $gte: 25, $lte: 40 } });             // range
db.users.find({ tags: { $in: ["developer", "designer"] } });  // in array
db.users.find({ name: { $regex: /^A/i } });                   // regex
db.users.find({ "address.city": "New York" });                 // nested field

// Update
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { name: "Alice Smith" }, $push: { tags: "senior" }, $inc: { loginCount: 1 } }
);

// Delete
db.users.deleteMany({ isActive: false });
</pre>

<h3>8.3 Aggregation Pipeline</h3>

<div class="card concept">
<p>The aggregation pipeline processes documents through stages. Each stage transforms the data. Think of it like Unix pipes: <code>data | $match | $group | $sort | $project</code></p>
</div>

<pre>
// Example: Sales analytics
db.orders.aggregate([
  // Stage 1: Filter orders from 2024
  { $match: { date: { $gte: ISODate("2024-01-01") } } },
  
  // Stage 2: Lookup customer info (like SQL JOIN)
  { $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer"
  }},
  { $unwind: "$customer" },
  
  // Stage 3: Group by customer, calculate totals
  { $group: {
      _id: "$customer.name",
      totalOrders: { $sum: 1 },
      totalSpent: { $sum: "$amount" },
      avgOrder: { $avg: "$amount" },
      lastOrder: { $max: "$date" }
  }},
  
  // Stage 4: Filter top customers
  { $match: { totalSpent: { $gte: 1000 } } },
  
  // Stage 5: Sort by spending
  { $sort: { totalSpent: -1 } },
  
  // Stage 6: Format output
  { $project: {
      customer: "$_id",
      totalOrders: 1,
      totalSpent: { $round: ["$totalSpent", 2] },
      avgOrder: { $round: ["$avgOrder", 2] },
      _id: 0
  }},
  
  // Stage 7: Limit results
  { $limit: 10 }
]);
</pre>

<h3>8.4 Indexing in MongoDB</h3>

<pre>
// Single field index
db.users.createIndex({ email: 1 });  // 1 = ascending, -1 = descending

// Compound index
db.orders.createIndex({ customer_id: 1, date: -1 });

// Text index (full-text search)
db.articles.createIndex({ title: "text", content: "text" });
db.articles.find({ $text: { $search: "mongodb tutorial" } });

// TTL index (auto-delete after time)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Unique index
db.users.createIndex({ email: 1 }, { unique: true });

// Check index usage
db.users.find({ email: "john@example.com" }).explain("executionStats");
</pre>

<h3>8.5 SQL vs NoSQL</h3>

<table>
<thead><tr><th>Feature</th><th>SQL (PostgreSQL)</th><th>NoSQL (MongoDB)</th></tr></thead>
<tbody>
<tr><td>Data Model</td><td>Tables with rows/columns</td><td>Documents (JSON-like)</td></tr>
<tr><td>Schema</td><td>Fixed, predefined</td><td>Flexible, dynamic</td></tr>
<tr><td>Relationships</td><td>JOINs</td><td>Embed or $lookup</td></tr>
<tr><td>Scaling</td><td>Vertical (bigger server)</td><td>Horizontal (sharding)</td></tr>
<tr><td>Transactions</td><td>Full ACID</td><td>ACID (since 4.0, multi-doc)</td></tr>
<tr><td>Query Language</td><td>SQL</td><td>MQL (MongoDB Query)</td></tr>
<tr><td>Best For</td><td>Complex relations, consistency</td><td>Flexible data, high write loads</td></tr>
</tbody>
</table>

<div class="qa">
<div class="question">When would you choose MongoDB over PostgreSQL?</div>
<div class="answer">Choose MongoDB when: data structure changes frequently, you need horizontal scaling, schema is unpredictable (IoT, logs, CMS), you need high write throughput, or data is naturally document-shaped. Choose PostgreSQL when: data has complex relationships, you need strict ACID, data integrity is critical (finance), or you need complex joins and aggregations.</div>
</div>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Know when to embed vs reference — this is the #1 MongoDB design question</li>
<li>Be able to write an aggregation pipeline from scratch</li>
<li>Understand that MongoDB has ACID transactions since v4.0</li>
<li>Know the trade-offs of denormalization (faster reads, harder updates)</li>
</ul>
</div>

</div>
'''
