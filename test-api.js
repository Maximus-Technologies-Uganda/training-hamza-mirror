/**
 * Manual API testing script
 * Tests all endpoints to verify functionality
 */

import { createServer } from './src/blog/server.js';

async function testAPI() {
  const server = await createServer();

  try {
    console.log('🧪 Testing Blog Posts API\n');

    // Test 1: Health check
    console.log('1️⃣ Testing GET /health');
    const healthResponse = await server.inject({
      method: 'GET',
      url: '/health'
    });
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Body: ${healthResponse.body}\n`);

    // Test 2: Create a post
    console.log('2️⃣ Testing POST /posts (Create post)');
    const createResponse = await server.inject({
      method: 'POST',
      url: '/posts',
      payload: {
        title: 'Getting Started with Node.js',
        body: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine.'
      }
    });
    console.log(`   Status: ${createResponse.statusCode}`);
    const createdPost = JSON.parse(createResponse.body);
    console.log(`   Created post ID: ${createdPost.id}`);
    console.log(`   Slug: ${createdPost.slug}\n`);

    // Test 3: List all posts
    console.log('3️⃣ Testing GET /posts (List all posts)');
    const listResponse = await server.inject({
      method: 'GET',
      url: '/posts'
    });
    console.log(`   Status: ${listResponse.statusCode}`);
    const posts = JSON.parse(listResponse.body);
    console.log(`   Total posts: ${posts.length}\n`);

    // Test 4: Get post by ID
    console.log('4️⃣ Testing GET /posts/:id (Get single post)');
    const getResponse = await server.inject({
      method: 'GET',
      url: `/posts/${createdPost.id}`
    });
    console.log(`   Status: ${getResponse.statusCode}`);
    console.log(`   Retrieved post title: ${JSON.parse(getResponse.body).title}\n`);

    // Test 5: Update post
    console.log('5️⃣ Testing PATCH /posts/:id (Update post)');
    const updateResponse = await server.inject({
      method: 'PATCH',
      url: `/posts/${createdPost.id}`,
      payload: {
        title: 'Complete Guide to Node.js'
      }
    });
    console.log(`   Status: ${updateResponse.statusCode}`);
    const updatedPost = JSON.parse(updateResponse.body);
    console.log(`   Updated title: ${updatedPost.title}`);
    console.log(`   Updated slug: ${updatedPost.slug}\n`);

    // Test 6: Create another post for testing
    console.log('6️⃣ Creating another post for delete test');
    const createResponse2 = await server.inject({
      method: 'POST',
      url: '/posts',
      payload: {
        title: 'Test Post to Delete',
        body: 'This post will be deleted.'
      }
    });
    const postToDelete = JSON.parse(createResponse2.body);
    console.log(`   Created post ID: ${postToDelete.id}\n`);

    // Test 7: Delete post
    console.log('7️⃣ Testing DELETE /posts/:id (Delete post)');
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/posts/${postToDelete.id}`
    });
    console.log(`   Status: ${deleteResponse.statusCode}`);
    console.log(`   Body: ${deleteResponse.body || '(No content)'}\n`);

    // Test 8: Verify deletion
    console.log('8️⃣ Verifying deleted post returns 404');
    const verifyDeleteResponse = await server.inject({
      method: 'GET',
      url: `/posts/${postToDelete.id}`
    });
    console.log(`   Status: ${verifyDeleteResponse.statusCode}`);
    console.log(`   Error message: ${JSON.parse(verifyDeleteResponse.body).message}\n`);

    // Test 9: Validation error (missing title)
    console.log('9️⃣ Testing validation error (missing title)');
    const validationResponse = await server.inject({
      method: 'POST',
      url: '/posts',
      payload: {
        body: 'Body without title'
      }
    });
    console.log(`   Status: ${validationResponse.statusCode}`);
    console.log(`   Error: ${JSON.parse(validationResponse.body).message}\n`);

    // Test 10: Validation error (title too long)
    console.log('🔟 Testing validation error (title too long)');
    const longTitle = 'A'.repeat(201);
    const validationResponse2 = await server.inject({
      method: 'POST',
      url: '/posts',
      payload: {
        title: longTitle,
        body: 'Some body'
      }
    });
    console.log(`   Status: ${validationResponse2.statusCode}`);
    console.log(`   Error includes length constraint: ${validationResponse2.body.includes('200')}\n`);

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await server.close();
  }
}

testAPI();
