# Implementation Plan: Blog Authentication & Authorization

**Branch**: `004-blog-auth` | **Date**: December 5, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-blog-auth/spec.md`

## Summary

Add authentication (simple username/password login with JWT) and authorization (ownership-based access control) to the Blog Posts API and Next.js frontend. Posts gain an `ownerId` field; write operations require auth + ownership; reads remain public. Includes observability improvements (request-id, structured logs, /health enhancement) and CI latency reporting.

## Technical Context

**Language/Version**: Node.js 20+ (ES Modules), TypeScript 5.5+ (frontend)  
**Primary Dependencies**: Fastify 4.x, jsonwebtoken, bcrypt (API); Next.js 14, react-hook-form, swr (frontend)  
**Storage**: Memory/SQLite/Firestore (existing adapters extended with User entity)  
**Testing**: Vitest (API), Jest (frontend), Playwright (e2e)  
**Target Platform**: Linux server (API on Cloud Run), GitHub Pages (static frontend)  
**Project Type**: web (backend + frontend)  
**Performance Goals**: p95 < 200ms for create/list operations  
**Constraints**: Static export for frontend (no SSR for data), JWT in localStorage  
**Scale/Scope**: Single-tenant, ~10 concurrent users, pre-configured test users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | ✅ PASS | Auth logic isolated in `services/auth.js` and `middleware/auth.js` |
| Test-First | ✅ PASS | Contract tests for auth endpoints, unit tests for JWT/ownership |
| Observability | ✅ PASS | Request-id propagation, structured JSON logging, /health endpoint |
| Simplicity | ✅ PASS | Simple username/password, no OAuth complexity; pre-configured users |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/004-blog-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml     # Extended with auth
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
# Backend (existing structure extended)
src/blog/
├── server.js                  # Add auth middleware registration
├── middleware/
│   ├── error-handler.js       # Extend for 401/403 responses
│   ├── auth.js                # NEW: JWT validation middleware
│   └── request-id.js          # NEW: Request-id propagation
├── models/
│   ├── post.js                # Extend with ownerId field
│   └── user.js                # NEW: User entity
├── routes/
│   ├── health.js              # Extend with version/uptime
│   ├── posts.js               # Add auth requirements
│   └── auth.js                # NEW: Login endpoint
├── services/
│   ├── post-service.js        # Extend with ownership checks
│   ├── auth-service.js        # NEW: JWT signing/validation
│   └── user-service.js        # NEW: User lookup, password verification
└── storage/
    ├── memory-storage.js      # Extend for users
    └── sqlite-storage.js      # Extend for users

tests/blog/
├── contract/
│   ├── auth.contract.test.js  # NEW: Auth endpoint contracts
│   └── posts.contract.test.js # Extend with auth scenarios
├── unit/
│   ├── auth-service.test.js   # NEW: JWT tests
│   └── auth-middleware.test.js # NEW: Middleware tests
└── integration/
    └── ownership.test.js      # NEW: End-to-end ownership tests

# Frontend (existing structure extended)
frontend/src/
├── app/
│   ├── login/
│   │   └── page.tsx           # NEW: Login page
│   ├── posts/
│   │   ├── [id]/
│   │   │   └── page.tsx       # Extend with ownership-aware buttons
│   │   └── new/
│   │       └── page.tsx       # Extend with auth redirect
│   └── layout.tsx             # Add auth provider, nav changes
├── components/
│   ├── AuthProvider.tsx       # NEW: Auth context
│   ├── LoginForm.tsx          # NEW: Login form
│   ├── LogoutButton.tsx       # NEW: Logout button
│   └── PostActions.tsx        # NEW: Ownership-aware edit/delete
├── lib/
│   ├── api.ts                 # Extend with auth header
│   ├── auth.ts                # NEW: Token storage, auth state
│   └── errors.ts              # NEW: 401/403 message mapping
└── styles/
    └── globals.css            # Auth-related styles

frontend/tests/
├── unit/
│   ├── auth.test.ts           # NEW: Auth hook tests
│   └── errors.test.ts         # NEW: Error mapping tests
└── integration/
    └── auth-flow.test.tsx     # NEW: Login/logout integration
```

**Structure Decision**: Web application pattern with separate backend/frontend. Backend extends existing Fastify structure with new auth middleware and routes. Frontend extends existing Next.js App Router structure with auth context and protected routes.

## Complexity Tracking

> **No violations - table not required.**

