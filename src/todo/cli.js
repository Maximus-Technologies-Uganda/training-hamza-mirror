#!/usr/bin/env node

import {
  addTask,
  getAllTasks,
  completeTask,
  filterDueToday,
  filterHighPriority,
  formatTask
} from './core.js';

/**
 * Parse command-line arguments
 * @param {string[]} args - Command-line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    command: null,
    text: null,
    id: null,
    dueDate: null,
    priority: 'normal',
    dueToday: false,
    highPriority: false,
    help: false
  };

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    options.help = true;
    return options;
  }

  options.command = args[0];

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--dueDate' && args[i + 1]) {
      options.dueDate = args[i + 1];
      i++;
    } else if (args[i] === '--priority' && args[i + 1]) {
      options.priority = args[i + 1];
      i++;
    } else if (args[i] === '--dueToday') {
      options.dueToday = true;
    } else if (args[i] === '--highPriority') {
      options.highPriority = true;
    } else if (!args[i].startsWith('--')) {
      if (options.command === 'add') {
        options.text = args[i];
      } else if (options.command === 'complete') {
        options.id = parseInt(args[i]);
      }
    }
  }

  return options;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('Usage: node cli.js <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  add <text>        Add a new task');
  console.log('  list              List all tasks');
  console.log('  complete <id>     Mark a task as completed');
  console.log('');
  console.log('Options for add:');
  console.log('  --dueDate <date>     Set due date (YYYY-MM-DD format)');
  console.log('  --priority <level>   Set priority (high or normal)');
  console.log('');
  console.log('Options for list:');
  console.log('  --dueToday           Show only tasks due today');
  console.log('  --highPriority       Show only high priority tasks');
  console.log('');
  console.log('Examples:');
  console.log('  node cli.js add "Buy milk"');
  console.log('  node cli.js add "Finish report" --dueDate 2025-12-31 --priority high');
  console.log('  node cli.js list');
  console.log('  node cli.js list --dueToday');
  console.log('  node cli.js list --highPriority');
  console.log('  node cli.js complete 1');
}

/**
 * Main CLI function
 * @param {string[]} argv - Command-line arguments
 * @returns {number} Exit code
 */
export function run(argv) {
  const options = parseArgs(argv);

  if (options.help) {
    showUsage();
    return 0;
  }

  try {
    switch (options.command) {
      case 'add': {
        if (!options.text) {
          console.error('Error: Task text is required');
          console.error('Usage: node cli.js add <text> [options]');
          return 1;
        }

        const taskOptions = {
          priority: options.priority
        };

        if (options.dueDate) {
          const date = new Date(options.dueDate);
          if (isNaN(date.getTime())) {
            console.error(`Error: Invalid date format "${options.dueDate}"`);
            console.error('Use YYYY-MM-DD format (e.g., 2025-12-31)');
            return 1;
          }
          taskOptions.dueDate = date;
        }

        const task = addTask(options.text, taskOptions);
        console.log(`Task added: ${formatTask(task)}`);
        return 0;
      }

      case 'list': {
        let tasks = getAllTasks();

        if (options.dueToday) {
          tasks = filterDueToday(tasks);
        }

        if (options.highPriority) {
          tasks = filterHighPriority(tasks);
        }

        if (tasks.length === 0) {
          console.log('No tasks to display');
          return 0;
        }

        console.log('Tasks:');
        tasks.forEach(task => {
          console.log(`  ${formatTask(task)}`);
        });
        return 0;
      }

      case 'complete': {
        if (!options.id) {
          console.error('Error: Task ID is required');
          console.error('Usage: node cli.js complete <id>');
          return 1;
        }

        const task = completeTask(options.id);
        console.log(`Task completed: ${formatTask(task)}`);
        return 0;
      }

      default:
        console.error(`Error: Unknown command "${options.command}"`);
        console.error('');
        showUsage();
        return 1;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

// Only run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  process.exit(run(process.argv.slice(2)));
}
