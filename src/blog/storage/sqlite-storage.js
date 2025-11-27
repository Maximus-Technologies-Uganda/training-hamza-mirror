/**
 * SQLite Storage Adapter
 * 
 * Persistent storage implementation using better-sqlite3.
 * Implements the StorageAdapter interface for CRUD operations on blog posts.
 */

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

/**
 * SQLite storage adapter implementing StorageAdapter interface
 */
export class SQLiteStorage {
  /**
   * Initialize SQLite database with schema
   * @param {string} dbPath - Path to SQLite database file
   */
  constructor(dbPath = './data/blog.db') {
    // Ensure data directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Initialize database connection
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    
    // Create schema
    this.initSchema();
  }

  /**
   * Create database schema if it doesn't exist
   */
  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 200),
        slug TEXT NOT NULL UNIQUE CHECK(slug NOT LIKE '%[-][-]%'),
        body TEXT NOT NULL CHECK(length(trim(body)) > 0 AND length(body) <= 50000),
        createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(createdAt DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    `);
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data {title, slug, body}
   * @returns {Promise<Object>} Created post with id and timestamps
   */
  async createPost({ title, slug, body }) {
    const stmt = this.db.prepare(`
      INSERT INTO posts (title, slug, body, createdAt, updatedAt)
      VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    `);

    const info = stmt.run(title, slug, body);
    
    // Retrieve the created post
    const post = this.db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }

  /**
   * Retrieve all posts
   * @returns {Promise<Array>} Array of all posts (empty if none)
   */
  async getAllPosts() {
    const posts = this.db.prepare('SELECT * FROM posts ORDER BY createdAt DESC').all();
    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }

  /**
   * Retrieve a single post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async getPostById(id) {
    const post = this.db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    
    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }

  /**
   * Update an existing post
   * @param {number} id - Post ID
   * @param {Object} updates - Fields to update {title?, slug?, body?}
   * @returns {Promise<Object|null>} Updated post or null if not found
   */
  async updatePost(id, updates) {
    // First check if post exists
    const existing = await this.getPostById(id);
    if (!existing) {
      return null;
    }

    // Build dynamic UPDATE query
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.slug !== undefined) {
      fields.push('slug = ?');
      values.push(updates.slug);
    }
    if (updates.body !== undefined) {
      fields.push('body = ?');
      values.push(updates.body);
    }

    // Always update updatedAt
    fields.push("updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    values.push(id); // WHERE id = ?

    const stmt = this.db.prepare(`
      UPDATE posts 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    // Return updated post
    return await this.getPostById(id);
  }

  /**
   * Delete a post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deletePost(id) {
    const stmt = this.db.prepare('DELETE FROM posts WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    this.db.close();
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database stats {postCount, dbSize}
   */
  async getStats() {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM posts').get();
    const dbSize = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
    
    return {
      postCount: result.count,
      dbSize: dbSize.size
    };
  }
}
