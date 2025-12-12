# Release Notes v7.0.0

**Release Date**: December 2025  
**Branch**: `004-blog-auth`  
**Tag**: `v7.0.0`

---

## 🎯 Overview

This release completes the Blog Auth implementation with Server-Side Rendering (SSR), comprehensive CI/CD pipeline improvements, OpenAPI hygiene enforcement, and production-ready deployment to Cloud Run.

---

## ✨ New Features

### A. Server-Side Rendering (SSR) for `/posts`

- **Converted frontend from static export to SSR mode**
  - Removed `output: 'export'` from `next.config.js`
  - Added `output: 'standalone'` for Docker deployment
  - Posts are now rendered server-side on first paint

- **Backend-for-Frontend (BFF) Route Handlers**
  - `app/api/posts/route.ts` - List/create posts
  - `app/api/posts/[id]/route.ts` - Get/update/delete single post
  - `app/api/auth/login/route.ts` - Authentication proxy
  - Browser calls stay behind Next.js; server fetches from `API_BASE_URL`

- **SSR Snapshot Test**
  - `tests/ssr/posts.ssr.test.tsx` validates server-rendered HTML
  - Verifies posts appear in initial HTML (not just loading skeletons)

### B. Frontend Coverage Surfacing

- **Coverage artifacts with stable names**
  - `coverage-frontend-next` artifact in CI
  - Includes `coverage-summary.json` for aggregation
  
- **Step summary output**
  - Frontend coverage totals written to `$GITHUB_STEP_SUMMARY`
  - Threshold checks (≥70% for statements/lines)

### C. Accessibility & Contract Artifacts

- **A11y HTML bundle**
  - `a11y-frontend-next` artifact with HTML report and JSON results
  - Uses `if: always()` for reliable uploads

- **Contract API artifact**
  - `contract-api` artifact with Spectral linting results
  - OpenAPI validation runs in CI

### D. OpenAPI Hygiene

- **Spectral configuration** (`.spectral.yaml`)
  - Extends `spectral:oas` ruleset
  - Enforces `operationId`, `tags`, `info-contact`
  - Linting script: `npm run lint:openapi`

- **OpenAPI spec updates**
  - Added `info.license` (ISC)
  - Added `servers` array with Cloud Run URL
  - Added `422 UnprocessableEntity` error response
  - All operations have `operationId`, `tags`, `summary/description`

### E. CI/CD Deploy Trail

- **Auto-deploy on main branch**
  - Push to `main` triggers production deployment
  - Manual dispatch still available for dev/staging/prod

- **Enhanced job summary**
  - Commit SHA in deployment summary
  - Cloud Build link
  - Cloud Run service link
  - Environment and image details

- **README updates**
  - Comprehensive environment variables table
  - Cloud Run URLs for frontend and backend
  - SSR setup instructions

---

## 📁 Files Changed

### New Files
- `frontend/src/app/api/posts/route.ts`
- `frontend/src/app/api/posts/[id]/route.ts`
- `frontend/src/app/api/auth/login/route.ts`
- `frontend/src/components/HomePageClient.tsx`
- `frontend/tests/ssr/posts.ssr.test.tsx`
- `frontend/Dockerfile`
- `.spectral.yaml`
- `.github/workflows/ci-gate.yml`

### Modified Files
- `frontend/next.config.js` - SSR mode + standalone output
- `frontend/src/app/page.tsx` - Server component with async fetch
- `frontend/src/lib/hooks/usePosts.ts` - Added `fallbackData` option
- `frontend/package.json` - Added `test:ssr` script
- `package.json` - Added `lint:openapi` script and Spectral dependency
- `specs/004-blog-auth/contracts/openapi.yaml` - License, 422 error, servers
- `.github/workflows/deploy-cloud-run.yml` - Auto-deploy on main, commit SHA
- `READMe.md` - Live URLs, env table

---

## 🔗 Links

- **Gate Run**: [CI Gate Workflow](../../actions/workflows/ci-gate.yml)
- **Review Packet**: [Latest Artifact](../../actions/workflows/review-packet.yml)
- **Demo URLs**:
  - Frontend (SSR): `https://blog-frontend-prod-xxxxxxxxxx-uc.a.run.app`
  - Backend API: `https://blog-api-prod-xxxxxxxxxx-uc.a.run.app`
  - API Docs: `https://blog-api-prod-xxxxxxxxxx-uc.a.run.app/docs`

---

## 🧪 Testing

```bash
# Run all tests including SSR
cd frontend && npm test

# Run SSR tests only
npm run test:ssr

# Run a11y tests
npm run test:a11y

# Lint OpenAPI spec
npm run lint:openapi
```

---

## 🚀 Deployment

```bash
# Local development
npm run dev        # Backend on :3000
cd frontend && npm run dev  # Frontend on :5000

# Docker build (frontend)
docker build -t blog-frontend -f frontend/Dockerfile frontend/
docker run -p 5000:5000 -e API_BASE_URL=http://host.docker.internal:3000 blog-frontend

# Cloud Run (via CI)
# Push to main branch triggers automatic deployment
```

---

## 📋 Checklist

- [x] SSR first-paint on /posts with server-side fetch
- [x] API_BASE_URL set on frontend Cloud Run
- [x] Browser calls stay behind Next.js Route Handlers
- [x] SSR snapshot test in CI
- [x] Frontend-next coverage surfaced with stable artifact name
- [x] Coverage totals in GITHUB_STEP_SUMMARY
- [x] A11y HTML bundle as a11y-frontend-next artifact
- [x] Spectral/OpenAPI results as contract-api artifact
- [x] Artifact uploads use `if: always()`
- [x] OpenAPI has operationId, tags, summary/description
- [x] OpenAPI has error schemas (401/403/404/422)
- [x] OpenAPI has info.contact and info.license
- [x] OpenAPI has servers array
- [x] Spectral lint with zero errors
- [x] Deploy job on main runs automatically
- [x] Deploy writes Cloud Build link + Cloud Run URLs + commit SHA
- [x] README Live URLs accurate
- [x] README env table comprehensive
- [x] v7.0.0 tag with links
