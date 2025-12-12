# Research: Blog Authentication & Authorization

**Feature**: 004-blog-auth  
**Date**: December 5, 2025  
**Status**: Complete

## Overview

Research findings to resolve technical decisions for authentication and authorization implementation.

---

## 1. JWT Implementation in Fastify

### Decision
Use `@fastify/jwt` plugin for JWT signing and verification.

### Rationale
- Native Fastify integration with request decorators
- Built-in token extraction from Authorization header
- Handles signature verification and expiration automatically
- Well-documented and maintained

### Alternatives Considered
- **jsonwebtoken (manual)**: More control but requires manual middleware setup; rejected for unnecessary complexity
- **@fastify/secure-session**: Cookie-based sessions; rejected because GitHub Pages static export needs client-side token storage

### Implementation Notes
```javascript
// Registration
fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Signing (in login route)
const token = fastify.jwt.sign({ id: user.id, username: user.username });

// Verification (middleware)
fastify.decorate('authenticate', async (request, reply) => {
  await request.jwtVerify(); // Throws on invalid/expired
});
```

---

## 2. Password Hashing

### Decision
Use `bcrypt` for password hashing with cost factor 10.

### Rationale
- Industry standard for password hashing
- Adaptive cost factor for future-proofing
- Cost factor 10 balances security and performance (~100ms hash time)

### Alternatives Considered
- **argon2**: More modern but requires native compilation; rejected for deployment simplicity
- **scrypt**: Good option but bcrypt has wider ecosystem support

### Implementation Notes
```javascript
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10;

// Hash on registration/seed
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verify on login
const valid = await bcrypt.compare(password, hash);
```

---

## 3. Session Model (JWT Structure)

### Decision
JWT payload contains minimal user identity with 24-hour expiration.

### Token Structure
```json
{
  "id": 1,
  "username": "alice",
  "iat": 1733400000,
  "exp": 1733486400
}
```

### Rationale
- Minimal payload reduces token size (localStorage efficient)
- 24-hour expiration balances security and UX
- No refresh tokens for simplicity (re-login on expiration)

### Storage Strategy (Frontend)
- Store JWT in `localStorage` (persists across sessions)
- Remove on logout
- Check expiration client-side before API calls

### Secret Management
- JWT_SECRET environment variable (minimum 32 characters)
- Fail-fast on startup if missing
- Different secrets per environment (dev/staging/prod)

---

## 4. Pre-configured Test Users

### Decision
Seed two test users on startup in development/test environments.

### Test Users
| Username | Password | Purpose |
|----------|----------|---------|
| alice | password123 | Primary test user |
| bob | password456 | Secondary for ownership tests |

### Rationale
- No registration endpoint needed for MVP
- Simplifies testing and demo
- Production can use environment-based seeding or migration

### Implementation Notes
- Check if users exist before seeding (idempotent)
- Only seed in development/test NODE_ENV
- Log warning in production if no users exist

---

## 5. Ownership Enforcement Pattern

### Decision
Ownership check at service layer with clear separation of concerns.

### Pattern
```javascript
// Route layer: Authentication check
fastify.patch('/posts/:id', { preHandler: [fastify.authenticate] }, handler);

// Service layer: Ownership check
async updatePost(postId, updates, userId) {
  const post = await this.storage.getById(postId);
  if (!post) throw new NotFoundError('Post not found');
  if (post.ownerId !== userId) throw new ForbiddenError('Not authorized');
  // ... perform update
}
```

### Rationale
- Middleware handles "is user logged in?" (401)
- Service handles "is user authorized?" (403)
- Clear error codes for each failure mode

---

## 6. Request-ID Propagation

### Decision
Use `@fastify/request-context` with UUID generation middleware.

### Implementation Pattern
```javascript
// Middleware: Generate or use provided request-id
fastify.addHook('onRequest', async (request) => {
  const requestId = request.headers['x-request-id'] || randomUUID();
  request.requestContext.set('requestId', requestId);
});

// Response: Include in all responses
fastify.addHook('onSend', async (request, reply) => {
  reply.header('X-Request-Id', request.requestContext.get('requestId'));
});

// Logging: Include in all log entries
logger.info({ requestId, ...data }, 'message');
```

