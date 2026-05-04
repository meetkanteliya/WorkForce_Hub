def get_fastapi_section():
    return '''
<div class="container section" id="fastapi">
<div class="section-header">
<h2>02 — FastAPI</h2>
<p>Routing, dependency injection, Pydantic, authentication, async, and real-world API design.</p>
</div>

<h3>2.1 Core Concepts & Routing</h3>

<div class="card concept">
<h4>What is FastAPI?</h4>
<p>FastAPI is a modern, high-performance Python web framework for building APIs. It is built on <strong>Starlette</strong> (for web parts) and <strong>Pydantic</strong> (for data validation). It is one of the fastest Python frameworks, comparable to Node.js and Go.</p>
<p><strong>Key advantages:</strong> Automatic docs (Swagger/ReDoc), type hints for validation, async support, dependency injection.</p>
</div>

<pre>
from fastapi import FastAPI, HTTPException, Depends, Query, Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from enum import Enum

app = FastAPI(title="My API", version="1.0.0")

# Path parameters with validation
@app.get("/users/{user_id}")
async def get_user(user_id: int = Path(..., gt=0, description="User ID")):
    return {"user_id": user_id}

# Query parameters
@app.get("/items/")
async def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    search: Optional[str] = None
):
    return {"skip": skip, "limit": limit, "search": search}

# Enum for fixed choices
class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"

@app.get("/products/")
async def list_products(sort: SortOrder = SortOrder.asc):
    return {"sort_order": sort}
</pre>

<h3>2.2 Pydantic Models & Validation</h3>

<pre>
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: int = Field(..., gt=0, lt=150)
    tags: List[str] = []
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('must be alphanumeric')
        return v.lower()
    
    class Config:
        schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "securepass123",
                "age": 25,
                "tags": ["developer"]
            }
        }

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    
    class Config:
        orm_mode = True  # allows from_orm() for SQLAlchemy models

@app.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # user data is already validated by Pydantic
    return save_to_db(user)
</pre>

<h3>2.3 Dependency Injection</h3>

<pre>
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

# Simple dependency
async def get_db():
    db = SessionLocal()
    try:
        yield db  # cleanup after request
    finally:
        db.close()

# Auth dependency
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Role-based dependency
def require_role(required_role: str):
    async def role_checker(user = Depends(get_current_user)):
        if user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

@app.get("/admin/dashboard")
async def admin_dashboard(user = Depends(require_role("admin"))):
    return {"message": f"Welcome admin {user.username}"}

@app.get("/users/me")
async def read_current_user(user = Depends(get_current_user)):
    return user
</pre>

<h3>2.4 Async vs Sync in FastAPI</h3>

<div class="card concept">
<p><strong>Rule of thumb:</strong> Use <code>async def</code> when your endpoint does I/O with async libraries (aiohttp, databases, etc.). Use regular <code>def</code> when doing blocking I/O (requests, time.sleep) — FastAPI will run it in a thread pool automatically.</p>
</div>

<table>
<thead><tr><th>Scenario</th><th>Use</th><th>Why</th></tr></thead>
<tbody>
<tr><td>Async DB query (databases lib)</td><td><code>async def</code></td><td>Non-blocking I/O</td></tr>
<tr><td>SQLAlchemy sync query</td><td><code>def</code></td><td>Blocking — runs in threadpool</td></tr>
<tr><td>CPU-heavy computation</td><td><code>def</code></td><td>Runs in threadpool, won't block event loop</td></tr>
<tr><td>External async API call</td><td><code>async def</code></td><td>Use aiohttp, non-blocking</td></tr>
</tbody>
</table>

<h3>2.5 Interview Questions & Answers</h3>

<div class="qa">
<div class="question">How does FastAPI achieve such high performance?</div>
<div class="answer">FastAPI uses <strong>Starlette</strong> (ASGI framework) under the hood, which supports async/await natively. It uses <strong>uvicorn</strong> (ASGI server built on uvloop), which is extremely fast. Pydantic does data validation in compiled Rust code (v2). This combination makes it comparable to Node.js/Go.</div>
</div>

<div class="qa">
<div class="question">What is the difference between FastAPI and Flask?</div>
<div class="answer">FastAPI: async-native, auto-validation via Pydantic, auto-generated OpenAPI docs, type hints required, ASGI server. Flask: synchronous by default, no built-in validation, manual docs, WSGI server. FastAPI is much faster and more modern. Flask has a larger ecosystem and is simpler for beginners.</div>
</div>

<div class="qa">
<div class="question">Explain middleware in FastAPI.</div>
<div class="answer">Middleware runs before every request and after every response. Used for logging, CORS, auth, timing. FastAPI uses Starlette middleware. You can add with <code>@app.middleware("http")</code> or <code>app.add_middleware()</code>.</div>
</div>

<pre>
import time
from fastapi.middleware.cors import CORSMiddleware

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom timing middleware
@app.middleware("http")
async def add_timing_header(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = str(duration)
    return response
</pre>

<div class="card warning">
<h4>⚠️ Common Mistakes</h4>
<ul>
<li>Using <code>async def</code> with blocking code (blocks the entire event loop)</li>
<li>Not using <code>response_model</code> to filter sensitive fields from response</li>
<li>Forgetting to close DB sessions (use <code>yield</code> in dependencies)</li>
<li>Not handling validation errors with custom exception handlers</li>
</ul>
</div>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Know the difference between ASGI and WSGI</li>
<li>Be ready to explain dependency injection with a real example</li>
<li>Mention Pydantic v2's Rust core for performance questions</li>
<li>Know how to structure a large FastAPI project (routers, dependencies, models)</li>
</ul>
</div>

</div>
'''
