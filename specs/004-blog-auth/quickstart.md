# Quickstart: Blog Authentication & Authorization

**Feature**: 004-blog-auth  
**Date**: December 5, 2025

## Overview

This guide explains how authentication and authorization work in the Blog Posts system after this feature is implemented.

---

## Test Users

Two pre-configured test users are available:

| Username | Password | User ID |
|----------|----------|---------|
| alice | password123 | 1 |
| bob | password456 | 2 |

---

## Authentication Flow

### 1. Login

```bash
# Login to get a JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```

### 2. Use Token for Protected Endpoints

```bash
# Create a post (requires auth)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"title": "My First Post", "body": "Hello world!"}'
```

---

## Authorization Rules

| Operation | Auth Required | Ownership Required |
|-----------|--------------|-------------------|
| GET /posts | ❌ No | ❌ No |
| GET /posts/:id | ❌ No | ❌ No |
| POST /posts | ✅ Yes | N/A (new post) |
| PATCH /posts/:id | ✅ Yes | ✅ Yes |
| DELETE /posts/:id | ✅ Yes | ✅ Yes |

### Error Responses

**401 Unauthorized** (no token or invalid token):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "requestId": "abc-123"
  }
}
```

**403 Forbidden** (authenticated but not owner):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Not authorized to access this resource",
    "requestId": "abc-123"
  }
}
```

---

## Frontend Usage

### Login Flow

```typescript
// src/lib/auth.ts
export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    throw new Error('Invalid credentials');
  }
  
  const { token, user } = await res.json();
  localStorage.setItem('token', token);
  return user;
}

export function logout() {
  localStorage.removeItem('token');
}

export function getToken() {
  return localStorage.getItem('token');
}
```

### Making Authenticated Requests

```typescript
// src/lib/api.ts
export async function createPost(title: string, body: string) {
  const token = getToken();
  
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ title, body }),
  });
  
  if (res.status === 401) {
    throw new AuthError('Please log in to create posts');
  }
  
  return res.json();
}
```

### Checking Ownership

```typescript
// src/components/PostActions.tsx
function PostActions({ post }: { post: Post }) {
  const { user } = useAuth();
  
  // Only show edit/delete if user is logged in AND owns the post
  if (!user || post.ownerId !== user.id) {
    return null;
  }
  
  return (
    <div>
      <button onClick={() => editPost(post.id)}>Edit</button>
      <button onClick={() => deletePost(post.id)}>Delete</button>
    </div>
  );
}
```

---

## Environment Configuration

### API Server

```bash
# Required
JWT_SECRET=your-secret-key-min-32-chars-long

# Optional (defaults shown)
PORT=3000
NODE_ENV=development
```

### Frontend (Next.js)

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### GitHub Pages Deployment

```bash
# Build-time environment
NEXT_PUBLIC_API_URL=https://your-api-host.example.com
```

---

## Request Tracing

All requests include a unique request ID:

```bash
# Request with custom ID
curl -H "X-Request-Id: my-trace-123" http://localhost:3000/posts

# Response includes the ID
# X-Request-Id: my-trace-123
```

Check server logs for correlated entries:
```json
{"level":30,"requestId":"my-trace-123","msg":"GET /posts completed","responseTime":12}
```

---

## Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "uptime": 3600,
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

---

## Common Scenarios

### Scenario 1: Create a Post as Alice

```bash
# 1. Login as alice
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | jq -r '.token')

# 2. Create a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Alice Post","body":"Created by alice"}'
```

### Scenario 2: Bob Tries to Edit Alice's Post

```bash
# 1. Login as bob
BOB_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"password456"}' | jq -r '.token')

# 2. Try to edit Alice's post (ID 1)
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{"title":"Hacked!"}'

# Response: 403 Forbidden
# {"error":{"code":"FORBIDDEN","message":"Not authorized to access this resource",...}}
```

### Scenario 3: Public Read Access

```bash
# No auth needed for reading
curl http://localhost:3000/posts
curl http://localhost:3000/posts/1
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on all requests | Missing/invalid token | Check token in localStorage, re-login |
| 403 when editing | Not post owner | Only owner can edit/delete |
| Token expired | 24-hour expiry | Re-login to get new token |
| Service won't start | JWT_SECRET missing | Set JWT_SECRET env var |
| CORS error | API URL mismatch | Check NEXT_PUBLIC_API_URL |
