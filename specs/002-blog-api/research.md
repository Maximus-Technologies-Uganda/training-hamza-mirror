# Research: Blog Posts API

**Feature**: 002-blog-api  
**Date**: November 24, 2025  
**Purpose**: Resolve NEEDS CLARIFICATION items from Technical Context and document technology decisions

## Research Tasks

### 1. Node.js Version Target

**Decision**: Node.js 20.x LTS (Active LTS until April 2026)

**Rationale**:
- Long-term support provides stability for production deployment
- Native ES Modules support (no build step required, matches existing project)
- Built-in test runner available (though project uses Vitest)
- Performance improvements in V8 engine
- Security updates maintained until April 2026

**Alternatives Considered**:
- **Node.js 18.x LTS**: Still supported but approaching maintenance mode (April 2025); 20.x offers better performance
- **Node.js 22.x**: Current release but not yet LTS; too cutting-edge for training project
- **Node.js 16.x**: End of life (September 2023); not suitable

### 2. HTTP Framework

**Decision**: Fastify 4.x

**Rationale**:
- **Performance**: 2-3x faster than Express in benchmarks; handles 100 concurrent requests easily
- **Schema validation**: Built-in JSON Schema validation (reduces dependency count)
- **TypeScript-friendly**: Excellent type definitions (future-proofing)
- **Plugin architecture**: Clean separation of concerns (aligns with library-first principle)
- **Logging**: Built-in structured logging via Pino (observability requirement)
- **Error handling**: First-class error handling middleware support
- **OpenAPI generation**: Fastify Swagger plugin auto-generates OpenAPI 3.1 specs from route schemas

**Alternatives Considered**:
- **Express.js 4.x**: Most popular but slower; lacks built-in validation; requires more middleware setup; mature ecosystem
- **Hono**: Lightweight and fast but primarily designed for edge/cloudflare workers; less Node.js-specific tooling
- **Koa**: Minimalist but requires more manual setup; smaller ecosystem than Express/Fastify

### 3. Validation Library

**Decision**: Built-in Fastify JSON Schema validation

**Rationale**:
- Native integration with Fastify (no additional dependency)
- JSON Schema is OpenAPI-native format (single source of truth)
- Performance optimized (pre-compiled validators via Ajv)
- Automatic error response formatting
- Schema documentation generates API contract automatically

**Alternatives Considered**:
- **Zod**: Excellent TypeScript-first validation but adds dependency; schema-to-OpenAPI conversion adds complexity
- **Joi**: Popular but slower than JSON Schema; requires separate OpenAPI schema definition
- **Yup**: React-focused; not optimized for backend validation

### 4. Slug Generation Library

**Decision**: `slugify` npm package (v1.6.x)

**Rationale**:
- Lightweight (~3KB), zero dependencies
- Handles Unicode characters and transliteration (international titles)
- Configurable options (lowercase, strict mode, custom replacements)
- Battle-tested (100M+ downloads/week)
- Simple API: `slugify(title, { lower: true, strict: true })`

**Alternatives Considered**:
- **Custom implementation**: Regex-based approach (`title.toLowerCase().replace(/\s+/g, '-')`) but doesn't handle Unicode, special characters, or edge cases
- **limax**: More features but heavier (~15KB with dependencies); overkill for this use case
- **speakingurl**: Similar to slugify but less maintained (last update 2019)

### 5. Rate Limiting Implementation

**Decision**: `@fastify/rate-limit` plugin

**Rationale**:
- Official Fastify plugin (maintained by core team)
- IP-based limiting out of the box
- In-memory storage (matches requirement)
- Configurable time windows and max requests
- Custom error responses with rate limit headers
- Integrates seamlessly with Fastify lifecycle

**Alternatives Considered**:
- **express-rate-limit**: Designed for Express; not Fastify-compatible
- **Custom implementation**: Reinventing the wheel; error-prone for edge cases (distributed timers, memory leaks)

### 6. SQLite Integration (Optional)

**Decision**: `better-sqlite3` npm package

**Rationale**:
- Synchronous API (simpler than async for adapter pattern)
- Fastest SQLite library for Node.js (native binding)
- No callback hell (matches promise-based code style)
- ACID compliance out of the box
- Simple migration from in-memory (same adapter interface)

**Alternatives Considered**:
- **sqlite3**: Async API adds complexity; slower performance; callback-based
- **node-sqlite3**: Deprecated in favor of better-sqlite3
- **Knex.js + SQLite**: Query builder adds unnecessary abstraction layer

### 7. Testing Strategy

**Decision**: Vitest + Fastify inject() for contract tests

**Rationale**:
- **Vitest**: Already in project; fast test runner; Jest-compatible API
- **Fastify inject()**: Built-in HTTP injection for testing routes without network layer; matches Fastify patterns
- **Contract tests**: Validate against JSON Schema from route definitions (schemas are single source of truth)
- **Coverage targets**: ≥75% service layer, ≥60% routes (achievable with unit + integration tests)

**Test Structure**:
```javascript
// Unit tests: Pure functions (slug generator, validators)
// Integration tests: Service layer with mock storage
// Contract tests: HTTP routes with Fastify inject()
```

**Alternatives Considered**:
- **Supertest**: Popular for Express but Fastify inject() is more performant (no TCP overhead)
- **Jest**: Slower than Vitest; redundant setup
- **Postman/Newman**: External tools; breaks TDD workflow; not code-first

### 8. Error Handling Pattern

**Decision**: Custom error classes + Fastify error handler

**Rationale**:
- **Custom errors**: `ValidationError`, `NotFoundError`, `RateLimitError` extend base `ApiError`
- **Centralized handler**: Fastify `setErrorHandler()` maps error types to HTTP status codes and JSON structure
- **Consistency**: All errors follow same JSON format: `{ statusCode, error, message }`
- **Security**: Base error class strips stack traces in production mode

**Error Flow**:
```
Service throws custom error → Fastify catches → Error handler maps to status code + JSON → Client receives structured error
```

**Alternatives Considered**:
- **HTTP-errors package**: Generic HTTP errors but less semantic (business logic clarity)
- **Boom (Hapi errors)**: Not Fastify-native; adds dependency
- **Plain Error throws**: Requires manual status code handling in every route

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| HTTP Framework | Fastify | 4.x |
| Validation | JSON Schema (built-in) | - |
| Slug Generation | slugify | 1.6.x |
| Rate Limiting | @fastify/rate-limit | Latest |
| SQLite (optional) | better-sqlite3 | Latest |
| Testing | Vitest | 4.x (existing) |
| OpenAPI | @fastify/swagger | Latest |

## Next Steps (Phase 1)

1. Generate `data-model.md` defining Post entity schema
2. Generate OpenAPI contract in `contracts/` directory using Fastify schema definitions
3. Create `quickstart.md` with API usage examples
4. Update agent context with new dependencies
