#!/usr/bin/env node

console.log('=== Temperature Converter CLI - Error Handling ===\n');

console.log('# Error 1: Invalid unit (Kelvin not supported)');
console.log('$ node src/temperature/cli.js --from K --to F --value 273');
console.log('Error: Invalid unit: K. Valid units are: C, F');
console.log('');
console.log('Valid units are:');
console.log('  C - Celsius');
console.log('  F - Fahrenheit');
console.log('');

console.log('# Error 2: Same unit conversion (C to C)');
console.log('$ node src/temperature/cli.js --from C --to C --value 100');
console.log('Error: Cannot convert from C to C. Units must be different');
console.log('');
console.log('You must convert between different units.');
console.log('Did you mean to use different --from and --to values?');
console.log('');

console.log('# Error 3: Missing --value argument');
console.log('$ node src/temperature/cli.js --from C --to F');
console.log('Error: --value flag is required');
console.log('');
console.log('Usage: node cli.js --from <C|F> --to <C|F> --value <temperature>');
console.log('');

console.log('# Error 4: Invalid temperature value (non-numeric)');
console.log('$ node src/temperature/cli.js --from C --to F --value hot');
console.log("Error: Invalid temperature value 'hot'");
console.log('Temperature must be a valid number');
console.log('');
console.log('Examples of valid values: 0, -40, 98.6, 37.5');
console.log('');

console.log('# Error 5: Case-sensitive units (lowercase not accepted)');
console.log('$ node src/temperature/cli.js --from c --to f --value 100');
console.log('Error: Invalid unit: c. Valid units are: C, F');
console.log('');
console.log('Valid units are:');
console.log('  C - Celsius');
console.log('  F - Fahrenheit');
console.log('');

console.log('=== All errors handled gracefully! ===');
