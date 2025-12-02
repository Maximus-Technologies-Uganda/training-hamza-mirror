# Tasks: Frontend Blog Integration

**Feature Branch**: `003-frontend-blog-integration`  
**Input**: Design documents from `/specs/003-frontend-blog-integration/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Based on spec.md Success Criteria SC-030 through SC-033, tests are included for comprehensive quality assurance including unit, integration, and accessibility validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each phase represents a complete, independently testable increment.

---

## Format: `- [ ] [ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` (markdown checkbox for tracking)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **Exact file paths** included in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Bootstrap Next.js frontend project with all required dependencies

- [X] T001 Create frontend project directory structure per plan.md (frontend/src/app/, frontend/src/components/, frontend/src/lib/, frontend/tests/, frontend/public/)
- [X] T002 Initialize Next.js 14+ App Router project with TypeScript in frontend/ directory
- [X] T003 [P] Configure next.config.js with static export settings (output: 'export', basePath, assetPrefix, unoptimized images)
- [X] T004 [P] Configure TypeScript with strict mode in frontend/tsconfig.json
- [X] T005 [P] Install and configure Tailwind CSS 3.4+ in frontend/tailwind.config.js and frontend/src/styles/globals.css
- [X] T006 [P] Install SWR 2.2+ and react-hook-form 7.52+ dependencies
- [X] T007 [P] Configure Jest 29.7+ and React Testing Library 16+ in frontend/jest.config.js
- [X] T008 [P] Install jest-axe 9.0+ for accessibility testing
- [X] T009 [P] Install MSW 2.3+ for API mocking in tests
- [X] T010 [P] Configure ESLint and Prettier in frontend/.eslintrc.json and frontend/.prettierrc
- [X] T011 [P] Create environment variable template in frontend/.env.example with NEXT_PUBLIC_API_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Create TypeScript type definitions in frontend/src/lib/types.ts (Post, CreatePostInput, UpdatePostInput, ApiError, HealthStatus interfaces)
- [X] T013 Implement API client wrapper in frontend/src/lib/api.ts with fetchApi() function, ApiError class, and error handling
- [X] T014 Copy API client contract from specs/003-frontend-blog-integration/contracts/api-client.ts to frontend/src/lib/api-client.ts
- [X] T015 Create validation rules in frontend/src/lib/validation.ts using react-hook-form schema (title: required, 1-200 chars; body: required, 1-50000 chars)
- [X] T016 [P] Create utility functions in frontend/src/lib/utils.ts (date formatting, slug generation helpers)
- [X] T017 [P] Setup root layout in frontend/src/app/layout.tsx with SWR provider configuration and global metadata
- [X] T018 [P] Create global error boundary in frontend/src/app/error.tsx
- [X] T019 [P] Create 404 page in frontend/src/app/not-found.tsx
- [X] T020 [P] Create loading state in frontend/src/app/loading.tsx
- [X] T021 [P] Setup public/404.html for GitHub Pages SPA routing fallback

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View All Blog Posts (Priority: P1) 🎯 MVP

**Goal**: Enable visitors to browse a list of all published blog posts on the homepage, seeing titles, publication dates, and excerpts for content discovery.

**Independent Test**: Navigate to homepage and verify that a list of posts renders with titles, dates, slugs, and preview text. Should work standalone without other features.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [P] [US1] Unit test for PostCard component in frontend/tests/unit/PostCard.test.tsx (renders title, date, slug, excerpt, link)
- [X] T023 [P] [US1] Unit test for PostList component in frontend/tests/unit/PostList.test.tsx (renders array of posts, handles empty state)
- [X] T024 [P] [US1] Unit test for EmptyState component in frontend/tests/unit/EmptyState.test.tsx
- [X] T025 [P] [US1] Unit test for LoadingSkeleton component in frontend/tests/unit/LoadingSkeleton.test.tsx
- [X] T026 [P] [US1] Integration test for post list page in frontend/tests/integration/post-list.test.tsx (fetches posts, renders list, handles API errors)
- [X] T027 [P] [US1] Accessibility test for PostList in frontend/tests/a11y/PostList.a11y.test.tsx using jest-axe (WCAG 2.1 AA compliance)

### Implementation for User Story 1

- [X] T028 [P] [US1] Create usePosts custom hook in frontend/src/lib/hooks/usePosts.ts with SWR for fetching all posts
- [X] T029 [P] [US1] Create PostCard component in frontend/src/components/PostCard.tsx (displays title, date, slug, excerpt with link to detail)
- [X] T030 [US1] Create PostList component in frontend/src/components/PostList.tsx (maps posts array to PostCard components)
- [X] T031 [P] [US1] Create LoadingSkeleton component in frontend/src/components/LoadingSkeleton.tsx (skeleton UI for loading state)
- [X] T032 [P] [US1] Create EmptyState component in frontend/src/components/EmptyState.tsx (friendly message when no posts exist)
- [X] T033 [P] [US1] Create ErrorMessage component in frontend/src/components/ErrorMessage.tsx (user-friendly error display)
- [X] T034 [US1] Implement homepage in frontend/src/app/page.tsx (fetches posts via usePosts, renders PostList/EmptyState/ErrorMessage)
- [X] T035 [US1] Add responsive styling to PostCard and PostList with Tailwind (mobile 320px, tablet 768px, desktop 1024px+)
- [X] T036 [US1] Add ARIA labels and semantic HTML to PostList for screen reader support
- [X] T037 [US1] Add keyboard navigation support to PostCard (focus indicators, tab order)

**Checkpoint**: At this point, User Story 1 should be fully functional - visitors can view all blog posts on homepage

---

## Phase 4: User Story 2 - View Individual Post Details (Priority: P1)

**Goal**: Enable visitors to click on a blog post to view its full content, including complete body text, title, publication date, and last updated timestamp for deep content consumption.

**Independent Test**: Navigate directly to /posts/[id] URL and verify full post details render correctly with proper formatting and metadata.

### Tests for User Story 2

- [X] T038 [P] [US2] Unit test for PostDetail component in frontend/tests/unit/PostDetail.test.tsx (renders full post data)
- [X] T039 [P] [US2] Integration test for post detail page in frontend/tests/integration/post-detail.test.tsx (fetches single post, handles 404)
- [X] T040 [P] [US2] Accessibility test for PostDetail in frontend/tests/a11y/PostDetail.a11y.test.tsx (heading hierarchy, semantic HTML)

### Implementation for User Story 2

- [X] T041 [P] [US2] Create usePost custom hook in frontend/src/lib/hooks/usePost.ts with SWR for fetching single post by ID
- [X] T042 [P] [US2] Create PostDetail component in frontend/src/components/PostDetail.tsx (displays full title, body, dates, metadata)
- [X] T043 [US2] Implement post detail page in frontend/src/app/posts/[id]/page.tsx (fetches post via usePost, renders PostDetail)
- [X] T044 [P] [US2] Create loading state in frontend/src/app/posts/[id]/loading.tsx (skeleton for post detail)
- [X] T045 [US2] Add date formatting utility usage in PostDetail (human-readable timestamps)
- [X] T046 [US2] Add responsive typography and layout for post body content with Tailwind prose classes
- [X] T047 [US2] Add navigation links (back to home, edit, delete buttons) to PostDetail
- [X] T048 [US2] Handle 404 errors in post detail page (redirect to not-found.tsx when post doesn't exist)

**Checkpoint**: At this point, User Stories 1 AND 2 work - visitors can browse posts and read full content

---

## Phase 5: User Story 3 - Create New Blog Posts (Priority: P2)

**Goal**: Enable content creators to compose and publish new blog posts by filling out a form with title and body content, with validation and feedback before submission.

**Independent Test**: Navigate to /posts/new, fill form with valid data, submit, and verify post appears in list and can be viewed.

### Tests for User Story 3

- [X] T049 [P] [US3] Unit test for PostForm component in frontend/tests/unit/PostForm.test.tsx (renders fields, validates input, handles submission)
- [X] T050 [P] [US3] Integration test for create post workflow in frontend/tests/integration/create-post.test.tsx (submits form, redirects to detail)
- [X] T051 [P] [US3] Accessibility test for PostForm in frontend/tests/a11y/PostForm.a11y.test.tsx (labels, error announcements, keyboard support)

### Implementation for User Story 3

- [X] T052 [P] [US3] Create PostForm component in frontend/src/components/PostForm.tsx with react-hook-form (title input, body textarea, validation)
- [X] T053 [US3] Implement create post page in frontend/src/app/posts/new/page.tsx (renders PostForm for creation)
- [X] T054 [US3] Add form validation rules to PostForm (required fields, character limits, whitespace checks)
- [X] T055 [US3] Add character count display for title field in PostForm (shows X/200 characters)
- [X] T056 [US3] Implement form submission handler in PostForm (calls createPost API, handles loading state)
- [X] T057 [US3] Add error handling in PostForm (displays API validation errors inline near fields)
- [X] T058 [US3] Add success handling in PostForm (redirects to new post detail page after creation)
- [X] T059 [US3] Add cancel button in PostForm (navigates back to home without saving)
- [X] T060 [US3] Add loading/disabled state to submit button during API call
- [X] T061 [US3] Add "Create New Post" button to homepage linking to /posts/new

**Checkpoint**: At this point, User Stories 1, 2, AND 3 work - visitors can browse, read, AND create posts

---

## Phase 6: User Story 4 - Edit Existing Blog Posts (Priority: P2)

**Goal**: Enable content creators to update existing blog posts to correct errors, add information, or revise content, with changes validated before submission and immediately reflected upon success.

**Independent Test**: Navigate to post detail page, click "Edit", modify content, save, and verify changes are reflected.

### Tests for User Story 4

- [X] T062 [P] [US4] Integration test for edit post workflow in frontend/tests/integration/edit-post.test.tsx (pre-populates form, updates post, handles 404)
- [X] T063 [P] [US4] Unit test for PostForm with edit mode in frontend/tests/unit/PostForm.test.tsx (default values populated)

### Implementation for User Story 4

- [X] T064 [US4] Extend PostForm component to support edit mode (accept post prop, set defaultValues)
- [X] T065 [US4] Implement edit post page in frontend/src/app/posts/[id]/edit/page.tsx (fetches post, renders PostForm with data)
- [X] T066 [P] [US4] Create loading state in frontend/src/app/posts/[id]/edit/loading.tsx
- [X] T067 [US4] Implement update submission handler in PostForm (calls updatePost API with partial data)
- [X] T068 [US4] Add "Edit" button to PostDetail component linking to /posts/[id]/edit
- [X] T069 [US4] Add visual indication of unsaved changes in edit form (dirty state detection)
- [X] T070 [US4] Handle post not found errors in edit page (redirect to 404 if post deleted)

**Checkpoint**: At this point, User Stories 1-4 work - visitors can browse, read, create, AND edit posts

---

## Phase 7: User Story 5 - Delete Blog Posts (Priority: P3)

**Goal**: Enable content creators to permanently remove blog posts that are no longer needed, with confirmation required before deletion to prevent accidental data loss.

**Independent Test**: Navigate to post detail page, initiate deletion, confirm, and verify post no longer appears in list.

### Tests for User Story 5

- [X] T071 [P] [US5] Unit test for DeleteConfirm component in frontend/tests/unit/DeleteConfirm.test.tsx (modal, confirmation, cancel)
- [X] T072 [P] [US5] Integration test for delete post workflow in frontend/tests/integration/delete-post.test.tsx (confirms deletion, removes from list)
- [X] T073 [P] [US5] Accessibility test for DeleteConfirm in frontend/tests/a11y/DeleteConfirm.a11y.test.tsx (focus management, keyboard support)

### Implementation for User Story 5

- [X] T074 [P] [US5] Create DeleteConfirm modal component in frontend/src/components/DeleteConfirm.tsx (confirmation dialog with cancel/confirm buttons)
- [X] T075 [US5] Add delete button to PostDetail component (opens DeleteConfirm modal)
- [X] T076 [US5] Implement deletion handler in DeleteConfirm (calls deletePost API, redirects to home on success)
- [X] T077 [US5] Add loading state to confirm button during deletion
- [X] T078 [US5] Handle deletion errors in DeleteConfirm (displays error message, keeps post intact)
- [X] T079 [US5] Add keyboard support to DeleteConfirm modal (Escape to cancel, Enter to confirm, focus trap)
- [X] T080 [US5] Add ARIA attributes to modal (role="dialog", aria-labelledby, aria-describedby)
- [X] T081 [US5] Implement SWR cache mutation to optimistically remove post from list after deletion

**Checkpoint**: At this point, User Stories 1-5 work - full CRUD functionality complete

---

## Phase 8: User Story 6 - API Health Status Indicator (Priority: P3)

**Goal**: Display a visual indicator of the Blog API's health status to help diagnose connectivity issues and inform users when the service is unavailable.

**Independent Test**: Call /health endpoint and display status with appropriate visual indicators (green when healthy, warning when unavailable).

### Tests for User Story 6

- [X] T082 [P] [US6] Unit test for HealthIndicator component in frontend/tests/unit/HealthIndicator.test.tsx (displays status, updates on change)
- [X] T083 [P] [US6] Integration test for health check in frontend/tests/integration/health-check.test.tsx (polls API, handles errors)

### Implementation for User Story 6

- [X] T084 [P] [US6] Create useHealth custom hook in frontend/src/lib/hooks/useHealth.ts with SWR (polls /health every 30 seconds)
- [X] T085 [P] [US6] Create HealthIndicator component in frontend/src/components/HealthIndicator.tsx (displays API status with visual indicator)
- [X] T086 [US6] Add HealthIndicator to root layout in frontend/src/app/layout.tsx (visible on all pages)
- [X] T087 [US6] Style HealthIndicator with Tailwind (green badge when healthy, yellow/red banner when unhealthy)
- [X] T088 [US6] Add ARIA live region to HealthIndicator for screen reader announcements

**Checkpoint**: All user stories complete - application has full functionality with health monitoring

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

- [X] T089 [P] Create comprehensive README.md in frontend/ directory with setup instructions, environment variables (NEXT_PUBLIC_API_URL), and deployment guide
- [X] T090 [P] Add "Frontend Demo" section to root README.md with link to GitHub Pages deployment
- [X] T091 [P] Create GitHub Actions workflow in .github/workflows/frontend-deploy.yml (CI: type-check, lint, test, build; CD: deploy to GitHub Pages)
- [X] T092 Run type-check across entire frontend codebase (npm run type-check) and fix any TypeScript errors
- [X] T093 Run linter across entire frontend codebase (npm run lint) and fix any violations
- [X] T094 Run all tests with coverage report (npm run test:coverage) - **RESULT: 56.86% statements, 66.66% branches. Tests pass (276/276) but below 70% threshold. Components at 92.99%. See journal 2025-11-28.md**
- [ ] T095 [P] Run Lighthouse CI against production build - **NOTE: Lighthouse blocked by Chrome interstitial errors. Bundle size verified: <110KB. Requires manual DevTools audit. See journal 2025-11-28.md**
- [X] T096 [P] Verify bundle size <500KB compressed (npm run build, check output) (SC-024) - **VERIFIED: 104-106KB First Load JS per page**
- [ ] T097 Manual accessibility testing: keyboard navigation through all workflows (create/edit/delete) (SC-007) - **Template ready in journal, awaiting manual execution**
- [ ] T098 Manual accessibility testing: screen reader testing with NVDA or VoiceOver (SC-013) - **Template ready in journal, awaiting manual execution**
- [ ] T099 Manual responsive design testing: verify layout on 320px, 768px, 1024px, 1920px widths (SC-020) - **Template ready in journal, awaiting manual execution**
- [ ] T100 Run all quickstart.md test scenarios to validate complete application functionality - **Template ready in journal, awaiting manual execution**
- [X] T101 Document NEXT_PUBLIC_API_URL configuration in frontend/README.md with examples for dev and production
- [X] T102 Create deployment documentation with GitHub Pages specific configuration (basePath, assetPrefix)
- [X] T103 Add code comments and JSDoc to all API functions and custom hooks
- [X] T104 Optimize images and static assets for web delivery (WebP format, compression)
- [X] T105 Review and refactor duplicate code across components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on User Story 3 (needs PostForm component from US3)
- **User Story 5 (Phase 7)**: Depends on User Story 2 (needs PostDetail component from US2)
- **User Story 6 (Phase 8)**: Depends on Foundational (Phase 2) completion - Can run in parallel with other stories
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational) ← BLOCKS EVERYTHING
         ↓
    ┌────┴────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓
   US1       US2       US3       US6  ← Can all start in parallel after Phase 2
  (P1)      (P1)      (P2)      (P3)
    │         │         │
    │         │         ↓
    │         │        US4 (P2) ← Needs US3's PostForm
    │         │
    │         ↓
    │        US5 (P3) ← Needs US2's PostDetail
    │
    └──── MVP (just US1 can deliver value!)
```

### MVP Definition

**Minimum Viable Product = Phase 1 + Phase 2 + Phase 3 (User Story 1 only)**

This delivers:
- Working Next.js frontend deployed to GitHub Pages
- List of all blog posts on homepage
- Responsive design (mobile/tablet/desktop)
- Error handling and loading states
- Accessibility compliant (WCAG 2.1 AA)
- Immediate value: visitors can discover and browse content

### Incremental Delivery Strategy

1. **Foundation** (Phase 1 + 2): ~15-20 tasks → Project setup complete
2. **MVP** (Phase 3): +11 tasks → User Story 1 complete → DEPLOY & DEMO ✅
3. **Read-Only** (Phase 4): +11 tasks → User Story 2 complete → DEPLOY & DEMO ✅
4. **Content Creation** (Phase 5): +13 tasks → User Story 3 complete → DEPLOY & DEMO ✅
5. **Content Management** (Phase 6): +9 tasks → User Story 4 complete → DEPLOY & DEMO ✅
6. **Content Lifecycle** (Phase 7): +11 tasks → User Story 5 complete → DEPLOY & DEMO ✅
7. **Monitoring** (Phase 8): +7 tasks → User Story 6 complete → DEPLOY & DEMO ✅
8. **Production Ready** (Phase 9): +17 tasks → Polish complete → FINAL RELEASE ✅

Each phase adds value without breaking previous functionality!

### Within Each User Story

- Tests MUST be written FIRST and FAIL before implementation
- Custom hooks before components (data layer before UI)
- Individual components before page composition
- Core functionality before styling/polish
- Happy path before edge cases
- Story must be independently testable before moving to next priority

### Parallel Opportunities

#### Within Setup (Phase 1)
All [P] tasks can run simultaneously:
- T003 (next.config.js), T004 (tsconfig.json), T005 (Tailwind), T006 (deps), T007 (Jest), T008 (jest-axe), T009 (MSW), T010 (ESLint/Prettier), T011 (.env.example)

#### Within Foundational (Phase 2)
Parallel groups:
- T016, T017, T018, T019, T020, T021 (all independent utilities and pages)

#### Within User Story 1 (Phase 3)
Parallel test writing:
- T022-T027 (all tests can be written in parallel)

Parallel component creation:
- T028 (hook), T029 (PostCard), T031 (skeleton), T032 (empty), T033 (error) → all independent

#### Within User Story 2 (Phase 4)
Parallel tasks:
- T038-T040 (tests)
- T041 (hook), T042 (component), T044 (loading) → independent

#### Across User Stories (After Phase 2)
If you have multiple developers:
- Developer A: User Story 1 (T022-T037)
- Developer B: User Story 2 (T038-T048)
- Developer C: User Story 6 (T082-T088) ← No dependencies on US1/US2
- Then: Developer A → US3, Developer B → US5, Developer C → US4

---

## Parallel Example: User Story 1 Implementation

```bash
# Step 1: Launch all tests in parallel (write first, should FAIL)
Parallel Task T022: "Unit test for PostCard component"
Parallel Task T023: "Unit test for PostList component"
Parallel Task T024: "Unit test for EmptyState component"
Parallel Task T025: "Unit test for LoadingSkeleton component"
Parallel Task T026: "Integration test for post list page"
Parallel Task T027: "Accessibility test for PostList"

# Step 2: Launch all independent components in parallel
Parallel Task T028: "Create usePosts custom hook"
Parallel Task T029: "Create PostCard component"
Parallel Task T031: "Create LoadingSkeleton component"
Parallel Task T032: "Create EmptyState component"
Parallel Task T033: "Create ErrorMessage component"

# Step 3: Sequential composition
Task T030: "Create PostList component" (needs PostCard from T029)
Task T034: "Implement homepage" (needs PostList from T030, usePosts from T028)

# Step 4: Polish in parallel
Parallel Task T035: "Add responsive styling"
Parallel Task T036: "Add ARIA labels"
Parallel Task T037: "Add keyboard navigation"
```

---

## Implementation Strategy Summary

### Recommended Approach: MVP First

1. **Complete Phase 1 (Setup)**: ~11 tasks
   - Sets up entire Next.js project structure
   - Installs all dependencies
   - Configures build tools

2. **Complete Phase 2 (Foundational)**: ~10 tasks
   - Creates type definitions and API client
   - Establishes core infrastructure
   - **CRITICAL CHECKPOINT**: Nothing else works until this is done

3. **Complete Phase 3 (User Story 1)**: ~16 tasks
   - Delivers MVP: browsing blog posts
   - **VALIDATE**: Test independently, deploy, demo
   - **DECISION POINT**: Stop here for MVP or continue

4. **Incremental Addition**: Add User Stories 2-6 based on priority
   - Each story independently testable
   - Each story deliverable as increment
   - Can stop at any point with working application

### Validation Checkpoints

After each user story phase:
- [ ] All tests for that story pass
- [ ] Story functionality works independently
- [ ] No regressions in previous stories
- [ ] Accessibility validation passes (jest-axe)
- [ ] Manual keyboard navigation works
- [ ] Responsive design verified

---

## Task Statistics

**Total Tasks**: 105

**By Phase**:
- Phase 1 (Setup): 11 tasks
- Phase 2 (Foundational): 10 tasks
- Phase 3 (User Story 1): 16 tasks
- Phase 4 (User Story 2): 11 tasks
- Phase 5 (User Story 3): 13 tasks
- Phase 6 (User Story 4): 9 tasks
- Phase 7 (User Story 5): 11 tasks
- Phase 8 (User Story 6): 7 tasks
- Phase 9 (Polish): 17 tasks

**By Priority**:
- P1 tasks (MVP): 27 tasks (Setup + Foundational + US1 + US2)
- P2 tasks: 22 tasks (US3 + US4)
- P3 tasks: 18 tasks (US5 + US6)
- Cross-cutting: 17 tasks (Polish)

**Test Coverage**:
- Unit tests: 14 tasks
- Integration tests: 7 tasks
- Accessibility tests: 5 tasks
- Total test tasks: 26 (24.8% of all tasks)

**Parallelizable Tasks**: 41 tasks marked [P] (39% can run in parallel)

**Independent Test Criteria**:
- User Story 1: Navigate to homepage, verify post list renders
- User Story 2: Navigate to /posts/[id], verify full post displays
- User Story 3: Navigate to /posts/new, create post, verify in list
- User Story 4: Navigate to post, click edit, modify, verify changes
- User Story 5: Navigate to post, delete, confirm removal from list
- User Story 6: Observe health indicator, verify status updates

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = 37 tasks (35% of total) delivers working blog viewer

---

## Format Validation

✅ All tasks follow required checklist format:
- [x] Checkbox: `- [ ]` present on every task
- [x] Task ID: Sequential T001-T105
- [x] [P] marker: 41 tasks marked as parallelizable
- [x] [Story] label: 81 tasks labeled with user story (US1-US6)
- [x] Description: All include specific file paths and clear actions

✅ All user stories from spec.md mapped to tasks:
- [x] User Story 1 (P1): View All Blog Posts → Phase 3 (16 tasks)
- [x] User Story 2 (P1): View Individual Post Details → Phase 4 (11 tasks)
- [x] User Story 3 (P2): Create New Blog Posts → Phase 5 (13 tasks)
- [x] User Story 4 (P2): Edit Existing Blog Posts → Phase 6 (9 tasks)
- [x] User Story 5 (P3): Delete Blog Posts → Phase 7 (11 tasks)
- [x] User Story 6 (P3): API Health Status Indicator → Phase 8 (7 tasks)

✅ Tests included as required by spec.md Success Criteria SC-030 through SC-033

---

## Notes

- Tests are written FIRST and MUST FAIL before implementation (TDD approach)
- [P] tasks work on different files with no dependencies on incomplete tasks
- [Story] label maps each task to specific user story for traceability
- Each user story phase delivers independently testable increment
- Stop at any checkpoint to validate and deploy working application
- MVP = just User Story 1 = 37 tasks = immediate value to users
- Environment variable NEXT_PUBLIC_API_URL must be configured before first run
- Static export constraint eliminates server-side features (per TC-005)
- GitHub Pages deployment requires basePath configuration (per TC-008)
- All components must meet WCAG 2.1 AA accessibility standards (per FR-038-FR-047)
