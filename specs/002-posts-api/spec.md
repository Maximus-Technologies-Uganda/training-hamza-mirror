# Technical Specification: Blog Posts API

**Feature ID:** 002-posts-api  
**Version:** 1.0.0  
**Status:** Draft  
**Author:** Development Team  
**Date:** November 21, 2025

---

## Problem Statement

We need a robust RESTful API for managing blog posts that allows clients to create, read, update, and delete blog content. Currently, there is no standardized way to programmatically interact with blog posts, limiting the ability to build client applications, automate content workflows, or integrate with third-party services.

The API must provide reliable error handling, prevent abuse through rate limiting, and maintain data consistency through proper validation. This forms the foundation for a scalable content management system.

---

## User Stories

### Core Functionality

**US-001: Create Blog Post**  
As a content creator, I want to create a new blog post with a title and body, so that I can publish content to the platform.

**US-002: List Blog Posts**  
As a reader, I want to retrieve a list of all blog posts, so that I can browse available content.

**US-003: View Single Post**  
As a reader, I want to retrieve a specific blog post by its ID, so that I can read the full content.

**US-004: Update Blog Post**  
As a content creator, I want to update the title or body of an existing post, so that I can correct mistakes or improve content.

**US-005: Delete Blog Post**  
As a content creator, I want to delete a blog post, so that I can remove outdated or inappropriate content.

### System Health

**US-006: Health Check**  
As a system administrator, I want to check the API health status, so that I can monitor service availability.

### Protection & Reliability

**US-007: Rate Limiting**  
As a system administrator, I want to prevent API abuse through rate limiting, so that the service remains available for all users.

**US-008: Consistent Error Responses**  
As an API consumer, I want to receive consistent error messages in a predictable JSON format, so that I can handle errors gracefully in my client application.

---

## Success Criteria

### Functional Requirements

1. **POST /posts** successfully creates a new post and returns `201 Created` with the post object including a server-generated slug.
2. **GET /posts** returns `200 OK` with an array of all posts.
3. **GET /posts/{id}** returns `200 OK` with the requested post or `404 Not Found` if the post doesn't exist.
4. **PATCH /posts/{id}** successfully updates a post and returns `200 OK` with the updated post object.
5. **DELETE /posts/{id}** successfully removes a post and returns `204 No Content`.
6. **GET /health** returns `200 OK` with system status information.

### Validation Requirements

7. API rejects requests with missing `title` field (returns `400 Bad Request`).
8. API rejects requests with missing `body` field (returns `400 Bad Request`).
9. API rejects titles shorter than 3 characters or longer than 200 characters.
10. API rejects body content shorter than 10 characters or longer than 10,000 characters.
11. Slug is automatically generated from the title (lowercase, hyphenated) and cannot be provided by the user.

### Reliability Requirements

12. All error responses follow a consistent JSON structure with `error`, `message`, and `statusCode` fields.
13. Typed errors map correctly to HTTP status codes (ValidationError → 400, NotFoundError → 404, etc.).

### Security Requirements

14. API returns `429 Too Many Requests` when a single IP exceeds the rate limit (100 requests per 15 minutes).
15. Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are included in responses.

### Documentation Requirements

16. An OpenAPI 3.1 specification accurately describes all endpoints, request/response schemas, and error responses.

---

## Acceptance Evidence

To verify successful implementation, the following evidence will be collected:

### Test Output Evidence

1. **Unit Test Report**: All validation, business logic, and error handling tests pass with >90% code coverage.
2. **Integration Test Report**: End-to-end tests for all six endpoints pass successfully.

### Contract Validation Evidence

3. **OpenAPI Validation**: Contract testing confirms all responses match the OpenAPI schema.
4. **Schema Examples**: Request/response JSON examples validate successfully against the contract.

### Rate Limiting Evidence

5. **Rate Limit Test Logs**: Automated tests demonstrate:
   - Request #100 succeeds with `X-RateLimit-Remaining: 0`
   - Request #101 returns `429 Too Many Requests`
   - Rate limit resets after the time window expires

### Error Handling Evidence

6. **Error Response Screenshots**: CI logs showing consistent error JSON shape for:
   - `400 Bad Request` (validation failure)
   - `404 Not Found` (non-existent post)
   - `429 Too Many Requests` (rate limit exceeded)
   - `500 Internal Server Error` (unexpected error)

### Health Check Evidence

7. **Health Endpoint Response**: CI output showing `/health` returns expected status JSON.

### CRUD Operation Evidence

8. **API Response Logs**: CI logs demonstrating successful:
   - Post creation with auto-generated slug
   - Post retrieval (list and single)
   - Post update with validation
   - Post deletion

---

## Proposed API Contract

An **OpenAPI 3.1 document** will be generated and stored in `specs/002-posts-api/contracts/openapi.yaml`. This document serves as the single source of truth for the API contract.

### Endpoints Overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | System health check |
| `POST` | `/posts` | Create a new blog post |
| `GET` | `/posts` | Retrieve all blog posts |
| `GET` | `/posts/{id}` | Retrieve a single blog post by ID |
| `PATCH` | `/posts/{id}` | Update an existing blog post |
| `DELETE` | `/posts/{id}` | Delete a blog post |

