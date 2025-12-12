# Feature Specification: Blog Authentication & Authorization

**Feature Branch**: `004-blog-auth`  
**Created**: December 5, 2025  
**Status**: Draft  
**Input**: User description: "AuthN: Simple username login (no 3rd-party provider this week) issuing a signed session. For GitHub Pages static export, use client-side JWT storage (localStorage) with API-issued tokens. Secret stored securely (environment variable or API-side). AuthZ/Ownership: Posts carry ownerId; Create/Update/Delete require an authenticated user and enforce ownership; Read remains public. Contracts: OpenAPI updated with securitySchemes, auth-required operations, error envelope for 401/403, and ownership checks. UI: Next.js adds Login/Logout, shows only my write actions, maps 401/403 to friendly messages; static export still renders list for everyone via client-side fetch. Observability: request-id propagation, structured logs (API), /health endpoint, and a tiny latency snapshot in CI job summary. GitHub Pages alignment: Deploy frontend via static export to GitHub Pages; API remains on existing host; env wiring documented in README."

## Overview

This feature adds authentication and authorization to the Blog Posts system, enabling secure user login with ownership-based access control for write operations while maintaining public read access. The implementation uses a simple username/password authentication system with API-issued JWT tokens stored client-side, suitable for the GitHub Pages static export architecture. The feature also introduces observability improvements including request tracing, structured logging, and latency monitoring.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Login (Priority: P1)

Users can authenticate with a username and password to gain write access to the blog system. Upon successful login, the user receives a session token that enables create, edit, and delete operations on their own posts.

**Why this priority**: Authentication is the foundation for all authorization features. Without login, users cannot be identified, making ownership-based access control impossible.

**Independent Test**: Can be fully tested by navigating to the login page, entering valid credentials, and verifying successful authentication with visible login state change.

**Acceptance Scenarios**:

1. **Given** I am not logged in, **When** I visit any page, **Then** I see a "Login" option in the navigation
2. **Given** I am on the login page, **When** I enter a valid username and password and submit, **Then** I am authenticated and redirected to the homepage with my username displayed
3. **Given** I am on the login page, **When** I enter an invalid username or password, **Then** I see a clear error message indicating invalid credentials without revealing which field was wrong
4. **Given** I am on the login page, **When** I submit without entering credentials, **Then** I see validation errors indicating required fields
5. **Given** I am logged in, **When** I close the browser and reopen it, **Then** I remain logged in (session persists in localStorage)
6. **Given** I am logged in, **When** my token expires, **Then** I am gracefully logged out and prompted to log in again

---

### User Story 2 - User Logout (Priority: P1)

Logged-in users can sign out to end their session, clearing their authentication state and preventing further write operations until they log in again.

**Why this priority**: Logout is essential for security - users must be able to end their sessions, especially on shared devices.

**Independent Test**: Can be tested by logging in, clicking logout, and verifying the session is cleared and write actions are no longer available.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I click "Logout", **Then** my session is cleared and I am returned to a logged-out state
2. **Given** I have logged out, **When** I try to access the create post page directly, **Then** I am redirected to the login page
3. **Given** I have logged out, **When** I view the navigation, **Then** I see "Login" instead of my username and "Logout"
4. **Given** I log out, **When** I check localStorage, **Then** the authentication token has been removed

---

### User Story 3 - Create Posts as Authenticated User (Priority: P1)

Authenticated users can create blog posts that are automatically associated with their account. The post stores the creator's identity for ownership tracking.

**Why this priority**: Creating owned content is the core value proposition of authentication - users need to create posts that belong to them.

**Independent Test**: Can be tested by logging in, creating a post, and verifying the post is associated with the logged-in user's account.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I create a new post, **Then** the post is saved with my user ID as the owner
2. **Given** I am logged in, **When** I view my newly created post, **Then** I see edit and delete buttons for that post
3. **Given** I am NOT logged in, **When** I try to access the create post form, **Then** I am redirected to the login page
4. **Given** I am NOT logged in, **When** I try to submit a create post request directly to the API, **Then** I receive a 401 Unauthorized error

