# Data Model: Auth, Roles, and Production Hardening

**Feature**: 005-auth-roles-hardening  
**Date**: December 9, 2025  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────┐         owns          ┌──────────────┐              │
│  │       User        │ ─────────────────────▶│     Post     │              │
│  │  (Firebase Auth)  │        1:N            └──────────────┘              │
│  └───────────────────┘                              │                      │
│         │                                           │                      │
│         │ has role                                  │ triggers             │
│         ▼                                           ▼                      │
│  ┌───────────────────┐                       ┌──────────────┐              │
│  │      Role         │                       │  AuditLog    │              │
│  │  (Custom Claims)  │                       │   Entry      │              │
│  │  - owner (implicit)                       └──────────────┘              │
│  │  - admin (explicit)                                                     │
│  └───────────────────┘                                                     │
│         │                                                                  │
│         │ authenticated by                                                 │
│         ▼                                                                  │
│  ┌───────────────────┐                                                     │
│  │     Session       │                                                     │
│  │  (Firebase Token) │                                                     │
│  └───────────────────┘                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entities

### User (UPDATED - Firebase Auth)

Represents an authenticated user from Firebase Auth. User data is managed by Firebase; local storage syncs for performance.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| uid | String | Primary Key, Firebase UID | Unique user identifier from Firebase |
| email | String | Required, Unique | User's email address |
| displayName | String | Optional | User's display name |
| role | Enum | Default: 'user' | User role: 'user' or 'admin' |
| createdAt | DateTime | Required, Auto-generated | Account creation timestamp |
| lastLoginAt | DateTime | Optional | Last login timestamp |

**Changes from existing model (004-blog-auth)**:
- `id` (integer) → `uid` (string, Firebase UID)
- `username` → `email` (Firebase primary identifier)
- `passwordHash` → Removed (Firebase handles authentication)
- Added `role` field (synced from Firebase custom claims)
- Added `displayName` and `lastLoginAt`

**Validation Rules**:
- `uid`: Firebase UID format (typically 28 characters)
- `email`: Valid email format
- `role`: Must be 'user' or 'admin'

**Indexes**:
- Primary: `uid`
- Unique: `email`

**Firebase Custom Claims Structure**:
```json
{
  "admin": true  // Only present for admin users
}
```

---

### Post (UPDATED - String ownerId)

Extended with string ownerId to reference Firebase UID instead of integer ID.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique post identifier |
| title | String | Required, 1-200 chars | Post title |
| slug | String | Required, URL-safe | URL-friendly identifier |
| body | String | Required, 1-50000 chars | Post content |
| ownerId | String | Required, Foreign Key → User.uid | Creator's Firebase UID |
| createdAt | DateTime | Required, Auto-generated | Creation timestamp |
| updatedAt | DateTime | Required, Auto-updated | Last modification timestamp |

**Changes from existing model**:
- `ownerId`: Integer → String (Firebase UID)

**Validation Rules**:
- Existing rules unchanged
- `ownerId`: Must be valid Firebase UID

**Indexes**:
- Primary: `id`
- Index: `ownerId` (for "my posts" queries)
- Index: `slug` (for URL lookups)

---

### AuditLogEntry (NEW)

Records mutation events for compliance and debugging. Stored as structured log entries (not database table).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| timestamp | DateTime | Required | Event timestamp (ISO 8601) |
| requestId | String | Required | Correlation ID for request tracing |
| userId | String | Required | Firebase UID of actor |
| action | Enum | Required | 'create', 'update', 'delete' |
| targetType | String | Required | Resource type (e.g., 'post') |
| targetId | String | Required | Resource identifier |
| metadata | Object | Optional | Additional context (before/after, IP) |

