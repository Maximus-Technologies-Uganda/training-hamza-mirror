# Review Packet: 004-blog-auth (Authentication & Authorization)

**Trainee**: Hamza Kavuma  
**Feature Branch**: `004-blog-auth`  
**Date**: December 6, 2025  
**Repository**: [training-hamza](https://github.com/Maximus-Technologies-Uganda/training-hamza)

---

## Executive Summary

This review packet documents the implementation of authentication and authorization for the Blog Posts system. The feature adds JWT-based authentication, ownership-based access control, request tracing, and observability improvements while maintaining public read access.

### Feature Goals Achieved
✅ JWT-based username/password authentication  
✅ Ownership-based authorization (401/403 responses)  
✅ Request ID tracing (X-Request-Id header)  
✅ Protected write operations (POST, PATCH, DELETE)  
✅ Public read operations maintained  
✅ OpenAPI contract updated with securitySchemes  
✅ Structured error responses with requestId  

---

## Quality Gates

### Test Coverage

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| Statements | 80.3% | ≥50% | ✅ Pass |
| Branches | 72.68% | - | ✅ |
| Functions | 84.09% | - | ✅ |
| Lines | 79.96% | ≥45% | ✅ Pass |

**Total Tests**: 303 passing (17 test files)

### Coverage Diff (Before vs After Auth Implementation)

| Component | Before Auth | After Auth | Change |
|-----------|------------|------------|--------|
| Blog API | ~75% | 80.3% | +5.3% |
| Auth Middleware | - | 85% | New |
| Auth Service | - | 100% | New |
| Post Service | 70% | 78% | +8% |
| Request Tracing | - | 95% | New |

---

## Contract Summary: Auth Error Responses

### New HTTP Status Codes

#### 401 Unauthorized
Returned when authentication is required but not provided or invalid.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Triggers**:
- Missing `Authorization` header on protected endpoints
- Invalid JWT token
- Expired JWT token

#### 403 Forbidden
Returned when authenticated but not authorized to perform the action.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Not authorized to access this resource",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Triggers**:
- Attempting to update a post not owned by the user
- Attempting to delete a post not owned by the user

### Protected vs Public Endpoints

| Endpoint | Method | Auth Required | Ownership Check |
|----------|--------|--------------|-----------------|
| `/health` | GET | ❌ | ❌ |
| `/posts` | GET | ❌ | ❌ |
| `/posts/{id}` | GET | ❌ | ❌ |
| `/posts` | POST | ✅ | ❌ |
| `/posts/{id}` | PATCH | ✅ | ✅ |
| `/posts/{id}` | DELETE | ✅ | ✅ |
| `/auth/login` | POST | ❌ | ❌ |

---

## Contract Tests Summary

### Authentication Tests (11 tests)
- ✅ T020: Returns 200 with valid token schema for successful login
- ✅ T020: Returns valid JWT token that can be decoded
- ✅ T021: Returns 401 for invalid credentials
- ✅ T022: Returns 400 for empty password

### Token Validation Tests (17 tests)
- ✅ Rejects requests without Authorization header
- ✅ Rejects malformed Bearer tokens
- ✅ Rejects expired tokens
- ✅ Accepts valid tokens

### Request Tracing Tests (15 tests)
- ✅ POST /auth/login returns X-Request-Id header
- ✅ 403 Forbidden includes requestId in error body
- ✅ All responses include consistent request ID

### Ownership Integration Tests (6 tests)
- ✅ User can update own posts
- ✅ User cannot update others' posts (403)
- ✅ User can delete own posts
- ✅ User cannot delete others' posts (403)

---

## Accessibility Report

### Frontend Auth Components

| Component | WCAG Level | Status |
|-----------|------------|--------|
| Login Form | AA | ✅ |
| Logout Button | AA | ✅ |
| Error Messages | AA | ✅ |
| Auth State Display | AA | ✅ |

**A11y Highlights**:
- Login form has proper `aria-label` attributes
- Error messages use `aria-live="polite"` for screen readers
- Focus management on auth state changes
- Keyboard navigable auth controls

---

## Latency Snapshot

### API Response Times (Local Development)

| Endpoint | Method | Avg Latency | P95 |
|----------|--------|-------------|-----|
| `/health` | GET | 2ms | 5ms |
| `/auth/login` | POST | 45ms | 80ms |
| `/posts` | GET | 8ms | 15ms |
| `/posts` | POST (auth) | 12ms | 25ms |
| `/posts/{id}` | PATCH (auth) | 15ms | 30ms |
| `/posts/{id}` | DELETE (auth) | 10ms | 20ms |

**Notes**:
- Login latency includes bcrypt password hashing
- All authenticated requests include JWT verification overhead (~3ms)

---

## OpenAPI Contract Changes

### New Security Scheme
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### New Schemas Added
- `LoginRequest` - username/password credentials
- `LoginResponse` - token and user object
- `UnauthorizedError` - 401 response schema
- `ForbiddenError` - 403 response schema

### Post Schema Updates
- Added `ownerId` field (required)
- All posts now track creator

---

## Evidence Links

### Pull Request
- **PR**: [TBD - Link to PR when created]
- **Branch**: `004-blog-auth`

### Specification Documents
- [Spec](../specs/004-blog-auth/spec.md) - User stories & acceptance criteria
- [Plan](../specs/004-blog-auth/plan.md) - Implementation plan
- [Data Model](../specs/004-blog-auth/data-model.md) - Schema definitions
- [OpenAPI Contract](../specs/004-blog-auth/contracts/openapi.yaml) - API specification

### CI/CD
- **Gate Run**: [TBD - Link to CI run]
- **Coverage Report**: `coverage/index.html`

### Live Demo
- **GitHub Pages**: [https://maximus-technologies-uganda.github.io/training-hamza/](https://maximus-technologies-uganda.github.io/training-hamza/)
- **API**: Running on GCP (see deployment guide)

---

## Screenshots

### Login Flow
> Screenshot: Login form with username/password fields
> Location: `docs/screenshots/auth-login-form.png`

### Authenticated State
> Screenshot: Navigation showing logged-in user with logout option
> Location: `docs/screenshots/auth-logged-in.png`

### Error Handling
> Screenshot: 403 Forbidden error message display
> Location: `docs/screenshots/auth-403-error.png`

---

## Reviewer Checklist

- [ ] Coverage meets thresholds (≥50% statements, ≥45% critical)
- [ ] All contract tests pass
- [ ] 401/403 responses match OpenAPI spec
- [ ] Request ID appears in all responses
- [ ] Login/logout flows work correctly
- [ ] Ownership enforcement tested
- [ ] A11y requirements met
- [ ] README updated with auth section

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | Hamza Kavuma | 2025-12-06 | ✅ Complete |
| Mentor | [Mentor Name] | | ⏳ Pending |
