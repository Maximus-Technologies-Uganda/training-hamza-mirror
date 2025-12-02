# Training Hamza

CLI applications and REST APIs to demonstrate testing, TDD, and production-ready development workflows.

## Projects Overview

This repository contains multiple projects demonstrating progressive complexity:

1. **CLI Applications** (Chapter 1-4): Hello, Stopwatch, and Temperature converter CLIs
2. **Blog Posts API** (Week 5): Production-shaped REST API with CRUD operations, validation, and error handling

## Chapter 1 Summary

This project contains **three CLI applications** built incrementally to practice:
- **Test-Driven Development (TDD)**
- **Input validation and error handling**
- **GitHub Actions CI/CD**
- **Code review workflows**

### CLIs Overview

| CLI | Purpose | Key Features | Tests |
|-----|---------|--------------|-------|
| **Hello CLI** | Greeting generator | Name parameter, shout mode, CLI integration | 9 tests |
| **Stopwatch CLI** | Time tracking | Start, lap, stop commands | 13 tests |
| **Temperature CLI** | Unit converter | C↔F conversion, validation, table-driven | 40 tests |

**Total: 63 comprehensive tests** (+ 1 sanity check)
- **Phase 0 Improvements:** +19 tests, run(argv) pattern, table-driven tests, explicit Infinity policy

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Try each CLI
node src/hello/cli.js --name Alice
node src/stopwatch/cli.js start
node src/temperature/cli.js --from C --to F --value 100
```

## Installation

```bash
npm install
```

---

## Blog Posts API (Week 5)

A production-shaped REST API for managing blog posts with full CRUD operations, validation, error handling, rate limiting, and swappable persistence (in-memory and SQLite).

### Features

- ✅ **CRUD Operations**: Create, read, update, and delete blog posts
- ✅ **Data Validation**: Automatic validation of title and body fields
- ✅ **Automatic Slug Generation**: URL-friendly slugs generated from titles
- ✅ **Error Handling**: Consistent, structured error responses
- ✅ **Rate Limiting**: IP-based request throttling to prevent abuse
- ✅ **Health Monitoring**: `/health` endpoint for service monitoring
- ✅ **Swappable Storage**: In-memory storage with optional SQLite adapter
- ✅ **OpenAPI Specification**: Full API documentation following OpenAPI 3.1

### Quick Start

Start the API server:

```bash
# Start the development server
node src/blog/server.js
```

The API will be available at `http://localhost:3000`.

### API Endpoints

#### Health Check

**GET /health**

Check if the API is operational.

```bash
# Check service health
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

#### Create a Post

**POST /posts**

Create a new blog post with title and body content.

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Node.js",
    "body": "Node.js is a JavaScript runtime built on Chrome'\''s V8 engine."
  }'
```

Response (201 Created):
```json
{
  "id": 1,
  "title": "Getting Started with Node.js",
  "slug": "getting-started-with-nodejs",
  "body": "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:00:00.000Z"
}
```

#### List All Posts

**GET /posts**

Retrieve all blog posts.

```bash
curl http://localhost:3000/posts
```

Response (200 OK):
```json
[
  {
    "id": 1,
    "title": "Getting Started with Node.js",
    "slug": "getting-started-with-nodejs",
    "body": "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
    "createdAt": "2025-11-24T12:00:00.000Z",
    "updatedAt": "2025-11-24T12:00:00.000Z"
  }
]
```

#### Get a Single Post

**GET /posts/{id}**

Retrieve a specific post by its ID.

```bash
curl http://localhost:3000/posts/1
```

Response (200 OK):
```json
{
  "id": 1,
  "title": "Getting Started with Node.js",
  "slug": "getting-started-with-nodejs",
  "body": "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:00:00.000Z"
}
```

#### Update a Post

**PATCH /posts/{id}**

Update an existing post's title and/or body.

```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Guide to Node.js",
    "body": "This comprehensive guide covers everything you need to know about Node.js."
  }'
```

Response (200 OK):
```json
{
  "id": 1,
  "title": "Complete Guide to Node.js",
  "slug": "complete-guide-to-nodejs",
  "body": "This comprehensive guide covers everything you need to know about Node.js.",
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:30:00.000Z"
}
```

#### Delete a Post

**DELETE /posts/{id}**

Permanently delete a blog post.

```bash
curl -X DELETE http://localhost:3000/posts/1
```

Response: 204 No Content

