# Release Notes — v6.0.0

**Release Date**: December 5, 2025  
**Feature**: Blog Frontend (Next.js)  
**Branch**: `003-frontend-blog-integration`  
**Developer**: Hamza Kavuma

---

## 🎯 Overview

Version 6.0.0 introduces a **production-ready Next.js frontend** for the Blog Posts API. This release includes full CRUD functionality, comprehensive accessibility compliance (WCAG 2.1 AA), and automated testing with Jest, React Testing Library, and Playwright E2E.

This release follows the spec-first approach with integrated CI/CD pipeline, coverage tracking, and GitHub Pages deployment.

---

## 🔗 Release Links

| Link | Description |
|------|-------------|
| **🚀 Live Demo** | [https://maximus-technologies-uganda.github.io/training-hamza/](https://maximus-technologies-uganda.github.io/training-hamza/) |
| **📊 CI Gate Run** | [GitHub Actions](https://github.com/Maximus-Technologies-Uganda/training-hamza/actions) |
| **📦 Review Packet** | Available in CI artifacts (`review-packet-*`) |
| **📋 Spec PR** | Branch `003-frontend-blog-integration` → `development` |

---

## ✨ Features

### Frontend Functionality

- **Post List View** (`/`)
  - Browse all blog posts with titles, dates, and excerpts
  - Loading skeleton states
  - Empty state messaging
  - Real-time updates with SWR

- **Post Detail View** (`/posts/[id]`)
  - Full post content with metadata
  - Shareable URLs
  - Edit and delete actions
  - Back navigation

- **Create Post** (`/posts/new`)
  - Form validation with react-hook-form
  - Real-time field validation
  - Loading state during submission
  - Success redirect to post detail

- **Edit Post** (`/posts/[id]/edit`)
  - Pre-populated form fields
  - Change detection
  - Cancel confirmation
  - Optimistic UI updates

- **Delete Post**
  - Confirmation dialog
  - Optimistic removal from list
  - Undo capability (via SWR revalidation)

### Technical Implementation

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.5+ (strict mode)
- **Styling**: Tailwind CSS 3.4+
- **Data Fetching**: SWR 2.2+ (automatic caching & revalidation)
- **Forms**: react-hook-form 7.52+
- **Deployment**: Static export to GitHub Pages

### Accessibility (WCAG 2.1 AA)

- ✅ Semantic HTML structure
- ✅ Labeled form controls
- ✅ Focus management after actions
- ✅ `aria-live` regions for dynamic content
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Screen reader compatibility

### Testing

- **Unit Tests**: Jest + React Testing Library
- **Accessibility Tests**: jest-axe automated a11y checks
- **Integration Tests**: Component integration testing
- **E2E Tests**: Playwright browser automation
- **Coverage**: 87%+ statement coverage

---

## 📊 Quality Gates

| Gate | Status | Threshold |
|------|--------|-----------|
| TypeScript type-check | ✅ Pass | No errors |
| ESLint | ✅ Pass | No warnings |
| Unit tests | ✅ Pass | All passing |
| Coverage (statements) | ✅ 87%+ | ≥50% |
| Build (`next build`) | ✅ Pass | No warnings |
| Playwright E2E | ✅ Pass | All scenarios |
| A11y smoke tests | ✅ Pass | No violations |

---

## 🔧 CI/CD Improvements

### Playwright CI Fix
- Added `wait-on` for reliable server startup detection
- Proper error handling if servers fail to start
- Both API server (port 3000) and frontend (port 5000) verified before tests

### Coverage Summary Fix
- Fixed `coverage-summary.md` generation in review packet
- Proper `frontend-next` section with coverage percentages
- Multiple path detection for coverage-summary.json

### GitHub Pages Deployment
- Automatic deployment on `main` branch merges
- Static export configuration with basePath
- 404.html SPA fallback for client-side routing

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Post list (home)
│   │   └── posts/
│   │       ├── [id]/page.tsx   # Post detail
│   │       ├── [id]/edit/      # Edit post
│   │       └── new/            # Create post
│   ├── components/             # Reusable components
│   └── lib/                    # API client, utilities
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── a11y/                   # Accessibility tests
└── e2e/                        # Playwright E2E tests
```

---

## 🏃 Run & Try

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------||
| `NEXT_PUBLIC_API_URL` | Yes | Blog API base URL | `http://localhost:3000` |

### Quick Start

```bash
# Start the Blog API
node src/blog/server.js

# Start the frontend (in separate terminal)
cd frontend
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 📝 Documentation

- [Spec](./specs/003-frontend-blog-integration/spec.md) - User stories, acceptance criteria, accessibility requirements
- [Plan](./specs/003-frontend-blog-integration/plan.md) - Implementation plan and milestones
- [Frontend README](./frontend/README.md) - Detailed setup and configuration guide

---

## ⬆️ Upgrade Notes

This release is additive and does not introduce breaking changes to the Blog API. The frontend is a new addition that consumes the existing API.

**Requirements**:
- Node.js 18+
- Blog API v5.0.0+ running
- Modern browser with JavaScript enabled

---

## 🙏 Acknowledgments

Built following the spec-first methodology with comprehensive test coverage and accessibility-first design principles.
