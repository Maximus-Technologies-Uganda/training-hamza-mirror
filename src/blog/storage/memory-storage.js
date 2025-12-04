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
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data containing title and body
   * @returns {Promise<Object>} Created post with generated fields
   */
  async createPost(postData) {
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
