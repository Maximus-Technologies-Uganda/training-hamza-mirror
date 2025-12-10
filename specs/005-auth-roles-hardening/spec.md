# Feature Specification: Auth, Roles, and Production Hardening

**Feature Branch**: `005-auth-roles-hardening`  
**Created**: December 9, 2025  
**Status**: Draft  
**Input**: User description: "Auth (Identity Platform), Roles, and Production Hardening: AuthN (Identity Platform): integrate Firebase Auth (Google Identity Platform) on the client for sign-in; verify ID tokens server-side (Next.js route handlers + API via Firebase Admin SDK). BFF pattern preserved: browser → Next.js route handlers → API (no direct API from the browser). AuthZ & Roles: introduce roles owner and admin; owner can mutate own posts; admin can mutate any post. Validation & Security: Zod (or Joi) request validation, input size limits, rate-limit on mutating endpoints, CSRF token on writes. Audit & Observability: audit log for create/update/delete (user, verb, target, trace id); structured logs with request-id; health endpoints. Docs/Evidence: Updated OpenAPI (securitySchemes, protected ops), a11y HTML for login flow, coverage & latency snapshots in Packet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Sign-In with Email/Password (Priority: P1)

A visitor arrives at the blog and wants to sign in to create or manage their posts. They click a "Sign In" button, enter their email and password credentials, and are authenticated. Once signed in, they see their authenticated state reflected in the UI and can access protected features.

**Why this priority**: Authentication is the foundational capability that enables all other protected features. Without sign-in, users cannot create, edit, or delete posts.

**Independent Test**: Can be fully tested by visiting the login page, entering credentials, and verifying the user sees authenticated state and their user identity. Delivers immediate value by enabling identity verification.

**Acceptance Scenarios**:

1. **Given** a user is on the blog homepage and not signed in, **When** they click "Sign In" and enter valid email/password credentials, **Then** they are authenticated and see their display name/email in the header
2. **Given** a user enters invalid credentials, **When** they submit the sign-in form, **Then** they see a clear error message indicating authentication failed
3. **Given** a signed-in user, **When** they click "Sign Out", **Then** they are signed out and returned to an unauthenticated state
4. **Given** a user with an existing session, **When** they revisit the blog, **Then** their authenticated state is preserved (session persistence)

---

### User Story 2 - Post Owner Edits Their Own Post (Priority: P1)

A signed-in user who authored a blog post wants to edit it. They navigate to their post, click "Edit", modify the content, and save changes. The system verifies they own the post before allowing the mutation.

**Why this priority**: Core authorization functionality—users must be able to manage their own content. This establishes the "owner" role behavior.

**Independent Test**: Can be tested by signing in as a user, creating a post, then editing that post and verifying changes persist.

**Acceptance Scenarios**:

1. **Given** a signed-in user viewing a post they authored, **When** they click "Edit", **Then** they see the edit form pre-filled with existing content
2. **Given** a signed-in user editing their own post, **When** they submit valid changes, **Then** the post is updated and they see a success confirmation
3. **Given** a signed-in user viewing a post authored by someone else, **When** they view the post actions, **Then** they do NOT see Edit/Delete buttons (unless they are an admin)
4. **Given** an unauthenticated request to update a post, **When** the API receives the request, **Then** it returns a 401 Unauthorized response

---

### User Story 3 - Post Owner Deletes Their Own Post (Priority: P1)

A signed-in user who authored a blog post wants to delete it. They navigate to their post, click "Delete", confirm the deletion, and the post is removed. The system verifies ownership before allowing the deletion.

**Why this priority**: Completes the owner authorization model. Users need full CRUD control over their own content.

**Independent Test**: Can be tested by signing in, creating a post, then deleting it and verifying it no longer appears in the post list.

**Acceptance Scenarios**:

1. **Given** a signed-in user viewing a post they authored, **When** they click "Delete" and confirm, **Then** the post is removed and they are redirected to the home page
2. **Given** a signed-in user attempting to delete a post they don't own (via direct API call), **When** the request is processed, **Then** it returns a 403 Forbidden response
3. **Given** an unauthenticated user, **When** they attempt to delete any post, **Then** the request is rejected with 401 Unauthorized

---

### User Story 4 - Admin Moderates Any Post (Priority: P2)

An administrator needs to edit or delete any post on the platform for moderation purposes (e.g., removing inappropriate content). They sign in with admin credentials and can perform mutations on any post regardless of authorship.

**Why this priority**: Important for platform governance but secondary to core owner functionality. Admins are a special user class with elevated permissions.

**Independent Test**: Can be tested by signing in as an admin user, navigating to a post authored by another user, and successfully editing or deleting it.

**Acceptance Scenarios**:

