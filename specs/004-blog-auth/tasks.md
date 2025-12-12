# Tasks: Blog Authentication & Authorization

**Input**: Design documents from `/specs/004-blog-auth/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create base files needed by all features

- [x] T001 Install API dependencies: `npm install @fastify/jwt bcrypt` in root package.json
- [x] T002 [P] Add `JWT_SECRET` to `.env.example` with documentation comment
- [x] T003 [P] Create `src/blog/models/user.js` with User schema (id, username, passwordHash, createdAt)
- [x] T004 [P] Create `src/blog/middleware/request-id.js` for X-Request-Id propagation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Foundation

- [x] T005 Extend `src/blog/storage/memory-storage.js` with users Map and CRUD methods (getUser, getUserByUsername, createUser)
- [x] T006 [P] Extend `src/blog/storage/sqlite-storage.js` with users table and CRUD methods
- [x] T007 Create `src/blog/services/user-service.js` with findByUsername, verifyPassword, seedTestUsers
- [x] T008 Create `src/blog/services/auth-service.js` with signToken, verifyToken methods using @fastify/jwt
- [x] T009 Create `src/blog/middleware/auth.js` with authenticate decorator (JWT validation)
- [x] T010 Register @fastify/jwt plugin in `src/blog/server.js` with JWT_SECRET from env
- [x] T011 Add fail-fast startup check: throw error if JWT_SECRET missing in production
- [x] T012 Register request-id middleware in `src/blog/server.js` (onRequest hook)
- [x] T013 Seed test users (alice/password123, bob/password456) on server startup in dev/test

### Post Model Extension

- [x] T014 Extend `src/blog/models/post.js` with ownerId field (required integer)
- [x] T015 Update postSchema to include ownerId in required array
- [x] T016 Update storage adapters to handle ownerId on create

### Error Handling

- [x] T017 Extend `src/blog/middleware/error-handler.js` with 401/403 error types
- [x] T018 Add requestId to all error response envelopes
- [x] T019 Create error codes: UNAUTHORIZED, INVALID_TOKEN, FORBIDDEN

**Checkpoint**: Foundation ready - JWT plugin registered, users seeded, request-id flowing

---

## Phase 3: User Story 1 & 2 - Login/Logout (Priority: P1) 🎯 MVP

**Goal**: Users can authenticate with username/password and receive JWT; can logout to clear session

**Independent Test**: POST /auth/login with valid credentials returns token; token validates on subsequent requests

### Tests for US1/US2

- [x] T020 [P] [US1] Contract test `tests/blog/contract/auth.contract.test.js`: POST /auth/login success (200 + token)
- [x] T021 [P] [US1] Contract test: POST /auth/login invalid credentials (401)
- [x] T022 [P] [US1] Contract test: POST /auth/login missing fields (400)
- [x] T023 [P] [US1] Unit test `tests/blog/unit/auth-service.test.js`: signToken, verifyToken
- [x] T024 [P] [US1] Unit test `tests/blog/unit/auth-middleware.test.js`: authenticate decorator

### API Implementation for US1/US2

- [x] T025 [US1] Create `src/blog/routes/auth.js` with POST /auth/login endpoint
- [x] T026 [US1] Login handler: validate input, lookup user, verify password, sign token
- [x] T027 [US1] Return response: `{ token: "...", user: { id, username } }`
- [x] T028 [US1] Add rate limiting to /auth/login (stricter than other endpoints)

### Frontend Implementation for US1/US2

- [x] T029 [P] [US1] Create `frontend/src/lib/auth.ts` with login, logout, getToken, isAuthenticated functions
- [x] T030 [P] [US1] Create `frontend/src/components/AuthProvider.tsx` React context
- [x] T031 [US1] Create `frontend/src/app/login/page.tsx` login page with form
- [x] T032 [P] [US1] Create `frontend/src/components/LoginForm.tsx` with username/password fields
- [x] T033 [P] [US2] Create `frontend/src/components/LogoutButton.tsx` 
- [x] T034 [US1] Update `frontend/src/app/layout.tsx` to wrap with AuthProvider
- [x] T035 [US1] Update navigation in layout to show Login/Logout based on auth state
- [x] T036 [US1] Store token in localStorage on successful login
- [x] T037 [US2] Clear localStorage token on logout, redirect to home

### Frontend Tests for US1/US2

- [x] T038 [P] [US1] Unit test `frontend/tests/unit/auth.test.ts`: login, logout, token storage
- [x] T039 [P] [US1] Integration test `frontend/tests/integration/auth-flow.test.tsx`: full login/logout cycle

**Checkpoint**: Login/logout works end-to-end; token persists in localStorage

---

## Phase 4: User Story 3 - Create Posts with Ownership (Priority: P1)

**Goal**: Authenticated users can create posts; posts are linked to creator via ownerId

**Independent Test**: Create post as alice → post.ownerId === alice.id; unauthenticated create → 401

### Tests for US3

- [x] T040 [P] [US3] Contract test `tests/blog/contract/posts.contract.test.js`: POST /posts with auth → 201 + ownerId
- [x] T041 [P] [US3] Contract test: POST /posts without auth → 401
- [x] T042 [P] [US3] Contract test: Verify created post includes ownerId matching token user

### API Implementation for US3

- [x] T043 [US3] Add `{ preHandler: [fastify.authenticate] }` to POST /posts in `src/blog/routes/posts.js`
- [x] T044 [US3] Extract user.id from request.user in create handler
- [x] T045 [US3] Pass ownerId to storage.create() in post-service
- [x] T046 [US3] Return created post with ownerId in response

### Frontend Implementation for US3

- [x] T047 [US3] Update `frontend/src/lib/api.ts` to include Authorization header on POST requests
- [x] T048 [US3] Update `frontend/src/app/posts/new/page.tsx` to require auth (redirect if not logged in)
- [x] T049 [US3] Hide "Create Post" navigation link when not authenticated

**Checkpoint**: Creating posts requires login; posts have owner

---

## Phase 5: User Story 4 - Edit Own Posts Only (Priority: P1)

**Goal**: Users can only edit posts they own; 403 if not owner; 401 if not authenticated

**Independent Test**: Alice edits alice's post → success; Bob edits alice's post → 403

### Tests for US4

- [x] T050 [P] [US4] Contract test: PATCH /posts/:id as owner → 200
- [x] T051 [P] [US4] Contract test: PATCH /posts/:id as non-owner → 403
- [x] T052 [P] [US4] Contract test: PATCH /posts/:id unauthenticated → 401
- [x] T053 [P] [US4] Integration test `tests/blog/integration/ownership.test.js`: cross-user edit rejection

### API Implementation for US4

- [x] T054 [US4] Add `{ preHandler: [fastify.authenticate] }` to PATCH /posts/:id
- [x] T055 [US4] Add ownership check in `src/blog/services/post-service.js` updatePost method
- [x] T056 [US4] Throw ForbiddenError if request.user.id !== post.ownerId

### Frontend Implementation for US4

- [x] T057 [US4] Create `frontend/src/components/PostActions.tsx` - show Edit only if user.id === post.ownerId
- [x] T058 [US4] Update `frontend/src/app/posts/[id]/page.tsx` to use PostActions
- [x] T059 [US4] Update `frontend/src/lib/api.ts` PATCH to include Authorization header
- [x] T060 [US4] Create `frontend/src/lib/errors.ts` with mapAuthError(status) → friendly message

**Checkpoint**: Edit restricted to owner; friendly 403 message in UI

---

## Phase 6: User Story 5 - Delete Own Posts Only (Priority: P2)

**Goal**: Users can only delete posts they own; 403 if not owner; 401 if not authenticated

**Independent Test**: Alice deletes alice's post → 204; Bob deletes alice's post → 403

### Tests for US5

- [x] T061 [P] [US5] Contract test: DELETE /posts/:id as owner → 204
- [x] T062 [P] [US5] Contract test: DELETE /posts/:id as non-owner → 403
- [x] T063 [P] [US5] Contract test: DELETE /posts/:id unauthenticated → 401

### API Implementation for US5

- [x] T064 [US5] Add `{ preHandler: [fastify.authenticate] }` to DELETE /posts/:id
- [x] T065 [US5] Add ownership check in `src/blog/services/post-service.js` deletePost method
- [x] T066 [US5] Throw ForbiddenError if request.user.id !== post.ownerId

### Frontend Implementation for US5

- [x] T067 [US5] Update PostActions to show Delete only if user.id === post.ownerId
- [x] T068 [US5] Update `frontend/src/lib/api.ts` DELETE to include Authorization header

**Checkpoint**: Delete restricted to owner

---

## Phase 7: User Story 6 - Public Read Access (Priority: P1)

**Goal**: GET /posts and GET /posts/:id work without authentication

**Independent Test**: Fetch posts without token → 200 with full post list including ownerId

### Tests for US6

- [x] T069 [P] [US6] Contract test: GET /posts without auth → 200 (verify existing tests still pass)
- [x] T070 [P] [US6] Contract test: GET /posts/:id without auth → 200
- [x] T071 [P] [US6] Contract test: Verify response includes ownerId field

### Implementation for US6

- [x] T072 [US6] Verify no auth preHandler on GET routes in `src/blog/routes/posts.js`
- [x] T073 [US6] Update OpenAPI spec to document ownerId in response schema

**Checkpoint**: Public reads work; posts show ownerId

---

## Phase 8: User Story 7 - Friendly Auth Error Messages (Priority: P2)

**Goal**: 401/403 errors display user-friendly messages in UI

**Independent Test**: Trigger 401 → see "Please log in" message; trigger 403 → see "You don't have permission"

### Tests for US7

- [x] T074 [P] [US7] Unit test `frontend/tests/unit/errors.test.ts`: mapAuthError returns correct messages
- [x] T075 [P] [US7] Integration test: 401 response shows login prompt

### Implementation for US7

- [x] T076 [US7] Implement mapAuthError in `frontend/src/lib/errors.ts`: 401 → "Please log in", 403 → "You don't have permission"
- [x] T077 [US7] Add error boundary/toast to show auth errors in UI
- [x] T078 [US7] On 401, show link to login page

**Checkpoint**: Auth failures show helpful messages

---

## Phase 9: User Story 8 - Request Tracing (Priority: P2)

**Goal**: All requests have X-Request-Id in response; logs include requestId

**Independent Test**: Make request → X-Request-Id header in response; check logs for matching ID

### Tests for US8

- [x] T079 [P] [US8] Contract test: Any request returns X-Request-Id header
- [x] T080 [P] [US8] Contract test: Client-provided X-Request-Id is echoed back
- [x] T081 [P] [US8] Contract test: Error responses include requestId in body

### Implementation for US8

- [x] T082 [US8] Implement onRequest hook in `src/blog/middleware/request-id.js` to set requestId
- [x] T083 [US8] Implement onSend hook to add X-Request-Id response header
- [x] T084 [US8] Update Pino logger config to include requestId in all log entries
- [x] T085 [US8] Update error-handler to include requestId in error response body

**Checkpoint**: Request tracing works end-to-end

---

## Phase 10: User Story 9 - Health Endpoint Enhancement (Priority: P2)

**Goal**: GET /health returns status, version, uptime, timestamp

**Independent Test**: GET /health → 200 with all four fields

### Tests for US9

- [x] T086 [P] [US9] Contract test: GET /health returns version field
- [x] T087 [P] [US9] Contract test: GET /health returns uptime (number)
- [x] T088 [P] [US9] Contract test: GET /health returns timestamp (ISO 8601)

### Implementation for US9

- [x] T089 [US9] Update `src/blog/routes/health.js` to include version from package.json
- [x] T090 [US9] Add uptime calculation (process.uptime() or custom start time)
- [x] T091 [US9] Add timestamp field with current ISO 8601 time

**Checkpoint**: Health endpoint provides operational data

---

## Phase 10.5: User Story 10 - Observability & Bench (Priority: P2)

**Goal**: Make behavior observable; capture latency snapshot in CI

**Independent Test**: CI job summary shows p50/p95 latency table

### Frontend Request-ID Propagation

- [x] T105 [US10] Update `frontend/src/lib/api.ts` to generate and send X-Request-ID header on all requests
- [x] T106 [US10] Use crypto.randomUUID() with fallback for older browsers

### Structured Logging Enhancement

- [x] T107 [US10] Update `src/blog/middleware/error-handler.js` to include userId in structured logs
- [x] T108 [US10] Log context includes: level, msg, route, status, requestId, userId (if authenticated)

### CI Bench Job (Non-Gating)

- [x] T109 [US10] Create `scripts/bench.mjs` benchmark script (100 reads + 20 writes @ concurrency 5)
- [x] T110 [US10] Script calculates p50/p95 latencies for reads and writes
- [x] T111 [US10] Script outputs markdown table to GITHUB_STEP_SUMMARY
- [x] T112 [US10] Add `bench` job to `.github/workflows/checks.yaml` (continue-on-error: true)
- [x] T113 [US10] Bench job runs after CI job passes

**Checkpoint**: CI shows latency metrics in job summary

---

## Phase 11: CI Latency Reporting - SUPERSEDED

**Note**: This phase has been superseded by Phase 10.5 (Observability & Bench) which implements
a more comprehensive approach using a dedicated bench script with p50/p95 latency reporting.

- [x] ~~T092~~ Superseded by T109-T113 in Phase 10.5
- [x] ~~T093~~ Superseded by T109-T113 in Phase 10.5
- [x] ~~T094~~ Superseded by T109-T113 in Phase 10.5
- [x] ~~T095~~ Superseded by T109-T113 in Phase 10.5

**Checkpoint**: CI shows latency metrics (implemented in Phase 10.5)

---

## Phase 12: Documentation & Polish

**Purpose**: Update documentation and finalize contracts

- [ ] T096 [P] Update `specs/004-blog-auth/contracts/openapi.yaml` - verify matches implementation
- [ ] T097 [P] Update root `README.md` with JWT_SECRET configuration instructions
- [ ] T098 [P] Update `frontend/README.md` with NEXT_PUBLIC_API_URL configuration
- [ ] T099 Document GitHub Pages deployment with env variable wiring
- [ ] T100 [P] Update Postman collection with auth examples (login, authenticated requests)

---

## Phase 13: Final Verification

**Purpose**: End-to-end validation before PR

- [ ] T101 Run full test suite: `npm test` (API) + `npm test` (frontend)
- [ ] T102 Manual smoke test: login as alice, create post, logout, login as bob, verify can't edit alice's post
- [ ] T103 Verify static export works: `npm run build` in frontend, serve out/ folder
- [ ] T104 Verify fail-fast: remove JWT_SECRET, confirm service fails with clear error

---

## Summary

| Phase | Tasks | Priority | Dependencies |
|-------|-------|----------|--------------|
| 1. Setup | T001-T004 | - | None |
| 2. Foundation | T005-T019 | - | Phase 1 |
| 3. Login/Logout | T020-T039 | P1 | Phase 2 |
| 4. Create with Owner | T040-T049 | P1 | Phase 3 |
| 5. Edit Own Posts | T050-T060 | P1 | Phase 4 |
| 6. Delete Own Posts | T061-T068 | P2 | Phase 5 |
| 7. Public Read | T069-T073 | P1 | Phase 2 |
| 8. Error Messages | T074-T078 | P2 | Phase 5 |
| 9. Request Tracing | T079-T085 | P2 | Phase 2 |
| 10. Health Endpoint | T086-T091 | P2 | Phase 2 |
| 10.5 Observability & Bench | T105-T113 | P2 | Phase 9 |
| 11. CI Latency | ~~T092-T095~~ | ~~P3~~ | Superseded by 10.5 |
| 12. Documentation | T096-T100 | - | All |
| 13. Verification | T101-T104 | - | All |

**Total Tasks**: 113 (9 new observability tasks)  
**Parallel-capable**: ~40 tasks marked [P]  
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
