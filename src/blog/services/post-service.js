/**
 * Post Service
 * 
 * Core business logic for blog post operations (CRUD).
 * Uses storage adapter for persistence, provides validation and error handling.
 */

import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/error-handler.js';
import { validatePost } from '../models/post.js';
import { validateCreatePost, formatZodErrors } from '../models/post.zod.js';
import { generateSlug } from './slug-generator.js';

/**
 * Assert ownerId is valid (Firebase UID string)
 * @param {string} ownerId - Owner ID (Firebase UID)
 * @throws {ValidationError} If ownerId is invalid
 */
function assertOwnerId(ownerId) {
  if (ownerId === null || ownerId === undefined) {
    throw new ValidationError('ownerId is required for post creation');
  }
  if (typeof ownerId !== 'string' || ownerId.trim().length === 0) {
    throw new ValidationError('ownerId must be a non-empty string (Firebase UID)');
  }
}

/**
 * Assert userId is valid (Firebase UID string)
 * @param {string} userId - User ID (Firebase UID)
 * @param {string} action - Action being performed
 * @throws {ValidationError} If userId is invalid
 */
function assertUserId(userId, action) {
  if (userId === null || userId === undefined) {
    throw new ValidationError(`userId is required to ${action} a post`);
  }
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('userId must be a non-empty string (Firebase UID)');
  }
}

export class PostService {
  /**
   * @param {StorageAdapter} storage - Storage adapter instance
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @param {string} postData.title - Post title
   * @param {string} postData.body - Post body
   * @param {string} postData.ownerId - Owner ID (Firebase UID)
   * @returns {Promise<Object>} Created post
   * @throws {ValidationError} If validation fails
   */
  async createPost(postData) {
    assertOwnerId(postData.ownerId);

    // Validate input with Zod (title and body only)
    const { ownerId, ...postInput } = postData;
    const validation = validateCreatePost(postInput);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ');
      throw new ValidationError(errors);
    }

    // Generate slug from title
    const slug = generateSlug(validation.data.title);

    // Create post via storage adapter
    try {
      const post = await this.storage.createPost({
        title: validation.data.title,
        body: validation.data.body,
        ownerId,
        slug
      });
      return post;
    } catch (error) {
      // Catch SQLite UNIQUE constraint violation for duplicate slugs
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
          (error.message && error.message.includes('UNIQUE constraint failed'))) {
        throw new ValidationError(`A post with a similar title already exists (slug: ${slug})`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all posts
   * @returns {Promise<Array>} Array of all posts
   */
  async getAllPosts() {
    return await this.storage.getAllPosts();
  }

  /**
   * Get a single post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object>} Post object
   * @throws {NotFoundError} If post not found
   */
  async getPostById(id) {
    const post = await this.storage.getPostById(id);
    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }
    return post;
  }

  /**
   * Update an existing post
   * @param {number} id - Post ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - New title
   * @param {string} [updates.body] - New body
   * @returns {Promise<Object>} Updated post
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If post not found
   */
  async updatePost(id, updates) {
    // Import updatePostSchema for validation
    const { validateUpdatePost, formatZodErrors } = await import('../models/post.zod.js');
    
    // Validate input with Zod
    const validation = validateUpdatePost(updates);
    if (!validation.success) {
      const validationErrors = formatZodErrors(validation.error);
      const message = validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
      throw new ValidationError(message, null, validationErrors);
    }

    // Check if post exists
    const existingPost = await this.storage.getPostById(id);
    if (!existingPost) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    // Note: Ownership check removed - handled by authorization middleware (requireOwnerOrAdmin)

    // Regenerate slug if title is being updated
    const updateData = { ...validation.data };
    if (updateData.title !== undefined) {
      updateData.slug = generateSlug(updateData.title);
    }

    // Update post via storage adapter
    try {
      const post = await this.storage.updatePost(id, updateData);
      if (!post) {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      return post;
    } catch (error) {
      // Catch SQLite UNIQUE constraint violation for duplicate slugs
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
          (error.message && error.message.includes('UNIQUE constraint failed'))) {
        throw new ValidationError(`A post with a similar title already exists (slug: ${updateData.slug})`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} true if deleted
   * @throws {NotFoundError} If post not found
   * 
   * Note: Ownership/admin authorization is now handled by middleware (requireOwnerOrAdmin).
   * This method only verifies existence before deletion.
   */
  async deletePost(id) {
    // Check if post exists
    const existingPost = await this.storage.getPostById(id);
    if (!existingPost) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    // Delete post via storage adapter
    const deleted = await this.storage.deletePost(id);
    if (!deleted) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }
    return true;
  }
}
