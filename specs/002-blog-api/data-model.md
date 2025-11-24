# Data Model: Blog Posts API

**Feature**: 002-blog-api  
**Date**: November 24, 2025  
**Purpose**: Define entities, fields, relationships, validation rules, and state transitions

## Entities

### Post

**Description**: Represents a blog article with metadata for content management and URL routing.

**Fields**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | Integer | Yes (auto) | Unique, positive | Auto-generated unique identifier |
| `title` | String | Yes | 1-200 chars, non-whitespace | Human-readable post title |
| `slug` | String | Yes (auto) | URL-safe, lowercase, derived from title | Auto-generated URL-friendly identifier |
| `body` | String | Yes | 1-50000 chars, non-whitespace | Post content (markdown or plain text) |
| `createdAt` | ISO 8601 DateTime | Yes (auto) | Immutable | Timestamp of post creation |
| `updatedAt` | ISO 8601 DateTime | Yes (auto) | Must be ≥ createdAt | Timestamp of last modification |

**JSON Schema Definition** (for Fastify validation):

```json
{
  "$id": "post",
  "type": "object",
  "required": ["id", "title", "slug", "body", "createdAt", "updatedAt"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1,
      "description": "Unique post identifier"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "pattern": "\\S",
      "description": "Post title (non-whitespace)"
    },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      "description": "URL-friendly slug"
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50000,
      "pattern": "\\S",
      "description": "Post content (non-whitespace)"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp (ISO 8601)"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp (ISO 8601)"
    }
  }
}
```

**Relationships**: None (single entity model; no comments, tags, or authors in scope)

**Indexes** (for SQLite adapter):
- Primary key on `id`
- Unique constraint on `slug` (prevents URL collisions)
- Index on `createdAt` (for chronological ordering if implemented)

## Validation Rules

### Create Post Request

**Required Fields**: `title`, `body`

**Schema**:
```json
{
  "type": "object",
  "required": ["title", "body"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "pattern": "\\S"
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50000,
      "pattern": "\\S"
    }
  },
  "additionalProperties": false
}
```

**Business Rules**:
1. Title must contain at least one non-whitespace character (FR-010)
2. Body must contain at least one non-whitespace character (FR-011)
3. Slug is auto-generated from title using `slugify(title, { lower: true, strict: true })` (FR-012)
4. `id` is auto-assigned (incremental integer for in-memory, auto-increment for SQLite) (FR-014)
5. `createdAt` and `updatedAt` both set to current UTC timestamp (FR-015, FR-016)

**Error Responses**:
- Missing `title`: `400 Bad Request` - "title is required"
- Missing `body`: `400 Bad Request` - "body is required"
- Title too long: `400 Bad Request` - "title must not exceed 200 characters"
- Body too long: `400 Bad Request` - "body must not exceed 50000 characters"
- Title only whitespace: `400 Bad Request` - "title must contain non-whitespace characters"
- Body only whitespace: `400 Bad Request` - "body must contain non-whitespace characters"

### Update Post Request (PATCH)

**Optional Fields**: `title`, `body` (at least one required)

**Schema**:
```json
{
  "type": "object",
  "minProperties": 1,
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "pattern": "\\S"
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50000,
      "pattern": "\\S"
    }
  },
  "additionalProperties": false
}
```

**Business Rules**:
1. At least one field (`title` or `body`) must be provided
2. If `title` is updated, `slug` is regenerated (FR-013)
3. `createdAt` remains unchanged (FR-017)
4. `updatedAt` is set to current UTC timestamp (FR-018)
5. Post must exist (checked via `id` in URL path)

**Error Responses**:
- Post not found: `404 Not Found` - "Post with id {id} not found"
- No fields provided: `400 Bad Request` - "At least one field (title or body) is required"
- Validation errors: Same as Create Post validation

### Get Post by ID

**Path Parameter**: `id` (integer)

**Schema**:
```json
{
  "type": "object",
  "required": ["id"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    }
  }
}
```

**Business Rules**:
1. Post must exist

**Error Responses**:
- Post not found: `404 Not Found` - "Post with id {id} not found"
- Invalid ID format: `400 Bad Request` - "id must be a positive integer"

