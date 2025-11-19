#!/usr/bin/env node

import { createStopwatch, formatTime } from './index.js';

console.log('=== Stopwatch CLI Demo ===\n');

const stopwatch = createStopwatch();

// Simulate user commands
console.log('$ node src/stopwatch/cli.js start');
stopwatch.start();
console.log('Stopwatch started\n');

// Wait and lap
await new Promise(resolve => setTimeout(resolve, 2000));
console.log('$ node src/stopwatch/cli.js lap');
const lap1 = stopwatch.lap();
console.log(`Lap: ${formatTime(lap1)}\n`);

// Wait and lap again
await new Promise(resolve => setTimeout(resolve, 1500));
console.log('$ node src/stopwatch/cli.js lap');
const lap2 = stopwatch.lap();
console.log(`Lap: ${formatTime(lap2)}\n`);

// Wait and stop
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('$ node src/stopwatch/cli.js stop');
stopwatch.stop();
const final = stopwatch.elapsedMs();
console.log(`Stopped: ${formatTime(final)}\n`);

console.log('=== Demo Complete ===');
