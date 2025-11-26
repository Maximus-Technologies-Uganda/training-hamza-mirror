# Release Notes — v5.0.0

**Release Date**: November 26, 2025  
**Feature**: Blog Posts API  
**Branch**: `002-blog-api`  
**Developer**: Hamza Kavuma

---

## 🎯 Overview

Version 5.0.0 introduces a **production-ready REST API** for managing blog posts. This is a complete CRUD API with health monitoring, automatic slug generation, validation, rate limiting, and swappable storage backends.

This release represents 5 days of development following a structured specification-first approach with comprehensive testing and documentation.

---

## ✨ Features

### Core API Functionality

- **Health Check Endpoint** (`GET /health`)
  - Service status monitoring
  - Timestamp for availability tracking
  - Sub-second response time

- **Full CRUD Operations**
  - Create posts: `POST /posts`
  - List all posts: `GET /posts`
  - Get single post: `GET /posts/:id`
  - Update post: `PATCH /posts/:id`
  - Delete post: `DELETE /posts/:id`

- **Automatic Slug Generation**
  - URL-friendly slugs generated from titles
  - Regenerated when title changes
  - Uses slugify library (lowercase, strict mode)

- **Data Validation**
  - Title: 1-200 characters, non-whitespace required
  - Body: 1-50,000 characters, non-whitespace required
  - Helpful error messages with field-specific guidance

### Quality & Reliability

- **Error Handling**
  - Consistent JSON error structure across all endpoints
  - Appropriate HTTP status codes (400, 404, 429, 500)
  - Helpful error messages without exposing internals
  - No stack traces in production mode

- **Rate Limiting**
  - IP-based request throttling
  - Default: 100 requests per minute per IP
  - Configurable limits via environment variables
  - Rate limit headers in responses

- **Request Tracking**
  - Automatic UUID generation for each request
  - Support for client-provided `X-Request-ID` header
  - Request ID in all log entries
  - Enables distributed tracing

### Storage & Persistence

- **Swappable Storage Adapters**
  - In-memory storage (default): Fast, development-friendly
  - SQLite adapter: Persistent, production-ready
  - Easy to add new adapters (PostgreSQL, MongoDB, etc.)

- **SQLite Features**
  - Automatic schema creation with indexes
  - WAL mode for better concurrency
  - ACID compliance
  - Database statistics endpoint

### Security & Production-Readiness

- **CORS Support**
  - Development: Allow all origins
  - Production: Configurable whitelist
  - Proper preflight handling

- **Security Headers** (via @fastify/helmet)
  - Content Security Policy
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME sniffing protection)
  - Strict-Transport-Security (HSTS)

- **Configuration**
  - Environment variable support
  - Sensible defaults for all settings
  - Production/development mode detection

### Documentation & Testing

- **OpenAPI 3.1 Specification**
  - Auto-generated from route schemas
  - Complete request/response documentation
  - Interactive Swagger UI at `/docs`
  - JSON spec at `/docs/json`

- **Postman Collection**
  - Complete API test suite
  - Automated test scripts
  - Environment variables
  - Error scenario examples

- **Comprehensive Test Suite**
  - 88 tests total (18 contract + 26 unit + 44 CLI)
  - 79.64% overall code coverage
  - 100% route coverage
  - 75% service coverage
  - All tests passing in CI

---

## 📦 What's Included

### Source Code
- `src/blog/` - Complete API implementation
  - Layered architecture (routes → services → storage)
  - Error handling middleware
  - Storage adapter pattern
  - Post entity model

### Documentation
- [Feature Specification](specs/002-blog-api/spec.md) - User stories & requirements
- [Implementation Plan](specs/002-blog-api/plan.md) - Architecture & decisions
- [Data Model](specs/002-blog-api/data-model.md) - Entity definitions
- [Quickstart Guide](specs/002-blog-api/quickstart.md) - Testing scenarios
- [Tasks Breakdown](specs/002-blog-api/tasks.md) - 67 tasks across 10 phases
- [OpenAPI Contract](specs/002-blog-api/contracts/openapi.yaml) - API specification
- [Review Packet](docs/review-packet-002-blog-api.md) - Complete review evidence

### Tests
- Contract tests validating OpenAPI compliance
- SQLite adapter unit tests
- 88 tests total, all passing

### Tools
- [Postman Collection](docs/blog-posts-api.postman_collection.json)
- Interactive Swagger UI
- CI/CD pipeline with Newman integration

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Start production server
npm start
```

### Basic Usage

```bash
# Check health
curl http://localhost:3000/health

# Create a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post","body":"Hello world!"}'

