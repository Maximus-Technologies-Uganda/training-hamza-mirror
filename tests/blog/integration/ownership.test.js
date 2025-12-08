/**
 * Integration Tests for Post Ownership
 * 
 * T053: [US4] Tests cross-user edit rejection and ownership enforcement
 * Validates that users can only edit/delete their own posts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from '../../../src/blog/server.js';
import { AuthService } from '../../../src/blog/services/auth-service.js';

describe('Post Ownership Integration Tests', () => {
  let server;
  let authService;
  let aliceToken;
  let bobToken;

  beforeAll(async () => {
    // Initialize server with test configuration
    server = await createServer({ 
      logger: false,
      skipCors: true,
      skipHelmet: true,
      skipRequestContext: true,
      skipRateLimiting: true,
      jwtSecret: 'test-secret'
    });
    await server.ready();

    // Seed test users
    await server.userService.seedTestUsers();

    // Create auth service and generate tokens for both users
    authService = new AuthService(server);
    aliceToken = authService.signToken({ id: 1, username: 'alice' });
    bobToken = authService.signToken({ id: 2, username: 'bob' });
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Cross-user Edit Rejection', () => {
    let alicePost;

    beforeEach(async () => {
      // Create a post as alice before each test
      const response = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${aliceToken}`
        },
        payload: {
          title: `Alice's Post ${Date.now()}`,
          body: 'This post belongs to alice'
        }
      });

      alicePost = JSON.parse(response.body);
    });

    it('should allow alice to edit her own post', async () => {
      const updatedTitle = `Updated by Alice ${Date.now()}`;
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${alicePost.id}`,
        headers: {
          'Authorization': `Bearer ${aliceToken}`
        },
        payload: {
          title: updatedTitle
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.title).toBe(updatedTitle);
      expect(data.ownerId).toBe(1);
    });

    it('should reject bob trying to edit alice\'s post with 403', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${alicePost.id}`,
        headers: {
          'Authorization': `Bearer ${bobToken}`
        },
        payload: {
          title: 'Bob Trying to Edit'
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('FORBIDDEN');

      // Verify the post was not modified
      const getResponse = await server.inject({
        method: 'GET',
        url: `/posts/${alicePost.id}`
      });
      const unchangedPost = JSON.parse(getResponse.body);
      expect(unchangedPost.title).toBe(alicePost.title);
    });

    it('should allow bob to edit his own post', async () => {
      // Create a post as bob
      const createResponse = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${bobToken}`
        },
        payload: {
          title: `Bob's Post ${Date.now()}`,
          body: 'This post belongs to bob'
        }
      });

      const bobPost = JSON.parse(createResponse.body);
      expect(bobPost.ownerId).toBe(2);

      // Bob edits his own post
      const updatedTitle = `Updated by Bob ${Date.now()}`;
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${bobPost.id}`,
        headers: {
          'Authorization': `Bearer ${bobToken}`
        },
        payload: {
          title: updatedTitle
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.title).toBe(updatedTitle);
      expect(data.ownerId).toBe(2);
    });

    it('should reject alice trying to edit bob\'s post with 403', async () => {
      // Create a post as bob
      const createResponse = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${bobToken}`
        },
        payload: {
          title: `Bob's Protected Post ${Date.now()}`,
          body: 'Alice should not be able to edit this'
        }
      });

      const bobPost = JSON.parse(createResponse.body);

      // Alice tries to edit bob's post
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${bobPost.id}`,
        headers: {
          'Authorization': `Bearer ${aliceToken}`
        },
        payload: {
          title: 'Alice Trying to Edit'
        }
      });

      expect(response.statusCode).toBe(403);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated edit attempts with 401', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: `/posts/${alicePost.id}`,
        payload: {
          title: 'Anonymous Edit Attempt'
        }
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Ownership Preservation', () => {
    it('should preserve ownerId after update', async () => {
      // Create a post as alice with unique title to avoid slug collisions
      const uniqueTitle = `Ownership Preservation Test ${Date.now()}`;
      const createResponse = await server.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          'Authorization': `Bearer ${aliceToken}`
        },
        payload: {
          title: uniqueTitle,
          body: 'Testing that ownerId is preserved after update'
        }
      });

      const post = JSON.parse(createResponse.body);
      expect(post.ownerId).toBe(1);

      // Update the post
      const updatedTitle = `Updated Title ${Date.now()}`;
      const updateResponse = await server.inject({
        method: 'PATCH',
        url: `/posts/${post.id}`,
        headers: {
          'Authorization': `Bearer ${aliceToken}`
        },
        payload: {
          title: updatedTitle,
          body: 'Updated body content'
        }
      });

      const updatedPost = JSON.parse(updateResponse.body);
      expect(updatedPost.ownerId).toBe(1);
      expect(updatedPost.title).toBe(updatedTitle);

      // Fetch the post to double-check
      const getResponse = await server.inject({
        method: 'GET',
        url: `/posts/${post.id}`
      });

      const fetchedPost = JSON.parse(getResponse.body);
      expect(fetchedPost.ownerId).toBe(1);
    });
  });
});
