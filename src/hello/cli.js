#!/usr/bin/env node

import { formatGreeting } from './index.js';

function parseArgs(args) {
  const parsed = {
    name: null,
    shout: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      parsed.name = args[i + 1];
      i++; // Skip next arg since we consumed it
    } else if (args[i] === '--shout') {
      parsed.shout = true;
    }
  }

  return parsed;
}

function main() {
  try {
    const args = process.argv.slice(2);
    const { name, shout } = parseArgs(args);

    if (!name) {
      console.error('Error: --name argument is required');
      console.error('Usage: node src/hello/cli.js --name <name> [--shout]');
      process.exit(1);
    }

    const greeting = formatGreeting(name, shout);
    console.log(greeting);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