**Log Format (JSON)**:
```json
{
  "level": 30,
  "time": 1733750400000,
  "audit": true,
  "requestId": "abc-123-def",
  "userId": "firebase-uid-123",
  "action": "update",
  "targetType": "post",
  "targetId": "42",
  "metadata": {
    "before": { "title": "Old Title" },
    "after": { "title": "New Title" },
    "ip": "192.168.1.1"
  },
  "msg": "Audit: update post 42"
}
```

**Storage**: Application logs (Pino JSON), not database table.

---

### Session (Firebase Token)

Represents an authenticated user's session. Managed by Firebase Auth; not stored locally.

| Component | Type | Description |
|-----------|------|-------------|
| ID Token | JWT | Short-lived (1 hour), contains user identity and claims |
| Session Cookie | String | httpOnly cookie, up to 5 days, created by Next.js BFF |
| Refresh Token | String | Client-side only, handled by Firebase SDK |

**ID Token Claims**:
```json
{
  "iss": "https://securetoken.google.com/PROJECT_ID",
  "aud": "PROJECT_ID",
  "auth_time": 1733750400,
  "user_id": "firebase-uid-123",
  "sub": "firebase-uid-123",
  "iat": 1733750400,
  "exp": 1733754000,
  "email": "user@example.com",
  "email_verified": true,
  "admin": true,
  "firebase": {
    "identities": { "email": ["user@example.com"] },
    "sign_in_provider": "password"
  }
}
```

---

## State Transitions

### User Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────┐                                                           │
│  │   Visitor   │ ──── Sign In ────▶ ┌─────────────────────────────────┐   │
│  │  (Guest)    │                    │   Firebase Auth                  │   │
│  └─────────────┘                    │   (Email/Password)               │   │
│        ▲                            └───────────────┬───────────────────┘   │
│        │                                            │                       │
│        │ Sign Out                                   ▼                       │
│        │                            ┌─────────────────────────────────┐     │
│  ┌─────┴───────┐                    │   ID Token Received             │     │
│  │ Signed Out  │                    │   (Client)                      │     │
│  │ (No Token)  │                    └───────────────┬───────────────────┘   │
│  └─────────────┘                                    │                       │
│        ▲                                            ▼                       │
│        │                            ┌─────────────────────────────────┐     │
│        │ Session Expires            │   Session Cookie Created        │     │
│        │                            │   (Next.js BFF)                 │     │
│  ┌─────┴───────┐                    └───────────────┬───────────────────┘   │
│  │  Expired    │◀─── Token Expires ──               │                       │
│  │  Session    │                                    ▼                       │
│  └─────────────┘                    ┌─────────────────────────────────┐     │
│                                     │   Authenticated                 │     │
│                                     │   (Valid Session)               │     │
│                                     └─────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authorization Decision Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         API Request (Mutation)                               │
└────────────────────────────────────────┬─────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     1. Is Bearer Token Present?                              │
└────────────────────────────────────────┬─────────────────────────────────────┘
                          ┌──────────────┴──────────────┐
                          │ NO                          │ YES
                          ▼                             ▼
               ┌────────────────────┐       ┌────────────────────┐
               │  Return 401        │       │  2. Verify Token   │
               │  Unauthorized      │       │  (Firebase Admin)  │
               └────────────────────┘       └──────────┬─────────┘
                                                       │
                                         ┌─────────────┴─────────────┐
                                         │ INVALID                   │ VALID
                                         ▼                           ▼
                              ┌────────────────────┐    ┌────────────────────┐
                              │  Return 401        │    │  3. Check Role     │
                              │  Invalid Token     │    │                    │
                              └────────────────────┘    └──────────┬─────────┘
                                                                   │
                                           ┌───────────────────────┼───────────────────────┐
                                           │                       │                       │
                                           ▼                       ▼                       ▼
                                   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
                                   │  Is Admin?    │       │  Is Owner?    │       │  Neither      │
                                   │  (claim check)│       │  (id match)   │       │               │
                                   └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
                                           │ YES                   │ YES                   │
                                           ▼                       ▼                       ▼
                                   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
                                   │  ALLOW        │       │  ALLOW        │       │  Return 403   │
                                   │  (admin)      │       │  (owner)      │       │  Forbidden    │
                                   └───────────────┘       └───────────────┘       └───────────────┘