# List all posts
curl http://localhost:3000/posts

# Get a specific post
curl http://localhost:3000/posts/1

# Update a post
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'

# Delete a post
curl -X DELETE http://localhost:3000/posts/1
```

### Configuration

Environment variables:

```bash
# Server
PORT=3000                      # Server port
HOST=0.0.0.0                   # Bind address
NODE_ENV=production            # Environment mode

# Storage
STORAGE_TYPE=memory            # memory | sqlite
SQLITE_DB_PATH=./data/blog.db  # SQLite file path

# Rate Limiting
RATE_LIMIT_MAX=100             # Max requests per window
RATE_LIMIT_WINDOW=60000        # Time window in ms

# CORS
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

---

## 📊 Test Coverage

```
----------------|---------|----------|---------|---------|
File            | % Stmts | % Branch | % Funcs | % Lines |
----------------|---------|----------|---------|---------|
All files       |   79.64 |    67.17 |   77.77 |   79.56 |
 blog/routes    |     100 |      100 |     100 |     100 | ✅
 blog/services  |      75 |    53.33 |     100 |      75 | ✅
 blog/storage   |      90 |    85.71 |   76.19 |   89.85 | ✅
----------------|---------|----------|---------|---------|
```

**Coverage Goals**:
- ✅ Routes: 100% (target: ≥60%)
- ✅ Services: 75% (target: ≥75%)
- ✅ Overall: 79.64%

---

## 🔗 Links

### Specification & Design
- [Feature Specification](specs/002-blog-api/spec.md)
- [Implementation Plan](specs/002-blog-api/plan.md)
- [Data Model](specs/002-blog-api/data-model.md)
- [Tasks Breakdown](specs/002-blog-api/tasks.md)

### API Documentation
- [OpenAPI Specification](specs/002-blog-api/contracts/openapi.yaml)
- Interactive Swagger UI: `http://localhost:3000/docs`
- [Postman Collection](docs/blog-posts-api.postman_collection.json)

### Quality Assurance
- [Review Packet](docs/review-packet-002-blog-api.md)
- [Quickstart Testing Guide](specs/002-blog-api/quickstart.md)
- Contract Tests: `tests/blog/contract/posts-api.test.js`
- Unit Tests: `tests/blog/unit/sqlite-storage.test.js`

### CI/CD
- [GitHub Actions Workflow](.github/workflows/review-packet.yml)
- [CI Runs](https://github.com/Maximus-Technologies-Uganda/training-hamza/actions)
- Branch: `002-blog-api`
- Commit: `1570afd0f5410bfa5a6025a84810307b0ff8bedb`

---

## 🎓 Technical Highlights

### Architecture Patterns
- **Layered Architecture**: Routes → Services → Storage
- **Adapter Pattern**: Swappable storage backends
- **Middleware Pattern**: Centralized error handling
- **Repository Pattern**: Storage abstraction

### Technology Stack
- **Runtime**: Node.js 20.x with ES Modules
- **Framework**: Fastify 4.x (high performance, schema validation)
- **Storage**: In-memory + SQLite (better-sqlite3)
- **Testing**: Vitest 4.x with AJV for schema validation
- **Documentation**: OpenAPI 3.1 with Swagger UI
- **CI/CD**: GitHub Actions with Newman integration

### Production Features
- Request ID tracking for debugging
- Structured logging with Pino
- Security headers (Helmet)
- CORS configuration
- Rate limiting
- Environment-based configuration
- Graceful error handling

---

## 📝 Known Limitations

1. **No Pagination**: `GET /posts` returns all posts (acceptable for MVP)
2. **No Authentication**: All endpoints public (use rate limiting)
3. **In-Memory Default**: Data lost on restart unless SQLite configured
4. **IP-Based Rate Limiting**: Users behind NAT share rate limit bucket

All limitations are documented and acceptable for current scope.

---

## 🔜 Future Enhancements

Potential future features (not in current scope):

- Pagination for large result sets
- Authentication & authorization
- Post categories and tags
- Full-text search
- Image uploads
- Markdown support
- Post drafts and publishing workflow
- Comment system
- Redis cache for popular posts

---

## 🙏 Acknowledgments

**Developed by**: Hamza Kavuma  
**Review**: Maximus Technologies Uganda  
**Timeline**: November 24-26, 2025 (5 days)  
**Methodology**: Specification-first, TDD, contract testing

---

## 📄 License

This project is part of the Maximus Technologies training program.

---

**For questions or issues, please see the [Review Packet](docs/review-packet-002-blog-api.md) or contact the development team.**
