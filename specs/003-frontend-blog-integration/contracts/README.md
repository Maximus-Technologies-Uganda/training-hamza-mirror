# API Client Contract Documentation

**Feature**: 003-frontend-blog-integration  
**Date**: November 27, 2025  
**Source**: specs/002-blog-api/contracts/openapi.yaml

---

## Overview

This directory contains TypeScript API client contracts that provide type-safe access to the Blog Posts API. All functions match the OpenAPI 3.1 specification from feature 002-blog-api.

---

## Files

### `api-client.ts`

Complete TypeScript API client with:
- Type-safe functions for all API endpoints
- Error handling with custom ApiError class
- Request/response validation
- JSDoc documentation with examples
- Configuration via environment variables

---

## API Endpoints Summary

| Endpoint | Method | Function | Returns | Throws |
|----------|--------|----------|---------|--------|
| `/health` | GET | `getHealth()` | `HealthStatus` | Error (network) |
| `/posts` | GET | `getPosts()` | `Post[]` | ApiError, Error |
| `/posts/{id}` | GET | `getPost(id)` | `Post` | ApiError (404), Error |
| `/posts` | POST | `createPost(data)` | `Post` | ApiError (400), Error |
| `/posts/{id}` | PATCH | `updatePost(id, data)` | `Post` | ApiError (400, 404), Error |
| `/posts/{id}` | DELETE | `deletePost(id)` | `void` | ApiError (404), Error |

---

## Configuration

### Environment Variables

**Required**:
- `NEXT_PUBLIC_API_URL` - Base URL of Blog Posts API

**Example**:
```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.production (production build)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

**Access in Code**:
```typescript
import { API_URL } from './contracts/api-client';
console.log(API_URL);  // http://localhost:3000
```

---

## Usage Examples

### Import

```typescript
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getHealth,
  isApiError,
  type Post,
  type CreatePostInput
} from '@/lib/contracts/api-client';
```

### Health Check

```typescript
try {
  const health = await getHealth();
  if (health.status === 'ok') {
    console.log('API is healthy');
  }
} catch (error) {
  console.error('API health check failed', error);
}
```

### Fetch All Posts

```typescript
try {
  const posts = await getPosts();
  console.log(`Found ${posts.length} posts`);
} catch (error) {
  if (isApiError(error)) {
    console.error(`API error: ${error.message}`);
  } else {
    console.error('Network error', error);
  }
}
```

### Fetch Single Post

```typescript
try {
  const post = await getPost(123);
  console.log(post.title);
} catch (error) {
  if (isApiError(error) && error.statusCode === 404) {
    console.log('Post not found');
  } else {
    console.error('Error fetching post', error);
  }
}
```

### Create Post

```typescript
const newPostData: CreatePostInput = {
  title: 'Getting Started with Next.js',
  body: 'This is a comprehensive guide...'
};

try {
  const createdPost = await createPost(newPostData);
  console.log(`Created post #${createdPost.id}`);
  console.log(`Slug: ${createdPost.slug}`);
} catch (error) {
  if (isApiError(error) && error.statusCode === 400) {
    console.error('Validation error:', error.message);
  } else {
    console.error('Failed to create post', error);
  }
}
```

### Update Post

```typescript
// Update only title
try {
  const updated = await updatePost(123, {
    title: 'Updated Title'
  });
  console.log('Post updated:', updated.updatedAt);
} catch (error) {
  if (isApiError(error)) {
    if (error.statusCode === 404) {
      console.log('Post not found');
    } else if (error.statusCode === 400) {
      console.log('Validation error:', error.message);
    }
  }
}

// Update multiple fields
const updates: UpdatePostInput = {
  title: 'New Title',
  body: 'Updated content...'
};

