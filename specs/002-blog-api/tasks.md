# Tasks: Blog Posts API

**Input**: Design documents from `/specs/002-blog-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are EXCLUDED per template instructions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure: src/blog/, src/blog/models/, src/blog/services/, src/blog/storage/, src/blog/middleware/, src/blog/routes/
- [X] T002 Initialize Node.js 20.x project with package.json and configure ES modules (type: "module")
- [X] T003 [P] Install Fastify dependencies: fastify@4.x, @fastify/swagger@latest, @fastify/rate-limit@latest
- [X] T004 [P] Install utility dependencies: slugify@1.6.x
- [X] T005 [P] Install development dependencies: vitest@4.x (if not present)
- [X] T006 [P] Configure .gitignore for node_modules/, data/*.db (SQLite files)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define storage adapter interface in src/blog/storage/storage-adapter.js (createPost, getAllPosts, getPostById, updatePost, deletePost methods)
- [X] T008 [P] Implement centralized error handler middleware in src/blog/middleware/error-handler.js (custom error classes: ApiError, ValidationError, NotFoundError, RateLimitError)
- [X] T009 [P] Implement slug generator service in src/blog/services/slug-generator.js using slugify library (lower: true, strict: true)
- [X] T010 [P] Define Post entity model in src/blog/models/post.js with validation rules (title 1-200 chars, body 1-50000 chars, non-whitespace patterns)
- [X] T011 Implement in-memory storage adapter in src/blog/storage/memory-storage.js implementing StorageAdapter interface
- [X] T012 Create Fastify server initialization in src/blog/server.js (register error handler, configure JSON parsing, setup logging)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 4 - API Health Monitoring (Priority: P1) 🎯 MVP Component

**Goal**: System administrators and monitoring tools can check if the API is operational and ready to accept requests

**Independent Test**: Make GET requests to /health and verify successful responses with 200 status and health information

### Implementation for User Story 4

- [X] T013 [US4] Implement health check route in src/blog/routes/health.js (GET /health endpoint returning {status: "ok", timestamp: ISO8601})
- [X] T014 [US4] Register health route in src/blog/server.js with Fastify (ensure responds within 1 second per FR-033)

**Checkpoint**: Health endpoint is functional and can be tested independently

---

## Phase 4: User Story 1 - Create and Retrieve Blog Posts (Priority: P1) 🎯 MVP Core

**Goal**: Users can create blog posts with title and body content, and retrieve them individually or as a list

**Independent Test**: Make POST requests to create posts and GET requests to retrieve them by ID or list all posts. Validate that posts have unique IDs, generated slugs, and timestamps. Test validation by sending requests without title or body.

### Implementation for User Story 1

- [X] T015 [US1] Implement PostService in src/blog/services/post-service.js (createPost method with slug generation, timestamp creation, validation)
- [X] T016 [US1] Add getAllPosts method to PostService in src/blog/services/post-service.js (retrieve all posts from storage)
- [X] T017 [US1] Add getPostById method to PostService in src/blog/services/post-service.js (retrieve single post, throw NotFoundError if not exists)
- [X] T018 [US1] Implement POST /posts route in src/blog/routes/posts.js with Fastify JSON Schema validation (require title and body, maxLength constraints per FR-006 to FR-011)
- [X] T019 [US1] Implement GET /posts route in src/blog/routes/posts.js (list all posts)
- [X] T020 [US1] Implement GET /posts/:id route in src/blog/routes/posts.js with path parameter validation (id must be positive integer)
- [X] T021 [US1] Register posts routes in src/blog/server.js with Fastify
- [X] T022 [US1] Add request validation for title and body fields (non-whitespace pattern, FR-010, FR-011)

**Checkpoint**: At this point, User Story 1 should be fully functional - can create posts, list all posts, and retrieve individual posts with proper validation

---

## Phase 5: User Story 2 - Update Existing Blog Posts (Priority: P2)

**Goal**: Users can modify existing blog posts to correct errors, add information, or update content while preserving the post's identity and creation history

**Independent Test**: Create a post, update its title or body via PATCH /posts/{id}, and verify the changes are reflected while ID and creation timestamp remain unchanged. Verify slug regeneration when title changes. Test validation by sending empty fields.

### Implementation for User Story 2

- [X] T023 [US2] Add updatePost method to PostService in src/blog/services/post-service.js (partial update with title/body, regenerate slug if title changes, preserve createdAt, update updatedAt per FR-013, FR-017, FR-018)
- [X] T024 [US2] Implement PATCH /posts/:id route in src/blog/routes/posts.js with Fastify JSON Schema validation (at least one field required: title or body, same constraints as create)
- [X] T025 [US2] Add validation to ensure at least one field is provided in update request (return 400 if empty body)
- [X] T026 [US2] Handle NotFoundError for non-existent posts in update route (return 404 per FR-022)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - can create, read, and update posts

---

## Phase 6: User Story 3 - Remove Unwanted Blog Posts (Priority: P3)

**Goal**: Users can permanently delete blog posts that are no longer needed, removing them from all listings and making them inaccessible

**Independent Test**: Create a post, delete it via DELETE /posts/{id}, and verify it no longer appears in listings or can be retrieved individually. Verify 404 errors when attempting to delete non-existent posts.

### Implementation for User Story 3

- [X] T027 [US3] Add deletePost method to PostService in src/blog/services/post-service.js (remove post from storage, throw NotFoundError if not exists)
- [X] T028 [US3] Implement DELETE /posts/:id route in src/blog/routes/posts.js (return 204 No Content on success per OpenAPI spec)
- [X] T029 [US3] Handle NotFoundError for non-existent posts in delete route (return 404 per FR-022)

**Checkpoint**: All core CRUD user stories are now independently functional (US1, US2, US3, US4)

---

## Phase 7: User Story 5 - Protection from Abuse (Priority: P2)

**Goal**: The API protects itself from excessive requests using IP-based rate limiting, ensuring fair resource allocation and preventing resource exhaustion

**Independent Test**: Make rapid successive requests from the same IP address and verify rate limits are enforced at the configured threshold (100 requests per minute default). Verify 429 status code and rate limit headers.

### Implementation for User Story 5

- [X] T030 [US5] Configure @fastify/rate-limit plugin in src/blog/server.js (max: 100 requests, timeWindow: 60000ms per FR-027 to FR-030)
- [X] T031 [US5] Configure rate limit to track by IP address (default @fastify/rate-limit behavior)
- [X] T032 [US5] Customize rate limit error response to include RateLimitError with helpful message and rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- [X] T033 [US5] Register rate limit middleware before route registration in src/blog/server.js

**Checkpoint**: Rate limiting is enforced across all endpoints - API is protected from abuse

---

## Phase 8: User Story 6 - Consistent Error Communication (Priority: P2)

**Goal**: When errors occur, the API provides clear, structured error messages that help clients understand what went wrong and how to fix it, without exposing internal system details

**Independent Test**: Trigger various error conditions (validation failures, not found, rate limits) and verify all return consistent JSON error structures with statusCode, error type, and helpful messages. Verify no stack traces are exposed.

### Implementation for User Story 6

- [X] T034 [US6] Update error handler middleware in src/blog/middleware/error-handler.js to ensure consistent JSON error structure for all error types ({statusCode, error, message} per FR-020)
- [X] T035 [US6] Map ValidationError to 400 status code with field-specific messages in error handler (FR-021)
- [X] T036 [US6] Map NotFoundError to 404 status code with resource identifier in message (FR-022)
- [X] T037 [US6] Map RateLimitError to 429 status code with rate limit information (FR-023)
- [X] T038 [US6] Map unhandled errors to 500 status code with generic message, strip stack traces in production mode (FR-024, FR-025)
- [X] T039 [US6] Ensure all route error responses include helpful guidance messages per FR-026

**Checkpoint**: All error responses are consistent, informative, and secure - excellent developer experience

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and optional features

- [X] T040 [P] Add environment variable configuration in src/blog/server.js (PORT, NODE_ENV, STORAGE_TYPE, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
- [X] T041 [P] Create main library export in src/blog/index.js (export service factory, storage adapters, models)
- [X] T042 [P] Add npm scripts to package.json (dev, start, test)
- [X] T043 [P] OPTIONAL: Implement SQLite storage adapter in src/blog/storage/sqlite-storage.js using better-sqlite3 (if time permits per Day 4 timeline C-012)
- [X] T044 [P] OPTIONAL: Add SQLite schema creation with indexes in src/blog/storage/sqlite-storage.js (posts table with id, title, slug, body, createdAt, updatedAt)
- [X] T050 [P] DAY 4: Add @fastify/cors plugin for CORS support (development: allow all, production: whitelist)
- [X] T051 [P] DAY 4: Add @fastify/helmet plugin for security headers (CSP, HSTS, X-Frame-Options, etc.)
- [X] T052 [P] DAY 4: Add @fastify/request-context for request ID tracking in logs
- [X] T053 DAY 4: Configure Fastify request ID generation (UUID) and logging with request ID
- [X] T054 DAY 4: Wire up storage adapter selection via STORAGE_TYPE env var (memory|sqlite)
- [X] T055 DAY 4: Create comprehensive SQLite adapter tests (26 test cases covering all CRUD operations, constraints, persistence)
- [X] T047 Run through quickstart.md scenarios to validate all endpoints work as documented
- [X] T048 [P] Add JSDoc comments to all public methods in services and storage adapters
- [X] T049 Code review: Check that all functional requirements FR-001 to FR-042 are implemented

---

## Phase 10: OpenAPI Contract & Documentation (Day 3 Deliverables)

**Purpose**: Generate OpenAPI specification, implement contract tests, create Postman collection, and document API usage

**⚠️ CRITICAL**: Required for Day 3 completion - OpenAPI contract generation, contract tests, Postman collection, and README documentation

- [X] T045 Register @fastify/swagger plugin in src/blog/server.js to auto-generate OpenAPI 3.1 spec from Fastify route schemas
- [X] T046 Configure @fastify/swagger with proper API metadata (title, description, version, servers) matching contracts/openapi.yaml structure
- [X] T047 Add GET /docs/json endpoint to expose generated OpenAPI specification in JSON format
- [X] T048 Add GET /docs endpoint to serve Swagger UI for interactive API documentation
- [X] T049 Validate generated OpenAPI spec against contracts/openapi.yaml (ensure all paths, schemas, responses match)
- [X] T050 [P] Install contract testing dependencies: ajv@^8.12.0 (JSON Schema validation), ajv-formats@^2.1.1 (format validation)
- [X] T051 Create contract test suite in tests/blog/contract/posts-api.test.js using Vitest and Fastify inject()
- [X] T052 Add contract tests for POST /posts endpoint (validate request/response against OpenAPI schema)
- [X] T053 [P] Add contract tests for GET /posts endpoint (validate response array against OpenAPI schema)
- [X] T054 [P] Add contract tests for GET /posts/{id} endpoint (validate response and 404 error against OpenAPI schema)
- [X] T055 [P] Add contract tests for PATCH /posts/{id} endpoint (validate request/response and errors against OpenAPI schema)
- [X] T056 [P] Add contract tests for DELETE /posts/{id} endpoint (validate 204 response and 404 error against OpenAPI schema)
- [X] T057 [P] Add contract tests for GET /health endpoint (validate response structure against OpenAPI schema)
- [X] T058 [P] Add contract tests for rate limiting responses (validate 429 error structure and headers against OpenAPI schema)
- [X] T059 [P] Add contract tests for validation errors (validate 400 error structure against OpenAPI schema)
- [X] T060 Create Postman collection in docs/blog-posts-api.postman_collection.json with all CRUD endpoints
- [X] T061 Add Postman collection examples for health check, create post, list posts, get post, update post, delete post
- [X] T062 Add Postman collection examples for error scenarios (validation errors, 404, rate limiting)
- [X] T063 Add environment variables to Postman collection (baseUrl, port) for easy configuration
- [X] T064 Update README.md with "Blog Posts API" section including quick start guide, API endpoints summary, and link to OpenAPI spec
- [X] T065 Add "Running Tests" section to README.md including contract tests command and coverage expectations
- [X] T066 Add "API Documentation" section to README.md with links to OpenAPI spec, Swagger UI, and Postman collection
- [X] T067 Add "Day 3 Deliverables" section to README.md documenting completion of CRUD, contract tests, and documentation

**Checkpoint**: Day 3 complete - All CRUD endpoints working, OpenAPI contract generated and validated, contract tests passing, Postman collection created, README documentation updated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US4 (Health) - Can start immediately after Phase 2
  - US1 (CRUD Core) - Can start immediately after Phase 2
  - US2 (Update) - Depends on US1 PostService existing
  - US3 (Delete) - Can run parallel with US2 (independent of update logic)
  - US5 (Rate Limiting) - Can run parallel with all CRUD stories (middleware layer)
  - US6 (Error Handling) - Builds on Phase 2 error handler, can run parallel with CRUD
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 4 (P1 - Health)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 1 (P1 - CRUD Core)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - Update)**: Depends on US1 PostService being implemented (adds updatePost method to existing service)
- **User Story 3 (P3 - Delete)**: Can start after US1 PostService exists (adds deletePost method), can run parallel with US2
- **User Story 5 (P2 - Rate Limiting)**: Independent middleware layer - can run parallel with CRUD stories after Phase 2
- **User Story 6 (P2 - Error Handling)**: Enhances Phase 2 error handler - can run parallel with CRUD stories

### Within Each User Story

- US4: Sequential (route → registration)
- US1: PostService methods can be written together → Routes implemented after service complete → Registration last
- US2: Service method first → Route implementation → Validation and error handling
- US3: Service method first → Route implementation → Error handling
- US5: Sequential (configure → customize → register)
- US6: All error handler updates can be done together (all in same file)

### Parallel Opportunities Per Phase

**Phase 1 (Setup)**: T003, T004, T005, T006 can all run in parallel

**Phase 2 (Foundational)**: T008 (error handler), T009 (slug generator), T010 (model) can all run in parallel

**After Phase 2 completes**: US4, US1, US5, US6 can all START in parallel (though US1 must complete before US2)

**Phase 9 (Polish)**: T040, T041, T042, T043, T044, T048 can all run in parallel

**Phase 10 (OpenAPI & Docs)**: After T045-T049 complete, T050-T059 (contract tests), T060-T063 (Postman), T064-T067 (README) can all run in parallel

---

## Parallel Example: Multiple User Stories

```bash
# After Foundational Phase (Phase 2) completes:

