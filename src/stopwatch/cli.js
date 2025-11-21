#!/usr/bin/env node

import { createStopwatch, formatTime } from './index.js';

// Singleton stopwatch instance for CLI usage
const stopwatch = createStopwatch();

/**
 * Parse command-line arguments
 * @param {string[]} args - Command-line arguments
 * @returns {string|null} Command name or null
 */
function parseCommand(args) {
  if (args.length === 0) {
    return null;
  }
  return args[0].toLowerCase();
}

/**
 * Show usage information
 */
function showUsage() {
  console.error('Usage: node cli.js <command>');
  console.error('');
  console.error('Commands:');
  console.error('  start  Start the stopwatch');
  console.error('  lap    Record a lap time');
  console.error('  stop   Stop the stopwatch');
}

/**
 * Main CLI function that can be tested without spawning a process
 * @param {string[]} argv - Command-line arguments (without node/script path)
 * @returns {number} Exit code (0 for success, 1 for error)
 */
export function run(argv) {
  const command = parseCommand(argv);

  if (!command) {
    console.error('Error: Command required');
    console.error('');
    showUsage();
    return 1;
  }

  try {
    switch (command) {
      case 'start':
        stopwatch.start();
        console.log('Stopwatch started');
        return 0;

      case 'lap':
        const lapTime = stopwatch.lap();
        console.log(`Lap: ${formatTime(lapTime)}`);
        return 0;

      case 'stop':
        stopwatch.stop();
        const elapsed = stopwatch.elapsedMs();
        console.log(`Stopped: ${formatTime(elapsed)}`);
        return 0;

      case 'help':
      case '--help':
      case '-h':
        showUsage();
        return 0;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error('');
        showUsage();
        return 1;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

// Only run if executed directly (not imported)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  process.exit(run(process.argv.slice(2)));
}
