# Tasks: Auth, Roles, and Production Hardening

**Input**: Design documents from `/specs/005-auth-roles-hardening/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are OPTIONAL - test tasks are NOT included (not explicitly requested in feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend API**: `src/blog/`
- **Frontend (Next.js)**: `frontend/src/`
- **Backend Tests**: `tests/blog/`
- **Frontend Tests**: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Firebase configuration, and dependency installation

- [X] T001 Install backend dependencies (firebase-admin, zod) in package.json
- [X] T002 Install frontend dependencies (firebase) in frontend/package.json
- [X] T003 [P] Create Firebase configuration file frontend/src/lib/firebase.ts with client SDK initialization
- [X] T004 [P] Create Firebase Admin SDK configuration in src/blog/services/firebase-admin.js
- [X] T005 [P] Add environment variables template to .env.example (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_AUTH_EMULATOR_HOST)
- [X] T006 [P] Add frontend environment variables template to frontend/.env.example (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID)
- [X] T007 Configure Firebase Emulator in firebase.json (auth emulator port 9099)
- [X] T008 Create seed users script in scripts/seed-users.mjs for alice (regular) and bob (admin) test users

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create Zod validation schemas for posts in src/blog/models/post.zod.js (createPostSchema, updatePostSchema)
- [X] T010 [P] Update User model for Firebase UID in src/blog/models/firebase-user.js (uid string, email, displayName, role enum)
- [X] T011 [P] Create Firebase Auth verification middleware in src/blog/middleware/firebase-auth.js (verifyIdToken, optional auth)
- [X] T012 Create authorization middleware in src/blog/middleware/authorization.js (requireOwnerOrAdmin, checkOwnership)
- [X] T013 [P] Create CSRF middleware in src/blog/middleware/csrf.js (double submit cookie pattern)
- [X] T014 [P] Create audit logging service in src/blog/services/audit-service.js (logCreate, logUpdate, logDelete)
- [X] T015 [P] Create audit logging middleware in src/blog/middleware/audit.js (wrap mutations with audit logging)
- [X] T016 Update error handler for auth errors in src/blog/middleware/error-handler.js (AUTH_REQUIRED, TOKEN_INVALID, TOKEN_EXPIRED, NOT_OWNER, CSRF_INVALID codes)
- [X] T017 [P] Update rate limiting configuration for per-user mutation limits in src/blog/server.js (10 req/min per user on mutations)
- [X] T018 [P] Create AuthProvider context in frontend/src/components/AuthProvider.tsx (Firebase Auth state, sign-in/sign-out methods)
- [X] T019 Integrate Zod validation with Fastify in src/blog/middleware/zod-validation.js (Zod validation utilities for preHandler)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Sign-In with Email/Password (Priority: P1) 🎯 MVP

**Goal**: Users can sign in with email/password via Firebase Auth and see authenticated state in UI

**Independent Test**: Visit login page, enter credentials, verify user sees authenticated state and their identity displayed

### Implementation for User Story 1

- [X] T020 [US1] Create LoginForm component in frontend/src/components/LoginForm.tsx (email/password inputs, error handling, WCAG 2.1 AA)
- [X] T021 [US1] Create login page in frontend/src/app/login/page.tsx (uses LoginForm component)
- [X] T022 [P] [US1] Create Next.js BFF session route handler in frontend/src/app/api/auth/session/route.ts (POST: create session cookie, GET: get session)
- [X] T023 [P] [US1] Create Next.js BFF logout route handler in frontend/src/app/api/auth/logout/route.ts (POST: clear session cookie)
- [X] T024 [US1] Update header component in frontend/src/components/Header.tsx (show Sign In/Sign Out button, display user name when authenticated)
- [X] T025 [US1] Wrap app with AuthProvider in frontend/src/app/layout.tsx (provide auth context to all pages)
- [X] T026 [US1] Create auth utility functions in frontend/src/lib/auth.ts (signInWithEmail, signOut, getCurrentUser, onAuthStateChanged wrapper)
- [X] T027 [US1] Add API auth session endpoint in src/blog/routes/auth.js (GET /auth/session returns user info from token)

**Checkpoint**: User Story 1 complete - users can sign in, see their identity, and sign out

---

## Phase 4: User Story 5 - User Creates a New Post (Priority: P1)

**Goal**: Signed-in users can create new posts with their user ID recorded as owner

**Independent Test**: Sign in, create a post with title/body, verify post appears in list with correct author attribution

### Implementation for User Story 5

- [X] T028 [US5] Update post creation endpoint in src/blog/routes/posts.js POST /posts (require auth, set ownerId from token, add CSRF check, add audit log)
- [X] T029 [US5] Update post service create method in src/blog/services/post-service.js (accept ownerId, validate with Zod)
- [X] T030 [US5] Update Post model to use string ownerId in src/blog/models/post.js (ownerId TEXT, add index)
- [X] T031 [US5] Update NewPostForm in frontend/src/components/NewPostForm.tsx (include auth token in request, send CSRF token header)
- [X] T032 [US5] Update new post page to require auth in frontend/src/app/posts/new/page.tsx (redirect to login if not authenticated)

**Checkpoint**: User Story 5 complete - authenticated users can create posts with ownership attribution

---

## Phase 5: User Story 2 - Post Owner Edits Their Own Post (Priority: P1)

**Goal**: Post owners can edit their own posts; non-owners see no edit button

**Independent Test**: Sign in, create a post, edit that post, verify changes persist

### Implementation for User Story 2

- [X] T033 [US2] Update post update endpoint in src/blog/routes/posts.js PATCH /posts/:id (require auth, check ownership or admin, add CSRF check, add audit log)
- [X] T034 [US2] Update post service update method in src/blog/services/post-service.js (validate with Zod, check ownership)
- [X] T035 [US2] Update EditPostForm in frontend/src/components/EditPostForm.tsx (include auth token, send CSRF token header)
- [X] T036 [US2] Update PostActions component in frontend/src/components/PostActions.tsx (conditionally show Edit button only for owner or admin)
- [X] T037 [US2] Update edit post page to check ownership in frontend/src/app/posts/[id]/edit/page.tsx (redirect if not owner/admin)

**Checkpoint**: User Story 2 complete - owners can edit their posts, non-owners cannot

---

## Phase 6: User Story 3 - Post Owner Deletes Their Own Post (Priority: P1)

**Goal**: Post owners can delete their own posts; non-owners receive 403

**Independent Test**: Sign in, create a post, delete it, verify it no longer appears in list

### Implementation for User Story 3

- [X] T038 [US3] Update post delete endpoint in src/blog/routes/posts.js DELETE /posts/:id (require auth, check ownership or admin, add CSRF check, add audit log)
- [X] T039 [US3] Update post service delete method in src/blog/services/post-service.js (check ownership before deletion)
- [X] T040 [US3] Update DeleteConfirm component in frontend/src/components/DeleteConfirm.tsx (include auth token, send CSRF token header)
- [X] T041 [US3] Ensure PostDetail shows Delete button only for owner/admin in frontend/src/components/PostDetail.tsx (use PostActions conditional rendering)

**Checkpoint**: User Story 3 complete - owners can delete their posts, non-owners cannot

---

## Phase 7: User Story 4 - Admin Moderates Any Post (Priority: P2)

**Goal**: Admin users can edit or delete any post regardless of ownership

**Independent Test**: Sign in as admin (bob), navigate to another user's post, successfully edit or delete it

### Implementation for User Story 4

- [X] T042 [US4] Add admin claim check to authorization middleware in src/blog/middleware/authorization.js (check token.admin === true)
- [X] T043 [US4] Update user service to sync Firebase custom claims in src/blog/services/user-service.js (getOrCreateUser from token, cache role)
- [X] T044 [US4] Update frontend auth context to expose isAdmin flag in frontend/src/components/AuthProvider.tsx (read admin claim from token)
- [X] T045 [US4] Update PostActions to show edit/delete for admins in frontend/src/components/PostActions.tsx (check isAdmin from auth context)

**Checkpoint**: User Story 4 complete - admins can moderate any post

---

## Phase 8: User Story 6 - Rate Limiting Protects Mutating Endpoints (Priority: P2)

**Goal**: Users exceeding 10 mutations/minute receive 429 Too Many Requests

**Independent Test**: Rapidly submit multiple create requests, verify 429 response after threshold

### Implementation for User Story 6

- [X] T046 [US6] Configure per-route rate limiting in src/blog/routes/posts.js (apply mutation rate limit to POST, PATCH, DELETE)
- [X] T047 [US6] Create rate limit key generator in src/blog/middleware/rate-limit.js (use user UID or IP for unauthenticated)
- [X] T048 [US6] Add rate limit headers to responses in src/blog/server.js (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After)
- [X] T049 [US6] Handle 429 errors gracefully in frontend in frontend/src/lib/api.ts (show user-friendly retry message)

**Checkpoint**: User Story 6 complete - mutation endpoints are rate limited

---

## Phase 9: User Story 7 - System Logs Audit Trail for Mutations (Priority: P2)

**Goal**: All mutations generate audit log entries with user ID, action, target, and trace ID

**Independent Test**: Perform a mutation, verify audit log contains expected entry with all fields

### Implementation for User Story 7

- [X] T050 [US7] Integrate audit service into post create route in src/blog/routes/posts.js (call auditService.logCreate after success)
- [X] T051 [US7] Integrate audit service into post update route in src/blog/routes/posts.js (call auditService.logUpdate with before/after)
- [X] T052 [US7] Integrate audit service into post delete route in src/blog/routes/posts.js (call auditService.logDelete before removal)
- [X] T053 [US7] Ensure request-id is passed to audit service in src/blog/middleware/audit.js (get from request.id)
- [X] T054 [US7] Add audit log filtering in Pino config in src/blog/server.js (audit: true flag for filtering)

**Checkpoint**: User Story 7 complete - all mutations are audited

---

## Phase 10: User Story 8 - Health Endpoints for Operations (Priority: P3)

**Goal**: Health endpoints report system status for monitoring

**Independent Test**: Call /health and /health/ready, verify appropriate responses

### Implementation for User Story 8

- [X] T055 [US8] Update GET /health endpoint in src/blog/routes/health.js (return status, version, uptime, timestamp)
- [X] T056 [US8] Add GET /health/ready endpoint in src/blog/routes/health.js (check database, check Firebase connectivity)
- [X] T057 [US8] Add Firebase connectivity check in src/blog/services/firebase-admin.js (verifyFirebaseConnection method)

**Checkpoint**: User Story 8 complete - health endpoints operational

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, accessibility, migrations, and final validation

- [X] T058 [P] Update OpenAPI spec with security schemes in specs/005-auth-roles-hardening/contracts/openapi.yaml (verify all protected endpoints annotated)
- [X] T059 [P] Create data migration script for existing posts in scripts/migrate-posts-owner.mjs (assign 'system' to ownerless posts)
- [X] T060 [P] Add accessibility tests for login flow in frontend/tests/a11y/login.test.ts (WCAG 2.1 AA verification)
- [X] T061 [P] Update frontend error boundaries for auth errors in frontend/src/components/ErrorBoundary.tsx (handle 401, 403 gracefully)
- [X] T062 [P] Create auth-specific error messages utility in frontend/src/lib/errors.ts (user-friendly messages for AUTH_REQUIRED, NOT_OWNER, etc.)
- [X] T063 Run quickstart.md validation (verify all setup steps work)
- [X] T064 Verify test coverage exceeds 80% for auth code paths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1 (Sign-In), US5 (Create Post) can proceed in parallel after Foundation
  - US2 (Edit), US3 (Delete) depend on US5 (need posts to exist)
  - US4 (Admin) depends on US1 (need authentication)
  - US6 (Rate Limiting), US7 (Audit) can proceed after Foundation
  - US8 (Health) has no dependencies, can proceed after Foundation
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Can Start After | Dependencies on Other Stories |
|-------|-----------------|-------------------------------|
| US1 (Sign-In) | Foundational | None - independent |
| US5 (Create Post) | Foundational | US1 (needs auth) |
| US2 (Edit Post) | US5 | US1, US5 (needs auth + posts) |
| US3 (Delete Post) | US5 | US1, US5 (needs auth + posts) |
| US4 (Admin) | US1 | US1 (needs auth infrastructure) |
| US6 (Rate Limiting) | Foundational | None - infrastructure |
| US7 (Audit) | Foundational | None - infrastructure |
| US8 (Health) | Foundational | None - independent |

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend (for API integration)
- Core implementation before integration

### Parallel Opportunities

**Phase 1 (Setup):**
- T003, T004, T005, T006 can all run in parallel

**Phase 2 (Foundational):**
- T010, T011, T013, T014, T015, T17, T018 can run in parallel

**After Foundational completes:**
- US1 (Sign-In) and US5 (Create), US6 (Rate Limiting), US7 (Audit), US8 (Health) can start in parallel
- US4 (Admin) can start after US1
- US2 (Edit) and US3 (Delete) can start after US5

**Phase 11 (Polish):**
- T058, T059, T060, T061, T062 can all run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# Developer A: User Story 1 (Sign-In)
T020 → T021 → T022, T023 (parallel) → T024 → T025 → T026 → T027

# Developer B: User Story 5 (Create Post)  
T028 → T029 → T030 → T031 → T032

# Developer C: Infrastructure Stories (US6, US7, US8)
US6: T046 → T047 → T048 → T049
US7: T050, T051, T052 (sequential) → T053 → T054
US8: T055 → T056 → T057
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Sign-In)
4. Complete Phase 4: User Story 5 (Create Post)
5. **STOP and VALIDATE**: Test sign-in and post creation independently
6. Deploy/demo if ready - users can sign in and create posts

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US5 → Test independently → Deploy (MVP: auth + create)
3. Add US2 + US3 → Test independently → Deploy (full owner CRUD)
4. Add US4 → Test independently → Deploy (admin moderation)
5. Add US6 + US7 → Test independently → Deploy (production hardening)
6. Add US8 → Test independently → Deploy (operational readiness)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Sign-In) → US4 (Admin)
   - Developer B: US5 (Create) → US2 (Edit) → US3 (Delete)
   - Developer C: US6 (Rate Limit) → US7 (Audit) → US8 (Health)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- BFF pattern maintained: browser → Next.js route handlers → API
- Firebase Auth Emulator used for local development
- Session cookies (httpOnly) for security, not localStorage