1. **Given** a signed-in admin viewing any post, **When** they click "Edit", **Then** they can modify and save the post regardless of who authored it
2. **Given** a signed-in admin, **When** they delete any post, **Then** the post is removed successfully
3. **Given** a non-admin user attempting to modify another user's post, **When** the API processes the request, **Then** it returns 403 Forbidden

---

### User Story 5 - User Creates a New Post (Priority: P1)

A signed-in user wants to create a new blog post. They navigate to the "New Post" page, fill in the title and body, and submit. The post is created with the user recorded as the author/owner.

**Why this priority**: Core functionality that requires authentication. Posts must be attributed to their creator for the ownership model to work.

**Independent Test**: Can be tested by signing in, creating a post with title/body, and verifying the post appears in the list with correct author attribution.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they submit a new post with valid title and body, **Then** the post is created with them recorded as the owner
2. **Given** an unauthenticated user, **When** they attempt to create a post, **Then** they are prompted to sign in first (or receive 401 if calling API directly)
3. **Given** a signed-in user submitting invalid data (empty title, body exceeds size limit), **When** the form is submitted, **Then** they see clear validation error messages

---

### User Story 6 - Rate Limiting Protects Mutating Endpoints (Priority: P2)

The system limits how frequently users can perform write operations (create, update, delete) to prevent abuse. A user making excessive requests within a short time period receives a rate limit error.

**Why this priority**: Security hardening that protects system integrity. Important for production but doesn't block core functionality.

**Independent Test**: Can be tested by rapidly submitting multiple create/update requests and verifying rate limit responses after threshold is exceeded.

**Acceptance Scenarios**:

1. **Given** a user making mutating requests at normal frequency, **When** requests are processed, **Then** all requests succeed
2. **Given** a user exceeding the rate limit threshold, **When** they submit another mutating request, **Then** they receive a 429 Too Many Requests response with retry information
3. **Given** a rate-limited user, **When** the rate limit window expires, **Then** they can resume normal operations

---

### User Story 7 - System Logs Audit Trail for Mutations (Priority: P2)

Administrators and system operators need visibility into who performed what actions on posts. Every create, update, and delete operation is recorded in an audit log with user identity, action type, target resource, and trace ID.

**Why this priority**: Critical for compliance, debugging, and security investigation, but doesn't affect user-facing functionality.

**Independent Test**: Can be tested by performing a mutation and verifying the audit log contains the expected entry with all required fields.

**Acceptance Scenarios**:

1. **Given** a user creates a post, **When** the operation completes, **Then** an audit log entry records: user ID, "create" verb, post ID, timestamp, and trace ID
2. **Given** a user updates a post, **When** the operation completes, **Then** an audit log entry records the update action with before/after context
3. **Given** a user deletes a post, **When** the operation completes, **Then** an audit log entry records the deletion with the deleted resource identifier
4. **Given** any API request, **When** it is processed, **Then** logs include a request-id that correlates all related log entries

---

### User Story 8 - Health Endpoints for Operations (Priority: P3)

Operations teams need to monitor system health. Dedicated health check endpoints report whether the system (and its dependencies) are functioning correctly.

**Why this priority**: Operational necessity for production deployment but doesn't affect user-facing features.

**Independent Test**: Can be tested by calling health endpoints and verifying appropriate responses.

**Acceptance Scenarios**:

1. **Given** the system is running normally, **When** a health check endpoint is called, **Then** it returns a 200 OK with healthy status
2. **Given** a critical dependency is unavailable, **When** the health check is called, **Then** it returns an appropriate status indicating degraded health
3. **Given** monitoring systems polling health endpoints, **When** they query repeatedly, **Then** responses are returned quickly without impacting system performance

---

### Edge Cases

- What happens when a user's session expires mid-edit? → User sees friendly error and is prompted to re-authenticate; unsaved changes should be preserved where possible
- What happens when an admin role is revoked while user is logged in? → Next request with that token should fail authorization; user needs to re-authenticate
- How does the system handle concurrent edits to the same post? → Last-write-wins with conflict warning if detectable (or accept standard behavior)
- What happens when rate limit storage is unavailable? → Fail open (allow request) or fail closed (deny request) based on security posture; default: fail open with alert
- What happens if the audit log storage fails? → Mutation should still succeed (audit is non-blocking), but alert operators to audit failure
- How are malformed or oversized requests handled? → Return 400 Bad Request with clear validation error messages before processing
- What happens to existing posts without an owner after migration? → Existing posts created before auth should be treated as system-owned or assigned to a default account

## Requirements *(mandatory)*

### Functional Requirements

**Authentication (AuthN)**