### Error Handling

The API returns consistent JSON error responses with helpful messages.

#### Validation Error (400)

Missing or invalid fields:

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

Response:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "title must contain non-whitespace characters"
}
```

#### Not Found (404)

Post doesn't exist:

```bash
curl http://localhost:3000/posts/999
```

Response:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Post with id 999 not found"
}
```

#### Rate Limit Exceeded (429)

Too many requests from the same IP:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

#### Internal Server Error (500)

Unexpected errors (no sensitive details exposed):

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Running Tests

The Blog API includes comprehensive contract tests that validate all endpoints against the OpenAPI specification.

#### Run All Contract Tests

```bash
# Run the complete contract test suite
npm test tests/blog/contract/posts-api.test.js
```

#### Test Coverage

The contract test suite includes:
- ✅ Health check endpoint validation
- ✅ POST /posts - Create post with validation tests
- ✅ GET /posts - List all posts
- ✅ GET /posts/{id} - Get single post with 404 handling
- ✅ PATCH /posts/{id} - Update post with validation
- ✅ DELETE /posts/{id} - Delete post with 404 handling
- ✅ Rate limiting (429) response validation
- ✅ Error response consistency across all endpoints
- ✅ OpenAPI specification validation

**Total: 18 comprehensive contract tests** ensuring API conformance to OpenAPI 3.1 specification.

#### Using Postman

Import and run the complete API test collection:

```bash
# Import the collection in Postman
docs/blog-posts-api.postman_collection.json
```

The Postman collection includes:
- All CRUD operations with example requests
- Pre-configured environment variables
- Automated test scripts
- Error scenario examples
- Rate limiting demonstrations

#### Running Postman Collection with Newman

Newman allows you to run the Postman collection from the command line:

```bash
# Start the server first
npm run dev

# In another terminal, run the collection
npm run test:postman

# Or run Newman directly
newman run docs/blog-posts-api.postman_collection.json --env-var baseUrl=http://localhost:3000
```

**Expected Results:**
- Total Requests: 12
- Assertions: 22
- Failed: 0

The collection validates:
- ✅ Health check endpoint
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Validation error scenarios (whitespace, too long, empty)
- ✅ Invalid ID format handling
- ✅ OpenAPI specification endpoint
- ✅ Swagger UI endpoint
- ✅ Proper status codes (200, 201, 204, 400)
- ✅ Response structure validation

### Data Validation Rules

**Title**:
- Required field
- Maximum 200 characters
- Must contain non-whitespace characters
- Automatically generates URL-friendly slug

**Body**:
- Required field
- Maximum 50,000 characters
- Must contain non-whitespace characters

**ID**:
- Auto-generated integer
- Unique and sequential
- Immutable after creation

### Rate Limiting

The API implements IP-based rate limiting to prevent abuse:

- Requests are tracked per IP address
- Each IP has an independent rate limit bucket
- Rate limit information included in 429 responses
- Configurable limits and time windows

### Storage Options

#### In-Memory Storage (Default)

Fast, ephemeral storage for development:

```javascript
import { createMemoryStorage } from './src/blog/storage/memory-storage.js';

const storage = createMemoryStorage();
```

**Pros**: Fast, simple, no dependencies  
**Cons**: Data lost on restart

#### SQLite Adapter (Optional)

Persistent storage with SQLite:

```javascript
import { createSQLiteStorage } from './src/blog/storage/sqlite-storage.js';

const storage = createSQLiteStorage('./blog.db');
```

**Pros**: Persistent, reliable, suitable for production  
**Cons**: Slightly slower, requires SQLite

### API Documentation

#### Interactive Swagger UI

Access the interactive API documentation with live testing capabilities:

```bash
# Start the server
node src/blog/server.js

# Open in browser
http://localhost:3000/docs
```

The Swagger UI provides:
- **Interactive testing**: Test all endpoints directly from the browser
- **Schema visualization**: View request/response schemas
- **Example values**: Pre-filled example requests
- **Response inspection**: See actual API responses

#### OpenAPI Specification

Get the OpenAPI 3.1 specification in JSON format:

```bash
# Get the spec programmatically
curl http://localhost:3000/docs/json

# Or view the source YAML
specs/002-blog-api/contracts/openapi.yaml
```

The specification includes:
- Complete endpoint documentation
- Request/response schemas with validation rules
- Error response formats
- Example requests and responses
- Security requirements (rate limiting)