---

### User Story 4 - Edit Own Posts Only (Priority: P1)

Authenticated users can only edit posts they own. The system prevents users from modifying posts created by other users.

**Why this priority**: Ownership enforcement is core to the authorization model - users must only modify their own content.

**Independent Test**: Can be tested by logging in as User A, creating a post, logging in as User B, and verifying User B cannot edit User A's post.

**Acceptance Scenarios**:

1. **Given** I am logged in and viewing my own post, **When** I click "Edit", **Then** I can access the edit form and save changes
2. **Given** I am logged in and viewing another user's post, **When** I view the post detail, **Then** I do NOT see edit or delete buttons
3. **Given** I am logged in, **When** I try to submit an edit request for another user's post, **Then** I receive a 403 Forbidden error
4. **Given** I am NOT logged in, **When** I try to edit any post, **Then** I receive a 401 Unauthorized error

---

### User Story 5 - Delete Own Posts Only (Priority: P2)

Authenticated users can only delete posts they own. The system prevents users from deleting posts created by other users.

**Why this priority**: Similar to editing, ownership-based deletion protects content integrity but is less frequently used than editing.

**Independent Test**: Can be tested by creating a post as User A, then attempting to delete it as User B and verifying the operation is rejected.

**Acceptance Scenarios**:

1. **Given** I am logged in and viewing my own post, **When** I click "Delete" and confirm, **Then** the post is deleted successfully
2. **Given** I am logged in, **When** I try to delete another user's post via the API, **Then** I receive a 403 Forbidden error
3. **Given** I am NOT logged in, **When** I try to delete any post, **Then** I receive a 401 Unauthorized error

---

### User Story 6 - Public Read Access (Priority: P1)

All visitors, whether logged in or not, can view the list of all blog posts and read individual post details. Authentication is not required for any read operations.

**Why this priority**: Public read access is essential for the blog's purpose - content should be discoverable and readable by everyone.

**Independent Test**: Can be tested by accessing the homepage and post detail pages without logging in and verifying all content is visible.

**Acceptance Scenarios**:

1. **Given** I am NOT logged in, **When** I visit the homepage, **Then** I see the list of all blog posts
2. **Given** I am NOT logged in, **When** I navigate to a post detail page, **Then** I can read the full post content
3. **Given** the API requires authentication for some endpoints, **When** I request GET /posts or GET /posts/{id}, **Then** the request succeeds without authentication

---

### User Story 7 - Friendly Error Messages for Auth Failures (Priority: P2)

When authentication or authorization fails, users see helpful, non-technical error messages that guide them toward resolution.

**Why this priority**: Good error messages improve user experience and reduce confusion when access is denied.

**Independent Test**: Can be tested by triggering 401 and 403 errors and verifying the displayed messages are user-friendly.

**Acceptance Scenarios**:

1. **Given** my session has expired, **When** I try to create/edit/delete a post, **Then** I see a message like "Your session has expired. Please log in again."
2. **Given** I try to edit another user's post, **When** I receive a 403 error, **Then** I see a message like "You don't have permission to edit this post."
3. **Given** I receive a 401 error, **When** the error is displayed, **Then** I see a link or button to navigate to the login page
4. **Given** an auth error occurs, **When** the message is displayed, **Then** it does NOT reveal technical details or stack traces

---

### User Story 8 - Request Tracing (Priority: P2)

Every API request is assigned a unique request ID that appears in logs and error responses, enabling end-to-end debugging and request correlation.

**Why this priority**: Observability is crucial for production debugging - correlating logs across services requires request IDs.

**Independent Test**: Can be tested by making API requests and verifying a consistent request-id header appears in responses and logs.

**Acceptance Scenarios**:

1. **Given** I make any API request, **When** the response is returned, **Then** it includes a unique `X-Request-Id` header
2. **Given** an error occurs, **When** I receive the error response, **Then** the response body includes the request ID for reference
3. **Given** a request is processed, **When** I check the server logs, **Then** all log entries for that request include the same request ID
4. **Given** a client provides an `X-Request-Id` header, **When** the API processes the request, **Then** it uses the provided ID for tracing

