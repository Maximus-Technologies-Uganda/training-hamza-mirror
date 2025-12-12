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
   * Create database schema if it doesn't exist, and migrate existing schemas
   */
  initSchema() {
    // Enable foreign key enforcement
    this.db.pragma('foreign_keys = ON');

    // Create users table FIRST (before posts, since posts references users)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE CHECK(length(username) >= 3 AND length(username) <= 50),
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Check if posts table exists and needs migration
    const postsTableExists = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
    ).get();

    if (postsTableExists) {
      // Check if ownerId column exists and its type
      const columns = this.db.prepare("PRAGMA table_info(posts)").all();
      const ownerIdColumn = columns.find(col => col.name === 'ownerId');

      if (!ownerIdColumn) {
        // Migration: add ownerId column to existing posts table
        this.migrateAddOwnerId();
      } else if (ownerIdColumn.type === 'INTEGER') {
        // Migration: convert INTEGER ownerId to TEXT (Firebase UID)
        this.migrateOwnerIdToString();
      }
    } else {
      // Create posts table with full schema (new database)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 200),
          slug TEXT NOT NULL UNIQUE CHECK(slug NOT LIKE '%[-][-]%'),
          body TEXT NOT NULL CHECK(length(trim(body)) > 0 AND length(body) <= 50000),
          ownerId TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(createdAt DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
        CREATE INDEX IF NOT EXISTS idx_posts_owner ON posts(ownerId);
      `);
    }
  }

  /**
   * Migrate existing posts table to add ownerId column
   * Assigns legacy posts to ownerId = 'system' (unowned)
   */
  migrateAddOwnerId() {
    // Check if there are any existing posts that need an owner
    const postCount = this.db.prepare('SELECT COUNT(*) as count FROM posts').get().count;

    // Add ownerId column as TEXT for Firebase UID
    this.db.exec(`ALTER TABLE posts ADD COLUMN ownerId TEXT`);
    
    if (postCount > 0) {
      // Backfill existing posts with ownerId = 'system' (legacy posts)
      this.db.prepare("UPDATE posts SET ownerId = 'system' WHERE ownerId IS NULL").run();
      console.log(`[MIGRATION] Assigned ${postCount} legacy posts to ownerId = 'system'`);
    }

    // Create the owner index
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_owner ON posts(ownerId)`);
    
    console.log('[MIGRATION] Successfully added ownerId column to posts table');
  }

  /**
   * Migrate ownerId from INTEGER to TEXT (Firebase UID migration)
   * Converts existing integer owner IDs to string format
   */
  migrateOwnerIdToString() {
    console.log('[MIGRATION] Converting ownerId from INTEGER to TEXT for Firebase UID support');
    
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    this.db.exec(`
      -- Create new posts table with TEXT ownerId
      CREATE TABLE posts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 200),
        slug TEXT NOT NULL UNIQUE CHECK(slug NOT LIKE '%[-][-]%'),
        body TEXT NOT NULL CHECK(length(trim(body)) > 0 AND length(body) <= 50000),
        ownerId TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Copy data, converting ownerId to string, use 'system' for 0 (legacy posts)
      INSERT INTO posts_new (id, title, slug, body, ownerId, createdAt, updatedAt)
      SELECT 
        id, 
        title, 
        slug, 
        body, 
        CASE 
          WHEN ownerId = 0 THEN 'system'
          ELSE CAST(ownerId AS TEXT)
        END as ownerId,
        createdAt, 
        updatedAt
      FROM posts;

      -- Drop old table
      DROP TABLE posts;

      -- Rename new table
      ALTER TABLE posts_new RENAME TO posts;

      -- Recreate indexes
      CREATE INDEX idx_posts_created ON posts(createdAt DESC);
      CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
      CREATE INDEX idx_posts_owner ON posts(ownerId);
    `);

    const postCount = this.db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    console.log(`[MIGRATION] Successfully migrated ${postCount} posts to use TEXT ownerId`);
  }

  // ==================== User Methods ====================

  /**
   * Create a new user
   * @param {Object} userData - User data {username, passwordHash}
   * @returns {Promise<Object>} Created user with id and timestamps
   */
  async createUser({ username, passwordHash }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, passwordHash, createdAt)
      VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    `);

    const info = stmt.run(username, passwordHash);
    
    // Retrieve the created user
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt
    };
  }

  /**
   * Retrieve a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUser(id) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt
    };
  }

  /**
   * Retrieve a user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserByUsername(username) {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt
    };
  }

  /**
   * Determine whether any real (non-system) user exists in the database
   * Excludes the _system_migration user created during schema migration
   * to ensure bootstrap admin creation still happens after legacy upgrades
   * @returns {Promise<boolean>} true if at least one real user exists
   */
  async hasAnyUsers() {
    const row = this.db.prepare(
      "SELECT 1 as hasUser FROM users WHERE username != '_system_migration' LIMIT 1"
    ).get();
    return !!row;
  }

  // ==================== Post Methods ====================

  // ==================== Post Methods ====================

  /**
   * Create a new post
   * @param {Object} postData - Post data {title, slug, body, ownerId}
   * @returns {Promise<Object>} Created post with id and timestamps
   */
  async createPost({ title, slug, body, ownerId }) {
    if (ownerId === null || ownerId === undefined) {
      const error = new Error('ownerId is required');
      error.code = 'SQLITE_CONSTRAINT_NOTNULL';
      throw error;
    }

    const stmt = this.db.prepare(`
      INSERT INTO posts (title, slug, body, ownerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    `);

    const info = stmt.run(title, slug, body, ownerId);
    
    // Retrieve the created post
    const post = this.db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
    
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      body: post.body,
      ownerId: post.ownerId,
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
      ownerId: post.ownerId,
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
      ownerId: post.ownerId,
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
