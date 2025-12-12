# Data Model: Blog Authentication & Authorization

**Feature**: 004-blog-auth  
**Date**: December 5, 2025  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────┐         owns          ┌──────────────┐       │
│  │     User     │ ─────────────────────▶│     Post     │       │
│  └──────────────┘        1:N            └──────────────┘       │
│         │                                       │               │
│         │                                       │               │
│         ▼                                       ▼               │
│  ┌──────────────┐                       ┌──────────────┐       │
│  │   Session    │                       │   Extended   │       │
│  │   (JWT)      │                       │   with       │       │
│  │              │                       │   ownerId    │       │
│  └──────────────┘                       └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entities

### User (NEW)

Represents an authenticated user who can create and own blog posts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique user identifier |
| username | String | Unique, Required, 3-50 chars | Login identifier |
| passwordHash | String | Required | bcrypt hash of password |
| createdAt | DateTime | Required, Auto-generated | Account creation timestamp |

**Validation Rules**:
- `username`: 3-50 alphanumeric characters, lowercase, no spaces
- `passwordHash`: bcrypt hash (60 characters)

**Indexes**:
- Primary: `id`
- Unique: `username`

---

### Post (EXTENDED)

Extended with ownership field linking to creating user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique post identifier |
| title | String | Required, 1-200 chars | Post title |
| slug | String | Required, URL-safe | URL-friendly identifier |
| body | String | Required, 1-50000 chars | Post content |
| **ownerId** | Integer | **Required, Foreign Key → User.id** | **Creator's user ID (NEW)** |
| createdAt | DateTime | Required, Auto-generated | Creation timestamp |
| updatedAt | DateTime | Required, Auto-updated | Last modification timestamp |

**Changes from existing model**:
- Added `ownerId` field (required, references User.id)

**Validation Rules**:
- Existing rules unchanged
- `ownerId`: Must reference existing user

**Indexes**:
- Primary: `id`
- Index: `ownerId` (for "my posts" queries)

---

### Session/Token (TRANSIENT)

JWT token representing an active user session. Not persisted; validated on each request.

| Claim | Type | Description |
|-------|------|-------------|
| id | Integer | User's ID |
| username | String | User's username |
| iat | Integer | Issued-at timestamp (Unix) |
| exp | Integer | Expiration timestamp (Unix) |

**Token Properties**:
- Algorithm: HS256
- Expiration: 24 hours from issuance
- Storage: Client-side (localStorage)

---

## State Transitions

### User Lifecycle

```
                    ┌─────────────────┐
                    │   Pre-seeded    │
                    │   (startup)     │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────┐     ┌─────────────────┐
│   Guest     │────▶│   Registered    │
│  (no auth)  │     │   (in storage)  │
└─────────────┘     └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  Authenticated  │◀────────▶│  Logged Out     │
     │  (valid JWT)    │  logout  │  (no JWT)       │
     └─────────────────┘          └─────────────────┘
              │
              │ token expires
              ▼
     ┌─────────────────┐
     │  Session Expired│
     │  (invalid JWT)  │
     └─────────────────┘
```

### Post Authorization Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        API Request                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│               Is endpoint protected? (POST/PATCH/DELETE)          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │ NO                          │ YES
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  Allow request  │          │  Has valid JWT? │
     │  (public read)  │          └────────┬────────┘
     └─────────────────┘                   │
                               ┌───────────┴───────────┐
                               │ NO                    │ YES
                               ▼                       ▼
                      ┌─────────────────┐    ┌─────────────────┐
                      │  401 Unauth     │    │  Is owner?      │
                      └─────────────────┘    │  (PATCH/DELETE) │
                                             └────────┬────────┘
                                          ┌───────────┴───────────┐
                                          │ NO                    │ YES
                                          ▼                       ▼
                                 ┌─────────────────┐    ┌─────────────────┐
                                 │  403 Forbidden  │    │  Allow request  │
                                 └─────────────────┘    └─────────────────┘
```

---

## Migration Notes

### Existing Posts Migration

Posts created before auth feature will need an `ownerId`. Options:

1. **Default to first user**: Assign existing posts to `alice` (user ID 1)
2. **NULL allowed temporarily**: Allow NULL ownerId for legacy posts (read-only)
3. **Migration script**: Manually assign ownership

**Recommended**: Option 1 (assign to alice) for simplicity in this training context.

### Storage Adapter Changes

| Adapter | Changes Required |
|---------|------------------|
| MemoryStorage | Add `users` Map, extend `posts` with ownerId |
| SQLiteStorage | Add `users` table, ALTER `posts` ADD ownerId |
| FirestoreStorage | Add `users` collection, extend post documents |

---

## JSON Schemas

### User Schema (Internal)

```json
{
  "$id": "user",
  "type": "object",
  "required": ["id", "username", "passwordHash", "createdAt"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "pattern": "^[a-z0-9]+$"
    },
    "passwordHash": {
      "type": "string",
      "minLength": 60,
      "maxLength": 60
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### Extended Post Schema

```json
{
  "$id": "post",
  "type": "object",
  "required": ["id", "title", "slug", "body", "ownerId", "createdAt", "updatedAt"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "body": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50000
    },
    "ownerId": {
      "type": "integer",
      "minimum": 1,
      "description": "ID of the user who created this post"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### Login Request Schema

```json
{
  "$id": "loginRequest",
  "type": "object",
  "required": ["username", "password"],
  "properties": {
    "username": {
      "type": "string",
      "minLength": 1
    },
    "password": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

### Login Response Schema

```json
{
  "$id": "loginResponse",
  "type": "object",
  "required": ["token", "user"],
  "properties": {
    "token": {
      "type": "string",
      "description": "JWT access token"
    },
    "user": {
      "type": "object",
      "required": ["id", "username"],
      "properties": {
        "id": {
          "type": "integer"
        },
        "username": {
          "type": "string"
        }
      }
    }
  }
}
```

### Auth Error Response Schema

```json
{
  "$id": "authError",
  "type": "object",
  "required": ["error"],
  "properties": {
    "error": {
      "type": "object",
      "required": ["code", "message", "requestId"],
      "properties": {
        "code": {
          "type": "string",
          "enum": ["UNAUTHORIZED", "INVALID_TOKEN", "FORBIDDEN"]
        },
        "message": {
          "type": "string"
        },
        "requestId": {
          "type": "string",
          "format": "uuid"
        }
      }
    }
  }
}
```
