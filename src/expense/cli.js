#!/usr/bin/env node

import {
  parseExpenses,
  filterByMonth,
  filterByCategory,
  calculateTotal,
  formatExpense,
  VALID_CATEGORIES
} from './core.js';

/**
 * Parse command-line arguments
 * @param {string[]} args - Command-line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    month: null,
    category: null,
    data: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--month' && args[i + 1]) {
      options.month = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    } else if (!args[i].startsWith('--')) {
      // Assume it's inline data
      options.data = args[i];
    }
  }

  return options;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('Usage: node cli.js [options] [data]');
  console.log('');
  console.log('Track and filter expenses');
  console.log('');
  console.log('Options:');
  console.log('  --month <1-12>      Filter by month (1-12)');
  console.log('  --category <name>   Filter by category');
  console.log('  --help, -h          Show this help message');
  console.log('');
  console.log(`Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  console.log('');
  console.log('Data format: "amount,category,month,description"');
  console.log('');
  console.log('Examples:');
  console.log('  node cli.js "100,food,1,Groceries"');
  console.log('  node cli.js --month 1 "100,food,1,Groceries\\n50,transport,2,Bus"');
  console.log('  node cli.js --category food "100,food,1,Groceries\\n50,transport,2,Bus"');
  console.log('  node cli.js --month 1 --category food <data>');
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

  // Validate required data
  if (!options.data) {
    console.error('Error: Expense data is required');
    console.error('');
    showUsage();
    return 1;
  }

  try {
    // Parse expenses
    let expenses = parseExpenses(options.data);

    if (expenses.length === 0) {
      console.log('No expenses to display');
      return 0;
    }

    // Apply filters
    if (options.month !== null) {
      try {
        expenses = filterByMonth(expenses, options.month);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return 1;
      }
    }

    if (options.category) {
      try {
        expenses = filterByCategory(expenses, options.category);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('');
        console.error(`Valid categories: ${VALID_CATEGORIES.join(', ')}`);
        return 1;
      }
    }

    // Display results
    if (expenses.length === 0) {
      console.log('No expenses match the specified filters');
      return 0;
    }

    console.log('Expenses:');
    expenses.forEach(expense => {
      console.log(`  ${formatExpense(expense)}`);
    });
    
    const total = calculateTotal(expenses);
    console.log('');
    console.log(`Total: $${total.toFixed(2)}`);
    
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
