# Research: Frontend Blog Integration

**Feature**: 003-frontend-blog-integration  
**Date**: November 27, 2025  
**Purpose**: Document technical decisions for Next.js App Router frontend consuming Blog Posts API

---

## Research Task 1: Data Fetching Strategy

### Decision: Client-Side Fetching with SWR

**Rationale**:
- **Static Export Constraint**: TC-004 and TC-005 require static export (`output: 'export'`), which eliminates Server Components that require runtime server
- **No getStaticProps/getServerSideProps**: Static export with App Router means we cannot use server-side data fetching at build time for dynamic content
- **SWR Benefits**: Provides caching, revalidation, focus revalidation, and error retry out of the box
- **Client-Side Only**: All data must be fetched client-side after initial page load

**Alternatives Considered**:
1. **Server Components with RSC**: Rejected - requires runtime server, incompatible with static export
2. **getStaticProps (Pages Router)**: Rejected - spec requires App Router, and static export would require all post IDs at build time
3. **Plain fetch API**: Rejected - would require manual implementation of caching, revalidation, error handling
4. **React Query**: Considered - similar to SWR but SWR is lighter and sufficient for our needs

**Implementation Approach**:
```typescript
// Use SWR for all API calls
import useSWR from 'swr';

// Fetcher function
const fetcher = (url: string) => fetch(url).then(r => r.json());

// In components
const { data, error, isLoading } = useSWR('/api/posts', fetcher);
```

**Trade-offs**:
- ✅ Works with static export
- ✅ Automatic caching and revalidation
- ✅ Built-in loading and error states
- ❌ No SEO benefits (content not in initial HTML)
- ❌ Requires JavaScript enabled
- ❌ Initial page shows loading state

---

## Research Task 2: State Management Approach

### Decision: Local React State + SWR Cache

**Rationale**:
- **Simple Requirements**: App only needs to manage form state and API response state
- **SWR Handles API State**: SWR provides global cache for API responses, eliminating need for Redux/Zustand
- **Form State Local**: Create/edit forms can use React useState or react-hook-form
- **No Complex Global State**: No authentication, shopping cart, or cross-cutting concerns requiring centralized state

**Alternatives Considered**:
1. **Redux Toolkit**: Rejected - overkill for simple CRUD, adds bundle size
2. **Zustand**: Rejected - unnecessary when SWR handles API state
3. **Context API**: Rejected - no need to pass state through multiple levels
4. **Jotai/Recoil**: Rejected - atomic state not needed for this scale

**Implementation Approach**:
```typescript
// API state via SWR
const { data: posts } = useSWR('/api/posts', fetcher);

// Form state via React Hook Form
import { useForm } from 'react-hook-form';
const { register, handleSubmit, errors } = useForm();

// Local UI state via useState
const [isConfirmOpen, setIsConfirmOpen] = useState(false);
```

**Components**:
- No global state management library needed
- SWR for server state (posts data)
- react-hook-form for form state (validation, submission)
- useState for local UI state (modals, toggles)

---

## Research Task 3: URL Strategy for Pagination

### Decision: No Pagination in Initial Implementation

**Rationale**:
- **Spec Assumption A-016**: "Typical post count is between 0-1000 posts (pagination not required initially)"
- **Known Limitation**: Review packet notes "No Pagination (Acceptable)" for backend API
- **Simplicity**: Fetch all posts on initial load, render full list
- **Future-Ready**: When pagination added, use searchParams: `?page=1&limit=10`

**Future Implementation Plan** (when needed):
```typescript
// URL structure: /posts?page=2&limit=20
// In page component:
export default function PostsPage({
  searchParams
}: {
  searchParams: { page?: string; limit?: string }
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  
  const { data } = useSWR(`/api/posts?page=${page}&limit=${limit}`, fetcher);
}
```

**Current Approach**:
- Display all posts in a single list
- Client-side filtering/sorting if needed
- Monitor performance with >50 posts
- Add pagination when dataset grows or performance degrades

---

## Research Task 4: Deployment Strategy

### Decision: Static Export to GitHub Pages

**Rationale**:
- **Spec Requirement TC-004**: "Application MUST be configured for static export (output: 'export' in next.config.js)"
- **Spec Requirement TC-007**: "Application MUST be deployable to GitHub Pages as static HTML/CSS/JS"
- **Cost**: Free for public repositories
- **Simplicity**: No server infrastructure, no environment management
- **CI/CD**: Easy automation with GitHub Actions
- **Learning Value**: Demonstrates understanding of static vs SSR trade-offs