#### Postman Collection

Import the complete API collection with examples:

```
docs/blog-posts-api.postman_collection.json
```

Features:
- All CRUD endpoints pre-configured
- Automated test scripts for validation
- Environment variables for easy configuration
- Error scenario examples
- Collection-level documentation

### Day 4 — Persistence + Hardening ✅

Day 4 focused on adding durable storage, production hardening, and comprehensive testing:

#### 1. SQLite Persistence Adapter ✅
- ✅ `SQLiteStorage` class implementing `StorageAdapter` interface
- ✅ better-sqlite3 library for native SQLite bindings
- ✅ Automatic schema creation with indexes
- ✅ WAL (Write-Ahead Logging) for better concurrency
- ✅ Support for CRUD operations with ACID compliance
- ✅ Configurable via `STORAGE_TYPE` environment variable
- ✅ Data persists across server restarts
- ✅ Database statistics (post count, file size)

**Usage**:
```bash
# Use in-memory storage (default)
STORAGE_TYPE=memory node src/blog/server.js

# Use SQLite persistence
STORAGE_TYPE=sqlite SQLITE_DB_PATH=./data/blog.db node src/blog/server.js
```

#### 2. Request ID Tracking & Logging ✅
- ✅ Automatic request ID generation (UUID)
- ✅ Request ID in all log entries for traceability
- ✅ `X-Request-ID` header support (client can provide)
- ✅ Pino logger with structured JSON logging
- ✅ Pretty printing in development mode
- ✅ Request/response logging with metadata

**Request ID Example**:
```bash
curl -H "X-Request-ID: my-custom-id" http://localhost:3000/posts
# Server logs will include: "requestId": "my-custom-id"
```

#### 3. CORS Support ✅
- ✅ `@fastify/cors` plugin integrated
- ✅ Development: Allow all origins
- ✅ Production: Configurable whitelist via `ALLOWED_ORIGINS`
- ✅ Custom headers support (`X-Request-ID`, `Authorization`)
- ✅ Proper handling of preflight OPTIONS requests

**Configuration**:
```bash
# Development (allows all origins)
NODE_ENV=development node src/blog/server.js

# Production (whitelist specific origins)
NODE_ENV=production ALLOWED_ORIGINS=https://example.com,https://app.example.com node src/blog/server.js
```

#### 4. Security Headers ✅
- ✅ `@fastify/helmet` plugin for security hardening
- ✅ Content Security Policy (CSP) - disabled in dev for Swagger UI
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ Strict-Transport-Security (HSTS for HTTPS)
- ✅ X-DNS-Prefetch-Control
- ✅ Production-ready security posture

#### 5. Comprehensive Adapter Tests ✅
- ✅ 26 test cases for SQLite adapter
- ✅ Schema initialization validation
- ✅ CRUD operations (create, read, update, delete)
- ✅ Unique constraints and validation
- ✅ Timestamp management (createdAt, updatedAt)
- ✅ Data persistence verification
- ✅ Database statistics
- ✅ Error handling and edge cases
- ✅ 100% SQLite adapter test coverage

**Test Suite**:
```bash
# Run SQLite adapter tests
npm test tests/blog/unit/sqlite-storage.test.js

# All tests (including contract tests)
npm test
```

#### Performance Characteristics
| Operation | In-Memory | SQLite | Target |
|-----------|-----------|---------|---------|
| Create Post | <1ms | <5ms | <10ms |
| Read Post | <1ms | <5ms | <10ms |
| Update Post | <1ms | <5ms | <10ms |
| Delete Post | <1ms | <5ms | <10ms |
| List All Posts | <1ms | <10ms | <10ms |

#### Storage Adapter Comparison

| Feature | In-Memory | SQLite |
|---------|-----------|---------|
| **Speed** | Fastest (<1ms) | Fast (<10ms) |
| **Persistence** | ❌ Lost on restart | ✅ Survives restarts |
| **Data Loss Risk** | High | Low (ACID) |
| **Setup** | Zero config | Auto-creates DB |
| **Dependencies** | None | better-sqlite3 |
| **Use Case** | Development, testing | Production, staging |
| **Max Capacity** | RAM limited | Disk limited (TB+) |

#### Configuration Summary

