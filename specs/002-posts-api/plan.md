# Technical Plan: Blog Posts API Implementation

**Feature ID:** 002-posts-api  
**Version:** 1.0.0  
**Date:** November 24, 2025  
**Status:** Approved for Implementation

---

## Executive Summary

This document outlines the technical architecture, stack choices, and implementation strategy for the Blog Posts API. We'll build a production-ready RESTful API using Fastify, with an adapter-based persistence layer that allows seamless migration from in-memory storage to SQLite.

---

## Technology Stack

### Core Framework

**Fastify v4.x**
- **Why:** High performance (65k+ req/sec), excellent TypeScript support, built-in schema validation
- **Advantages:** Native JSON Schema validation, plugin ecosystem, async/await native
- **Learning Curve:** Moderate (similar to Express but with better DX)

### Testing Infrastructure

**Vitest v1.x**
- **Why:** Fast, modern, Vite-powered test runner with excellent DX
- **Coverage:** Built-in code coverage with c8/istanbul
- **Features:** Watch mode, snapshot testing, parallel execution
- **Compatibility:** Drop-in Jest replacement with faster execution

### Logging

**Pino v8.x**
- **Why:** Industry-standard, extremely fast JSON logger (30x faster than alternatives)
- **Features:** Log levels, serializers, redaction, pretty-printing in dev
- **Integration:** Native Fastify integration via `fastify-pino`

### Validation

**Fastify JSON Schema + AJV**
- **Why:** Native Fastify support, automatic OpenAPI generation, performance
- **Alternative Considered:** Zod (more ergonomic but adds overhead)
- **Benefit:** Single source of truth for validation and contract

### HTTP Testing

**Fastify Inject (built-in)**
- **Why:** No external HTTP server needed, faster than supertest
- **Usage:** Direct injection into Fastify app instance
- **Benefit:** Simplified CI/CD, no port conflicts

### Additional Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| `@fastify/rate-limit` | Rate limiting middleware | v9.x |
| `@fastify/swagger` | OpenAPI generation | v8.x |
| `@fastify/swagger-ui` | Interactive API docs | v2.x |
| `@fastify/cors` | CORS handling | v9.x |
| `uuid` | UUID generation | v9.x |
| `@sinclair/typebox` | TypeScript schema types | v0.32.x |

---

## Architecture Pattern

### Clean Architecture / Service-Based Design

We'll implement a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│   HTTP Layer (Routes/Controllers)   │  ← Fastify routes, request/response handling
├─────────────────────────────────────┤
│      Service Layer (Business)       │  ← Business logic, validation, orchestration
├─────────────────────────────────────┤
│   Repository Layer (Data Access)    │  ← Abstract persistence interface
├─────────────────────────────────────┤
│    Adapter Layer (Implementation)   │  ← Concrete storage (InMemory/SQLite)
└─────────────────────────────────────┘
```

### Dependency Inversion Principle

- **Services** depend on **Repository Interface** (not implementation)
- **Repositories** are injected at runtime (enables testing and swapping)
- **Adapters** implement the repository interface

---

## Folder Structure

```
src/
├── posts-api/
│   ├── index.js                    # Main entry point, server bootstrap
│   ├── app.js                      # Fastify app factory (for testing)
│   ├── config/
│   │   ├── index.js                # Configuration loader (env vars)
│   │   └── schemas.js              # JSON Schema definitions (contracts)
│   ├── routes/
│   │   ├── index.js                # Route registration
│   │   ├── health.js               # GET /health
│   │   └── posts.js                # All /posts/* routes
│   ├── services/
│   │   └── posts-service.js        # Business logic, validation, slug generation
│   ├── repositories/
│   │   └── posts-repository.js     # Abstract interface (class with methods)
│   ├── adapters/
│   │   ├── in-memory-posts.js      # JavaScript Map implementation
│   │   └── sqlite-posts.js         # Future SQLite implementation
│   ├── errors/
│   │   ├── index.js                # Custom error classes export
│   │   ├── validation-error.js     # 400 errors
│   │   ├── not-found-error.js      # 404 errors
│   │   └── rate-limit-error.js     # 429 errors
│   ├── utils/
│   │   ├── slug-generator.js       # Title → slug conversion
│   │   └── logger.js               # Pino logger instance
│   └── plugins/
│       ├── error-handler.js        # Global error handler plugin
│       └── rate-limiter.js         # Rate limiting plugin
│
tests/
├── unit/
│   ├── services/
│   │   └── posts-service.test.js   # Business logic tests
│   ├── utils/
│   │   └── slug-generator.test.js  # Slug generation tests
│   └── adapters/
│       └── in-memory-posts.test.js # Adapter tests
├── integration/
│   ├── posts-api.test.js           # Full API endpoint tests
│   ├── health.test.js              # Health check tests
│   └── rate-limiting.test.js       # Rate limit behavior tests
└── contract/
    └── openapi-validation.test.js  # Contract compliance tests
```

---

## Persistence Strategy: Adapter Pattern

### Interface Definition

```javascript
// repositories/posts-repository.js
class PostsRepository {
  async create(postData) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}
