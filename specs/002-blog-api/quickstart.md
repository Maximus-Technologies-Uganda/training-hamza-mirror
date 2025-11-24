# Quickstart Guide: Blog Posts API

**Feature**: 002-blog-api  
**Last Updated**: November 24, 2025

## Overview

This quickstart guide helps developers set up, run, and interact with the Blog Posts API. The API provides CRUD operations for blog posts with validation, rate limiting, and health monitoring.

## Prerequisites

- **Node.js**: Version 20.x LTS ([Download](https://nodejs.org/))
- **npm**: Included with Node.js
- **curl or Postman**: For testing API endpoints

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/Maximus-Technologies-Uganda/training-hamza.git
   cd training-hamza
   git checkout 002-blog-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   node --version  # Should show v20.x.x
   npm --version   # Should show 10.x.x or higher
   ```

## Running the API

### Development Mode

```bash
# Start the server (default port: 3000)
npm run dev

# Or run directly
node src/blog/server.js
```

Expected output:
```
Server listening on http://localhost:3000
```

### Production Mode

```bash
NODE_ENV=production node src/blog/server.js
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check

**Request**:
```bash
curl http://localhost:3000/health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T12:00:00.000Z"
}
```

---

### Create a Post

**Request**:
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Node.js",
    "body": "Node.js is a JavaScript runtime built on Chrome'\''s V8 engine."
  }'
```

**Response** (201 Created):
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

**Validation Errors** (400 Bad Request):
```bash
# Missing title
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"body": "Some content"}'

# Response:
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "title is required"
}
```

---

### List All Posts

**Request**:
```bash
curl http://localhost:3000/posts
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Getting Started with Node.js",
    "slug": "getting-started-with-nodejs",
    "body": "Node.js is a JavaScript runtime...",
    "createdAt": "2025-11-24T12:00:00.000Z",
    "updatedAt": "2025-11-24T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Advanced JavaScript Patterns",
    "slug": "advanced-javascript-patterns",
    "body": "In this guide, we explore...",
    "createdAt": "2025-11-24T12:05:00.000Z",
    "updatedAt": "2025-11-24T12:05:00.000Z"
  }
]
```

---

### Get a Single Post

**Request**:
```bash
curl http://localhost:3000/posts/1
```

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Getting Started with Node.js",
  "slug": "getting-started-with-nodejs",
  "body": "Node.js is a JavaScript runtime...",
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:00:00.000Z"
}
```

**Not Found** (404):
```bash
curl http://localhost:3000/posts/999

# Response:
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Post with id 999 not found"
}
```

---

### Update a Post

**Update Title Only**:
```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete Guide to Node.js"}'
```

**Update Body Only**:
```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"body": "Updated content goes here..."}'
```

**Update Both Fields**:
```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Guide to Node.js",
    "body": "This comprehensive guide covers everything you need to know..."
  }'
```

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Complete Guide to Node.js",
  "slug": "complete-guide-to-nodejs",
  "body": "This comprehensive guide covers everything...",
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:30:00.000Z"
}
```

**Note**: Updating the title regenerates the slug. The `createdAt` timestamp remains unchanged, but `updatedAt` is updated.

---

### Delete a Post

**Request**:
```bash
curl -X DELETE http://localhost:3000/posts/1
```

**Response** (204 No Content):
```
(No response body; status code indicates success)
```

**Verify Deletion**:
```bash
curl http://localhost:3000/posts/1

# Response (404 Not Found):
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Post with id 1 not found"
}
```

---

## Rate Limiting

The API enforces IP-based rate limiting to prevent abuse.

**Default Limits** (configurable):
- **100 requests per minute** per IP address

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1732454400
```

**Rate Limit Exceeded** (429 Too Many Requests):
```bash
# After exceeding limit
curl http://localhost:3000/posts

# Response:
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

```bash
npm test -- --coverage
```

**Coverage Targets**:
- Service layer: ≥75%
- Route layer: ≥60%

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `STORAGE_TYPE` | Storage adapter (`memory` or `sqlite`) | `memory` |
| `SQLITE_DB_PATH` | SQLite database file path | `./data/blog.db` |
| `RATE_LIMIT_MAX` | Max requests per time window | `100` |
| `RATE_LIMIT_WINDOW` | Time window in milliseconds | `60000` (1 minute) |

**Example**:
```bash
PORT=8080 STORAGE_TYPE=sqlite node src/blog/server.js
```

---

## Storage Adapters

### In-Memory Storage (Default)

- **Pros**: Fast (<10ms operations), no dependencies
- **Cons**: Data lost on restart, limited by RAM

```bash
STORAGE_TYPE=memory node src/blog/server.js
```

### SQLite Storage (Optional)

- **Pros**: Persistent storage, ACID compliance
- **Cons**: Slightly slower (<50ms operations), requires disk space

```bash
STORAGE_TYPE=sqlite SQLITE_DB_PATH=./data/blog.db node src/blog/server.js
```

**First Run**: Database file is created automatically if it doesn't exist.

---

## OpenAPI Documentation

View the complete API contract:

```bash
# View OpenAPI spec
cat specs/002-blog-api/contracts/openapi.yaml

# Or import into Swagger Editor
# https://editor.swagger.io/
```

---

## Common Workflows

### Workflow 1: Create and List Posts

```bash
# Create three posts
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Post 1", "body": "Content 1"}'

curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Post 2", "body": "Content 2"}'

curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Post 3", "body": "Content 3"}'

# List all posts
curl http://localhost:3000/posts
```

### Workflow 2: Update and Verify Changes

```bash
# Create a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Draft Title", "body": "Draft content"}' \
  | jq '.id'  # Extract ID (e.g., 1)

# Update the post
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Final Title", "body": "Final content"}'

# Verify changes
curl http://localhost:3000/posts/1 | jq '.'
```

### Workflow 3: Delete and Verify Removal

```bash
# Delete a post
curl -X DELETE http://localhost:3000/posts/1

# Verify deletion (should return 404)
curl http://localhost:3000/posts/1
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Use a different port
PORT=8080 node src/blog/server.js

# Or find and kill the process using port 3000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

### Issue: Module Not Found

**Error**:
```
Error: Cannot find module 'fastify'
```

**Solution**:
```bash
# Reinstall dependencies
npm install
```

### Issue: Rate Limit Blocking Development

**Solution**:
```bash
# Increase rate limit for development
RATE_LIMIT_MAX=1000 node src/blog/server.js
```

---

## Next Steps

1. **Explore the codebase**: Review `src/blog/` for implementation details
2. **Run tests**: Verify all functionality with `npm test`
3. **Read the spec**: See `specs/002-blog-api/spec.md` for requirements
4. **Check the data model**: Review `specs/002-blog-api/data-model.md` for entity definitions
5. **Review OpenAPI contract**: Import `contracts/openapi.yaml` into Swagger Editor

---

## Resources

- **Repository**: https://github.com/Maximus-Technologies-Uganda/training-hamza
- **OpenAPI Spec**: `specs/002-blog-api/contracts/openapi.yaml`
- **Feature Spec**: `specs/002-blog-api/spec.md`
- **Data Model**: `specs/002-blog-api/data-model.md`
- **Research Notes**: `specs/002-blog-api/research.md`

---

**Questions?** Check the feature spec or open an issue in the repository.