---

### User Story 9 - API Health Endpoint (Priority: P2)

Operations tools can monitor the API's health status through a dedicated endpoint that reports service availability.

**Why this priority**: Health endpoints are essential for deployment pipelines, load balancers, and monitoring systems.

**Independent Test**: Can be tested by calling GET /health and verifying a successful response with health information.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** I request GET /health, **Then** I receive a 200 response with health status information
2. **Given** the health endpoint is called, **When** the service is operational, **Then** the response includes service version and uptime information
3. **Given** monitoring tools poll the health endpoint, **When** the service is healthy, **Then** responses are returned within 500ms

---

### User Story 10 - CI Latency Reporting (Priority: P3)

The CI pipeline captures and reports API latency metrics in the job summary, providing visibility into performance characteristics.

**Why this priority**: Performance visibility in CI helps catch regressions early but is not critical for core functionality.

**Independent Test**: Can be tested by running the CI pipeline and verifying latency metrics appear in the job summary.

**Acceptance Scenarios**:

1. **Given** the CI pipeline runs, **When** API tests execute, **Then** latency metrics are captured for key operations
2. **Given** latency metrics are captured, **When** the job completes, **Then** a summary of response times is displayed in the GitHub Actions job summary

---

### Edge Cases

- What happens when a user's account is deleted while they have an active session?
- How does the system handle concurrent login attempts from the same user?
- What happens when localStorage is full or unavailable (private browsing mode)?
- How does the system handle token tampering or invalid JWT signatures?
- What happens when the JWT secret is rotated while active tokens exist?
- How does the system handle requests with expired tokens?
- What happens when a user tries to access a post that was deleted after the page loaded?
- How does the system handle very long usernames or passwords?
- What happens when the API is unavailable during login attempt?
- How does the system handle rate limiting on login attempts?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication (API)**
- **FR-001**: API MUST provide a POST /auth/login endpoint accepting username and password
- **FR-002**: API MUST issue a signed JWT token upon successful authentication
- **FR-003**: API MUST reject invalid credentials with appropriate error response
- **FR-004**: JWT tokens MUST include user ID, username, and expiration timestamp
- **FR-005**: JWT signing secret MUST be stored in environment variables, never in code
- **FR-006**: API MUST validate JWT signature and expiration on protected endpoints

**Authorization (API)**
- **FR-007**: Posts MUST include an ownerId field linking to the creating user
- **FR-008**: POST /posts MUST require authentication (reject with 401 if unauthenticated)
- **FR-009**: PATCH /posts/{id} MUST require authentication AND ownership (reject with 403 if not owner)
- **FR-010**: DELETE /posts/{id} MUST require authentication AND ownership (reject with 403 if not owner)
- **FR-011**: GET /posts and GET /posts/{id} MUST remain publicly accessible without authentication

**User Management (API)**
- **FR-012**: API MUST provide a mechanism for user registration or pre-configured test users
- **FR-013**: Passwords MUST be stored securely (hashed, never plaintext)

**Authentication (Frontend)**
- **FR-014**: Frontend MUST provide a login page with username and password fields
- **FR-015**: Frontend MUST store JWT token in localStorage upon successful login
- **FR-016**: Frontend MUST include JWT token in Authorization header for protected API requests
- **FR-017**: Frontend MUST provide a logout action that clears the stored token
- **FR-018**: Frontend MUST display current authentication state (logged in/out, username)
- **FR-019**: Frontend MUST redirect unauthenticated users to login page when accessing protected features

**Authorization (Frontend)**
- **FR-020**: Frontend MUST show edit/delete buttons only on posts owned by the logged-in user
- **FR-021**: Frontend MUST hide create post functionality from unauthenticated users
- **FR-022**: Frontend MUST display user-friendly messages for 401 errors ("Please log in")
- **FR-023**: Frontend MUST display user-friendly messages for 403 errors ("You don't have permission")

