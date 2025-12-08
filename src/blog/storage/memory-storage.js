/**
 * In-Memory Storage Adapter
 * 
 * Implements the StorageAdapter interface using in-memory data structures.
 * Fast performance (<10ms operations) but data is lost on restart.
 */

import { StorageAdapter } from './storage-adapter.js';
import { generateSlug } from '../services/slug-generator.js';

export class MemoryStorage extends StorageAdapter {
  constructor() {
    super();
    this.posts = new Map(); // Map<id, post>
    this.nextId = 1;
    
    // User storage
    this.users = new Map(); // Map<id, user>
    this.nextUserId = 1;
  }

  // ==================== User Methods ====================

  /**
   * Create a new user
   * @param {Object} userData - User data containing username and passwordHash
   * @returns {Promise<Object>} Created user with generated fields
   */
  async createUser(userData) {
    // Enforce unique username
    for (const user of this.users.values()) {
      if (user.username === userData.username) {
        const error = new Error('UNIQUE constraint failed: users.username');
        error.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw error;
      }
    }

    const now = new Date().toISOString();
    const user = {
      id: this.nextUserId++,
      username: userData.username,
      passwordHash: userData.passwordHash,
      createdAt: now
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * Retrieve a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser(id) {
    return this.users.get(id) || null;
  }

  /**
   * Retrieve a user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  /**
   * Check if any user exists in memory
   * @returns {Promise<boolean>} true if at least one user exists
   */
  async hasAnyUsers() {
    return this.users.size > 0;
  }

  // ==================== Post Methods ====================

  // ==================== Post Methods ====================

  /**
   * Create a new post
   * @param {Object} postData - Post data containing title, body, and optionally ownerId
   * @returns {Promise<Object>} Created post with generated fields
   */
  async createPost(postData) {
    if (postData.ownerId === null || postData.ownerId === undefined) {
      const error = new Error('ownerId is required');
      error.code = 'SQLITE_CONSTRAINT_NOTNULL';
      throw error;
    }

    const slug = postData.slug ?? generateSlug(postData.title);

    // Mirror SQLite UNIQUE constraint on slug
    if (Array.from(this.posts.values()).some(existing => existing.slug === slug)) {
      const error = new Error('UNIQUE constraint failed: posts.slug');
      error.code = 'SQLITE_CONSTRAINT_UNIQUE';
      throw error;
    }

    const now = new Date().toISOString();
    const post = {
      id: this.nextId++,
      title: postData.title,
      slug,
      body: postData.body,
      ownerId: postData.ownerId,
      createdAt: now,
      updatedAt: now
    };

    this.posts.set(post.id, post);
    return post;
  }

  /**
   * Retrieve all posts
   * @returns {Promise<Array>} Array of all posts sorted by createdAt DESC (newest first)
   */
  async getAllPosts() {
    return Array.from(this.posts.values()).sort((a, b) => {
      // Sort by createdAt descending (newest first) for consistency across all storage adapters
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Retrieve a single post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(id) {
    return this.posts.get(id) || null;
  }

  /**
   * Update an existing post
   * @param {number} id - Post ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated post or null if not found
   */
  async updatePost(id, updates) {
    const post = this.posts.get(id);
    if (!post) {
      return null;
    }

    // Determine the next slug (regenerate when title changes unless explicitly provided)
    const nextSlug = updates.slug !== undefined
      ? updates.slug
      : (updates.title !== undefined ? generateSlug(updates.title) : post.slug);

    // Enforce slug uniqueness (skip self)
    if (nextSlug !== post.slug) {
      const hasConflict = Array.from(this.posts.values())
        .some(existing => existing.id !== id && existing.slug === nextSlug);
      if (hasConflict) {
        const error = new Error('UNIQUE constraint failed: posts.slug');
        error.code = 'SQLITE_CONSTRAINT_UNIQUE';
        throw error;
      }
    }

    // Update fields
    if (updates.title !== undefined) {
      post.title = updates.title;
    }
    if (updates.body !== undefined) {
      post.body = updates.body;
    }
    if (updates.title !== undefined || updates.slug !== undefined) {
      post.slug = nextSlug;
    }

    // Update timestamp (preserve createdAt)
    post.updatedAt = new Date().toISOString();

    this.posts.set(id, post);
    return post;
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deletePost(id) {
    return this.posts.delete(id);
  }
}