**Alternatives Considered**:
1. **Vercel with SSR**: Rejected - spec requires static export, would enable features we can't use
2. **Netlify**: Rejected - similar to GitHub Pages but spec explicitly mentions GitHub Pages
3. **Cloudflare Pages**: Rejected - spec requirement for GitHub Pages

**Configuration Required**:

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/training-hamza',  // GitHub repo name
  assetPrefix: '/training-hamza/',
  images: {
    unoptimized: true  // Required for static export
  }
};

module.exports = nextConfig;
```

**GitHub Actions Workflow**:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

**Trade-offs**:
- ✅ Free hosting
- ✅ Simple deployment
- ✅ Fast page loads (static HTML)
- ❌ No SEO for blog content
- ❌ No server-side features (API routes, middleware)
- ❌ Client-side routing requires 404.html fallback

---

## Research Task 5: Best Practices for Chosen Technologies

### Next.js 14+ App Router Best Practices

**1. File Structure**:
```text
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (post list)
│   │   ├── posts/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx    # Post detail
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx # Edit post
│   │   │   └── new/
│   │   │       └── page.tsx    # Create post
│   │   └── error.tsx           # Error boundary
│   ├── components/             # Reusable components
│   │   ├── PostList.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostForm.tsx
│   │   ├── DeleteConfirm.tsx
│   │   └── HealthIndicator.tsx
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # API client functions
│   │   ├── hooks/              # Custom hooks
│   │   │   └── usePosts.ts
│   │   └── types.ts            # TypeScript interfaces
│   └── styles/
│       └── globals.css         # Tailwind imports
├── public/
├── tests/
│   ├── unit/                   # Component tests
│   ├── integration/            # API integration tests
│   └── a11y/                   # Accessibility tests
└── next.config.js
```

**2. TypeScript Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**3. Error Handling Pattern**:
```typescript
// lib/api.ts
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message);
  }

  return response.json();
}
```

**4. SWR Configuration**:
```typescript
// app/layout.tsx
import { SWRConfig } from 'swr';

export default function RootLayout({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetchApi(url),
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

**5. Accessibility Patterns**:
```typescript
// Components must include:
// - Semantic HTML (article, nav, main, header)
// - ARIA labels for icon buttons
// - Focus management for modals
// - Keyboard event handlers
// - Error announcements with role="alert"

// Example:
<button
  aria-label="Delete post"
  onClick={handleDelete}
  className="focus:ring-2 focus:ring-blue-500"
>
  <TrashIcon />
</button>
```

**6. Loading States**:
```typescript
// Use Suspense boundaries and loading.tsx
// app/posts/[id]/loading.tsx
export default function Loading() {
  return <PostDetailSkeleton />;
}

// Or in components:
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <PostList posts={data} />;
```

---

### TypeScript Best Practices

**1. Strict Type Definitions**:
```typescript
// lib/types.ts
export interface Post {
  id: number;
  title: string;
  slug: string;
  body: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}

// Form types
export interface CreatePostInput {
  title: string;
  body: string;
}

export type UpdatePostInput = Partial<CreatePostInput>;
```

**2. Type Guards**:
```typescript
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  );
}
```

**3. Generic API Functions**:
```typescript
export async function getPosts(): Promise<Post[]> {
  return fetchApi<Post[]>(`${API_URL}/posts`);
}

export async function getPost(id: number): Promise<Post> {
  return fetchApi<Post>(`${API_URL}/posts/${id}`);
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  return fetchApi<Post>(`${API_URL}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

### Tailwind CSS Best Practices

**1. Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // Customize colors
        error: '#ef4444',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),  // Better form styles
  ],
};
```

**2. Component Patterns**:
```typescript
// Use consistent spacing scale
// Use responsive prefixes (sm:, md:, lg:)
// Group related utilities
// Use @apply sparingly (prefer utility classes)

<article className="
  max-w-4xl mx-auto px-4 py-8
  bg-white rounded-lg shadow-md
  hover:shadow-lg transition-shadow
  md:px-6 md:py-10
">
  <h1 className="text-3xl font-bold text-gray-900 mb-4">
    {post.title}
  </h1>
  <p className="text-gray-600 text-sm mb-6">
    {formatDate(post.createdAt)}
  </p>
  <div className="prose prose-lg max-w-none">
    {post.body}
  </div>
</article>
```

**3. Accessibility with Tailwind**:
```typescript
// Focus states
<button className="
  px-4 py-2 bg-blue-600 text-white rounded
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  hover:bg-blue-700
  transition-colors
">
  Submit
</button>