**Error Responses (API)**
- **FR-024**: API MUST return 401 Unauthorized for requests requiring authentication when not authenticated
- **FR-025**: API MUST return 403 Forbidden for authenticated requests failing ownership checks
- **FR-026**: Error responses MUST include request-id for correlation
- **FR-027**: Error responses MUST follow consistent envelope structure with code, message, and requestId

**Observability**
- **FR-028**: API MUST generate a unique request-id for each incoming request
- **FR-029**: API MUST accept and use client-provided X-Request-Id header if present
- **FR-030**: API MUST include X-Request-Id header in all responses
- **FR-031**: API MUST use structured logging format (JSON) for all log output
- **FR-032**: All log entries MUST include the request-id field
- **FR-033**: API MUST provide GET /health endpoint returning service status
- **FR-034**: Health endpoint MUST return status, version, and uptime information

**Contracts**
- **FR-035**: OpenAPI specification MUST include securitySchemes for JWT Bearer authentication
- **FR-036**: OpenAPI specification MUST mark POST/PATCH/DELETE operations as requiring authentication
- **FR-037**: OpenAPI specification MUST document 401 and 403 error response schemas
- **FR-038**: OpenAPI specification MUST document the ownerId field on post resources

**GitHub Pages Deployment**
- **FR-039**: Frontend MUST be deployable as static export to GitHub Pages
- **FR-040**: Frontend MUST fetch data client-side (no server-side rendering for data)
- **FR-041**: API URL MUST be configurable via environment variable for different environments
- **FR-042**: README MUST document environment variable configuration for deployment

**CI/CD**
- **FR-043**: CI pipeline MUST capture API response latency metrics during test execution
- **FR-044**: CI pipeline MUST output latency summary to GitHub Actions job summary

### Key Entities

- **User**: Represents an authenticated user with id, username, and hashed password. Users own posts and are identified by JWT tokens.
- **Post**: Extended with ownerId field linking to the creating User. Ownership determines edit/delete permissions.
- **Session/Token**: JWT containing user identity (id, username) and expiration. Stored client-side, validated server-side.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login flow (navigate to login, enter credentials, submit, see logged-in state) in under 30 seconds
- **SC-002**: 100% of write operations (create/update/delete) enforce authentication - no unauthenticated writes succeed
- **SC-003**: 100% of update/delete operations enforce ownership - users cannot modify others' posts
- **SC-004**: Read operations (list posts, view post) remain accessible without login - 0% authentication requirement for reads
- **SC-005**: 401 and 403 errors display user-friendly messages within 200ms of API response
- **SC-006**: All API requests include request-id in response headers (100% coverage)
- **SC-007**: Health endpoint responds within 500ms under normal conditions
- **SC-008**: CI job summary displays latency metrics for at least 3 key API operations
- **SC-009**: Session persists across browser refresh (token stored and retrieved from localStorage)
- **SC-010**: Invalid credentials result in error message within 2 seconds (no long timeouts)

## Assumptions

- **A-001**: A simple username/password authentication is sufficient (no OAuth, social login, or multi-factor authentication required for this iteration)
- **A-002**: Pre-configured test users are acceptable for initial implementation; user self-registration can be added later
- **A-003**: JWT tokens with 24-hour expiration provide reasonable balance between security and convenience
- **A-004**: localStorage is available in target browsers (modern evergreen browsers)
- **A-005**: The existing Blog Posts API infrastructure can be extended to support authentication endpoints
- **A-006**: Rate limiting on login attempts uses existing rate limiting infrastructure
- **A-007**: Structured logging uses JSON format compatible with common log aggregation tools

## Out of Scope

- Third-party authentication providers (OAuth, Google, GitHub login)
- Multi-factor authentication (MFA/2FA)
- Password reset/recovery flow
- Email verification
- User profile management beyond basic identity
- Session revocation (force logout)
- Role-based access control (admin, moderator roles)
- Audit logging of authentication events
- Token refresh mechanism (users will re-login on expiration)