```

### In-Memory Adapter (Phase 1)

```javascript
// adapters/in-memory-posts.js
class InMemoryPostsAdapter extends PostsRepository {
  constructor() {
    super();
    this.posts = new Map(); // UUID → Post object
    this.slugIndex = new Map(); // slug → UUID (for collision detection)
  }
  
  async create(postData) {
    const id = uuidv4();
    const post = { id, ...postData, createdAt: new Date().toISOString() };
    this.posts.set(id, post);
    this.slugIndex.set(post.slug, id);
    return post;
  }
  
  // ... other methods
}
```

### Future SQLite Adapter (Phase 2+)

```javascript
// adapters/sqlite-posts.js
class SQLitePostsAdapter extends PostsRepository {
  constructor(dbPath) {
    super();
    this.db = new Database(dbPath);
    this.initSchema();
  }
  
  async create(postData) {
    const stmt = this.db.prepare(
      'INSERT INTO posts (id, title, body, slug, createdAt) VALUES (?, ?, ?, ?, ?)'
    );
    // ... SQLite implementation
  }
}
```

### Adapter Injection

```javascript
// app.js
export function createApp(options = {}) {
  const app = fastify({ logger: true });
  
  // Inject repository (default: in-memory)
  const repository = options.repository || new InMemoryPostsAdapter();
  const postsService = new PostsService(repository);
  
  // Decorate app with service
  app.decorate('postsService', postsService);
  
  return app;
}
```

**Benefits:**
- Zero code changes in services when swapping storage
- Easy to test with mock adapters
- Future-proof for SQLite, PostgreSQL, etc.

---

## Testing Strategy

### 1. Unit Tests (Vitest)

**Target:** Core business logic in isolation

**Coverage Areas:**
- `slug-generator.js`: Title → slug transformation, collision handling
- `posts-service.js`: Validation rules (title 3-200 chars, body 10-10000 chars)
- Custom error classes: Correct `statusCode` and `name` properties
- In-memory adapter: CRUD operations, edge cases

**Approach:**
- No HTTP layer involvement
- Mock repository dependencies
- Fast execution (<100ms per test)

**Example:**
```javascript
describe('PostsService.create', () => {
  it('should reject content shorter than 10 characters', async () => {
    const service = new PostsService(mockRepo);
    await expect(service.create({ content: 'Too short' }))
      .rejects.toThrow(ValidationError);
  });
});
```

### 2. Integration Tests (Vitest + Fastify Inject)

**Target:** Full request/response cycle through all layers

**Coverage Areas:**
- `POST /posts`: Success (201), validation errors (400)
- `GET /posts`: Empty array, multiple posts
- `GET /posts/{id}`: Success (200), not found (404)
- `DELETE /posts/{id}`: Success (204), not found (404)
- `GET /health`: Status response

**Approach:**
- Use Fastify's `.inject()` method (no real HTTP server)
- Fresh app instance per test suite
- Seed test data as needed

**Example:**
```javascript
describe('POST /posts', () => {
  let app;
  
  beforeEach(async () => {
    app = await createApp();
    await app.ready();
  });
  
  afterEach(async () => {
    await app.close();
  });
  
  it('should create post and return 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/posts',
      payload: { content: 'This is test content' }
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: expect.any(String),
      slug: 'test-post'
    });
  });
});
```

### 3. Contract Tests (OpenAPI Validation)

**Target:** Verify responses match OpenAPI spec

**Coverage Areas:**
- Response schema validation (all endpoints)
- Required fields presence
- Data type correctness
- Error response shape consistency

**Approach:**
- Use `@seriousme/openapi-schema-validator`
- Load generated OpenAPI spec
- Validate actual responses against schemas

**Example:**
```javascript
describe('OpenAPI Contract Compliance', () => {
  it('POST /posts response should match schema', async () => {
    const response = await app.inject({ method: 'POST', url: '/posts', payload });
    const validator = new OpenApiValidator({ spec: openapiSpec });
    
    const result = validator.validate(response.json(), '#/components/schemas/Post');
    expect(result.valid).toBe(true);
  });
});
```

### 4. Rate Limiting Tests

**Target:** Rate limit enforcement and headers

**Coverage:**
- 100 requests succeed with decrementing `X-RateLimit-Remaining`
- 101st request returns 429
- Headers present in all responses
- Reset timestamp correctness

**Approach:**
- Loop 101 requests in rapid succession
- Assert on status codes and headers
- Test reset window behavior

---

## Error Handling Architecture

### Custom Error Classes

All domain errors extend `AppError` base class:

```javascript
// errors/app-error.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

// errors/validation-error.js
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
  }
}

// errors/not-found-error.js
class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`, 404);
  }
}
```

### Global Error Handler Plugin

```javascript
// plugins/error-handler.js
export default async function errorHandler(app) {
  app.setErrorHandler((error, request, reply) => {
    // Handle known application errors
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details })
      });
    }
    
    // Handle unexpected errors
    request.log.error(error);
    return reply.status(500).send({
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500
    });
  });
}
```

---

## OpenAPI Contract Generation