// Screen reader only text
<span className="sr-only">Loading posts</span>

// Color contrast
// Use Tailwind colors that meet WCAG AA (text-gray-900 on white, etc.)
```

---

### Testing Best Practices

**1. Unit Testing with Jest + React Testing Library**:
```typescript
// tests/unit/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    body: 'Test body',
    createdAt: '2025-11-27T10:00:00Z',
    updatedAt: '2025-11-27T10:00:00Z',
  };

  it('renders post title and date', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText(/November 27, 2025/)).toBeInTheDocument();
  });

  it('links to post detail page', () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/posts/1');
  });
});
```

**2. Accessibility Testing with jest-axe**:
```typescript
// tests/a11y/PostList.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PostList } from '@/components/PostList';

expect.extend(toHaveNoViolations);

describe('PostList Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<PostList posts={mockPosts} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**3. Integration Testing**:
```typescript
// tests/integration/post-workflow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/posts', (req, res, ctx) => {
    return res(ctx.json(mockPosts));
  }),
  rest.post('/api/posts', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(newPost));
  })
);

describe('Create Post Workflow', () => {
  it('creates post and redirects to detail page', async () => {
    render(<CreatePostPage />);
    
    await userEvent.type(screen.getByLabelText(/title/i), 'New Post');
    await userEvent.type(screen.getByLabelText(/body/i), 'Post content');
    await userEvent.click(screen.getByRole('button', { name: /publish/i }));
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/posts/1');
    });
  });
});
```

---

## Technology Stack Summary

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2.0 | App Router framework |
| react | ^18.3.0 | UI library |
| react-dom | ^18.3.0 | React DOM rendering |
| typescript | ^5.5.0 | Type safety |
| swr | ^2.2.0 | Data fetching & caching |
| react-hook-form | ^7.52.0 | Form state management |
| tailwindcss | ^3.4.0 | Utility-first CSS |
| @tailwindcss/forms | ^0.5.0 | Form styling |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @testing-library/react | ^16.0.0 | Component testing |
| @testing-library/jest-dom | ^6.4.0 | DOM matchers |
| @testing-library/user-event | ^14.5.0 | User interaction simulation |
| jest | ^29.7.0 | Test runner |
| jest-environment-jsdom | ^29.7.0 | Browser environment |
| jest-axe | ^9.0.0 | Accessibility testing |
| msw | ^2.3.0 | API mocking |
| eslint | ^8.57.0 | Linting |
| prettier | ^3.3.0 | Code formatting |
| @types/react | ^18.3.0 | React types |
| @types/node | ^20.14.0 | Node.js types |

---

## Performance Considerations

**Bundle Optimization**:
- Use dynamic imports for heavy components: `const Editor = dynamic(() => import('./Editor'))`
- Minimize dependencies (avoid moment.js, lodash - use date-fns, native methods)
- Code split by route automatically with App Router

**Image Optimization**:
- Static export requires `images.unoptimized: true`
- Use WebP format for any images
- Provide width/height to prevent layout shift

**CSS Optimization**:
- Tailwind purges unused CSS in production
- Use content-visibility for long lists if performance issues
- Minimize custom CSS (prefer Tailwind utilities)

---

## Development Workflow

**Local Development**:
```bash
npm run dev          # Start dev server (http://localhost:3001)
npm run build        # Build for production
npm run start        # Serve production build locally
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Environment Variables**:
```env
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.production (production build)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

**Git Workflow**:
1. Feature branch from `003-frontend-blog-integration`
2. Commit frequently with descriptive messages
3. Run tests before commit (husky pre-commit hook)
4. Create PR to merge back to feature branch
5. Merge feature branch to `development` after review

---

## Risk Mitigation

**API Dependency**:
- Mock API server for testing (`msw`)
- Graceful error handling for all API failures
- Health check indicator visible to users
- Cached data displayed during outages

**Static Export Limitations**:
- Thoroughly test static build early
- Document unsupported Next.js features
- Use 404.html for client-side routing fallback
- Validate all routes work in production build

**Accessibility Compliance**:
- Run jest-axe on all components
- Manual keyboard navigation testing
- Screen reader testing (NVDA/VoiceOver)
- Color contrast validation in Tailwind config

---

## References

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [SWR Documentation](https://swr.vercel.app/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [jest-axe](https://github.com/nickcolley/jest-axe)

---

## Next Steps

1. ✅ Research complete
2. → Fill Technical Context in plan.md
3. → Generate data-model.md
4. → Generate API contracts
5. → Generate quickstart.md
6. → Update agent context
7. → Re-evaluate constitution
