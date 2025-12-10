# Audit Logging Verification Guide

This guide explains how to verify that audit logging is working correctly in the Blog Posts API.

## Overview

All mutations (CREATE, UPDATE, DELETE) on posts generate audit log entries with the following information:
- **User ID** (Firebase UID of the actor)
- **Action** (create, update, delete)
- **Target Type** (e.g., "post")
- **Target ID** (the resource identifier)
- **Request ID** (correlation ID for tracing)
- **IP Address** (client IP)
- **Metadata** (contextual data like before/after state)

## Implementation Details

### Audit Service

The audit service is located in `src/blog/services/audit-service.js` and provides structured logging with the following methods:

- `logCreate()` - Logs post creation
- `logUpdate()` - Logs post updates with before/after state
- `logDelete()` - Logs post deletion with deleted data

### Audit Middleware

The audit middleware (`src/blog/middleware/audit.js`) decorates each request with convenience methods:

- `request.auditCreate(targetType, targetId, data)`
- `request.auditUpdate(targetType, targetId, before, after)`
- `request.auditDelete(targetType, targetId, data)`

### Log Format

All audit logs include the field `audit: true` for easy filtering. Example:

```json
{
  "level": "info",
  "audit": true,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "firebase-uid-123",
  "action": "create",
  "targetType": "post",
  "targetId": "42",
  "metadata": {
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "ip": "127.0.0.1"
  },
  "msg": "Audit: create post 42"
}
```

## Verification Steps

### 1. Start the Server

```bash
npm run dev
```

### 2. Perform Mutations

Create, update, or delete posts using the API:

```bash
# Create a post (requires authentication)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"title":"Test Post","body":"This is a test"}'

# Update a post
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"title":"Updated Title"}'

# Delete a post
curl -X DELETE http://localhost:3000/posts/1 \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

### 3. Filter Audit Logs

#### Development (Pino Pretty)

In development, audit logs appear with other logs but are marked with `audit: true`.

#### Production (JSON Logs)

In production, filter audit logs using `jq`:

```bash
# Filter only audit logs
node src/blog/server.js 2>&1 | jq 'select(.audit == true)'

# Filter by action
node src/blog/server.js 2>&1 | jq 'select(.audit == true and .action == "create")'

# Filter by user
node src/blog/server.js 2>&1 | jq 'select(.audit == true and .userId == "firebase-uid-123")'

# Save audit trail to file
node src/blog/server.js 2>&1 | jq 'select(.audit == true)' > audit-trail.json
```

#### Using grep for simple filtering

```bash
# Filter audit logs (simple text search)
node src/blog/server.js 2>&1 | grep '"audit":true'
```

## Expected Audit Log Entries

### Post Creation

```json
{
  "audit": true,
  "action": "create",
  "targetType": "post",
  "targetId": "1",
  "userId": "firebase-uid-123",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "ip": "127.0.0.1"
  }
}
```

### Post Update

```json
{
  "audit": true,
  "action": "update",
  "targetType": "post",
  "targetId": "1",
  "userId": "firebase-uid-123",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "metadata": {
    "before": {
      "title": "My Blog Post",
      "body": "Original content"
    },
    "after": {
      "title": "Updated Blog Post",
      "body": "Updated content"
    },
    "ip": "127.0.0.1"
  }
}
```

### Post Deletion

```json
{
  "audit": true,
  "action": "delete",
  "targetType": "post",
  "targetId": "1",
  "userId": "firebase-uid-123",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "metadata": {
    "title": "Deleted Post",
    "slug": "deleted-post",
    "ip": "127.0.0.1"
  }
}
```

## Integration with Log Management Systems

### Cloud Logging (Google Cloud)

When deployed to Cloud Run, audit logs are automatically ingested by Cloud Logging. Filter using:

```
jsonPayload.audit=true
```

### CloudWatch (AWS)

Use CloudWatch Insights query:

```
fields @timestamp, userId, action, targetType, targetId
| filter audit = true
| sort @timestamp desc
```

### Elasticsearch

Query for audit logs:

```json
{
  "query": {
    "term": {
      "audit": true
    }
  }
}
```

## Troubleshooting

### No Audit Logs Appearing

1. Verify mutations are being executed (check response status codes)
2. Ensure authentication is working (audit logs require user context)
3. Check log level is set to `info` or lower (audit logs use info level)
4. Verify audit middleware is registered in `src/blog/server.js`

### Missing Request IDs

Request IDs are automatically generated by Fastify. Verify:
- `genReqId` is configured in server initialization
- Request ID plugin is registered

### Missing User IDs

User ID is extracted from Firebase token. Verify:
- Firebase Auth middleware is working
- Token is being sent in Authorization header
- Token is valid and not expired

## Related Files

- `src/blog/services/audit-service.js` - Audit service implementation
- `src/blog/middleware/audit.js` - Audit middleware with request decorators
- `src/blog/routes/posts.js` - Post routes with audit logging
- `src/blog/server.js` - Server configuration with Pino logger

## Compliance & Retention

For production deployments:
1. Configure log retention policies per compliance requirements
2. Ensure audit logs are backed up separately from application logs
3. Implement log rotation and archival
4. Restrict access to audit logs (only authorized personnel)
5. Consider log immutability for regulatory compliance
