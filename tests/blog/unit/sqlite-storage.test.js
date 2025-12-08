/**
 * SQLite Storage Adapter Tests
 * 
 * Tests for SQLite persistence implementation.
 * Verifies CRUD operations, data integrity, and adapter interface compliance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteStorage } from '../../../src/blog/storage/sqlite-storage.js';
import { unlinkSync, existsSync } from 'fs';

describe('SQLiteStorage Adapter', () => {
  const TEST_DB_PATH = './data/test-blog.db';
  let storage;
  let testUser;

  beforeEach(async () => {
    // Create fresh storage instance for each test
    storage = new SQLiteStorage(TEST_DB_PATH);
    // Create a test user for ownerId references (required for posts)
    testUser = await storage.createUser({
      username: 'testuser',
      passwordHash: 'hashedpassword123'
    });
  });

  afterEach(async () => {
    // Close connection and clean up test database
    await storage.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    // Clean up WAL files
    if (existsSync(`${TEST_DB_PATH}-wal`)) {
      unlinkSync(`${TEST_DB_PATH}-wal`);
    }
    if (existsSync(`${TEST_DB_PATH}-shm`)) {
      unlinkSync(`${TEST_DB_PATH}-shm`);
    }
  });

  describe('Schema Initialization', () => {
    it('should create database file on initialization', () => {
      expect(existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should create posts table with correct schema', async () => {
      // Verify we can insert a valid post
      const post = await storage.createPost({
        title: 'Test Post',
        slug: 'test-post',
        body: 'This is a test post body with sufficient content.',
        ownerId: testUser.id
      });

      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('createdAt');
      expect(post).toHaveProperty('updatedAt');
    });
  });

  describe('createPost', () => {
    it('should create a post and return it with id and timestamps', async () => {
      const postData = {
        title: 'My First Post',
        slug: 'my-first-post',
        body: 'This is the body of my first blog post.',
        ownerId: testUser.id
      };

      const post = await storage.createPost(postData);

      expect(post).toMatchObject({
        id: expect.any(Number),
        title: postData.title,
        slug: postData.slug,
        body: postData.body,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(post.id).toBeGreaterThan(0);
    });

    it('should auto-increment post IDs', async () => {
      const post1 = await storage.createPost({
        title: 'First',
        slug: 'first',
        body: 'First post',
        ownerId: testUser.id
      });

      const post2 = await storage.createPost({
        title: 'Second',
        slug: 'second',
        body: 'Second post',
        ownerId: testUser.id
      });

      expect(post2.id).toBe(post1.id + 1);
    });

    it('should enforce unique slug constraint', async () => {
      await storage.createPost({
        title: 'First Post',
        slug: 'unique-slug',
        body: 'First post body',
        ownerId: testUser.id
      });

      // Attempting to create another post with same slug should throw
      await expect(storage.createPost({
        title: 'Second Post',
        slug: 'unique-slug',
        body: 'Second post body',
        ownerId: testUser.id
      })).rejects.toThrow();
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();
      
      const post = await storage.createPost({
        title: 'Timestamped Post',
        slug: 'timestamped-post',
        body: 'Testing timestamps',
        ownerId: testUser.id
      });

      const after = new Date();

      expect(post.createdAt).toBeTruthy();
      expect(post.updatedAt).toBeTruthy();
      expect(post.createdAt).toBe(post.updatedAt); // Should be same on creation
    });
  });

  describe('getAllPosts', () => {
    it('should return empty array when no posts exist', async () => {
      const posts = await storage.getAllPosts();
      expect(posts).toEqual([]);
    });

    it('should return all posts ordered by createdAt DESC', async () => {
      // Create posts with delay to ensure different timestamps (SQLite has second precision)
      const post1 = await storage.createPost({
        title: 'First',
        slug: 'first',
        body: 'First post',
        ownerId: testUser.id
      });

      await new Promise(resolve => setTimeout(resolve, 1100));

      const post2 = await storage.createPost({
        title: 'Second',
        slug: 'second',
        body: 'Second post',
        ownerId: testUser.id
      });

      await new Promise(resolve => setTimeout(resolve, 1100));

      const post3 = await storage.createPost({
        title: 'Third',
        slug: 'third',
        body: 'Third post',
        ownerId: testUser.id
      });

      const posts = await storage.getAllPosts();

      expect(posts).toHaveLength(3);
      // Most recent first (highest ID should be first if timestamps are same)
      // SQLite orders by createdAt DESC, and IDs auto-increment
      expect(posts[0].id).toBeGreaterThanOrEqual(posts[1].id);
      expect(posts[1].id).toBeGreaterThanOrEqual(posts[2].id);
    });

    it('should return complete post objects with all fields', async () => {
      await storage.createPost({
        title: 'Complete Post',
        slug: 'complete-post',
        body: 'Complete post body',
        ownerId: testUser.id
      });

      const posts = await storage.getAllPosts();

      expect(posts[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        slug: expect.any(String),
        body: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });

  describe('getPostById', () => {
    it('should return null for non-existent post', async () => {
      const post = await storage.getPostById(999);
      expect(post).toBeNull();
    });

    it('should retrieve existing post by id', async () => {
      const created = await storage.createPost({
        title: 'Retrievable Post',
        slug: 'retrievable-post',
        body: 'This post can be retrieved',
        ownerId: testUser.id
      });

      const retrieved = await storage.getPostById(created.id);

      expect(retrieved).toMatchObject({
        id: created.id,
        title: created.title,
        slug: created.slug,
        body: created.body
      });
    });

    it('should return complete post object with timestamps', async () => {
      const created = await storage.createPost({
        title: 'Post with Timestamps',
        slug: 'post-with-timestamps',
        body: 'Testing timestamp retrieval',
        ownerId: testUser.id
      });

      const retrieved = await storage.getPostById(created.id);

      expect(retrieved.createdAt).toBeTruthy();
      expect(retrieved.updatedAt).toBeTruthy();
    });
  });

  describe('updatePost', () => {
    it('should return null for non-existent post', async () => {
      const result = await storage.updatePost(999, { title: 'New Title' });
      expect(result).toBeNull();
    });

    it('should update post title', async () => {
      const created = await storage.createPost({
        title: 'Original Title',
        slug: 'original-slug',
        body: 'Original body',
        ownerId: testUser.id
      });

      const updated = await storage.updatePost(created.id, {
        title: 'Updated Title',
        slug: 'updated-slug'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.slug).toBe('updated-slug');
      expect(updated.body).toBe('Original body'); // Unchanged
    });

    it('should update post body', async () => {
      const created = await storage.createPost({
        title: 'Title',
        slug: 'slug',
        body: 'Original body',
        ownerId: testUser.id
      });

      const updated = await storage.updatePost(created.id, {
        body: 'Updated body content'
      });

      expect(updated.body).toBe('Updated body content');
      expect(updated.title).toBe('Title'); // Unchanged
    });

    it('should update multiple fields simultaneously', async () => {
      const created = await storage.createPost({
        title: 'Old Title',
        slug: 'old-slug',
        body: 'Old body',
        ownerId: testUser.id
      });

      const updated = await storage.updatePost(created.id, {
        title: 'New Title',
        slug: 'new-slug',
        body: 'New body'
      });

      expect(updated.title).toBe('New Title');
      expect(updated.slug).toBe('new-slug');
      expect(updated.body).toBe('New body');
    });

    it('should preserve createdAt timestamp', async () => {
      const created = await storage.createPost({
        title: 'Original',
        slug: 'original',
        body: 'Original body',
        ownerId: testUser.id
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await storage.updatePost(created.id, {
        title: 'Updated'
      });

      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await storage.createPost({
        title: 'Original',
        slug: 'original',
        body: 'Original body',
        ownerId: testUser.id
      });

      // Wait at least 1 second for SQLite timestamp to change (second precision)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const updated = await storage.updatePost(created.id, {
        title: 'Updated'
      });

      // updatedAt should be different from original
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('should enforce unique slug constraint on update', async () => {
      await storage.createPost({
        title: 'First',
        slug: 'first-slug',
        body: 'First post',
        ownerId: testUser.id
      });

      const second = await storage.createPost({
        title: 'Second',
        slug: 'second-slug',
        body: 'Second post',
        ownerId: testUser.id
      });

      // Try to update second post to use first post's slug
      await expect(storage.updatePost(second.id, {
        slug: 'first-slug'
      })).rejects.toThrow();
    });
  });

  describe('deletePost', () => {
    it('should return false for non-existent post', async () => {
      const result = await storage.deletePost(999);
      expect(result).toBe(false);
    });

    it('should delete existing post and return true', async () => {
      const created = await storage.createPost({
        title: 'To Be Deleted',
        slug: 'to-be-deleted',
        body: 'This post will be deleted',
        ownerId: testUser.id
      });

      const result = await storage.deletePost(created.id);
      expect(result).toBe(true);

      // Verify post is gone
      const retrieved = await storage.getPostById(created.id);
      expect(retrieved).toBeNull();
    });

    it('should remove post from getAllPosts results', async () => {
      const post1 = await storage.createPost({
        title: 'Post 1',
        slug: 'post-1',
        body: 'First post',
        ownerId: testUser.id
      });

      const post2 = await storage.createPost({
        title: 'Post 2',
        slug: 'post-2',
        body: 'Second post',
        ownerId: testUser.id
      });

      await storage.deletePost(post1.id);

      const posts = await storage.getAllPosts();
      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe(post2.id);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across storage instance recreations', async () => {
      // Create post with first instance
      const created = await storage.createPost({
        title: 'Persistent Post',
        slug: 'persistent-post',
        body: 'This should persist',
        ownerId: testUser.id
      });

      await storage.close();

      // Create new instance pointing to same database
      const newStorage = new SQLiteStorage(TEST_DB_PATH);
      
      const retrieved = await newStorage.getPostById(created.id);
      expect(retrieved).toMatchObject({
        id: created.id,
        title: created.title,
        slug: created.slug,
        body: created.body
      });

      await newStorage.close();
    });
  });

  describe('getStats', () => {
    it('should return zero count for empty database', async () => {
      const stats = await storage.getStats();
      expect(stats.postCount).toBe(0);
      expect(stats.dbSize).toBeGreaterThan(0); // Database file exists even if empty
    });

    it('should return correct post count', async () => {
      await storage.createPost({ title: 'Post 1', slug: 'post-1', body: 'Body 1', ownerId: testUser.id });
      await storage.createPost({ title: 'Post 2', slug: 'post-2', body: 'Body 2', ownerId: testUser.id });
      await storage.createPost({ title: 'Post 3', slug: 'post-3', body: 'Body 3', ownerId: testUser.id });

      const stats = await storage.getStats();
      expect(stats.postCount).toBe(3);
    });

    it('should return database size', async () => {
      const stats = await storage.getStats();
      expect(stats.dbSize).toBeGreaterThan(0);
      expect(typeof stats.dbSize).toBe('number');
    });
  });

  describe('hasAnyUsers', () => {
    it('should return false when only _system_migration user exists', async () => {
      // Remove the testUser created in beforeEach by creating fresh storage
      await storage.close();
      if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
      }
      
      // Create fresh storage
      storage = new SQLiteStorage(TEST_DB_PATH);
      
      // Manually insert the _system_migration user (simulating migration)
      storage.db.prepare(`
        INSERT INTO users (username, passwordHash, createdAt)
        VALUES ('_system_migration', 'LOCKED_NO_LOGIN', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      `).run();

      // hasAnyUsers should return false because _system_migration is excluded
      const hasUsers = await storage.hasAnyUsers();
      expect(hasUsers).toBe(false);
    });

    it('should return true when a real user exists alongside _system_migration', async () => {
      // Remove the testUser created in beforeEach by creating fresh storage
      await storage.close();
      if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
      }
      
      // Create fresh storage
      storage = new SQLiteStorage(TEST_DB_PATH);
      
      // Insert both _system_migration and a real user
      storage.db.prepare(`
        INSERT INTO users (username, passwordHash, createdAt)
        VALUES ('_system_migration', 'LOCKED_NO_LOGIN', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      `).run();
      
      await storage.createUser({
        username: 'realuser',
        passwordHash: 'hashedpassword'
      });

      // hasAnyUsers should return true because a real user exists
      const hasUsers = await storage.hasAnyUsers();
      expect(hasUsers).toBe(true);
    });

    it('should return true when only regular users exist (no _system_migration)', async () => {
      // The testUser from beforeEach is a regular user
      const hasUsers = await storage.hasAnyUsers();
      expect(hasUsers).toBe(true);
    });
  });
});
