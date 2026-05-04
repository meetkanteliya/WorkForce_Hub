def get_django_section():
    return '''
<div class="container section" id="django">
<div class="section-header">
<h2>03 — Django</h2>
<p>MVT architecture, ORM, middleware, authentication, signals, and Django vs FastAPI comparison.</p>
</div>

<h3>3.1 MVT Architecture</h3>

<div class="card concept">
<p><strong>Model:</strong> Defines data structure (database tables). <strong>View:</strong> Handles business logic and returns responses. <strong>Template:</strong> HTML rendering (presentation layer). Django follows MVT, not MVC. The "Controller" part is handled by Django itself (URL routing).</p>
</div>

<table>
<thead><tr><th>MVC</th><th>Django MVT</th><th>Role</th></tr></thead>
<tbody>
<tr><td>Model</td><td>Model</td><td>Database / data logic</td></tr>
<tr><td>View</td><td>Template</td><td>What user sees (HTML)</td></tr>
<tr><td>Controller</td><td>View</td><td>Business logic + routing</td></tr>
</tbody>
</table>

<h3>3.2 ORM Deep Dive</h3>

<pre>
from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name='books')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    published = models.DateField()
    tags = models.ManyToManyField('Tag', blank=True)

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

# ===== QUERYSETS =====
# Lazy evaluation — query runs only when you access the data
books = Book.objects.filter(price__gte=20)  # not executed yet
for b in books:  # NOW it executes
    print(b.title)

# Chaining
expensive_recent = Book.objects.filter(
    price__gte=50
).exclude(
    author__name="Unknown"
).order_by('-published')[:10]

# Aggregation
from django.db.models import Avg, Count, Sum, Q, F

Book.objects.aggregate(avg_price=Avg('price'))
# {'avg_price': 29.99}

# Annotation — add computed fields
authors = Author.objects.annotate(
    book_count=Count('books'),
    avg_price=Avg('books__price')
).filter(book_count__gt=5)

# F expressions — reference model fields in queries
Book.objects.filter(price__gt=F('author__books__price'))
Book.objects.update(price=F('price') * 1.10)  # 10% price increase

# Q objects — complex lookups (OR, AND, NOT)
Book.objects.filter(
    Q(price__lt=10) | Q(title__icontains="python")
)

# select_related (ForeignKey — JOIN) vs prefetch_related (M2M — 2 queries)
books = Book.objects.select_related('author').all()  # 1 query with JOIN
books = Book.objects.prefetch_related('tags').all()   # 2 queries
</pre>

<div class="qa">
<div class="question">What is the N+1 query problem and how do you fix it in Django?</div>
<div class="answer">N+1 happens when you fetch N objects, then for each object you make another query for related data (1 + N queries total). Fix: use <code>select_related()</code> for ForeignKey/OneToOne (SQL JOIN) or <code>prefetch_related()</code> for ManyToMany/reverse FK (2 queries with Python-side joining).</div>
</div>

<h3>3.3 Middleware</h3>

<pre>
import time

class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = time.time() - start
        response['X-Request-Duration'] = f"{duration:.4f}s"
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Called just before Django calls the view."""
        pass
    
    def process_exception(self, request, exception):
        """Called when a view raises an exception."""
        pass

# settings.py — order matters!
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'myapp.middleware.RequestTimingMiddleware',  # custom
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]
</pre>

<h3>3.4 Signals</h3>

<pre>
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import User

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(pre_delete, sender=Book)
def log_book_deletion(sender, instance, **kwargs):
    AuditLog.objects.create(
        action="DELETE",
        model="Book",
        object_id=instance.id,
        details=f"Deleted: {instance.title}"
    )
</pre>

<h3>3.5 Django vs FastAPI</h3>

<table>
<thead><tr><th>Feature</th><th>Django</th><th>FastAPI</th></tr></thead>
<tbody>
<tr><td>Type</td><td>Full-stack (batteries included)</td><td>API-only (micro)</td></tr>
<tr><td>ORM</td><td>Built-in, powerful</td><td>None (use SQLAlchemy)</td></tr>
<tr><td>Admin Panel</td><td>Built-in</td><td>None</td></tr>
<tr><td>Async</td><td>Partial (Django 4.1+)</td><td>Native async</td></tr>
<tr><td>Performance</td><td>Moderate</td><td>Very high</td></tr>
<tr><td>Validation</td><td>Forms/Serializers</td><td>Pydantic (automatic)</td></tr>
<tr><td>API Docs</td><td>Manual (DRF + drf-spectacular)</td><td>Auto-generated</td></tr>
<tr><td>Best for</td><td>Full web apps, CMS, e-commerce</td><td>Microservices, APIs</td></tr>
</tbody>
</table>

<div class="card tip">
<h4>💡 Interview Tips</h4>
<ul>
<li>Know when to use Django vs FastAPI — this is a very common comparison question</li>
<li>Always mention <code>select_related</code> and <code>prefetch_related</code> for optimization</li>
<li>Understand middleware execution order (top-down for request, bottom-up for response)</li>
<li>Be ready to explain the request-response lifecycle in Django</li>
</ul>
</div>

</div>
'''
