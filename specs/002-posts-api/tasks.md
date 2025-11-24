# Tasks Checklist: Posts API

## Phase 0: Project Foundation

- [ ] **Initialize Project Structure**
  - Create `src/posts-api/` directory
  - Create `tests/posts-api/` directory
  - Create `src/posts-api/adapters/` directory for storage implementations
  - **Verification**: Confirm all directories exist with `ls -R src/posts-api tests/posts-api`

- [ ] **Configure Package Dependencies**
  - Add Fastify to `package.json` (`npm install fastify`)
  - Add Vitest as dev dependency (`npm install -D vitest`)
  - Add `@fastify/cors` for CORS support
  - Add `@fastify/rate-limit` for rate limiting
  - **Verification**: Run `npm list fastify vitest @fastify/cors @fastify/rate-limit` and confirm versions

- [ ] **Setup Test Infrastructure**
  - Configure Vitest in `package.json` with test script
  - Create `tests/posts-api/setup.js` for test utilities
  - Add helper functions for creating test Fastify instances
  - **Verification**: Run `npm test` and confirm Vitest executes (even with 0 tests)

## Phase 1: Server Bootstrap & Health Check

- [ ] **Write Health Check Test (TDD)**
  - Create `tests/posts-api/health.test.js`
  - Write test: `GET /health` returns `{ status: 'ok' }`
  - Write test: Response has status code 200
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement Server Bootstrap**
  - Create `src/posts-api/server.js` with Fastify instance
  - Export factory function `createServer(options)`
  - Configure JSON body parser
  - Add basic error handling
  - **Verification**: Server file exists and exports function

- [ ] **Implement Health Check Endpoint**
  - Add `GET /health` route in `server.js`
  - Return `{ status: 'ok' }` with 200 status
  - **Verification**: Run `npm test` and confirm health tests pass (GREEN)

- [ ] **Create Server Entry Point**
  - Create `src/posts-api/index.js` as main entry point
  - Import and start server with `.listen()`
  - Add graceful shutdown handling
  - Log server start with port number
  - **Verification**: Run `node src/posts-api/index.js` and curl `http://localhost:3000/health`

## Phase 2: In-Memory Storage Adapter

- [ ] **Write Storage Adapter Tests (TDD)**
  - Create `tests/posts-api/adapters/in-memory.test.js`
  - Write test: `createPost()` saves and returns post with ID and timestamp
  - Write test: `getPostById()` retrieves existing post
  - Write test: `getPostById()` returns null for non-existent ID
  - Write test: `getAllPosts()` returns all posts ordered by createdAt DESC
  - Write test: `deletePost()` removes post and returns true
  - Write test: `deletePost()` returns false for non-existent ID
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement In-Memory Adapter Interface**
  - Create `src/posts-api/adapters/in-memory.js`
  - Implement `createInMemoryAdapter()` factory function
  - Use Map or plain object for storage
  - **Verification**: Adapter file exists and exports factory

- [ ] **Implement Storage Methods**
  - Implement `createPost(content)` - generates UUID, timestamp, stores post
  - Implement `getPostById(id)` - retrieves single post
  - Implement `getAllPosts()` - returns array sorted by createdAt DESC
  - Implement `deletePost(id)` - removes post, returns boolean
  - **Verification**: Run `npm test` and confirm adapter tests pass (GREEN)

## Phase 3: POST /posts Endpoint

- [ ] **Write POST Endpoint Tests (TDD)**
  - Create `tests/posts-api/posts.create.test.js`
  - Write test: POST with valid content returns 201 and post object
  - Write test: Response includes `id`, `content`, `createdAt`
  - Write test: POST with empty content returns 400
  - Write test: POST with content > 280 chars returns 400
  - Write test: POST without content field returns 400
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement POST /posts Route**
  - Add `POST /posts` route in `server.js`
  - Inject storage adapter as dependency
  - Parse request body and extract `content`
  - **Verification**: Route handler exists

- [ ] **Implement Request Validation**
  - Validate `content` field is present
  - Validate `content` is string between 1-280 characters
  - Return 400 with descriptive error for validation failures
  - **Verification**: Run `npm test` and confirm validation tests pass