### Rationale
- Accept client-provided ID for end-to-end tracing
- Generate UUID if not provided
- Consistent across logs and responses

---

## 7. Structured Logging Format

### Decision
Use Pino (Fastify default) with JSON format in production.

### Log Format
```json
{
  "level": 30,
  "time": 1733400000000,
  "requestId": "abc-123",
  "msg": "POST /posts completed",
  "responseTime": 42,
  "statusCode": 201
}
```

### Rationale
- Pino is Fastify's native logger (zero config)
- JSON format for log aggregation (Cloud Logging compatible)
- pino-pretty for development readability

---

## 8. Health Endpoint Enhancement

### Decision
Extend /health to include version and uptime.

### Response Format
```json
{
  "status": "ok",
  "version": "1.1.0",
  "uptime": 3600,
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

### Rationale
- Version helps identify deployed release
- Uptime useful for monitoring
- Timestamp for time sync verification

---

## 9. CI Latency Measurement

### Decision
Capture p95 latency for create and list operations in CI using test timing.

### Implementation
```yaml
# In GitHub Actions workflow
- name: Run API tests with timing
  run: npm run test:contract -- --reporter=json > test-results.json

- name: Extract latency metrics
  run: |
    node scripts/extract-latency.js test-results.json >> $GITHUB_STEP_SUMMARY
```

### Metrics to Capture
- `POST /posts` create latency (p95)
- `GET /posts` list latency (p95)
- `POST /auth/login` login latency (p95)

### Rationale
- Minimal SLI for performance regression detection
- Integrated into existing CI workflow
- Results visible in job summary

---

## 10. Error Response Envelope

### Decision
Consistent error envelope with code, message, and requestId.

### Format
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "requestId": "abc-123"
  }
}
```

### Error Codes
| HTTP Status | Code | Message |
|-------------|------|---------|
| 401 | UNAUTHORIZED | Authentication required |
| 401 | INVALID_TOKEN | Token expired or invalid |
| 403 | FORBIDDEN | Not authorized to access this resource |
| 404 | NOT_FOUND | Resource not found |

### Rationale
- Machine-readable code for client error handling
- Human-readable message for display
- Request-id for support/debugging

---

## 11. Rollback Strategy

### Decision
Graceful degradation with fail-fast for critical failures.

### Scenarios

| Failure | Behavior | Recovery |
|---------|----------|----------|
| JWT_SECRET missing | Service fails to start | Set env var, restart |
| Auth middleware error | 500 with requestId | Check logs, fix code |
| Database unavailable | Reads fail, service degrades | Restore DB, auto-recover |
| Token validation fails | 401, user re-logs | User action |

### Read-Only Fallback
- If auth system completely fails, reads (GET /posts) still work
- Write operations return 503 Service Unavailable
- Frontend shows "Service temporarily unavailable for edits"

### Rationale
- Public read access is the primary use case
- Better to show content than fail completely
- Clear logging for quick diagnosis

---

## 12. Frontend Auth State Management

### Decision
React Context with localStorage persistence.

### Implementation Pattern
```typescript
// AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isExpired(token)) {
      setUser(decodeToken(token));
    }
  }, []);
  
  const login = async (username: string, password: string) => {
    const { token, user } = await api.login(username, password);
    localStorage.setItem('token', token);
    setUser(user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
```

### Rationale
- Context provides global auth state
- localStorage persists across sessions
- Simple pattern, no external dependencies

---

## Summary of Decisions

| Topic | Decision | Key Dependency |
|-------|----------|----------------|
| JWT | @fastify/jwt plugin | @fastify/jwt |
| Password | bcrypt with cost 10 | bcrypt |
| Token expiry | 24 hours | - |
| Storage | localStorage | - |
| Test users | alice, bob (seeded) | - |
| Request-ID | UUID, accept client-provided | crypto.randomUUID |
| Logging | Pino JSON format | (built-in) |
| Error codes | UNAUTHORIZED, FORBIDDEN | - |
| CI metrics | p95 for create/list | test timing |
