# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Primary Requirement**: Build a responsive web frontend that enables users to view, create, edit, and delete blog posts through an intuitive interface, consuming the Blog Posts API (feature 002). The application must provide full CRUD functionality with comprehensive error handling, WCAG 2.1 AA accessibility compliance, and be deployable as a static site to GitHub Pages.

**Technical Approach**: 
- **Framework**: Next.js 14+ App Router with TypeScript strict mode for type safety and modern React patterns
- **Data Fetching**: Client-side fetching with SWR for automatic caching, revalidation, and error handling (required by static export constraint)
- **Styling**: Tailwind CSS utility-first approach for responsive design across mobile, tablet, and desktop
- **State Management**: SWR for server state, react-hook-form for form validation, React useState for local UI state
- **Testing**: Jest + React Testing Library for component tests, jest-axe for accessibility validation, MSW for API mocking
- **Deployment**: Static HTML/CSS/JS export to GitHub Pages via GitHub Actions CI/CD pipeline

**Key Trade-offs**:
- Static export enables free hosting but eliminates SEO benefits (no server-side rendering)
- Client-side data fetching simplifies architecture but requires loading states
- No pagination initially (acceptable for 0-1000 posts per spec assumption)

## Technical Context

**Language/Version**: TypeScript 5.5+ / JavaScript ES2020+  
**Framework**: Next.js 14.2+ with App Router, React 18.3+  
**Primary Dependencies**: 
  - **Data Fetching**: SWR 2.2+ (client-side caching, revalidation)
  - **Forms**: react-hook-form 7.52+ (validation, state management)
  - **Styling**: Tailwind CSS 3.4+ with @tailwindcss/forms plugin
  - **API Integration**: Native fetch API with typed wrappers

**Storage**: Browser-side only (SWR cache in memory, no persistence required)  
**Testing**: 
  - **Unit/Component**: Jest 29.7+ with React Testing Library 16+, jest-dom 6.4+
  - **Accessibility**: jest-axe 9.0+ (automated WCAG 2.1 AA validation)
  - **Integration**: MSW (Mock Service Worker) 2.3+ for API mocking
  - **Coverage Target**: ≥70% per spec SC-030

**Target Platform**: Static web application (GitHub Pages)
  - **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (ES2020 support)
  - **Devices**: Responsive 320px-2560px width (mobile, tablet, desktop)
  - **Deployment**: Static HTML/CSS/JS export (Next.js output: 'export')

**Project Type**: Web frontend (single-page application with client-side routing)

**Performance Goals**: 
  - Initial page load: <3s on 10 Mbps connection (SC-023)
  - Time to interactive: <500ms for UI operations (SC-009)
  - Bundle size: <500KB compressed (SC-024)
  - Lighthouse scores: Performance ≥85, Accessibility = 100 (SC-025, SC-026)

**Constraints**: 
  - **Static Export Only**: No server-side rendering, API routes, or middleware (TC-005)
  - **Client-Side Data Fetching**: All API calls after initial page load (no SSR/SSG for dynamic content)
  - **No Server Features**: Cannot use Next.js server components requiring runtime server
  - **GitHub Pages**: Base path configuration required for repo hosting (TC-008)
  - **Accessibility**: WCAG 2.1 AA compliance mandatory (FR-038 to FR-047)

**Scale/Scope**: 
  - **Content**: 0-1000 blog posts initially (no pagination per A-016)
  - **Users**: Public access, no authentication (all visitors can CRUD)
  - **API Dependency**: Blog Posts API (feature 002) at configurable endpoint
  - **Components**: ~15-20 React components (pages, forms, cards, lists, errors)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (Post-Design Review - November 27, 2025)

**Note**: The constitution template is currently unpopulated (contains placeholder markers). Based on standard software engineering principles and the existing repository structure (see feature 002-blog-api), this feature adheres to established best practices.

### Initial Review (Pre-Phase 0)
1. **Clear Separation of Concerns**: Frontend separated from backend API ✅
2. **Test-First Approach**: Jest + React Testing Library tests specified before implementation ✅
3. **Documentation**: Comprehensive spec, plan, research artifacts required ✅
4. **Accessibility**: WCAG 2.1 AA compliance enforced via automated testing ✅
5. **Type Safety**: TypeScript strict mode mandatory ✅
6. **Static Analysis**: ESLint + Prettier in CI pipeline ✅

### Post-Design Re-evaluation (After Phase 1)

**Architecture Decisions Validated**:
- ✅ **Frontend/Backend Separation**: Clean API boundary via OpenAPI contract
- ✅ **Technology Stack**: Standard industry patterns (Next.js, React, TypeScript, Tailwind)
- ✅ **State Management**: Appropriate for scale (SWR for server state, no over-engineering)
- ✅ **Testing Strategy**: Comprehensive (unit, integration, accessibility, contract-based)
- ✅ **Deployment**: Static export aligns with constraints (free hosting, no server management)

