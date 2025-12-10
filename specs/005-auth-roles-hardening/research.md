# Research: Auth, Roles, and Production Hardening

**Feature**: 005-auth-roles-hardening  
**Date**: December 9, 2025  
**Status**: Complete

## Overview

Research findings to resolve technical decisions for Firebase Auth integration, role-based authorization, production hardening (validation, rate limiting, CSRF), and audit logging.

---

## 1. Firebase Auth Integration Strategy

### Decision
Use Firebase Auth (Google Identity Platform) with a **hybrid approach**:
- **Client-side**: Firebase Auth SDK for sign-in UI and token acquisition
- **Server-side (Next.js BFF)**: Firebase Auth SDK for session management
- **Server-side (API)**: Firebase Admin SDK for ID token verification

### Rationale
- Firebase Auth handles email/password authentication, token refresh, and session management out of the box
- The BFF pattern is preserved: browser → Next.js → API (no direct browser-to-API calls)
- Existing JWT implementation (`@fastify/jwt`) can be replaced with Firebase Admin SDK verification
- Firebase custom claims enable role management without a separate roles table

### Alternatives Considered
- **Keep existing JWT implementation**: Rejected because spec requires Firebase Auth (Google Identity Platform)
- **Direct browser-to-API with Firebase tokens**: Rejected because BFF pattern must be preserved
- **Auth0/Okta**: Rejected because spec specifically calls for Firebase Auth

### Implementation Notes

**Frontend (Client-side Firebase Auth):**
```typescript
// firebase.ts - Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**Next.js BFF Route Handler:**
```typescript
// app/api/auth/session/route.ts
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const { idToken } = await request.json();
  
  // Verify the ID token and create a session cookie
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  
  cookies().set('__session', sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  return Response.json({ success: true });
}
```

**Backend API (Firebase Admin SDK):**
```javascript
// middleware/firebase-auth.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth = getAuth(app);

// Verify ID token middleware
async function verifyIdToken(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(idToken);
  
  return decodedToken; // Contains uid, email, custom claims (role)
}
```

---

## 2. Role Management with Firebase Custom Claims

### Decision
Use Firebase custom claims to store the `admin` role. The `owner` role is implicit (based on post ownership).

### Rationale
- Firebase custom claims are included in every ID token, no additional database lookup required
- Claims propagate automatically on token refresh
- Maximum claim size is 1000 bytes, sufficient for role flags
- Follows Firebase best practices for authorization

### Role Definitions

| Role | Storage | Check Method |
|------|---------|--------------|
| `owner` | Implicit (post.ownerId === user.uid) | Service layer comparison |
| `admin` | Firebase custom claim `{ admin: true }` | Decoded token claims |

### Implementation Notes

**Setting admin role (Firebase Admin SDK):**
```javascript
// One-time admin assignment via Firebase Admin SDK
import { getAuth } from 'firebase-admin/auth';

