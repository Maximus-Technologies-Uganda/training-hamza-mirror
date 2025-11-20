#!/usr/bin/env node

import { convert } from './index.js';

function parseArgs(args) {
  const parsed = {
    from: null,
    to: null,
    value: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) {
      parsed.from = args[i + 1];
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      parsed.to = args[i + 1];
      i++;
    } else if (args[i] === '--value' && args[i + 1]) {
      parsed.value = args[i + 1];
      i++;
    }
  }

  return parsed;
}

function formatTemperature(value, unit) {
  const rounded = Math.round(value * 100) / 100;
  const unitName = unit === 'C' ? 'Celsius' : 'Fahrenheit';
  return `${rounded}°${unit} (${unitName})`;
}

function showUsage() {
  console.error('Usage: node cli.js --from <C|F> --to <C|F> --value <temperature>');
  console.error('');
  console.error('Examples:');
  console.error('  node cli.js --from C --to F --value 0');
  console.error('  node cli.js --from F --to C --value 32');
  console.error('');
  console.error('Options:');
  console.error('  --from   Source unit (C for Celsius, F for Fahrenheit)');
  console.error('  --to     Target unit (C for Celsius, F for Fahrenheit)');
  console.error('  --value  Temperature value to convert');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const { from, to, value } = parseArgs(args);

  // Validate required arguments
  if (!from) {
    console.error('Error: --from flag is required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  if (!to) {
    console.error('Error: --to flag is required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  if (!value) {
    console.error('Error: --value flag is required');
    console.error('');
    showUsage();
    process.exit(1);
  }

  // Parse temperature value
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    console.error(`Error: Invalid temperature value '${value}'`);
    console.error('Temperature must be a valid number');
    console.error('');
    console.error('Examples of valid values: 0, -40, 98.6, 37.5');
    process.exit(1);
  }

  // Perform conversion
  try {
    const result = convert(numValue, from, to);
    
    // Success output
    console.log(`Input:  ${formatTemperature(numValue, from)}`);
    console.log(`Output: ${formatTemperature(result, to)}`);
  } catch (error) {
    // Handle validation errors with helpful messages
    console.error(`Error: ${error.message}`);
    console.error('');
    
    if (error.message.includes('Invalid unit')) {
      console.error('Valid units are:');
      console.error('  C - Celsius');
      console.error('  F - Fahrenheit');
    } else if (error.message.includes('Cannot convert')) {
      console.error('You must convert between different units.');
      console.error('Did you mean to use different --from and --to values?');
    } else if (error.message.includes('Temperature must be')) {
      console.error('Please provide a valid numeric temperature value.');
    }
    
    process.exit(1);
  }
}

main();