const updated = await updatePost(123, updates);
```

### Delete Post

```typescript
try {
  await deletePost(123);
  console.log('Post deleted successfully');
} catch (error) {
  if (isApiError(error) && error.statusCode === 404) {
    console.log('Post already deleted or does not exist');
  } else {
    console.error('Failed to delete post', error);
  }
}
```

---

## Error Handling

### ApiError Class

All API errors (4xx, 5xx) throw `ApiError`:

```typescript
class ApiError extends Error {
  statusCode: number;  // HTTP status code
  error: string;       // Error type (e.g., "Bad Request")
  message: string;     // Human-readable message
}
```

### Type Guard

Use `isApiError()` to check error type:

```typescript
try {
  const post = await getPost(123);
} catch (error) {
  if (isApiError(error)) {
    // TypeScript knows error is ApiError
    console.log(error.statusCode);
    console.log(error.message);
  } else {
    // Network error or unexpected error
    console.error('Unexpected error', error);
  }
}
```

### Common Error Codes

| Status | Meaning | Common Causes | Handling |
|--------|---------|---------------|----------|
| 400 | Bad Request | Invalid input (missing title/body, too long, whitespace only) | Show validation error inline in form |
| 404 | Not Found | Post ID doesn't exist | Show "Post not found" page or message |
| 429 | Too Many Requests | Rate limit exceeded | Show "Please wait" message with retry |
| 500 | Internal Server Error | Server-side error | Show generic error message |
| Network | Connection failed | API unreachable, CORS, timeout | Show "Unable to connect" with retry |

---

## Integration with SWR

### Custom Hooks

```typescript
import useSWR from 'swr';
import { getPosts, getPost } from './contracts/api-client';

// Hook for all posts
export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR(
    '/posts',
    () => getPosts()
  );
  
  return {
    posts: data,
    isLoading,
    isError: error,
    mutate  // For manual revalidation
  };
}

// Hook for single post
export function usePost(id: number | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/posts/${id}` : null,
    () => id ? getPost(id) : null
  );
  
  return {
    post: data,
    isLoading,
    isError: error
  };
}
```

### Usage in Components

```typescript
const PostList = () => {
  const { posts, isLoading, isError } = usePosts();
  
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorMessage error={isError} />;
  if (!posts || posts.length === 0) return <EmptyState />;
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
```

### Mutations with Optimistic Updates

```typescript
import { mutate } from 'swr';

const handleDelete = async (postId: number) => {
  // Optimistically update UI
  mutate('/posts', 
    (posts: Post[]) => posts.filter(p => p.id !== postId),
    false  // Don't revalidate immediately
  );
  
  try {
    await deletePost(postId);
    mutate('/posts');  // Revalidate to confirm
  } catch (error) {
    mutate('/posts');  // Revert on error
    throw error;
  }
};
```

---

## Validation Rules

### Create/Update Post

| Field | Constraint | Error Message |
|-------|------------|---------------|
| title | Required | "title is required" |
| title | 1-200 characters | "title must be between 1 and 200 characters" |
| title | Non-whitespace | "title must contain non-whitespace characters" |
| body | Required | "body is required" |
| body | 1-50000 characters | "body must be between 1 and 50000 characters" |
| body | Non-whitespace | "body must contain non-whitespace characters" |

**Client-side validation should match these rules** (see data-model.md for react-hook-form config)

---

## Testing

### Unit Tests

```typescript
import { createPost, ApiError } from './api-client';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/posts', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({
      id: 1,
      title: 'Test',
      slug: 'test',
      body: 'Test body',
      createdAt: '2025-11-27T10:00:00Z',
      updatedAt: '2025-11-27T10:00:00Z'
    }));
  })
);

test('createPost returns new post', async () => {
  const post = await createPost({
    title: 'Test',
    body: 'Test body'
  });
  
  expect(post.id).toBe(1);
  expect(post.slug).toBe('test');
});
```

### Error Testing

```typescript
test('createPost throws ApiError on validation failure', async () => {
  server.use(
    rest.post('/posts', (req, res, ctx) => {
      return res(ctx.status(400), ctx.json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'title is required'
      }));
    })
  );
  
  await expect(createPost({ title: '', body: 'test' }))
    .rejects
    .toThrow(ApiError);
});
```

---

## Rate Limiting

The API implements rate limiting (default: 100 requests/minute per IP). Handle 429 responses:

```typescript
try {
  await createPost(data);
} catch (error) {
  if (isApiError(error) && error.statusCode === 429) {
    // Show user-friendly message
    showMessage('Too many requests. Please wait a moment and try again.');
    
    // Optional: Implement exponential backoff retry
    setTimeout(() => retry(), 5000);
  }
}
```

---

## CORS Configuration

API must be configured to allow requests from frontend domain:

**Development**: `http://localhost:3001` (Next.js dev server)  
**Production**: `https://<username>.github.io/training-hamza` (GitHub Pages)

If CORS errors occur, verify API CORS configuration includes frontend domain.

---

## References

- **OpenAPI Spec**: `specs/002-blog-api/contracts/openapi.yaml`
- **Data Model**: `specs/003-frontend-blog-integration/data-model.md`
- **Feature Spec**: `specs/003-frontend-blog-integration/spec.md`
- **SWR Documentation**: https://swr.vercel.app/
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
