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
    const now = new Date().toISOString();
    const post = {
      id: this.nextId++,
      title: postData.title,
      slug: generateSlug(postData.title),
      body: postData.body,
      createdAt: now,
      updatedAt: now
    };

    this.posts.set(post.id, post);
    return post;
  }

  /**
   * Retrieve all posts
   * @returns {Promise<Array>} Array of all posts
   */
  async getAllPosts() {
    return Array.from(this.posts.values());
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

    // Update fields
    if (updates.title !== undefined) {
      post.title = updates.title;
      post.slug = generateSlug(updates.title); // Regenerate slug when title changes
    }
    if (updates.body !== undefined) {
      post.body = updates.body;
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
