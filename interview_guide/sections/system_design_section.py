def get_system_design_section():
    return '''
<div class="container section" id="system-design">
<div class="section-header">
<h2>09 — System Design (Beginner)</h2>
<p>URL shortener, chat system, and scalable API — explained simply.</p>
</div>

<h3>9.1 Design a URL Shortener (like bit.ly)</h3>

<div class="card concept">
<h4>Requirements</h4>
<ul>
<li>Given a long URL, generate a short URL</li>
<li>Redirect short URL to original long URL</li>
<li>Handle millions of URLs</li>
<li>Short URL should be unique and short (6-8 chars)</li>
</ul>
</div>

<h4>Solution Architecture</h4>
<pre>
User → Load Balancer → API Server → Database
                                  → Cache (Redis)

POST /shorten { "url": "https://very-long-url.com/..." }
→ Returns: { "short_url": "https://short.ly/abc123" }

GET /abc123
→ 301 Redirect to original URL
</pre>

<h4>Key Decisions</h4>
<table>
<thead><tr><th>Component</th><th>Choice</th><th>Why</th></tr></thead>
<tbody>
<tr><td>Short ID Generation</td><td>Base62 encoding of auto-increment ID or hash</td><td>62^6 = 56 billion unique URLs</td></tr>
<tr><td>Database</td><td>PostgreSQL (or DynamoDB for scale)</td><td>Simple key-value lookup</td></tr>
<tr><td>Cache</td><td>Redis</td><td>Cache hot URLs, reduce DB load</td></tr>
<tr><td>Redirect Code</td><td>301 (permanent) or 302 (temporary)</td><td>301 for SEO, 302 if tracking clicks</td></tr>
</tbody>
</table>

<pre>
# Python implementation sketch
import hashlib, string

BASE62 = string.ascii_letters + string.digits

def encode_base62(num):
    if num == 0: return BASE62[0]
    result = []
    while num:
        result.append(BASE62[num % 62])
        num //= 62
    return ''.join(reversed(result))

# Method 1: Auto-increment ID → Base62
# ID 12345 → encode_base62(12345) → "dnh"

# Method 2: Hash the URL
def shorten(url):
    hash_hex = hashlib.md5(url.encode()).hexdigest()
    hash_int = int(hash_hex[:10], 16)
    return encode_base62(hash_int)[:7]
</pre>

<h3>9.2 Design a Chat System</h3>

<div class="card concept">
<h4>Requirements</h4>
<ul>
<li>Real-time 1:1 and group messaging</li>
<li>Online/offline status</li>
<li>Message history</li>
<li>Read receipts</li>
</ul>
</div>

<h4>Architecture</h4>
<pre>
Client ←WebSocket→ Chat Server → Message Queue (Redis/RabbitMQ)
                                → Database (MongoDB for messages)
                                → Presence Service (Redis)

Flow:
1. User connects via WebSocket → server maps userId → socketId
2. User sends message → server routes to recipient's socket
3. If recipient offline → store in DB, deliver when online (push notification)
4. Group chat → fan out message to all group members
</pre>

<h4>Key Decisions</h4>
<table>
<thead><tr><th>Component</th><th>Choice</th><th>Why</th></tr></thead>
<tbody>
<tr><td>Protocol</td><td>WebSocket</td><td>Persistent, bidirectional, real-time</td></tr>
<tr><td>Message Store</td><td>MongoDB or Cassandra</td><td>High write throughput, flexible schema</td></tr>
<tr><td>Presence</td><td>Redis (key: userId, value: lastSeen)</td><td>Fast in-memory lookups</td></tr>
<tr><td>Message Queue</td><td>Redis Pub/Sub or Kafka</td><td>Decouple sending from processing</td></tr>
<tr><td>File Sharing</td><td>S3 + CDN</td><td>Store files separately, send URL in message</td></tr>
</tbody>
</table>

<h3>9.3 Design a Scalable REST API</h3>

<div class="card concept">
<h4>Key Principles</h4>
<ul>
<li><strong>Stateless:</strong> Server stores no client state — use JWT tokens</li>
<li><strong>Rate Limiting:</strong> Prevent abuse (e.g., 100 requests/minute per user)</li>
<li><strong>Pagination:</strong> Never return all records — use cursor or offset pagination</li>
<li><strong>Caching:</strong> Redis for hot data, CDN for static assets</li>
<li><strong>Versioning:</strong> <code>/api/v1/users</code> — always version your API</li>
</ul>
</div>

<pre>
Architecture for 10K+ requests/second:

                    ┌─ API Server 1 ─┐
Client → CDN → LB ─┼─ API Server 2 ─┼─ DB (Primary)
                    └─ API Server 3 ─┘      ↓
                          ↓            DB (Read Replica)
                        Redis Cache

Scaling strategies:
1. Horizontal scaling: Add more API servers behind load balancer
2. Database: Read replicas for read-heavy workloads
3. Caching: Redis/Memcached to reduce DB queries
4. CDN: Cache static content at edge locations
5. Message queue: Offload heavy tasks (email, image processing)
6. Database sharding: Split data across multiple DB servers
</pre>

<div class="card tip">
<h4>💡 System Design Interview Tips</h4>
<ul>
<li>Always start with requirements clarification (functional + non-functional)</li>
<li>Do back-of-envelope calculations (storage, bandwidth, QPS)</li>
<li>Start simple, then add complexity (caching → sharding → CDN)</li>
<li>Mention trade-offs for every decision</li>
<li>Draw diagrams — interviewers love visual explanations</li>
</ul>
</div>

</div>
'''
