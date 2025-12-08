# training-hamza Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-24

## Active Technologies
- Node.js 20+ (ES Modules), TypeScript 5.5+ (frontend) + Fastify 4.x, jsonwebtoken, bcrypt (API); Next.js 14, react-hook-form, swr (frontend) (004-blog-auth)
- Memory/SQLite/Firestore (existing adapters extended with User entity) (004-blog-auth)

### Frontend (003-frontend-blog-integration)
- **Framework**: Next.js 14.2+ with App Router, React 18.3+, TypeScript 5.5+ (strict mode)
- **Data Fetching**: SWR 2.2+ (client-side caching, revalidation)
- **Forms**: react-hook-form 7.52+ (validation, state management)
- **Styling**: Tailwind CSS 3.4+ with @tailwindcss/forms plugin
- **Testing**: Jest 29.7+ with React Testing Library 16+, jest-axe 9.0+ (accessibility), MSW 2.3+ (API mocking)
- **Storage**: Browser-side only (SWR cache in memory)
- **Deployment**: Static export to GitHub Pages

### Backend (002-blog-api)
- **Runtime**: Node.js 20.x LTS (ES Modules)
- **Framework**: Fastify 4.x (HTTP framework with built-in JSON Schema validation)
- **Dependencies**: slugify 1.6.x (URL-friendly slugs), @fastify/rate-limit (IP-based limiting), @fastify/swagger (OpenAPI generation), better-sqlite3 (optional SQLite adapter)

## Project Structure

```text
# Backend (002-blog-api)
src/blog/
├── server.js, index.js
├── routes/health.js, posts.js
├── services/post-service.js, slug-generator.js
├── models/post.js
├── storage/storage-adapter.js, memory-storage.js, sqlite-storage.js
└── middleware/error-handler.js

tests/blog/
├── contract/posts-api.test.js
└── unit/sqlite-storage.test.js

# Frontend (003-frontend-blog-integration)
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # Reusable React components
│   ├── lib/                    # API client, hooks, utils
│   └── styles/                 # Tailwind CSS
├── tests/
│   ├── unit/                   # Component tests
│   ├── integration/            # API integration tests
│   └── a11y/                   # Accessibility tests
└── public/                     # Static assets
```

## Commands

### Backend (src/blog/)
```bash
npm run dev            # Start Fastify dev server
npm test               # Run Jest tests
npm run test:coverage  # Coverage report
```

### Frontend (frontend/)
```bash
npm run dev           # Start Next.js dev server (port 3001)
npm run build         # Build static export
npm run start         # Serve production build
npm run lint          # ESLint
npm run type-check    # TypeScript compilation
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Code Style

### Backend
- Node.js ES Modules syntax (import/export)
- Fastify plugin architecture with async/await
- JSON Schema for request/response validation
- Service layer pattern (routes → services → storage)

### Frontend
- TypeScript strict mode (no implicit any)
- React functional components with hooks
- SWR for data fetching (no useState for server data)
- react-hook-form for form state
- Tailwind utility classes (minimal custom CSS)
- Semantic HTML with ARIA labels for accessibility

## Recent Changes
- 004-blog-auth: Added Node.js 20+ (ES Modules), TypeScript 5.5+ (frontend) + Fastify 4.x, jsonwebtoken, bcrypt (API); Next.js 14, react-hook-form, swr (frontend)

### November 27, 2025 - Feature 003 Planning Complete
- **003-frontend-blog-integration**: Next.js 14+ frontend with TypeScript, SWR, Tailwind CSS, static export to GitHub Pages
  - Data fetching: Client-side with SWR (required by static export constraint)
  - State management: SWR for server state, react-hook-form for forms, useState for local UI
  - Testing: Jest + React Testing Library + jest-axe (accessibility)
  - Deployment: GitHub Pages via GitHub Actions
  - Documentation: Complete spec, plan, research, data-model, contracts, quickstart

### November 24-27, 2025 - Feature 002 Complete
- **002-blog-api**: Production REST API with Fastify, SQLite, OpenAPI 3.1, comprehensive testing
  - Full CRUD operations for blog posts
  - Automatic slug generation, rate limiting, health check
  - Contract tests with OpenAPI validation
  - Newman/Postman collection integration in CI
  - 100/100 review packet score

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