async function setAdminRole(uid) {
  await getAuth().setCustomUserClaims(uid, { admin: true });
}
```

**Checking roles in API:**
```javascript
// Authorization middleware
function requireOwnerOrAdmin(post, user) {
  const isOwner = post.ownerId === user.uid;
  const isAdmin = user.admin === true; // From custom claims
  
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Not authorized to modify this post');
  }
}
```

---

## 3. Session Management Strategy

### Decision
Use **session cookies** (via Firebase session cookie API) for Next.js BFF authentication, and **short-lived ID tokens** for API calls.

### Rationale
- Session cookies provide better security (httpOnly, no localStorage exposure)
- Firebase session cookies support up to 2-week expiration
- ID tokens for API calls are short-lived (1 hour) and can be refreshed
- Supports the BFF pattern: browser has session cookie, BFF exchanges for ID token when calling API

### Flow

```
1. User signs in with Firebase Auth (client-side)
2. Client receives ID token from Firebase
3. Client sends ID token to Next.js BFF (/api/auth/session)
4. BFF creates session cookie using Firebase Admin SDK
5. Subsequent requests: BFF reads session cookie, verifies, gets fresh ID token
6. BFF calls backend API with ID token in Authorization header
```

### Token Lifecycle

| Token Type | Lifetime | Storage | Refresh |
|------------|----------|---------|---------|
| Firebase ID Token | 1 hour | Memory (client) | Automatic via Firebase SDK |
| Session Cookie | 5 days | httpOnly cookie | Manual re-login |
| API Bearer Token | 1 hour | BFF extracts from session | BFF handles refresh |

---

## 4. Zod Validation Integration

### Decision
Migrate from JSON Schema validation to Zod for runtime validation. Keep JSON Schema for OpenAPI spec generation.

### Rationale
- Zod provides type-safe validation with TypeScript inference
- Better error messages for end users
- Smaller bundle size than AJV
- Existing JSON Schema in models can be kept for OpenAPI compatibility
- `@fastify/type-provider-zod` plugin available

### Implementation Notes

**Backend Zod schemas:**
```javascript
// models/post.zod.js
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200).regex(/\S/, 'Title must contain non-whitespace'),
  body: z.string().min(1).max(50000).regex(/\S/, 'Body must contain non-whitespace'),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).regex(/\S/).optional(),
  body: z.string().min(1).max(50000).regex(/\S/).optional(),
}).refine(data => data.title || data.body, {
  message: 'At least one field must be provided',
});
```

**Fastify integration:**
```javascript
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
```

---

## 5. CSRF Protection Strategy

### Decision
Use the **Double Submit Cookie** pattern with SameSite cookies.

### Rationale
- Simple to implement, no server-side state required
- Works well with the BFF pattern
- SameSite=Lax provides baseline protection against most CSRF attacks
- Additional token validation for extra security on mutations

### Implementation Notes

**CSRF Token Generation (Next.js):**
```typescript
// lib/csrf.ts
import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}
```

**Middleware validation:**
```typescript
// Verify CSRF token on mutations
const csrfCookie = cookies().get('csrf_token');
const csrfHeader = request.headers.get('X-CSRF-Token');

if (csrfCookie?.value !== csrfHeader) {
  throw new ForbiddenError('Invalid CSRF token');
}
```

**Frontend implementation:**
```typescript
// Include CSRF token in mutation requests
const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## 6. Audit Logging Pattern

### Decision
Implement audit logging as **structured JSON logs** via Pino, with a dedicated audit service that decorates log entries.

### Rationale
- Per spec: "Audit logs will be stored in application logs (structured JSON)"
- Non-blocking: audit failures don't prevent mutations from succeeding
- Consistent with existing Pino logging infrastructure
- Request-ID already implemented for tracing

### Audit Log Entry Schema

```javascript
{
  level: 'info',
  audit: true,                    // Flag for filtering audit entries
  timestamp: '2025-12-09T...',    // ISO 8601
  requestId: 'uuid',              // Correlation ID
  userId: 'firebase-uid',         // Who performed the action
  action: 'create|update|delete', // Verb
  targetType: 'post',             // Resource type
  targetId: '123',                // Resource identifier
  metadata: {                     // Optional context
    before: {...},                // For updates
    after: {...},                 // For updates
    ip: '...',                    // Client IP
  }
}
```

### Implementation Notes

**Audit Service:**
```javascript
// services/audit-service.js
export class AuditService {
  constructor(logger) {
    this.logger = logger;
  }
  
  log(entry) {
    this.logger.info({
      audit: true,
      ...entry,
    }, `Audit: ${entry.action} ${entry.targetType} ${entry.targetId}`);
  }
  
  logCreate(userId, targetType, targetId, requestId, metadata = {}) {
    this.log({ userId, action: 'create', targetType, targetId, requestId, metadata });
  }
  
  logUpdate(userId, targetType, targetId, requestId, before, after) {
    this.log({ userId, action: 'update', targetType, targetId, requestId, metadata: { before, after } });
  }
  
  logDelete(userId, targetType, targetId, requestId, metadata = {}) {
    this.log({ userId, action: 'delete', targetType, targetId, requestId, metadata });
  }
}
```