### Delete Post

**Path Parameter**: `id` (integer)

**Schema**: Same as Get Post by ID

**Business Rules**:
1. Post must exist before deletion
2. Deletion is permanent (no soft delete)

**Error Responses**:
- Post not found: `404 Not Found` - "Post with id {id} not found"
- Invalid ID format: `400 Bad Request` - "id must be a positive integer"

## State Transitions

Posts have no explicit state machine (no draft/published workflow). Lifecycle:

```
┌─────────────┐
│  NOT EXISTS │
└──────┬──────┘
       │ POST /posts (create)
       ▼
┌─────────────┐
│   CREATED   │◄──┐
└──────┬──────┘   │
       │          │ PATCH /posts/:id (update)
       ├──────────┘
       │
       │ DELETE /posts/:id (delete)
       ▼
┌─────────────┐
│   DELETED   │
└─────────────┘
(permanent, no recovery)
```

**State-less transitions**:
- `GET /posts` - List all posts (read-only, no state change)
- `GET /posts/:id` - Retrieve single post (read-only, no state change)

## Slug Generation Algorithm

**Implementation** (using `slugify` library):

```javascript
import slugify from 'slugify';

function generateSlug(title) {
  return slugify(title, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters
    remove: /[*+~.()'"!:@]/g  // Remove specific punctuation
  });
}

// Examples:
// "Hello World" → "hello-world"
// "JavaScript: The Good Parts" → "javascript-the-good-parts"
// "C++ Programming" → "c-programming"
// "100% Pure" → "100-pure"
```

**Collision Handling** (if implemented):
1. Check if slug exists in storage
2. If collision, append `-{counter}`: `"hello-world"` → `"hello-world-2"`
3. Increment counter until unique slug found

**Note**: Collision handling is edge case handling (out of scope for MVP; see assumption A-008).

## Storage Adapter Interface

**Required Methods**:

```javascript
interface StorageAdapter {
  // Create new post
  createPost({ title, body }): Promise<Post>
  
  // Retrieve all posts
  getAllPosts(): Promise<Post[]>
  
  // Retrieve single post by ID
  getPostById(id): Promise<Post | null>
  
  // Update existing post
  updatePost(id, { title?, body? }): Promise<Post | null>
  
  // Delete post
  deletePost(id): Promise<boolean>
}
```

**Return Values**:
- `createPost()`: Full Post object with generated fields
- `getAllPosts()`: Array of Post objects (empty array if none)
- `getPostById()`: Post object or `null` if not found
- `updatePost()`: Updated Post object or `null` if not found
- `deletePost()`: `true` if deleted, `false` if not found

**Error Handling**:
- Adapters should throw descriptive errors for storage failures
- Service layer catches and transforms to HTTP errors

## Data Consistency Rules

1. **Immutable Creation Time**: `createdAt` never changes after post creation
2. **Update Timestamp**: `updatedAt` always reflects last modification time
3. **Slug Uniqueness**: No two posts can have the same slug (enforced by storage layer)
4. **ID Uniqueness**: IDs are unique and auto-generated (never reused after deletion)
5. **Atomic Operations**: Create/Update/Delete operations must be atomic (all-or-nothing)

## Migration Path (In-Memory → SQLite)

**Schema Compatibility**: Both adapters implement same interface; data format identical

**SQLite Table Definition**:

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 200),
  slug TEXT NOT NULL UNIQUE CHECK(slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*--*'),
  body TEXT NOT NULL CHECK(length(trim(body)) > 0 AND length(body) <= 50000),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_created ON posts(createdAt DESC);
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
```

**Migration Steps**:
1. Export data from in-memory storage: `getAllPosts()`
2. Initialize SQLite adapter with schema
3. Bulk insert posts preserving `id`, `createdAt`, `updatedAt`
4. Swap adapter in service configuration
5. Restart service with SQLite adapter

**Data Loss Considerations**:
- In-memory storage: Data lost on service restart (acceptable per A-010)
- SQLite storage: Data persists on disk; no data loss on restart
