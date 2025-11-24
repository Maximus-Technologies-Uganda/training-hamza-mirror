# Implementation Plan: Blog Posts API

**Branch**: `002-blog-api` | **Date**: November 24, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-blog-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a production-shaped REST API for blog post management with CRUD operations, input validation, error handling, IP-based rate limiting, and swappable persistence (in-memory primary, optional SQLite adapter). The API provides health monitoring, structured error responses, and conforms to OpenAPI 3.1 specification with comprehensive test coverage.

## Technical Context

**Language/Version**: Node.js 20.x LTS (ES Modules)  
**Primary Dependencies**: Fastify 4.x (HTTP framework with built-in JSON Schema validation), slugify 1.6.x (URL-friendly slugs), @fastify/rate-limit (IP-based limiting), @fastify/swagger (OpenAPI generation), better-sqlite3 (optional SQLite adapter)  
**Storage**: In-memory (primary), SQLite via better-sqlite3 (optional adapter)  
**Testing**: Vitest 4.x (unit, integration, contract tests using Fastify inject())  
**Target Platform**: Node.js 20.x server environment (containerized or VM)  
**Project Type**: Single project (REST API backend with library-first architecture)  
**Performance Goals**: Health endpoint <1s response, storage operations <10ms (in-memory) / <50ms (SQLite), handle 100 concurrent requests (Fastify optimized)  
**Constraints**: IP-based rate limiting in memory, structured JSON error responses, OpenAPI 3.1 auto-generated from route schemas, ≥75% service coverage, ≥60% route coverage  
**Scale/Scope**: Single-instance deployment, CRUD operations on posts entity, 5 user stories (P1-P3), 42 functional requirements, swappable storage adapter pattern

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on project patterns (library-first, CLI interface, test-first):

- ✅ **Library-First**: Core logic (post service, storage adapters, validation) implemented as standalone libraries in `src/blog/`
- ✅ **CLI Interface**: HTTP server acts as CLI entry point, exposes REST API endpoints (text-based protocol)
- ✅ **Test-First (NON-NEGOTIABLE)**: All tests written using Vitest before implementation; targeting ≥75% service coverage, ≥60% route coverage
- ✅ **Integration Testing**: Contract tests verify API endpoints against OpenAPI spec; adapter pattern tests ensure storage implementations are interchangeable
- ✅ **Observability**: Structured JSON error responses; HTTP status codes as debugging signals
- ✅ **Simplicity**: Start with in-memory storage; SQLite adapter only if time permits; no over-engineering (YAGNI)

**STATUS**: PASS - No constitution violations. All gates aligned with feature requirements.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
└── blog/
    ├── index.js                 # Main library exports (service factory)
    ├── server.js                # HTTP server entry point (CLI equivalent)
    ├── models/
    │   └── post.js              # Post entity definition and validation
    ├── services/
    │   ├── post-service.js      # Core business logic (CRUD operations)
    │   └── slug-generator.js    # URL-friendly slug generation
    ├── storage/
    │   ├── storage-adapter.js   # Storage interface definition
    │   ├── memory-storage.js    # In-memory implementation
    │   └── sqlite-storage.js    # Optional SQLite implementation
    ├── middleware/
    │   ├── error-handler.js     # Centralized error processing
    │   ├── rate-limiter.js      # IP-based rate limiting
    │   └── validator.js         # Request validation middleware
    └── routes/
        ├── health.js            # GET /health endpoint
        └── posts.js             # CRUD endpoints for posts

tests/
├── blog/
│   ├── contract/                # OpenAPI contract tests
│   │   └── posts-api.test.js
│   ├── integration/             # End-to-end API tests
│   │   ├── posts-crud.test.js
│   │   └── rate-limiting.test.js
│   └── unit/                    # Unit tests for services/models
│       ├── post-service.test.js
│       ├── slug-generator.test.js
│       ├── memory-storage.test.js
│       └── sqlite-storage.test.js
```

**Structure Decision**: Single project structure following existing patterns. Core logic in library modules (`src/blog/`), HTTP server as CLI entry point (`server.js`), comprehensive test suite using Vitest. Adapter pattern for storage enables swappable persistence implementations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Constitution check passed without exceptions.
