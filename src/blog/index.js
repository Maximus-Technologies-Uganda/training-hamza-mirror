/**
 * Blog API Library Exports
 * 
 * Main entry point for the Blog Posts API library.
 * Exports services, storage adapters, models, and error types for external use.
 */

// Services
export { PostService } from './services/post-service.js';
export { generateSlug } from './services/slug-generator.js';

// Storage Adapters
export { StorageAdapter } from './storage/storage-adapter.js';
export { MemoryStorage } from './storage/memory-storage.js';

// Models and Schemas
export {
  postSchema,
  createPostSchema,
  updatePostSchema,
  postValidation,
  validatePost
} from './models/post.js';

// Error Types
export {
  ApiError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  errorHandler
} from './middleware/error-handler.js';

// Server Factory
export { createServer } from './server.js';
export { default } from './server.js';