- [ ] **Implement Post Creation Logic**
  - Call `adapter.createPost(content)`
  - Return 201 status with created post object
  - **Verification**: Run `npm test` and confirm all POST tests pass (GREEN)

- [ ] **Manual Verification**
  - Start server: `node src/posts-api/index.js`
  - POST valid request: `curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -d '{"content":"Hello World"}'`
  - POST invalid request: `curl -X POST http://localhost:3000/posts -H "Content-Type: application/json" -d '{"content":""}'`
  - **Verification**: Confirm 201 for valid, 400 for invalid

## Phase 4: GET /posts Endpoint

- [ ] **Write GET All Posts Tests (TDD)**
  - Create `tests/posts-api/posts.list.test.js`
  - Write test: GET /posts returns empty array when no posts
  - Write test: GET /posts returns array of posts ordered by createdAt DESC
  - Write test: Each post has `id`, `content`, `createdAt` fields
  - Write test: GET /posts returns 200 status
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement GET /posts Route**
  - Add `GET /posts` route in `server.js`
  - Call `adapter.getAllPosts()`
  - Return 200 with posts array
  - **Verification**: Run `npm test` and confirm GET /posts tests pass (GREEN)

- [ ] **Manual Verification**
  - Start server and create 2-3 posts via POST
  - GET all posts: `curl http://localhost:3000/posts`
  - **Verification**: Confirm posts returned in reverse chronological order

## Phase 5: GET /posts/:id Endpoint

- [ ] **Write GET Single Post Tests (TDD)**
  - Create `tests/posts-api/posts.get.test.js`
  - Write test: GET /posts/:id returns post object when exists
  - Write test: Response has `id`, `content`, `createdAt` fields
  - Write test: GET /posts/:id returns 404 when post doesn't exist
  - Write test: GET /posts/:id with invalid ID format returns 404
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement GET /posts/:id Route**
  - Add `GET /posts/:id` route in `server.js`
  - Extract `id` from route params
  - Call `adapter.getPostById(id)`
  - Return 200 with post if found, 404 if not found
  - **Verification**: Run `npm test` and confirm GET /:id tests pass (GREEN)

- [ ] **Manual Verification**
  - Start server and create a post (note the returned ID)
  - GET specific post: `curl http://localhost:3000/posts/{id}`
  - GET non-existent post: `curl http://localhost:3000/posts/invalid-id`
  - **Verification**: Confirm 200 for valid ID, 404 for invalid

## Phase 6: DELETE /posts/:id Endpoint

- [ ] **Write DELETE Endpoint Tests (TDD)**
  - Create `tests/posts-api/posts.delete.test.js`
  - Write test: DELETE existing post returns 204 (No Content)
  - Write test: DELETE removes post from storage (subsequent GET returns 404)
  - Write test: DELETE non-existent post returns 404
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement DELETE /posts/:id Route**
  - Add `DELETE /posts/:id` route in `server.js`
  - Extract `id` from route params
  - Call `adapter.deletePost(id)`
  - Return 204 if deleted, 404 if not found
  - **Verification**: Run `npm test` and confirm DELETE tests pass (GREEN)

- [ ] **Manual Verification**
  - Start server, create a post, and note the ID
  - DELETE post: `curl -X DELETE http://localhost:3000/posts/{id}`
  - Verify deletion: `curl http://localhost:3000/posts/{id}`
  - **Verification**: Confirm 204 on delete, 404 on subsequent GET

## Phase 7: Error Handling

- [ ] **Write Error Handling Tests (TDD)**
  - Create `tests/posts-api/errors.test.js`
  - Write test: Malformed JSON returns 400
  - Write test: 404 for undefined routes
  - Write test: 500 errors return generic message (no stack trace leak)
  - Write test: Error responses have consistent structure `{ error: string, message: string }`
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement Global Error Handler**
  - Add `setErrorHandler` in `server.js`
  - Handle validation errors (400)
  - Handle not found errors (404)
  - Handle generic errors (500) with sanitized messages
  - Log errors with details for debugging
  - **Verification**: Run `npm test` and confirm error tests pass (GREEN)