### Core Data Model

```json
{
  "id": "string (UUID v4)",
  "title": "string (3-200 chars, required)",
  "body": "string (10-10000 chars, required)",
  "slug": "string (auto-generated, kebab-case)",
  "createdAt": "string (ISO 8601 timestamp)",
  "updatedAt": "string (ISO 8601 timestamp)"
}
```

### Standard Error Shape

```json
{
  "error": "string (error type)",
  "message": "string (human-readable description)",
  "statusCode": "number (HTTP status code)",
  "details": "object (optional, validation errors)"
}
```

### Rate Limiting Headers

- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

---

## Non-Goals

The following are explicitly **out of scope** for this iteration:

1. **Authentication & Authorization**: No user accounts, login, or permission systems. All endpoints are public.
2. **Multi-tenancy**: No organization or workspace isolation. Single shared data store.
3. **Pagination**: The `GET /posts` endpoint returns all posts without pagination support.
4. **Search & Filtering**: No full-text search, tagging, or query parameters for filtering.
5. **Image Upload**: No support for media attachments or file uploads.
6. **Draft/Published States**: No workflow states. All posts are immediately "published."
7. **Comments or Reactions**: No user engagement features.
8. **Cloud Deployment**: No production deployment configuration. Development/testing only.
9. **Database Persistence**: In-memory storage only (data lost on restart). SQLite migration planned for future iteration.
10. **Versioning**: No API versioning strategy. Breaking changes may occur.

---

## Risks & Mitigations

### Risk 1: Data Loss on Service Restart

**Impact:** High  
**Probability:** High (by design)  
**Description:** In-memory storage means all posts are lost when the server restarts.

**Mitigation:**
- Document clearly that this is a development/testing implementation.
- Design data access layer with repository pattern to enable seamless SQLite migration in v2.
- Add data seeding capability for quick test data restoration.

### Risk 2: Rate Limiting Bypass

**Impact:** Medium  
**Probability:** Medium  
**Description:** IP-based rate limiting can be bypassed using proxies or VPNs.

**Mitigation:**
- Acceptable for initial implementation given "Non-Goal: Authentication."
- Document limitation for future token-based rate limiting.
- Implement at application layer (not relying on reverse proxy) for consistency.

### Risk 3: Slug Collisions

**Impact:** Medium  
**Probability:** Low  
**Description:** Two posts with identical titles will generate the same slug.

**Mitigation:**
- Append timestamp or counter to slug if collision detected.
- Add unique constraint on slug field.
- Document slug generation algorithm in OpenAPI spec.

### Risk 4: Unbounded Memory Growth

**Impact:** High  
**Probability:** Medium  
**Description:** In-memory storage grows indefinitely as posts accumulate.

**Mitigation:**
- Document maximum recommended posts (~10,000) for in-memory mode.
- Add memory usage monitoring to `/health` endpoint.
- Plan SQLite migration before production use.

### Risk 5: Contract-Implementation Drift

**Impact:** Medium  
**Probability:** Medium  
**Description:** API implementation may diverge from OpenAPI specification over time.

**Mitigation:**
- Implement contract testing in CI pipeline.
- Use schema validation middleware to enforce contract at runtime.
- Make OpenAPI spec generation part of the build process.

### Risk 6: Insufficient Input Validation

**Impact:** High  
**Probability:** Low  
**Description:** Malicious input (XSS, SQL injection patterns) could bypass validation.

**Mitigation:**
- Enforce strict length limits on all string fields.
- Sanitize inputs before slug generation.
- Implement comprehensive validation test suite.
- Plan for HTML sanitization in future iterations when rendering is added.

---

## Implementation Notes

### Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js or Fastify
- **Validation:** Joi or Zod schema validation
- **Testing:** Jest or Vitest
- **Contract:** OpenAPI 3.1 with Swagger UI

### Development Phases

**Phase 1:** Core CRUD endpoints with validation  
**Phase 2:** Rate limiting and error handling  
**Phase 3:** OpenAPI contract generation and testing  
**Phase 4:** Integration tests and CI automation

### Definition of Done

- [ ] All endpoints implemented and returning correct status codes
- [ ] Validation rules enforced with typed errors
- [ ] Rate limiting functional with header responses
- [ ] OpenAPI 3.1 document generated and validated
- [ ] Unit test coverage >90%
- [ ] Integration tests passing in CI
- [ ] Contract tests validating responses against spec
- [ ] Documentation complete with usage examples
- [ ] Code review approved
- [ ] Acceptance evidence collected and archived

---

## References

- OpenAPI Specification: https://spec.openapis.org/oas/v3.1.0
- HTTP Status Codes: RFC 9110
- Rate Limiting Headers: IETF Draft draft-ietf-httpapi-ratelimit-headers

---

**Next Steps:**
1. Review and approve this specification
2. Generate OpenAPI contract in `specs/002-posts-api/contracts/openapi.yaml`
3. Set up project structure and dependencies
4. Implement Phase 1: Core CRUD operations
