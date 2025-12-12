/**
 * Test Health Endpoints
 * Tests /health and /health/ready endpoints
 */

import { createServer } from './src/blog/server.js';

async function testHealthEndpoints() {
  const server = await createServer({
    logger: false // Disable logging for cleaner output
  });

  try {
    console.log('🧪 Testing Health Endpoints\n');

    // Test 1: Basic health check
    console.log('1️⃣ Testing GET /health');
    const healthResponse = await server.inject({
      method: 'GET',
      url: '/health'
    });
    console.log(`   Status: ${healthResponse.statusCode}`);
    const healthData = JSON.parse(healthResponse.body);
    console.log(`   Status: ${healthData.status}`);
    console.log(`   Version: ${healthData.version}`);
    console.log(`   Uptime: ${healthData.uptime.toFixed(2)}s`);
    console.log(`   Timestamp: ${healthData.timestamp}\n`);

    // Test 2: Readiness check
    console.log('2️⃣ Testing GET /health/ready');
    const readyResponse = await server.inject({
      method: 'GET',
      url: '/health/ready'
    });
    console.log(`   Status: ${readyResponse.statusCode}`);
    const readyData = JSON.parse(readyResponse.body);
    console.log(`   Overall Status: ${readyData.status}`);
    console.log(`   Database: ${readyData.checks.database.status}`);
    if (readyData.checks.database.error) {
      console.log(`     Error: ${readyData.checks.database.error}`);
    }
    console.log(`   Firebase: ${readyData.checks.firebase.status}`);
    console.log(`     Connected: ${readyData.checks.firebase.connected}`);
    console.log(`     Project ID: ${readyData.checks.firebase.projectId}`);
    console.log(`     Emulator: ${readyData.checks.firebase.emulator}`);
    if (readyData.checks.firebase.error) {
      console.log(`     Error: ${readyData.checks.firebase.error}`);
    }
    console.log(`   Timestamp: ${readyData.timestamp}\n`);

    // Summary
    console.log('✅ Health endpoint tests completed successfully!');
    
    if (readyResponse.statusCode === 200) {
      console.log('✅ All systems ready!');
    } else if (readyResponse.statusCode === 503) {
      console.log('⚠️  System not ready - some checks failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await server.close();
  }
}

testHealthEndpoints();
