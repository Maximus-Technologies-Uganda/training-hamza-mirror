#!/usr/bin/env node

import { getAllQuotes, getRandomQuote, filterByAuthor, formatQuote } from './core.js';

/**
 * Parse command-line arguments
 * @param {string[]} args - Command-line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    by: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--by' && args[i + 1]) {
      options.by = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    }
  }

  return options;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('Usage: node cli.js [options]');
  console.log('');
  console.log('Display a random inspirational quote');
  console.log('');
  console.log('Options:');
  console.log('  --by <author>    Filter quotes by author (case-insensitive, partial match)');
  console.log('  --help, -h       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node cli.js                    # Show random quote');
  console.log('  node cli.js --by "Steve Jobs"  # Show random quote by Steve Jobs');
  console.log('  node cli.js --by jobs          # Partial author name works too');
}

/**
 * Main CLI function
 * @param {string[]} argv - Command-line arguments
 * @returns {number} Exit code
 */
export function run(argv) {
  const options = parseArgs(argv);

  // Show help
  if (options.help) {
    showUsage();
    return 0;
  }

  try {
    let quotesToChooseFrom = getAllQuotes();

    // Filter by author if specified
    if (options.by) {
      try {
        quotesToChooseFrom = filterByAuthor(options.by);
        
        if (quotesToChooseFrom.length === 0) {
          console.error(`Error: No quotes found by author "${options.by}"`);
          console.error('');
          console.error('Try a different author name or run without --by for all quotes');
          return 1;
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return 1;
      }
    }

    // Get random quote from filtered list
    const quote = getRandomQuote(quotesToChooseFrom);
    console.log(formatQuote(quote));
    return 0;

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

// Only run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  process.exit(run(process.argv.slice(2)));
}
