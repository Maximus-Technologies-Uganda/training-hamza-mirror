/**
 * Post Service
 * 
 * Core business logic for blog post operations (CRUD).
 * Uses storage adapter for persistence, provides validation and error handling.
 */

import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/error-handler.js';
import { validatePost } from '../models/post.js';
import { generateSlug } from './slug-generator.js';

function assertOwnerId(ownerId) {
  if (ownerId === null || ownerId === undefined) {
    throw new ValidationError('ownerId is required for post creation');
  }
  if (typeof ownerId !== 'number' || Number.isNaN(ownerId) || ownerId <= 0) {
    throw new ValidationError('ownerId must be a positive integer');
  }
}

function assertUserId(userId, action) {
  if (userId === null || userId === undefined) {
    throw new ValidationError(`userId is required to ${action} a post`);
  }
  if (typeof userId !== 'number' || Number.isNaN(userId) || userId <= 0) {
    throw new ValidationError('userId must be a positive integer');
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
   * @returns {Promise<Object>} Created post
   * @throws {ValidationError} If validation fails
   */
  async createPost(postData) {
    assertOwnerId(postData.ownerId);

    // Validate input
    const validation = validatePost(postData);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Generate slug from title
    const slug = generateSlug(postData.title);

    // Create post via storage adapter
    try {
      const post = await this.storage.createPost({
        ...postData,
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
   * @param {number} [userId] - ID of user making the request (for ownership check)
   * @returns {Promise<Object>} Updated post
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If post not found
   * @throws {ForbiddenError} If user is not the owner
   */
  async updatePost(id, updates, userId = null) {
    assertUserId(userId, 'update');

    // Validate at least one field is provided
    if (!updates.title && !updates.body) {
      throw new ValidationError('At least one field (title or body) is required');
    }

    // Check if post exists and verify ownership
    const existingPost = await this.storage.getPostById(id);
    if (!existingPost) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    // Ownership check: ensure user owns the post OR the post is a legacy post (ownerId = 0)
    // Legacy posts (ownerId === 0) can be edited by any authenticated user
    const isLegacyPost = existingPost.ownerId === 0;
    const isOwner = existingPost.ownerId === userId;
    
    if (!isLegacyPost && !isOwner) {
      throw new ForbiddenError('Not authorized to edit this post');
    }

    // Validate individual fields if provided
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.length < 1 || updates.title.length > 200) {
        throw new ValidationError('title must be between 1 and 200 characters');
      }
      if (!/\S/.test(updates.title)) {
        throw new ValidationError('title must contain at least one non-whitespace character');
      }
    }

    if (updates.body !== undefined) {
      if (typeof updates.body !== 'string' || updates.body.length < 1 || updates.body.length > 50000) {
        throw new ValidationError('body must be between 1 and 50000 characters');
      }
      if (!/\S/.test(updates.body)) {
        throw new ValidationError('body must contain at least one non-whitespace character');
      }
    }

    // Regenerate slug if title is being updated
    if (updates.title !== undefined) {
      updates.slug = generateSlug(updates.title);
    }

    // Update post via storage adapter
    try {
      const post = await this.storage.updatePost(id, updates);
      if (!post) {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      return post;
    } catch (error) {
      // Catch SQLite UNIQUE constraint violation for duplicate slugs
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || 
          (error.message && error.message.includes('UNIQUE constraint failed'))) {
        throw new ValidationError(`A post with a similar title already exists (slug: ${updates.slug})`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @param {number} [userId] - ID of user making the request (for ownership check)
   * @returns {Promise<boolean>} true if deleted
   * @throws {NotFoundError} If post not found
   * @throws {ForbiddenError} If user is not the owner
   */
  async deletePost(id, userId = null) {
    assertUserId(userId, 'delete');

    // Check if post exists and verify ownership
    const existingPost = await this.storage.getPostById(id);
    if (!existingPost) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    // Ownership check: ensure user owns the post OR the post is a legacy post (ownerId = 0)
    // Legacy posts (ownerId === 0) can be deleted by any authenticated user
    const isLegacyPost = existingPost.ownerId === 0;
    const isOwner = existingPost.ownerId === userId;
    
    if (!isLegacyPost && !isOwner) {
      throw new ForbiddenError('Not authorized to delete this post');
    }

    const deleted = await this.storage.deletePost(id);
    if (!deleted) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }
    return true;
  }
}
