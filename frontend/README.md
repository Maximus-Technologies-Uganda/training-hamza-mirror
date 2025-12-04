# Blog Frontend

A responsive web frontend for the Blog Posts API built with Next.js, TypeScript, and Tailwind CSS. This application provides full CRUD functionality for blog posts with comprehensive error handling and WCAG 2.1 AA accessibility compliance.

## 🚀 Live Demo

**Live URL**: [https://maximus-technologies-uganda.github.io/training-hamza/](https://maximus-technologies-uganda.github.io/training-hamza/)

> **Note**: The live demo requires a running Blog API backend. See the [Run & Try](#run--try) section for setup instructions.

## Run & Try

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the Blog Posts API | `http://localhost:3001` |

### Quick Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/Maximus-Technologies-Uganda/training-hamza.git
   cd training-hamza/frontend
   npm install
   ```

2. **Configure environment** - Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Start the API** (in a separate terminal from repo root):
   ```bash
   npm run blog:dev
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:5000](http://localhost:5000) in your browser

### Production Deployment

For GitHub Pages deployment, set the `NEXT_PUBLIC_API_URL` repository variable in GitHub Actions to point to your production API server.

## Features

- **View All Posts** - Browse a list of all published blog posts with titles, dates, and excerpts
- **View Post Details** - Read full post content with metadata and timestamps
- **Create Posts** - Compose and publish new blog posts with form validation
- **Edit Posts** - Update existing posts with change detection
- **Delete Posts** - Remove posts with confirmation dialog
- **Health Monitoring** - Real-time API health status indicator

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.5+ (strict mode)
- **Styling**: Tailwind CSS 3.4+
- **Data Fetching**: SWR 2.2+ (with automatic caching and revalidation)
- **Forms**: react-hook-form 7.52+
- **Testing**: Jest 29.7+ with React Testing Library 16+ and jest-axe 9.0+
- **Deployment**: Static export to GitHub Pages

## Prerequisites

- Node.js 18+ and npm 9+
- Blog Posts API running (see [API documentation](../docs/blog-posts-api.postman_collection.json))

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env.local` file (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API URL:

```env
# Local development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production (GitHub Pages example)
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Start the Blog API

In a separate terminal, start the Blog Posts API:

```bash
# From repository root
npm run blog:dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (static export) |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run format` | Format code with Prettier |

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page (post list)
│   │   ├── error.tsx           # Error boundary
│   │   ├── loading.tsx         # Loading state
│   │   ├── not-found.tsx       # 404 page
│   │   └── posts/
│   │       ├── [id]/           # Dynamic post routes
│   │       │   ├── page.tsx    # Post detail view
│   │       │   └── edit/       # Edit post
│   │       └── new/            # Create post
│   ├── components/             # Reusable React components
│   │   ├── DeleteConfirm.tsx   # Deletion confirmation modal
│   │   ├── EmptyState.tsx      # Empty list placeholder
│   │   ├── ErrorMessage.tsx    # Error display component
│   │   ├── HealthIndicator.tsx # API status indicator
│   │   ├── LoadingSkeleton.tsx # Loading state skeleton
│   │   ├── PostCard.tsx        # Single post preview
│   │   ├── PostDetail.tsx      # Full post display
│   │   ├── PostForm.tsx        # Create/edit form
│   │   ├── PostList.tsx        # List of post cards
│   │   └── SWRProvider.tsx     # SWR configuration
│   ├── lib/                    # Utilities and helpers
│   │   ├── api.ts              # API client functions
│   │   ├── api-client.ts       # API client contract
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── utils.ts            # Helper functions
│   │   ├── validation.ts       # Form validation rules
│   │   └── hooks/              # Custom React hooks
│   │       ├── useHealth.ts    # API health check
│   │       ├── usePost.ts      # Single post fetching
│   │       └── usePosts.ts     # Posts list fetching
│   └── styles/
│       └── globals.css         # Tailwind imports + custom styles
├── tests/
│   ├── unit/                   # Component unit tests
│   ├── integration/            # API integration tests
│   └── a11y/                   # Accessibility tests
├── public/                     # Static assets
│   └── 404.html                # GitHub Pages SPA fallback
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest testing configuration
└── package.json                # Dependencies
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Blog API base URL | `http://localhost:3001` |

### Development vs Production

**Local Development** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Production** (GitHub Actions / deployment):
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

**Note**: The `NEXT_PUBLIC_` prefix is required for client-side access in Next.js.

## Deployment

### GitHub Pages (Static Export)

This application is configured for static export to GitHub Pages.

#### Build Configuration

The `next.config.js` includes:

```javascript
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // For GitHub Pages repo hosting (not custom domain):
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name/',
};
```

#### Build for Production

```bash
npm run build
```

This creates an `out/` directory with static HTML/CSS/JS files.

#### GitHub Actions Deployment

The workflow at `.github/workflows/frontend-deploy.yml` handles:

1. **CI**: Type-check, lint, test, build
2. **CD**: Deploy to GitHub Pages

#### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy the `out/` directory contents to your hosting provider

### GitHub Pages SPA Routing

For client-side routing to work on GitHub Pages, a `404.html` fallback is included in `public/`. This redirects all 404s to `index.html` for SPA handling.

## Testing

### Run All Tests

```bash
npm run test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage target: ≥70%

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Categories

- **Unit Tests** (`tests/unit/`): Component behavior
- **Integration Tests** (`tests/integration/`): API interactions
- **Accessibility Tests** (`tests/a11y/`): WCAG 2.1 AA compliance

## Accessibility

This application meets **WCAG 2.1 AA** accessibility standards:

- [x] Semantic HTML structure
- [x] Keyboard navigation support
- [x] Screen reader compatibility (ARIA labels, live regions)
- [x] Focus management and visible focus indicators
- [x] Color contrast compliance
- [x] Responsive design (320px-2560px)

### Accessibility Testing

Automated testing with `jest-axe`:

```bash
npm run test -- tests/a11y
```

Manual testing recommended with:
- Keyboard-only navigation
- Screen readers (NVDA, VoiceOver)
- Browser accessibility tools

## Performance

Performance targets (Lighthouse):

- **Performance Score**: ≥85
- **Accessibility Score**: 100
- **Bundle Size**: <500KB compressed
- **Initial Load**: <3s on 10 Mbps connection
- **Time to Interactive**: <500ms for UI operations

## API Documentation

The frontend consumes the Blog Posts API with the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/posts` | List all posts |
| GET | `/posts/:id` | Get post by ID |
| POST | `/posts` | Create new post |
| PUT | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |

See the [API Postman collection](../docs/blog-posts-api.postman_collection.json) for detailed documentation.

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features
3. Ensure accessibility compliance
4. Run all checks before submitting:
   ```bash
   npm run type-check
   npm run lint
   npm run test
   npm run build
   ```

## License

See the root [LICENSE](../LICENSE) file.