```

---

## Validation Rules Summary

### User Input Validation (Zod Schemas)

```typescript
// Create Post
const createPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .regex(/\S/, 'Title must contain non-whitespace'),
  body: z.string()
    .min(1, 'Body is required')
    .max(50000, 'Body must be 50,000 characters or less')
    .regex(/\S/, 'Body must contain non-whitespace'),
});

// Update Post
const updatePostSchema = z.object({
  title: z.string().min(1).max(200).regex(/\S/).optional(),
  body: z.string().min(1).max(50000).regex(/\S/).optional(),
}).refine(data => data.title || data.body, {
  message: 'At least one field must be provided',
});
```

### Request Size Limits

| Endpoint | Max Body Size | Rationale |
|----------|---------------|-----------|
| POST /posts | 100KB | Generous limit for blog content |
| PATCH /posts/:id | 100KB | Same as create |
| POST /auth/login | 1KB | Credentials only |

---

## Database Schema Changes

### Migration: Add ownerId to Posts

```sql
-- SQLite Migration (if not already present)
-- Note: ownerId already exists from 004-blog-auth, but type changes from INTEGER to TEXT

-- Step 1: Create new table with TEXT ownerId
CREATE TABLE posts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body TEXT NOT NULL,
  ownerId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Step 2: Migrate data (convert integer to 'user-{id}' or assign 'system')
INSERT INTO posts_new (id, title, slug, body, ownerId, createdAt, updatedAt)
SELECT id, title, slug, body, 
       COALESCE('user-' || ownerId, 'system'),
       createdAt, updatedAt
FROM posts;

-- Step 3: Replace tables
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;

-- Step 4: Recreate indexes
CREATE INDEX idx_posts_ownerId ON posts(ownerId);
CREATE INDEX idx_posts_slug ON posts(slug);
```

### User Sync Table (Optional)

```sql
-- Optional: Local user cache for performance
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  role TEXT DEFAULT 'user',
  createdAt TEXT NOT NULL,
  lastLoginAt TEXT
);

CREATE INDEX idx_users_email ON users(email);
```

---

## Error Responses

### Authentication Errors (401)

| Code | Message | When |
|------|---------|------|
| `AUTH_REQUIRED` | Authentication required | No token provided |
| `TOKEN_EXPIRED` | Token has expired | Token exp claim passed |
| `TOKEN_INVALID` | Invalid token | Signature verification failed |

### Authorization Errors (403)

| Code | Message | When |
|------|---------|------|
| `FORBIDDEN` | Not authorized to access this resource | Generic forbidden |
| `NOT_OWNER` | You can only modify your own posts | Non-owner, non-admin trying to modify |
| `CSRF_INVALID` | Invalid CSRF token | CSRF token mismatch |

### Validation Errors (400)

| Code | Message | When |
|------|---------|------|
| `VALIDATION_ERROR` | Validation failed | Zod validation failed |
| `BODY_TOO_LARGE` | Request body too large | Exceeds size limit |

### Rate Limit Errors (429)

| Code | Message | When |
|------|---------|------|
| `RATE_LIMITED` | Too many requests | Rate limit exceeded |

---

## Key Constants

```javascript
// Authentication
const SESSION_COOKIE_EXPIRY = 5 * 24 * 60 * 60 * 1000; // 5 days in ms
const ID_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

// Rate Limiting
const MUTATION_RATE_LIMIT = 10; // requests
const MUTATION_RATE_WINDOW = 60 * 1000; // 1 minute in ms

// Input Limits
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 50000;
const MAX_REQUEST_BODY_SIZE = 100 * 1024; // 100KB

// Roles
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};
```
