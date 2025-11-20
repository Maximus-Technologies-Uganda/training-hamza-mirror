#!/usr/bin/env node

import { createStopwatch, formatTime } from './index.js';

const stopwatch = createStopwatch();

function parseCommand(args) {
  if (args.length === 0) {
    return null;
  }
  return args[0].toLowerCase();
}

function main() {
  const args = process.argv.slice(2);
  const command = parseCommand(args);

  if (!command) {
    console.error('Error: Command required');
    console.error('Usage: node cli.js <command>');
    console.error('Commands: start, lap, stop');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'start':
        stopwatch.start();
        console.log('Stopwatch started');
        break;

      case 'lap':
        const lapTime = stopwatch.lap();
        console.log(`Lap: ${formatTime(lapTime)}`);
        break;

      case 'stop':
        stopwatch.stop();
        const elapsed = stopwatch.elapsedMs();
        console.log(`Stopped: ${formatTime(elapsed)}`);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error('Available commands: start, lap, stop');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