# Developer A: User Story 4 (Health Check)
Task: "Implement health check route in src/blog/routes/health.js"
Task: "Register health route in src/blog/server.js"

# Developer B: User Story 1 (CRUD Core) - while A works on US4
Task: "Implement PostService in src/blog/services/post-service.js"
# ... continue with US1 tasks

# Developer C: User Story 5 (Rate Limiting) - while A and B work
Task: "Configure @fastify/rate-limit plugin in src/blog/server.js"
# ... continue with US5 tasks

# Developer D: User Story 6 (Error Handling) - while A, B, C work
Task: "Update error handler middleware in src/blog/middleware/error-handler.js"
# ... continue with US6 tasks
```

---

## Implementation Strategy

### MVP First (Minimal Viable Product)

**Recommendation**: Implement in this order for fastest time-to-value

1. **Phase 1**: Setup (T001-T006) - Required infrastructure
2. **Phase 2**: Foundational (T007-T012) - CRITICAL blocking work
3. **Phase 3**: User Story 4 - Health Check (T013-T014) - Quick win, enables monitoring
4. **Phase 4**: User Story 1 - CRUD Core (T015-T022) - Core value proposition
5. **STOP and VALIDATE**: Test US1 + US4 independently → **MVP READY**

**MVP Delivers**: Health monitoring + Create/Read blog posts (75% of core value)

### Incremental Delivery (Recommended)

1. **MVP** (Phases 1-4): Health + Create/Read posts → Deploy/Demo ✅
2. **Add US2** (Phase 5): Update posts → Deploy/Demo ✅
3. **Add US3** (Phase 6): Delete posts → Deploy/Demo ✅ (Full CRUD complete)
4. **Add US5** (Phase 7): Rate limiting → Deploy/Demo ✅ (Production hardening)
5. **Add US6** (Phase 8): Error handling polish → Deploy/Demo ✅ (Developer experience)
6. **Polish** (Phase 9): Optional features (SQLite), documentation, refinement
7. **Day 3 Deliverable** (Phase 10): OpenAPI contract generation, contract tests, Postman collection, README documentation → Production-ready with full docs ✅

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers (after Foundational Phase 2):

- **Developer 1**: US4 (Health) + US1 (CRUD Core) - Sequential, critical path
- **Developer 2**: US5 (Rate Limiting) - Parallel track
- **Developer 3**: US6 (Error Handling) - Parallel track
- **All converge**: US2 → US3 → Polish

Once US1 completes: Developer 1 continues to US2, US3 while others finish US5, US6.

---

## Success Criteria Checklist

Use this to verify feature completion:

### Core Functionality
- [ ] SC-001: Can create a post and retrieve it by ID in under 2 seconds
- [ ] SC-002: Can retrieve list of all posts in under 2 seconds
- [ ] SC-003: Can update a post and see changes immediately
- [ ] SC-004: Can delete a post and verify it's no longer accessible

### Data Integrity
- [ ] SC-005: System generates unique slugs for 100% of posts
- [ ] SC-006: System rejects 100% of posts missing title or body
- [ ] SC-007: System rejects 100% of posts exceeding max length
- [ ] SC-008: Creation timestamps preserved across all updates
- [ ] SC-009: Modification timestamps updated for 100% of updates

### Error Handling
- [ ] SC-010: All errors follow consistent JSON structure
- [ ] SC-011: Validation errors include clear field-specific messages
- [ ] SC-012: System returns 404 for 100% of non-existent post requests
- [ ] SC-013: No stack traces exposed to clients

### Rate Limiting
- [ ] SC-014: Rate limits correctly enforced by IP address
- [ ] SC-015: Rate-limited requests receive 429 with informative message
- [ ] SC-016: Different IPs have independent rate limit buckets

### Production Readiness
- [ ] SC-017: Health endpoint responds in under 1 second
- [ ] SC-018: API conforms to OpenAPI 3.1 specification
- [ ] SC-019: Service layer test coverage ≥75% (if tests implemented)
- [ ] SC-020: Route layer test coverage ≥60% (if tests implemented)

### Performance
- [ ] SC-021: Handles 100 concurrent requests without errors
- [ ] SC-022: In-memory operations complete in under 10ms
- [ ] SC-023: SQLite operations (if implemented) complete in under 50ms
- [ ] SC-024: Storage adapters are swappable without data loss

---

## Notes

- **[P]** tasks operate on different files with no dependencies - safe to parallelize
- **[Story]** label maps each task to its user story for traceability and independent delivery
- **Tests excluded**: Specification does not explicitly request tests, so test tasks are NOT included
- Each user story is independently completable and testable via API endpoints
- Stop at any checkpoint to validate story independence
- Commit after each task or logical group of parallel tasks
- In-memory storage is primary (FR-034); SQLite is optional (T043-T044 in Polish phase)
- OpenAPI spec validation (T045-T046) ensures contract compliance (FR-039)

---

## Total Task Count: 67 tasks

- **Setup**: 6 tasks
- **Foundational**: 6 tasks (BLOCKING)
- **User Story 4 (Health)**: 2 tasks
- **User Story 1 (CRUD Core)**: 8 tasks
- **User Story 2 (Update)**: 4 tasks
- **User Story 3 (Delete)**: 3 tasks
- **User Story 5 (Rate Limiting)**: 4 tasks
- **User Story 6 (Error Handling)**: 6 tasks
- **Polish**: 6 tasks (includes optional SQLite)
- **OpenAPI Contract & Documentation (Day 3)**: 23 tasks

**Parallel Opportunities**: 20+ tasks can run in parallel across different phases

**MVP Scope (Recommended)**: Phases 1-4 (US4 + US1) = 22 tasks → Delivers core value

**Day 3 Scope**: Phases 1-10 (All CRUD + Contract Tests + Docs) = 67 tasks → Production-ready API with full documentation

**Format Validation**: ✅ All tasks follow required checklist format with checkboxes, IDs, labels, and file paths
