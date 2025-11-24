# Feature Specification: Posts API

**Feature Branch**: `001-posts-api`  
**Created**: November 24, 2025  
**Status**: Draft  
**Input**: User description: "build a REST API for managing short text posts (like tweets) with CRUD operations, in-memory storage, rate limiting, and CORS support"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Publish Posts (Priority: P1)

Users can create short text posts (similar to tweets) and have them immediately available for viewing. This is the core value proposition of the API.

**Why this priority**: This is the fundamental feature - without the ability to create and retrieve posts, the API provides no value. This enables the basic publishing workflow.

**Independent Test**: Can be fully tested by making POST requests to create posts and GET requests to retrieve them. Delivers immediate value by enabling basic content publishing.

**Acceptance Scenarios**:

1. **Given** I have valid post content (1-280 characters), **When** I submit a POST request with the content, **Then** the system creates a post with a unique ID and timestamp
2. **Given** I have created a post, **When** I request all posts, **Then** the system returns my post with its ID, content, and creation time
3. **Given** I know a post's ID, **When** I request that specific post, **Then** the system returns the complete post details

---

### User Story 2 - View Timeline of Posts (Priority: P2)

Users can view all posts in reverse chronological order (newest first), similar to a social media timeline.

**Why this priority**: Builds on P1 by providing discoverability. Users need to see what's been posted to engage with content.

**Independent Test**: Can be tested by creating multiple posts at different times and verifying they appear in newest-first order.

**Acceptance Scenarios**:

1. **Given** multiple posts exist in the system, **When** I request all posts, **Then** posts are returned in reverse chronological order (newest first)
2. **Given** no posts exist, **When** I request all posts, **Then** the system returns an empty list without errors
3. **Given** posts were created at different times, **When** I view the timeline, **Then** I can see each post's creation timestamp

---

### User Story 3 - Remove Unwanted Posts (Priority: P3)

Users can delete their posts when they're no longer wanted or contain errors.

**Why this priority**: Provides content management capability. Less critical than creation/viewing but important for data hygiene.

**Independent Test**: Can be tested by creating a post, deleting it, and verifying it no longer appears in listings or individual fetches.

**Acceptance Scenarios**:

1. **Given** I have a post ID, **When** I send a DELETE request for that post, **Then** the post is permanently removed
2. **Given** a post has been deleted, **When** I try to retrieve it by ID, **Then** the system returns a not-found response
3. **Given** a post has been deleted, **When** I view all posts, **Then** the deleted post does not appear in the list

---

### User Story 4 - API Protection from Abuse (Priority: P2)

The API protects itself from excessive requests while allowing legitimate usage patterns.

**Why this priority**: Essential for production readiness. Prevents resource exhaustion and ensures fair usage.

**Independent Test**: Can be tested by making rapid successive requests and verifying rate limits are enforced at the specified threshold.

**Acceptance Scenarios**:

1. **Given** I make requests within rate limits, **When** I continue making requests, **Then** all requests succeed normally
2. **Given** I exceed the rate limit (100 requests in 15 minutes), **When** I make another request, **Then** the system rejects it with a rate limit error
3. **Given** I've been rate limited, **When** the time window resets, **Then** I can make requests again

---

### User Story 5 - Cross-Origin Access (Priority: P3)

Web applications from different domains can access the API through browsers.

**Why this priority**: Enables web-based frontends to consume the API. Important for web applications but doesn't affect core functionality.

**Independent Test**: Can be tested by making requests with Origin headers and verifying CORS headers are present in responses.

**Acceptance Scenarios**:

1. **Given** a web application makes a request from a different origin, **When** the request is processed, **Then** appropriate CORS headers are included in the response
2. **Given** a browser makes a preflight OPTIONS request, **When** processed, **Then** the system responds with allowed methods and headers

---

### Edge Cases

- What happens when someone tries to create a post with empty content?
- What happens when post content exceeds 280 characters?
- How does the system handle malformed JSON in requests?
- What happens when someone tries to delete a post that doesn't exist?
- What happens when someone tries to retrieve a post that doesn't exist?
- How does the system handle requests to undefined API endpoints?
- What happens when two clients try to delete the same post simultaneously?
- How does rate limiting distinguish between different clients?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept POST requests to create new posts with text content
- **FR-002**: System MUST validate post content is between 1 and 280 characters
- **FR-003**: System MUST assign each post a unique identifier upon creation
- **FR-004**: System MUST record the creation timestamp for each post
- **FR-005**: System MUST provide an endpoint to retrieve all posts
- **FR-006**: System MUST return posts in reverse chronological order (newest first)
- **FR-007**: System MUST provide an endpoint to retrieve a single post by its ID
- **FR-008**: System MUST provide an endpoint to delete a post by its ID
- **FR-009**: System MUST return appropriate error responses for invalid requests
- **FR-010**: System MUST return 404 status for non-existent posts
- **FR-011**: System MUST return 400 status for validation failures
- **FR-012**: System MUST limit clients to 100 requests per 15-minute window
- **FR-013**: System MUST return 429 status when rate limit is exceeded
- **FR-014**: System MUST include CORS headers in all responses
- **FR-015**: System MUST respond to preflight OPTIONS requests
- **FR-016**: System MUST persist posts in memory for the application lifetime
- **FR-017**: System MUST provide a health check endpoint for monitoring
- **FR-018**: System MUST return consistent error message structure
- **FR-019**: System MUST not expose internal error details or stack traces
- **FR-020**: System MUST handle malformed JSON with appropriate error responses

### Key Entities

- **Post**: Represents a short text message with a unique identifier, text content (1-280 characters), and creation timestamp. Posts can be created, retrieved individually or in bulk, and deleted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a post and retrieve it in under 1 second
- **SC-002**: System returns all posts in reverse chronological order on every request
- **SC-003**: System successfully rejects posts with content outside the 1-280 character range
- **SC-004**: System handles 100 requests per client within 15 minutes without throttling
- **SC-005**: The 101st request from a client within 15 minutes returns a rate limit error
- **SC-006**: Deleted posts are immediately removed and no longer retrievable
- **SC-007**: Cross-origin requests from web browsers succeed with proper CORS headers
- **SC-008**: Invalid requests return appropriate 400-level errors with helpful messages
- **SC-009**: Malformed JSON requests return 400 errors without server crashes
- **SC-010**: All API responses use consistent JSON structure
