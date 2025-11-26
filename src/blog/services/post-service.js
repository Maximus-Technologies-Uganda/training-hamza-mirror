/**
 * Post Service
 * 
 * Core business logic for blog post operations (CRUD).
 * Uses storage adapter for persistence, provides validation and error handling.
 */

import { ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { validatePost } from '../models/post.js';

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
    // Validate input
    const validation = validatePost(postData);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Create post via storage adapter
    const post = await this.storage.createPost(postData);
    return post;
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
    // Validate at least one field is provided
    if (!updates.title && !updates.body) {
      throw new ValidationError('At least one field (title or body) is required');
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

    // Update post via storage adapter
    const post = await this.storage.updatePost(id, updates);
    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }
    return post;
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} true if deleted
   * @throws {NotFoundError} If post not found
   */
  async deletePost(id) {
    const deleted = await this.storage.deletePost(id);
    if (!deleted) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }
    return true;
  }
}