- **FR-001**: System MUST provide a sign-in interface supporting Email/Password authentication via Firebase Auth (Google Identity Platform)
- **FR-002**: System MUST verify ID tokens server-side using Firebase Admin SDK in both Next.js route handlers and backend API
- **FR-003**: System MUST preserve the BFF (Backend-For-Frontend) pattern: browser communicates only with Next.js route handlers, which proxy to the API; no direct browser-to-API calls
- **FR-004**: System MUST support user sign-out that clears authentication state on both client and server
- **FR-005**: System MUST persist user sessions appropriately (session cookies or token refresh) so users don't need to re-authenticate on every page load

**Authorization (AuthZ) & Roles**

- **FR-006**: System MUST implement two roles: "owner" (implicit, based on post authorship) and "admin" (explicit, stored in user claims or database)
- **FR-007**: System MUST allow post owners to create, read, update, and delete their own posts
- **FR-008**: System MUST allow admins to read, update, and delete any post (admin moderation capability)
- **FR-009**: System MUST return 401 Unauthorized for unauthenticated requests to protected endpoints
- **FR-010**: System MUST return 403 Forbidden when an authenticated user attempts to modify a resource they don't have permission for
- **FR-011**: System MUST record the creator's user ID when a new post is created, establishing ownership

**Validation & Security**

- **FR-012**: System MUST validate all incoming request payloads using a schema validation library (Zod or Joi)
- **FR-013**: System MUST enforce input size limits on request bodies (reasonable limit for blog post content)
- **FR-014**: System MUST implement rate limiting on mutating endpoints (create, update, delete) to prevent abuse
- **FR-015**: System MUST implement CSRF protection on all write operations
- **FR-016**: System MUST sanitize user inputs to prevent injection attacks

**Audit & Observability**

- **FR-017**: System MUST log an audit entry for every create, update, and delete operation containing: user ID, action verb, target resource ID, timestamp, and trace/request ID
- **FR-018**: System MUST include a unique request-id in all log entries to enable request tracing
- **FR-019**: System MUST provide structured logs (JSON format) for all operations
- **FR-020**: System MUST expose health check endpoint(s) that report system and dependency status

**Documentation**

- **FR-021**: System MUST update OpenAPI specification with securitySchemes definitions and protected operation markers
- **FR-022**: System MUST ensure login flow UI meets accessibility standards (a11y compliant HTML)
- **FR-023**: System MUST provide test coverage evidence and latency measurements in documentation/review packet

### Key Entities

- **User**: Represents an authenticated person; has a unique user ID (from Firebase), email, display name, and role (owner is implicit, admin is explicit)
- **Post**: Represents a blog entry; has id, slug, title, body, createdAt, updatedAt, and **ownerId** (new field linking to creator's user ID)
- **AuditLogEntry**: Records a mutation event; has timestamp, userId, action (create/update/delete), targetType (e.g., "post"), targetId, requestId/traceId, and optional metadata
- **Session**: Represents an authenticated user's session; includes identity token, expiration, and refresh mechanism

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the sign-in flow (from clicking "Sign In" to seeing authenticated state) in under 5 seconds under normal network conditions
- **SC-002**: 100% of protected API endpoints correctly return 401 for unauthenticated requests
- **SC-003**: 100% of authorization checks correctly return 403 when users attempt to modify resources they don't own (and are not admin)
- **SC-004**: Post owners can successfully edit and delete their own posts with no authorization failures
- **SC-005**: Admin users can successfully moderate (edit/delete) any post on the platform
- **SC-006**: Rate limiting activates and returns 429 responses when request threshold is exceeded
- **SC-007**: All mutating operations (create, update, delete) generate corresponding audit log entries with complete metadata
- **SC-008**: Health endpoints respond within 500ms and accurately reflect system status
- **SC-009**: Login flow passes WCAG 2.1 AA accessibility checks (verified via automated a11y testing)
- **SC-010**: OpenAPI specification is updated with complete security schemes and all protected endpoints are annotated
- **SC-011**: Test coverage for authentication and authorization code paths exceeds 80%

## Assumptions

- Firebase project is already configured or can be easily set up for this application
- Email/Password is the primary authentication method; one SSO provider (e.g., Google) may be added if trivial
- Existing posts created before authentication will be handled via a migration strategy (assign to system account or mark as ownerless with special handling)
- Rate limiting thresholds will use reasonable defaults (e.g., 10 mutations per minute per user) and can be adjusted via configuration
- Audit logs will be stored in application logs (structured JSON) rather than a separate audit database
- CSRF protection will use standard patterns (token in cookie + header comparison or similar)
- "Admin" role will be assigned via Firebase custom claims or a simple database flag

## Out of Scope

- OAuth provider expansion beyond Email/Password and one SSO provider (if trivial)
- Multi-tenant project support
- Database migrations (unless already in use)
- IAP (Identity-Aware Proxy) or API Gateway integration
- Password reset flow (rely on Firebase built-in)
- User registration flow (rely on Firebase built-in)
- User profile management
- Social features (comments, likes, following)
