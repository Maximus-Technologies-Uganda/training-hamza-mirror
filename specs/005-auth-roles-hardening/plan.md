# Implementation Plan: Auth, Roles, and Production Hardening

**Branch**: `005-auth-roles-hardening` | **Date**: December 9, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-auth-roles-hardening/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integrate Firebase Auth (Google Identity Platform) for authentication, implement role-based authorization (owner/admin), add production hardening (Zod validation, rate limiting, CSRF protection), and establish audit logging with observability features. The BFF pattern is preserved: browser → Next.js route handlers → API (no direct browser-to-API calls).

## Technical Context

**Language/Version**: JavaScript (Node.js 18+, ES Modules) / TypeScript 5.5 (Frontend)  
**Primary Dependencies**: 
- Backend: Fastify, @fastify/jwt (to be replaced/augmented with Firebase Admin SDK), @fastify/rate-limit, Zod
- Frontend: Next.js 14, React 18, SWR, Firebase Auth SDK (client)
**Storage**: SQLite (better-sqlite3) for development/production, Memory storage for tests  
**Testing**: Vitest (backend), Jest (frontend), Playwright (E2E)  
**Target Platform**: Linux server (Cloud Run), Web browser (Next.js static/SSR)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Sign-in flow <5s, Health endpoints <500ms, Rate limit: 10 mutations/minute/user  
**Constraints**: BFF pattern (no direct browser-to-API), WCAG 2.1 AA accessibility, 80%+ test coverage  
**Scale/Scope**: Single-tenant blog platform, ~10-100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: The project constitution (`/.specify/memory/constitution.md`) is currently a template without specific rules defined. The following general software engineering principles are applied:

| Principle | Status | Notes |
|-----------|--------|-------|
| Test-First Development | ✅ PASS | Existing test infrastructure in place (Vitest, Jest); new auth code will follow TDD |
| Structured Logging | ✅ PASS | Pino logger already configured; will extend for audit logging |
| Clear Error Handling | ✅ PASS | Error middleware exists; will extend for auth-specific errors (401, 403) |
| Input Validation | ✅ PASS | JSON Schema validation exists; migrating to Zod for type-safe validation |
| Security Best Practices | ✅ PASS | BFF pattern maintained; no direct browser-to-API calls |

**Gate Result**: PASS - No violations identified. Proceeding to Phase 0.

### Post-Phase 1 Re-evaluation (December 9, 2025)

After completing Phase 1 design artifacts:

| Principle | Status | Artifacts Reviewed |
|-----------|--------|-------------------|
| Test-First Development | ✅ PASS | data-model.md defines testable schemas; contracts provide test fixtures |
| Structured Logging | ✅ PASS | research.md §6 defines audit log format; data-model.md §AuditLogEntry |
| Clear Error Handling | ✅ PASS | openapi.yaml defines all error responses (400, 401, 403, 404, 429) |
| Input Validation | ✅ PASS | data-model.md defines Zod schemas; openapi.yaml has validation rules |
| Security Best Practices | ✅ PASS | research.md §1-3 (Firebase Auth), §5 (CSRF), §7 (Rate Limiting) |

**Post-Design Gate Result**: PASS - Design artifacts comply with all principles.

## Project Structure

### Documentation (this feature)

```text
specs/005-auth-roles-hardening/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # Updated OpenAPI spec with security schemes
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Backend API (existing structure, to be extended)
src/blog/
├── middleware/
│   ├── auth.js              # UPDATE: Firebase Admin SDK token verification
│   ├── error-handler.js     # UPDATE: Add auth error types
│   ├── request-id.js        # Existing (no changes)
│   ├── csrf.js              # NEW: CSRF token validation
│   └── audit.js             # NEW: Audit logging middleware
├── models/
│   ├── post.js              # Existing (no changes, already has ownerId)
│   ├── user.js              # UPDATE: Add Firebase UID, role field
│   └── audit-log.js         # NEW: Audit log entry schema
├── routes/
│   ├── auth.js              # UPDATE: Firebase token exchange
│   ├── posts.js             # UPDATE: Authorization checks with roles
│   └── health.js            # Existing (may extend)
├── services/
│   ├── post-service.js      # UPDATE: Admin role bypass for authorization
│   ├── user-service.js      # UPDATE: Firebase user sync, role management
│   └── audit-service.js     # NEW: Audit log service
└── storage/
    └── (existing storage implementations)

# Frontend (Next.js, existing structure, to be extended)
frontend/src/
├── app/
│   ├── api/                 # NEW: BFF route handlers for auth
│   │   └── auth/
│   │       ├── login/route.ts
│   │       ├── logout/route.ts
│   │       └── session/route.ts
│   └── (existing pages)
├── components/
│   ├── LoginForm.tsx        # NEW: Email/password sign-in form
│   ├── AuthProvider.tsx     # NEW: Auth context provider
│   └── (existing components)
├── lib/
│   ├── auth.ts              # UPDATE: Firebase client SDK integration
│   ├── firebase.ts          # NEW: Firebase client initialization
│   └── (existing lib files)
└── tests/
    ├── a11y/                # UPDATE: Login flow accessibility tests
    └── (existing tests)

# Backend Tests
tests/blog/
├── auth.test.js             # UPDATE: Firebase token verification tests
├── authorization.test.js    # NEW: Role-based authorization tests
├── audit.test.js            # NEW: Audit logging tests
└── (existing tests)
```

**Structure Decision**: Web application structure with backend (`src/blog/`) and frontend (`frontend/src/`). This matches the existing project layout and follows the BFF pattern where the Next.js frontend proxies auth requests to the backend API.

## Complexity Tracking

> No constitution violations requiring justification. The design follows established patterns.

| Item | Decision | Rationale |
|------|----------|-----------|
| Firebase vs Custom Auth | Firebase Auth | Reduces implementation complexity; handles email/password, session management, token refresh; existing infrastructure preferred over custom JWT implementation |
| Zod vs JSON Schema | Migrate to Zod | Type-safe validation, better TypeScript integration, cleaner error messages; JSON Schema kept for OpenAPI compatibility |
| Audit Log Storage | Application logs (JSON) | Per spec assumptions; no separate audit database required; structured Pino logs with audit entries |