---

## 7. Rate Limiting Configuration

### Decision
Extend existing `@fastify/rate-limit` configuration with per-user limits on mutation endpoints.

### Rationale
- Rate limiting already implemented (RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
- Per spec: "10 mutations per minute per user"
- Existing setup uses IP-based limiting; extend to user-based for authenticated endpoints

### Configuration

```javascript
// Per-user rate limit for mutations
const mutationRateLimit = {
  max: 10,
  timeWindow: '1 minute',
  keyGenerator: (request) => {
    // Use Firebase UID for authenticated users, IP for unauthenticated
    return request.user?.uid || request.ip;
  },
  errorResponseBuilder: (request, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds`,
    retryAfter: Math.ceil(context.ttl / 1000),
  }),
};
```

---

## 8. Health Endpoint Extensions

### Decision
Keep existing `/health` endpoint, add `/health/ready` for dependency checks.

### Rationale
- `/health` for liveness (is the process running?)
- `/health/ready` for readiness (are dependencies available?)
- Cloud Run health checks can use `/health`
- Kubernetes-style probes if needed later

### Endpoints

| Endpoint | Purpose | Response Time Target |
|----------|---------|---------------------|
| `GET /health` | Liveness probe | <100ms |
| `GET /health/ready` | Readiness with dependency check | <500ms |

---

## 9. Existing Test Users Migration

### Decision
Migrate existing test users (alice, bob) to Firebase Auth, maintaining compatibility.

### Rationale
- Existing tests rely on alice/bob users
- Firebase Auth Emulator supports seeding users
- Production can use Firebase Console or Admin SDK for user creation

### Migration Strategy

1. **Development**: Use Firebase Auth Emulator with seeded users
2. **Test**: Same as development (emulator)
3. **Production**: Create users via Firebase Console or migration script

### Emulator Configuration

```json
// firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    }
  }
}
```

```javascript
// Seed users in development
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  await auth.createUser({
    uid: 'alice-uid',
    email: 'alice@example.com',
    password: 'password123',
    displayName: 'Alice',
  });
  await auth.setCustomUserClaims('alice-uid', { admin: false });
  
  await auth.createUser({
    uid: 'bob-uid',
    email: 'bob@example.com',
    password: 'password456',
    displayName: 'Bob',
  });
  await auth.setCustomUserClaims('bob-uid', { admin: true }); // Bob is admin for testing
}
```

---

## 10. Backward Compatibility with Existing Posts

### Decision
Existing posts without an `ownerId` will be assigned to a **system account** during migration.

### Rationale
- Per spec edge case: "Existing posts created before auth should be treated as system-owned"
- Allows existing data to remain accessible
- System account can be assigned admin privileges for legacy post management

### Migration Query

```sql
-- SQLite migration
UPDATE posts SET ownerId = 'system' WHERE ownerId IS NULL;
```

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Auth Provider | Firebase Auth (Google Identity Platform) | Per spec requirement; reduces implementation complexity |
| Role Storage | Firebase custom claims | No additional DB lookup; automatic token propagation |
| Session Management | Session cookies (5 days) | httpOnly security; BFF pattern compatible |
| Validation | Zod (migrate from JSON Schema) | Type-safe; better error messages |
| CSRF Protection | Double Submit Cookie | Stateless; SameSite provides baseline |
| Audit Logging | Structured Pino logs | Non-blocking; existing infrastructure |
| Rate Limiting | Per-user on mutations (10/min) | Extend existing @fastify/rate-limit |
| Test Users | Firebase Auth Emulator | Maintains alice/bob compatibility |
| Legacy Posts | System account ownership | Graceful migration path |