- [ ] **Implement 404 Handler**
  - Add `setNotFoundHandler` for undefined routes
  - Return consistent error structure
  - **Verification**: `curl http://localhost:3000/invalid-route` returns 404

## Phase 8: Rate Limiting

- [ ] **Write Rate Limiting Tests (TDD)**
  - Create `tests/posts-api/rate-limit.test.js`
  - Write test: Allow 100 requests per 15 minutes per IP
  - Write test: 101st request returns 429 (Too Many Requests)
  - Write test: Response includes `Retry-After` header
  - Write test: Different IPs have separate rate limits
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement Rate Limiting**
  - Register `@fastify/rate-limit` plugin in `server.js`
  - Configure: 100 requests per 15-minute window
  - Apply globally or to specific routes
  - **Verification**: Run `npm test` and confirm rate limit tests pass (GREEN)

- [ ] **Manual Verification**
  - Write script to make 101 POST requests rapidly
  - **Verification**: Confirm first 100 succeed, 101st returns 429

## Phase 9: CORS Configuration

- [ ] **Write CORS Tests (TDD)**
  - Create `tests/posts-api/cors.test.js`
  - Write test: OPTIONS request returns proper CORS headers
  - Write test: GET request includes `Access-Control-Allow-Origin` header
  - Write test: POST request allows cross-origin requests
  - **Verification**: Run `npm test` and confirm tests fail (RED)

- [ ] **Implement CORS**
  - Register `@fastify/cors` plugin in `server.js`
  - Configure allowed origins (start with `*` for development)
  - **Verification**: Run `npm test` and confirm CORS tests pass (GREEN)

- [ ] **Manual Verification**
  - Start server
  - Make CORS preflight: `curl -X OPTIONS http://localhost:3000/posts -H "Origin: http://example.com"`
  - **Verification**: Confirm CORS headers present

## Phase 10: Documentation & Integration

- [ ] **Create API Documentation**
  - Create `specs/002-posts-api/API.md`
  - Document all endpoints with request/response examples
  - Document error codes and messages
  - Document rate limiting rules
  - **Verification**: Review documentation for completeness

- [ ] **Create Development Guide**
  - Add "Running Locally" section to README
  - Document environment variables (if any)
  - Document how to run tests: `npm test`
  - Document how to start server: `node src/posts-api/index.js`
  - **Verification**: Follow guide on fresh clone

- [ ] **Final Integration Test**
  - Run full test suite: `npm test`
  - Start server and execute complete CRUD workflow manually
  - Test error cases manually
  - Test rate limiting manually
  - **Verification**: 100% test pass rate, all manual tests succeed

- [ ] **Code Review Preparation**
  - Run linter (if configured)
  - Check for console.logs (remove or replace with proper logging)
  - Verify consistent code style
  - Ensure all tests have descriptive names
  - **Verification**: Code is clean and ready for review

## Phase 11: Optional Enhancements

- [ ] **Add Request Logging**
  - Install `@fastify/sensible` or custom logger
  - Log incoming requests with timestamp, method, path
  - Log response status and duration
  - **Verification**: Start server and confirm logs appear for each request

- [ ] **Add Timestamps to All Operations**
  - Ensure `createdAt` is ISO 8601 format
  - Consider adding `updatedAt` field (requires adapter changes)
  - **Verification**: Check timestamp format in responses

- [ ] **Add Input Sanitization**
  - Trim whitespace from content
  - Consider HTML escaping for XSS prevention
  - **Verification**: POST with extra whitespace, confirm trimmed

- [ ] **Add Pagination to GET /posts**
  - Add `?limit` and `?offset` query parameters
  - Return metadata: `{ posts: [], total: number, limit: number, offset: number }`
  - **Verification**: Test with various limit/offset combinations

---

## Summary

**Total Tasks**: 43 core tasks + 4 optional enhancements

**Estimated Time**: 12-16 hours for core features

**Key Principles**:
- ✅ Write tests first (Red-Green-Refactor)
- ✅ Verify each task before moving to next
- ✅ Keep commits atomic and focused
- ✅ Run full test suite frequently

**Testing Coverage Target**: 100% for core business logic