**Design Patterns Applied**:
1. **Component-Based Architecture**: Reusable React components with single responsibility
2. **Custom Hooks**: Encapsulate data fetching logic (usePosts, usePost, useHealth)
3. **Error Boundaries**: Graceful error handling at multiple levels
4. **Type Safety**: Full TypeScript coverage with interfaces for all API entities
5. **Accessibility First**: WCAG 2.1 AA enforced via jest-axe in CI

**No Constitution Violations**:
- No complex abstractions without justification (SWR chosen over Redux due to simplicity)
- No new backend services (consumes existing Blog Posts API)
- Test coverage targets specified and enforced (≥70% via CI)
- Documentation complete (spec, plan, research, data-model, contracts, quickstart)
- CI/CD evidence mapping included (26 evidence points)

**Complexity Justified**:
- Next.js App Router: Required for modern React patterns, static export capability
- TypeScript: Mandatory for type safety per spec requirements
- Tailwind CSS: Standard utility-first approach, no custom CSS framework
- SWR: Lightweight data fetching, simpler than alternatives (Redux, React Query)

**Conclusion**: ✅ All constitution gates passed. Design follows established patterns with appropriate complexity for requirements.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web Application Structure (frontend separate from existing backend)
# Backend already exists: src/blog/ (feature 002-blog-api)
# Frontend will be created in new directory:

frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Home page (post list)
│   │   ├── error.tsx                 # Error boundary
│   │   ├── loading.tsx               # Loading state
│   │   ├── not-found.tsx             # 404 page
│   │   └── posts/
│   │       ├── [id]/
│   │       │   ├── page.tsx          # Post detail view
│   │       │   ├── loading.tsx       # Detail loading
│   │       │   └── edit/
│   │       │       └── page.tsx      # Edit post form
│   │       └── new/
│   │           └── page.tsx          # Create post form
│   ├── components/                   # Reusable React components
│   │   ├── PostList.tsx              # List of post cards
│   │   ├── PostCard.tsx              # Single post preview
│   │   ├── PostForm.tsx              # Create/edit form
│   │   ├── DeleteConfirm.tsx         # Deletion confirmation modal
│   │   ├── HealthIndicator.tsx       # API status indicator
│   │   ├── ErrorMessage.tsx          # Error display component
│   │   ├── LoadingSkeleton.tsx       # Loading state skeleton
│   │   └── EmptyState.tsx            # Empty list placeholder
│   ├── lib/                          # Utilities and helpers
│   │   ├── api.ts                    # API client functions
│   │   ├── types.ts                  # TypeScript interfaces
│   │   ├── constants.ts              # Configuration constants
│   │   ├── utils.ts                  # Helper functions (date formatting, etc.)
│   │   └── hooks/                    # Custom React hooks
│   │       ├── usePosts.ts           # Posts data fetching
│   │       ├── usePost.ts            # Single post fetching
│   │       └── useHealth.ts          # API health check
│   └── styles/
│       └── globals.css               # Tailwind imports + custom styles
├── public/                           # Static assets
│   └── 404.html                      # GitHub Pages SPA fallback
├── tests/
│   ├── unit/                         # Component unit tests
│   │   ├── PostCard.test.tsx
│   │   ├── PostForm.test.tsx
│   │   └── HealthIndicator.test.tsx
│   ├── integration/                  # API integration tests
│   │   ├── post-workflow.test.tsx
│   │   └── error-handling.test.tsx
│   └── a11y/                         # Accessibility tests
│       ├── PostList.a11y.test.tsx
│       ├── PostForm.a11y.test.tsx
│       └── navigation.a11y.test.tsx
├── .github/
│   └── workflows/
│       └── frontend-deploy.yml       # GitHub Pages deployment
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── jest.config.js                    # Jest testing configuration
├── .eslintrc.json                    # ESLint rules
├── .prettierrc                       # Prettier formatting
├── package.json                      # Dependencies
└── README.md                         # Frontend documentation

# Existing backend (no changes):
src/blog/                             # Feature 002 - Blog Posts API
├── server.js
├── routes/
├── services/
├── storage/
└── middleware/
```

**Structure Decision**: Web application structure selected. Frontend created in dedicated `frontend/` directory to maintain separation from existing backend API in `src/blog/`. This follows the repository's existing pattern of feature-based organization while keeping frontend and backend codebases independent. The App Router structure organizes pages by route with collocated loading/error states. Components, utilities, and tests are separated for clarity and maintainability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
