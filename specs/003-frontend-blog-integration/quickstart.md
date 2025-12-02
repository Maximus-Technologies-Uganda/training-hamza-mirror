# Quickstart Guide: Frontend Blog Integration

**Feature**: 003-frontend-blog-integration  
**Date**: November 27, 2025  
**Audience**: Developers setting up and testing the frontend application

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Development Workflow](#development-workflow)
5. [Testing Scenarios](#testing-scenarios)
6. [Build & Deployment](#build--deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Node.js | 18.x or 20.x | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| npm | 9.x or 10.x | Package manager | Bundled with Node.js |
| Git | 2.x+ | Version control | [git-scm.com](https://git-scm.com/) |

### Verify Installation

```bash
node --version    # Should show v18.x or v20.x
npm --version     # Should show 9.x or 10.x
git --version     # Should show 2.x+
```

### Required Services

- **Blog Posts API**: Must be running (feature 002-blog-api)
  - Default: `http://localhost:3000`
  - See: `src/blog/README.md` for API setup

---

## Initial Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/Maximus-Technologies-Uganda/training-hamza.git
cd training-hamza

# Switch to feature branch
git checkout 003-frontend-blog-integration
```

### 2. Navigate to Frontend Directory

```bash
cd frontend
```

### 3. Install Dependencies

```bash
npm install
```

**Expected output**:
```
added 250+ packages in 30s
```

**Key dependencies installed**:
- Next.js 14.2+
- React 18.3+
- TypeScript 5.5+
- Tailwind CSS 3.4+
- SWR 2.2+
- react-hook-form 7.52+
- Testing libraries (Jest, React Testing Library, jest-axe)

---

## Environment Configuration

### Development Environment

Create `.env.local` in `frontend/` directory:

```bash
# .env.local (DO NOT COMMIT)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: This file is git-ignored and won't be committed.

### Production Environment

For production builds, set environment variable at build time:

```bash
# Set before building
export NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Then build
npm run build
```

Or in CI/CD:

```yaml
# .github/workflows/frontend-deploy.yml
- name: Build
  run: npm run build
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

**Output**:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3001
- Ready in 2.3s
```

**Open in browser**: http://localhost:3001

### Development Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run dev` | Start dev server with hot reload | Active development |
| `npm run build` | Build production bundle | Before deployment, testing production |
| `npm run start` | Serve production build | Test production locally |
| `npm run lint` | Run ESLint | Before commit |
| `npm run type-check` | Run TypeScript compiler | Before commit, find type errors |
| `npm test` | Run tests once | CI, manual verification |
| `npm run test:watch` | Run tests in watch mode | Active test development |
| `npm run test:coverage` | Generate coverage report | Check test coverage |

### Hot Reload

Changes to files in `src/` automatically reload the browser:
- **React components**: Instant hot reload (preserves state)
- **API functions**: Page refresh
- **Styles**: Instant update

---

## Testing Scenarios

### Scenario 1: View All Posts

**Goal**: Verify post list displays correctly

**Steps**:
1. Ensure Blog Posts API is running with sample data
2. Open http://localhost:3001
3. Observe post list rendering

**Expected Result**:
- ✅ List of posts displays (or empty state if no posts)
- ✅ Each post shows: title, date, brief excerpt
- ✅ Posts are clickable
- ✅ Layout responsive on mobile/desktop

**Test with**:
```bash
# Create sample posts via API
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Sample Post 1","body":"Content for testing..."}'

curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Sample Post 2","body":"More content..."}'
```

---

### Scenario 2: View Single Post

**Goal**: Navigate to post detail and view full content

**Steps**:
1. From homepage, click on a post title
2. Observe post detail page

**Expected Result**:
- ✅ URL changes to `/posts/[id]`
- ✅ Full post title and body display
- ✅ Creation and update dates visible
- ✅ "Edit" and "Delete" buttons present

**Browser test**:
- Navigate directly to: http://localhost:3001/posts/1
- Should load post #1 details

---

### Scenario 3: Create New Post

**Goal**: Submit create form and verify post appears

**Steps**:
1. Click "Create New Post" button from homepage
2. Fill in title: "Test Post"
3. Fill in body: "This is test content"
4. Click "Publish"

**Expected Result**:
- ✅ Form validates input (required fields)
- ✅ Submit button shows loading state
- ✅ Redirects to new post detail page
- ✅ New post appears in homepage list
- ✅ Slug auto-generated from title

**Validation tests**:
```
Empty title → "Title is required"
Title with 201 chars → "Title must be 200 characters or less"
Empty body → "Body content is required"
Whitespace only → "Must contain non-whitespace characters"
```

---

### Scenario 4: Edit Existing Post

**Goal**: Update post and verify changes reflect

**Steps**:
1. Navigate to post detail page
2. Click "Edit" button
3. Modify title to "Updated Title"
4. Click "Save"

**Expected Result**:
- ✅ Form pre-populates with current values
- ✅ Submit button shows loading state
- ✅ Redirects to updated post detail
- ✅ Changes visible immediately
- ✅ Updated date changed, created date unchanged
- ✅ Slug regenerated if title changed

**Edge cases**:
- Edit only title (body unchanged)
- Edit only body (title unchanged)
- Cancel without saving (no changes applied)

---

### Scenario 5: Delete Post

**Goal**: Delete post and verify removal

**Steps**:
1. Navigate to post detail page
2. Click "Delete" button
3. Confirm deletion in modal
4. Observe redirect to homepage

**Expected Result**:
- ✅ Confirmation modal appears
- ✅ Modal shows post title
- ✅ "Cancel" closes modal without deleting
- ✅ "Confirm" deletes post
- ✅ Redirects to homepage
- ✅ Deleted post no longer in list
- ✅ Navigating to deleted post URL shows 404

---

### Scenario 6: Error Handling

#### 6.1 Network Error (API Down)

**Steps**:
1. Stop Blog Posts API (`Ctrl+C` in API terminal)
2. Refresh frontend
3. Observe error handling

**Expected Result**:
- ✅ Error message: "Unable to reach server"
- ✅ No crash, graceful degradation
- ✅ Retry button available
- ✅ Health indicator shows API down

#### 6.2 Validation Error (400)

**Steps**:
1. Try to create post with empty title
2. Submit form

**Expected Result**:
- ✅ Inline error message appears
- ✅ Submit button disabled until fixed
- ✅ Error message helpful and user-friendly

#### 6.3 Not Found Error (404)

**Steps**:
1. Navigate to http://localhost:3001/posts/999999

**Expected Result**:
- ✅ 404 page displays
- ✅ Message: "Post not found"
- ✅ Link back to homepage

#### 6.4 Rate Limit Error (429)

**Steps**:
1. Make 100+ rapid requests (script or manual)
2. Observe rate limit response

**Expected Result**:
- ✅ Error message: "Too many requests"
- ✅ Suggestion to wait and retry
- ✅ Countdown or retry button

---

### Scenario 7: Accessibility Testing

#### 7.1 Keyboard Navigation

**Steps**:
1. Navigate site using only keyboard (Tab, Enter, Escape)
2. Complete create/edit/delete workflows

**Expected Result**:
- ✅ Tab order logical (top to bottom, left to right)
- ✅ Focus indicators visible on all interactive elements
- ✅ Enter key submits forms
- ✅ Escape key closes modals
- ✅ No keyboard traps

#### 7.2 Screen Reader

**Steps**:
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate homepage and post detail

**Expected Result**:
- ✅ All content announced correctly
- ✅ Form labels associated with inputs
- ✅ Error messages announced
- ✅ Button purposes clear
- ✅ Headings provide structure

#### 7.3 Color Contrast

**Steps**:
1. Inspect with browser DevTools accessibility panel
2. Check text contrast ratios

**Expected Result**:
- ✅ All text meets 4.5:1 ratio (WCAG AA)
- ✅ No contrast violations reported

#### 7.4 Zoom

**Steps**:
1. Zoom browser to 200% (`Ctrl` + `+` / `Cmd` + `+`)
2. Navigate all pages

**Expected Result**:
- ✅ All content remains visible
- ✅ No horizontal scrolling required
- ✅ Text wraps appropriately
- ✅ Buttons remain usable

---

### Scenario 8: Responsive Design

**Test on multiple screen sizes**:

| Device | Width | Test |
|--------|-------|------|
| Mobile | 320px | iPhone SE |
| Mobile | 375px | iPhone 12 |
| Tablet | 768px | iPad |
| Laptop | 1024px | MacBook |
| Desktop | 1920px | Desktop |

**Expected Result for all sizes**:
- ✅ Layout adapts smoothly
- ✅ No content cut off
- ✅ Touch targets ≥44x44px on mobile
- ✅ Text readable without zooming
- ✅ Images scale appropriately

**Browser DevTools**: Toggle device toolbar (`Ctrl+Shift+M` / `Cmd+Shift+M`)

---

## Build & Deployment

### Local Production Build

**Purpose**: Test production build before deploying

```bash
# Build for production
npm run build

# Serve production build
npm run start
```

**Expected output**:
```
▲ Next.js 14.2.0
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    1.2 kB          85 kB
├ ○ /posts/[id]                          900 B           84 kB
├ ○ /posts/[id]/edit                     1.1 kB          85 kB
└ ○ /posts/new                           1.1 kB          85 kB

○  (Static)  prerendered as static HTML
```

**Verify**:
- Open http://localhost:3000
- Test all scenarios from production build
- Check bundle size (<500KB target)

---

### Static Export for GitHub Pages

**Generate static files**:

```bash
npm run build
```

**Output directory**: `frontend/out/`

**Contents**:
```
out/
├── index.html              # Homepage
├── 404.html               # Fallback for client-side routing
├── posts/
│   ├── [id].html
│   ├── new.html
│   └── [id]/
│       └── edit.html
├── _next/                 # JavaScript, CSS, assets
└── ...
```

**Deploy to GitHub Pages**:

```bash
# Push to gh-pages branch (automated in CI)
git subtree push --prefix frontend/out origin gh-pages
```

**Live URL**: `https://<username>.github.io/training-hamza`

---

### CI/CD Pipeline

**Workflow**: `.github/workflows/frontend-deploy.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run type-check
5. Run linter
6. Run tests
7. Build production bundle
8. Deploy to GitHub Pages

**View runs**: https://github.com/Maximus-Technologies-Uganda/training-hamza/actions

---

## Troubleshooting

### Problem: "Module not found" errors

**Cause**: Dependencies not installed or corrupted

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Problem: API requests fail with CORS error

**Cause**: API not configured to allow frontend domain

**Solution**:
1. Check API CORS configuration in `src/blog/server.js`
2. Ensure `http://localhost:3001` (dev) or GitHub Pages URL (prod) is allowed
3. Restart API server after changes

**Verify API CORS**:
```javascript
// src/blog/server.js
fastify.register(require('@fastify/cors'), {
  origin: [
    'http://localhost:3001',  // Dev frontend
    'https://maximus-technologies-uganda.github.io'  // Prod frontend
  ]
});
```

---

### Problem: Environment variable not working

**Cause**: `.env.local` not loaded or missing `NEXT_PUBLIC_` prefix

**Solution**:
1. Ensure file named exactly `.env.local` in `frontend/` directory
2. Verify variable starts with `NEXT_PUBLIC_` (required for client-side access)
3. Restart dev server after changing `.env.local`

**Test**:
```typescript
console.log(process.env.NEXT_PUBLIC_API_URL);  // Should log URL
```

---

### Problem: Static export fails with "Dynamic rendering" error

**Cause**: Using Next.js features incompatible with static export

**Solution**:
- Remove server actions (`use server`)
- Remove API routes (`app/api/`)
- Remove middleware (`middleware.ts`)
- Use only client-side data fetching

**Verify `next.config.js`**:
```javascript
module.exports = {
  output: 'export',  // Must be set
  images: {
    unoptimized: true  // Required for static export
  }
};
```

---

### Problem: Tests fail with "fetch is not defined"

**Cause**: Node.js environment doesn't have fetch by default (< v18)

**Solution**:
1. Upgrade to Node.js 18+ (has native fetch)
2. Or install `whatwg-fetch` polyfill

---

### Problem: Lighthouse score low

**Debugging**:
```bash
# Analyze bundle size
npm run build
# Check output for large bundles

# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Check specific metrics:
# - FCP (First Contentful Paint) < 1.8s
# - LCP (Largest Contentful Paint) < 2.5s
# - TBT (Total Blocking Time) < 200ms
```

---

### Problem: Accessibility violations

**Tools**:
```bash
# Automated testing
npm run test:a11y

# Manual testing
- NVDA screen reader (Windows): nvaccess.org
- VoiceOver (Mac): Built-in (Cmd+F5)
- axe DevTools browser extension
```

---

## Quick Reference

### File Structure

```
frontend/
├── src/
│   ├── app/              # Pages (App Router)
│   ├── components/       # Reusable components
│   ├── lib/             # API client, hooks, utils
│   └── styles/          # Global CSS
├── tests/               # Test files
├── public/              # Static assets
├── .env.local           # Local environment (git-ignored)
├── next.config.js       # Next.js config
├── tailwind.config.js   # Tailwind config
└── tsconfig.json        # TypeScript config
```

### Key URLs (Development)

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |
| API Health | http://localhost:3000/health |

### Common Tasks

```bash
# Start development
npm run dev

# Run tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build production
npm run build

# Preview production
npm run start
```

---

## Next Steps

1. **Complete Testing**: Run through all scenarios above
2. **Write Tests**: See `tests/` directory for examples
3. **Review Code**: Follow TypeScript best practices
4. **Deploy**: Push to GitHub, trigger CI/CD
5. **Monitor**: Check Lighthouse scores, accessibility

---

## Support

**Documentation**:
- Feature Spec: `specs/003-frontend-blog-integration/spec.md`
- Data Model: `specs/003-frontend-blog-integration/data-model.md`
- API Contracts: `specs/003-frontend-blog-integration/contracts/`

**Issues**: Open GitHub issue with reproduction steps

**Questions**: Contact project maintainer

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0
