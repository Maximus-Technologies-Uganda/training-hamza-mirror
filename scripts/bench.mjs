#!/usr/bin/env node
/**
 * API Benchmark Script
 * 
 * Runs 100 reads + 20 writes at concurrency 5, records p50/p95 latencies.
 * Outputs results to console and optionally to GITHUB_STEP_SUMMARY.
 * 
 * Usage:
 *   node scripts/bench.mjs [--base-url=http://localhost:3000]
 * 
 * Environment:
 *   API_BASE_URL - Base URL of the API (default: http://localhost:3000)
 *   GITHUB_STEP_SUMMARY - If set, appends markdown table to this file
 */

const BASE_URL = process.env.API_BASE_URL || process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:3000';

// Configuration
const READ_COUNT = 100;
const WRITE_COUNT = 20;
const CONCURRENCY = 5;

// Results storage
const results = {
  reads: [],
  writes: [],
  errors: []
};

/**
 * Execute a single HTTP request and measure latency
 */
async function timedFetch(url, options = {}) {
  const start = performance.now();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': `bench-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...options.headers
      }
    });
    const latency = performance.now() - start;
    return { ok: response.ok, status: response.status, latency };
  } catch (error) {
    const latency = performance.now() - start;
    return { ok: false, status: 0, latency, error: error.message };
  }
}

/**
 * Run requests with controlled concurrency
 */
async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const executing = new Set();
  
  for (const task of tasks) {
    const promise = task().then(result => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);
    results.push(promise);
    
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

/**
 * Format latency in ms
 */
function formatMs(ms) {
  return `${ms.toFixed(2)}ms`;
}

/**
 * Main benchmark runner
 */
async function runBenchmark() {
  console.log('🚀 Starting API Benchmark');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Reads: ${READ_COUNT}, Writes: ${WRITE_COUNT}, Concurrency: ${CONCURRENCY}`);
  console.log('');
  
  // First, create some posts to read
  console.log('📝 Seeding posts for read tests...');
  const seedResults = await runWithConcurrency(
    Array(5).fill(null).map((_, i) => () => 
      timedFetch(`${BASE_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          title: `Bench Seed Post ${i + 1}`,
          body: `This is a seed post for benchmarking. Created at ${new Date().toISOString()}`
        })
      })
    ),
    1
  );
  
  const seedSuccessful = seedResults.filter(r => r.ok).length;
  console.log(`   Seeded ${seedSuccessful} posts`);
  console.log('');
  
  // Run READ tests (GET /posts)
  console.log(`📖 Running ${READ_COUNT} READ requests (GET /posts)...`);
  const readTasks = Array(READ_COUNT).fill(null).map(() => () => 
    timedFetch(`${BASE_URL}/posts`)
  );
  
  const readResults = await runWithConcurrency(readTasks, CONCURRENCY);
  results.reads = readResults.filter(r => r.ok).map(r => r.latency);
  const readErrors = readResults.filter(r => !r.ok);
  
  console.log(`   ✅ Successful: ${results.reads.length}/${READ_COUNT}`);
  if (readErrors.length > 0) {
    console.log(`   ❌ Errors: ${readErrors.length}`);
    results.errors.push(...readErrors.map(e => ({ type: 'READ', ...e })));
  }
  console.log('');
  
  // Run WRITE tests (POST /posts)
  console.log(`✍️  Running ${WRITE_COUNT} WRITE requests (POST /posts)...`);
  const writeTasks = Array(WRITE_COUNT).fill(null).map((_, i) => () => 
    timedFetch(`${BASE_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify({
        title: `Bench Post ${i + 1} - ${Date.now()}`,
        body: `Benchmark test post content. Iteration ${i + 1}.`
      })
    })
  );
  
  const writeResults = await runWithConcurrency(writeTasks, CONCURRENCY);
  results.writes = writeResults.filter(r => r.ok).map(r => r.latency);
  const writeErrors = writeResults.filter(r => !r.ok);
  
  console.log(`   ✅ Successful: ${results.writes.length}/${WRITE_COUNT}`);
  if (writeErrors.length > 0) {
    console.log(`   ❌ Errors: ${writeErrors.length}`);
    results.errors.push(...writeErrors.map(e => ({ type: 'WRITE', ...e })));
  }
  console.log('');
  
  // Calculate statistics
  const readsSorted = [...results.reads].sort((a, b) => a - b);
  const writesSorted = [...results.writes].sort((a, b) => a - b);
  
  const stats = {
    reads: {
      count: results.reads.length,
      p50: percentile(readsSorted, 50),
      p95: percentile(readsSorted, 95),
      min: readsSorted[0] || 0,
      max: readsSorted[readsSorted.length - 1] || 0
    },
    writes: {
      count: results.writes.length,
      p50: percentile(writesSorted, 50),
      p95: percentile(writesSorted, 95),
      min: writesSorted[0] || 0,
      max: writesSorted[writesSorted.length - 1] || 0
    }
  };
  
  // Print results table
  console.log('📊 Results');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('| Operation | Count | p50 | p95 | Min | Max |');
  console.log('|-----------|-------|-----|-----|-----|-----|');
  console.log(`| GET /posts (reads) | ${stats.reads.count} | ${formatMs(stats.reads.p50)} | ${formatMs(stats.reads.p95)} | ${formatMs(stats.reads.min)} | ${formatMs(stats.reads.max)} |`);
  console.log(`| POST /posts (writes) | ${stats.writes.count} | ${formatMs(stats.writes.p50)} | ${formatMs(stats.writes.p95)} | ${formatMs(stats.writes.min)} | ${formatMs(stats.writes.max)} |`);
  console.log('');
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Total errors: ${results.errors.length}`);
  console.log('');
  
  // Write to GITHUB_STEP_SUMMARY if available
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import('fs');
    const summary = `
## 📊 API Latency Benchmark Results

**Configuration**: ${READ_COUNT} reads + ${WRITE_COUNT} writes @ concurrency ${CONCURRENCY}

| Operation | Count | p50 | p95 | Min | Max |
|-----------|-------|-----|-----|-----|-----|
| GET /posts (reads) | ${stats.reads.count} | ${formatMs(stats.reads.p50)} | ${formatMs(stats.reads.p95)} | ${formatMs(stats.reads.min)} | ${formatMs(stats.reads.max)} |
| POST /posts (writes) | ${stats.writes.count} | ${formatMs(stats.writes.p50)} | ${formatMs(stats.writes.p95)} | ${formatMs(stats.writes.min)} | ${formatMs(stats.writes.max)} |

${results.errors.length > 0 ? `⚠️ **Errors**: ${results.errors.length}` : '✅ **No errors**'}

---
`;
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    console.log('✅ Results appended to GITHUB_STEP_SUMMARY');
  }
  
  // Return exit code based on success
  const totalRequests = READ_COUNT + WRITE_COUNT;
  const successfulRequests = results.reads.length + results.writes.length;
  const successRate = (successfulRequests / totalRequests) * 100;
  
  console.log(`\n📈 Success rate: ${successRate.toFixed(1)}%`);
  
  // Non-gating: always exit 0, just report results
  process.exit(0);
}

// Run benchmark
runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(0); // Non-gating, don't fail CI
});