### Strategy: Code-First Approach

Generate OpenAPI spec from Fastify route schemas:

```javascript
// app.js
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Blog Posts API',
      version: '1.0.0',
      description: 'RESTful API for managing blog posts'
    },
    servers: [{ url: 'http://localhost:3000' }]
  }
});

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
  staticCSP: true
});

// Auto-generate spec file
app.ready(() => {
  const spec = app.swagger();
  fs.writeFileSync('./specs/002-posts-api/contracts/openapi.yaml', yaml.dump(spec));
});
```

### Route Schema Example

```javascript
// routes/posts.js
const createPostSchema = {
  body: {
    type: 'object',
    required: ['title', 'body'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      body: { type: 'string', minLength: 10, maxLength: 10000 }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        content: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

app.post('/posts', { schema: createPostSchema }, async (request, reply) => {
  // handler implementation
});
```

---

## Configuration Management

### Environment Variables

```javascript
// config/index.js
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes'
  }
};
```

### Development vs Production

| Setting | Development | Production (Future) |
|---------|-------------|---------------------|
| Logger | Pretty-print | JSON structured |
| Rate Limit | 1000 req/15min | 100 req/15min |
| CORS | `*` (all origins) | Specific domains |
| Error Stack | Included | Hidden |
| Auto-reload | Yes (nodemon) | No |

---

## Development Workflow

### Package Scripts

```json
{
  "scripts": {
    "dev": "node --watch src/posts-api/index.js",
    "start": "node src/posts-api/index.js",
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:contract": "vitest run tests/contract",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests",
    "format": "prettier --write 'src/**/*.js' 'tests/**/*.js'",
    "openapi:generate": "node scripts/generate-openapi.js"
  }
}
```

### Git Workflow

- **Branch:** `feature/002-posts-api`
- **Commits:** Atomic, following conventional commits (`feat:`, `test:`, `refactor:`)
- **PRs:** One per major task (e.g., "Implement POST endpoint", "Add rate limiting")

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time (P95) | <50ms | Fastify metrics |
| Throughput | >1000 req/sec | Load testing |
| Memory Usage | <100MB | Node.js heap stats |
| Test Execution | <5s total | Vitest output |
| Cold Start | <2s | Server ready log |

---

## Migration Path to SQLite

### Phase 2 Changes (Future)

1. **Add Dependency:** `npm install better-sqlite3`
2. **Create Adapter:** `adapters/sqlite-posts.js`
3. **Schema Migration:** Create `migrations/001_create_posts_table.sql`
4. **Swap Adapter:** Change default in `app.js` factory
5. **Update Tests:** Add SQLite-specific test suite
6. **Zero Service Changes:** Services remain untouched

**Estimated Effort:** 4-6 hours

---

## Security Considerations

### Input Sanitization

- **Fastify Validation:** Automatic rejection of invalid types
- **Length Limits:** Enforced at schema level
- **No HTML Rendering:** Raw text storage only (XSS not applicable yet)

### Rate Limiting

- **Implementation:** `@fastify/rate-limit` with in-memory store
- **Key:** IP address (`request.ip`)
- **Headers:** Standard draft-ietf-httpapi-ratelimit-headers
- **Future:** Token-based limits for authenticated users

### CORS

- **Development:** Allow all origins (`*`)
- **Production:** Whitelist specific domains
- **Credentials:** Not needed (no authentication)

---

## Monitoring & Observability

### Logging Strategy

```javascript
// All logs structured JSON in production
app.log.info({ postId: '123', action: 'create' }, 'Post created successfully');
app.log.error({ error: err.message, stack: err.stack }, 'Failed to process request');
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-24T10:30:00Z",
  "uptime": 3600,
  "memory": {
    "used": 45678912,
    "total": 536870912
  },
  "storage": {
    "type": "in-memory",
    "postCount": 42
  }
}
```

---

## Definition of Done (Technical)

- [ ] All routes registered and responding
- [ ] JSON Schema validation active on all endpoints
- [ ] Custom error classes throwing correct status codes
- [ ] Global error handler catching and formatting errors
- [ ] Rate limiting plugin active with header responses
- [ ] Pino logging all requests/errors
- [ ] OpenAPI 3.1 spec generated and valid
- [ ] Swagger UI accessible at `/docs`
- [ ] Unit tests >90% coverage
- [ ] Integration tests all green
- [ ] Contract tests validating against OpenAPI
- [ ] Code passes ESLint with zero warnings
- [ ] README with setup and usage instructions

---

## Risks & Mitigation (Technical)

### Risk: Schema Drift

**Mitigation:** Single source of truth (`config/schemas.js`), exported to routes and OpenAPI

### Risk: Adapter Interface Breaking

**Mitigation:** Comprehensive adapter test suite catches interface violations

### Risk: Rate Limit Memory Leak

**Mitigation:** Use `@fastify/rate-limit` built-in LRU cache, set `max` limit

### Risk: Test Slowdown

**Mitigation:** Keep unit tests pure (no I/O), parallelize integration tests

---

## Next Steps

Proceed to `tasks.md` for step-by-step implementation checklist.