| Environment Variable | Description | Default | Day 4 Feature |
|---------------------|-------------|---------|---------------|
| `STORAGE_TYPE` | Storage backend (`memory` \| `sqlite`) | `memory` | ✅ SQLite adapter |
| `SQLITE_DB_PATH` | SQLite database file path | `./data/blog.db` | ✅ SQLite adapter |
| `NODE_ENV` | Environment mode | `development` | ✅ CORS/Security |
| `ALLOWED_ORIGINS` | CORS whitelist (comma-separated) | None | ✅ CORS |
| `PORT` | HTTP server port | `3000` | Day 3 |
| `HOST` | Server bind address | `0.0.0.0` | Day 3 |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | Day 3 |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `60000` | Day 3 |

### Day 3 Deliverables ✅

The Blog Posts API has successfully completed all Day 3 requirements:

#### 1. Complete CRUD Operations ✅
- ✅ Create posts with automatic slug generation
- ✅ Read posts (single and list)
- ✅ Update posts with timestamp management
- ✅ Delete posts with proper cleanup
- ✅ All endpoints operational and tested

#### 2. OpenAPI Contract Generation ✅
- ✅ Fastify Swagger plugin integrated
- ✅ Auto-generated OpenAPI 3.1 specification from route schemas
- ✅ Interactive Swagger UI at `/docs`
- ✅ JSON spec available at `/docs/json`
- ✅ Matches hand-written contract in `specs/002-blog-api/contracts/openapi.yaml`

#### 3. Contract Tests ✅
- ✅ 18 comprehensive contract tests using Vitest and AJV
- ✅ All endpoints validated against OpenAPI schemas
- ✅ Request/response validation for all operations
- ✅ Error response validation (400, 404, 429, 500)
- ✅ Rate limiting validation with headers
- ✅ OpenAPI specification validation
- ✅ 100% test pass rate

#### 4. Postman Collection ✅
- ✅ Complete collection with all endpoints
- ✅ Example requests for each operation
- ✅ Error scenario examples
- ✅ Automated test scripts
- ✅ Environment variables configured
- ✅ Collection documentation included

#### 5. README Documentation ✅
- ✅ Quick start guide with examples
- ✅ All API endpoints documented with curl examples
- ✅ Error handling documentation
- ✅ Testing instructions
- ✅ Links to OpenAPI spec and Postman collection
- ✅ Architecture overview

#### Production Readiness Checklist
- ✅ Health monitoring endpoint operational
- ✅ IP-based rate limiting enforced
- ✅ Structured error responses (no stack traces)
- ✅ Data validation on all inputs
- ✅ Automatic slug generation
- ✅ Timestamp management (createdAt/updatedAt)
- ✅ Swappable storage adapter pattern
- ✅ Comprehensive test coverage
- ✅ OpenAPI 3.1 compliant
- ✅ Full API documentation

### Architecture

The API follows a clean, layered architecture:

```
src/blog/
├── server.js              # Express server setup
├── index.js               # Main entry point
├── routes/
│   ├── health.js          # Health check endpoint
│   └── posts.js           # Post CRUD endpoints
├── services/
│   ├── post-service.js    # Business logic
│   └── slug-generator.js  # URL slug generation
├── models/
│   └── post.js            # Post entity validation
├── storage/
│   ├── storage-adapter.js # Storage interface
│   └── memory-storage.js  # In-memory implementation
└── middleware/
    └── error-handler.js   # Centralized error handling
```

**Design Patterns**:
- **Adapter Pattern**: Swappable storage implementations
- **Service Layer**: Business logic separated from HTTP concerns
- **Middleware Pattern**: Centralized error handling and rate limiting
- **Repository Pattern**: Storage abstraction

---

## Blog Frontend (Week 6)

A responsive web frontend for the Blog Posts API built with Next.js, TypeScript, and Tailwind CSS.

### Features

- 📝 **View All Posts** - Browse a list of all published blog posts with titles, dates, and excerpts
- 📖 **View Post Details** - Read full post content with metadata and timestamps
- ✏️ **Create Posts** - Compose and publish new blog posts with form validation
- 🔄 **Edit Posts** - Update existing posts with change detection
- 🗑️ **Delete Posts** - Remove posts with confirmation dialog
- 🏥 **Health Monitoring** - Real-time API health status indicator

### Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.5+ (strict mode)
- **Styling**: Tailwind CSS 3.4+
- **Data Fetching**: SWR 2.2+ (with automatic caching)
- **Testing**: Jest + React Testing Library + jest-axe
- **Deployment**: Static export to GitHub Pages

### Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure API URL
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Frontend Demo

The live frontend is deployed to GitHub Pages:

🔗 **Live Demo**: [https://maximus-technologies-uganda.github.io/training-hamza/](https://maximus-technologies-uganda.github.io/training-hamza/)

**Note**: The demo requires the Blog Posts API to be running. For full functionality, start the API locally:

```bash
# Start the Blog API (port 3001)
npm run blog:dev
```

### Documentation

For complete setup instructions, environment configuration, and deployment guide, see the [Frontend README](frontend/README.md).

---

## CLI Applications

## Usage

### Temperature Converter CLI

Convert temperatures between Celsius and Fahrenheit with input validation.

#### Basic Conversion

Convert from Celsius to Fahrenheit:

```bash
node src/temperature/cli.js --from C --to F --value 0
```

Output:
```
Input:  0°C (Celsius)
Output: 32°F (Fahrenheit)
```

Convert from Fahrenheit to Celsius:

```bash
node src/temperature/cli.js --from F --to C --value 98.6
```

Output:
```
Input:  98.6°F (Fahrenheit)
Output: 37°C (Celsius)
```

#### More Examples

```bash
# Body temperature
node src/temperature/cli.js --from C --to F --value 37
# Input:  37°C (Celsius)
# Output: 98.6°F (Fahrenheit)

# Freezing point
node src/temperature/cli.js --from F --to C --value 32
# Input:  32°F (Fahrenheit)
# Output: 0°C (Celsius)

# Negative temperatures
node src/temperature/cli.js --from C --to F --value -40
# Input:  -40°C (Celsius)
# Output: -40°F (Fahrenheit)
```

#### Temperature Converter Error Cases

**Missing required flags:**
```bash
node src/temperature/cli.js --from C --to F
# Error: --value flag is required
# [Shows usage help]
```

**Invalid temperature value:**
```bash
node src/temperature/cli.js --from C --to F --value hot
# Error: Invalid temperature value 'hot'
# Temperature must be a valid number
```

**Converting to same unit:**
```bash
node src/temperature/cli.js --from C --to C --value 100
# Error: Cannot convert from C to C. Units must be different
# You must convert between different units.
```

**Invalid unit:**
```bash
node src/temperature/cli.js --from K --to F --value 273
# Error: Invalid unit: K. Valid units are: C, F
# Valid units are:
#   C - Celsius
#   F - Fahrenheit
```

**Lowercase units (case-sensitive):**
```bash
node src/temperature/cli.js --from c --to f --value 100
# Error: Invalid unit: c. Valid units are: C, F
```

#### Using the Temperature Module

Import and use functions in your code:

```javascript
import { cToF, fToC, convert } from './src/temperature/index.js';

// Direct conversion
console.log(cToF(0));    // 32
console.log(fToC(212));  // 100

// Generic convert function with validation
console.log(convert(37, 'C', 'F'));  // 98.6
```

### Stopwatch CLI

A stopwatch with start, lap, and stop functionality.

> **⚠️ Important: Single-Process Limitation**  
> The stopwatch CLI stores state in memory within a single Node.js process. Each time you run `node src/stopwatch/cli.js`, a **new process starts with fresh state**. This means:
> - Running `start` in one shell invocation, then `lap` in another **will not work** (the lap command starts a new process that doesn't remember the start time)
> - State does **not persist** between separate command invocations
> - For a working stopwatch sequence, use the **demo script** shown below, which runs all commands in one process

#### Working Demo (Single Process)

To see the stopwatch work correctly, run the demo script that keeps state in one process:

```bash
node src/stopwatch/demo.js
```

This demonstrates the intended behavior:
```
=== Stopwatch CLI Demo ===

$ node src/stopwatch/cli.js start
Stopwatch started

$ node src/stopwatch/cli.js lap
Lap: 00:02.003

$ node src/stopwatch/cli.js lap
Lap: 00:03.505

$ node src/stopwatch/cli.js stop
Stopped: 00:04.506

=== Demo Complete ===
```

#### Stopwatch Error Cases

**Starting twice without stopping:**
```bash
node src/stopwatch/cli.js start
node src/stopwatch/cli.js start
# Error: Stopwatch already running
```

**Lap before starting:**
```bash
node src/stopwatch/cli.js lap
# Error: Stopwatch not started
```

**Stop before starting:**
```bash
node src/stopwatch/cli.js stop
# Error: Stopwatch not started
```

#### Using the Stopwatch Module

The stopwatch is designed to be imported and used programmatically in a single process:

```javascript
import { createStopwatch, formatTime } from './src/stopwatch/index.js';

const sw = createStopwatch();
sw.start();

setTimeout(() => {
  console.log(`Lap: ${formatTime(sw.lap())}`);
}, 1000);

setTimeout(() => {
  sw.stop();
  console.log(`Total: ${formatTime(sw.elapsedMs())}`);
}, 2000);
```

This is the **recommended way** to use the stopwatch, as it maintains state correctly within your application.

### Hello CLI (Greeting)

#### Basic Greeting

Greet someone by name:

```bash
node src/hello/cli.js --name Alice
```

Output: `Hello, Alice!`

### Shouting Greeting

Add the `--shout` flag to make the greeting uppercase:

```bash
node src/hello/cli.js --name Bob --shout
```

Output: `HELLO, BOB!`

### Using the formatGreeting Function

You can also import and use the function directly in your code:

```javascript
import { formatGreeting } from './src/hello/index.js';

// Normal greeting
console.log(formatGreeting('Charlie')); // Hello, Charlie!

// Shouting greeting
console.log(formatGreeting('Diana', true)); // HELLO, DIANA!
```

## Error Cases

### Missing Name

If you don't provide a `--name` argument:

```bash
node src/hello/cli.js --shout
```

Output:
```
Error: --name argument is required
Usage: node src/hello/cli.js --name <name> [--shout]
```
Exit code: `1`

### Empty or Whitespace Name

If the name is empty or only whitespace, an error will be thrown:

```javascript
formatGreeting(''); // Throws: Error: Name is required
formatGreeting('   '); // Throws: Error: Name is required
```

## Running Tests

Run all tests once:

```bash
npm test
```

Run tests in watch mode (auto-rerun on file changes):

```bash
npm run test:watch
```

## Development

This project uses:
- **Vitest** for testing
- **ES Modules** (type: "module")
- **GitHub Actions** for CI/CD

## Project Structure

```
training-hamza/
├── src/
│   ├── blog/                        # Blog API (Week 5)
│   │   ├── server.js                # Express server
│   │   ├── index.js                 # Main entry point
│   │   ├── routes/
│   │   │   ├── health.js            # Health check endpoint
│   │   │   └── posts.js             # Post CRUD endpoints
│   │   ├── services/
│   │   │   ├── post-service.js      # Business logic
│   │   │   └── slug-generator.js    # Slug generation
│   │   ├── models/
│   │   │   └── post.js              # Post entity
│   │   ├── storage/
│   │   │   ├── storage-adapter.js   # Storage interface
│   │   │   └── memory-storage.js    # In-memory storage
│   │   └── middleware/
│   │       └── error-handler.js     # Error handling
│   ├── hello/
│   │   ├── index.js                 # Core formatGreeting function
│   │   └── cli.js                   # CLI wrapper
│   ├── stopwatch/
│   │   ├── index.js                 # Core stopwatch logic (TDD)
│   │   └── cli.js                   # Stopwatch CLI wrapper
│   └── temperature/
│       ├── index.js                 # Temperature conversion
│       └── cli.js                   # Temperature CLI wrapper
├── tests/
│   ├── blog/
│   │   └── contract/
│   │       └── posts-api.test.js    # API contract tests
│   ├── sanity.test.js               # Basic sanity check
│   ├── hello.test.js                # Tests for formatGreeting
│   ├── stopwatch.test.js            # Tests for stopwatch (TDD)
│   └── temperature.test.js          # Tests for temperature
├── specs/
│   └── 002-blog-api/                # Blog API specifications
│       ├── spec.md                  # User stories & requirements
│       ├── plan.md                  # Implementation plan
│       ├── data-model.md            # Data models
│       ├── quickstart.md            # Quick testing guide
│       ├── tasks.md                 # Task breakdown
│       └── contracts/
│           └── openapi.yaml         # OpenAPI 3.1 spec
├── docs/
│   ├── blog-posts-api.postman_collection.json  # Postman tests
│   ├── review-packet-chapter1.md    # Hello CLI review
│   ├── review-packet-chapter3.md    # Stopwatch review (TDD)
│   └── review-packet-chapter4.md    # Temperature review
├── package.json
└── README.md
```
