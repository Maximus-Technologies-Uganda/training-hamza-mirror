#!/usr/bin/env node

console.log('=== Temperature Converter CLI - Success Cases ===\n');

console.log('# Example 1: Freezing point (0°C to Fahrenheit)');
console.log('$ node src/temperature/cli.js --from C --to F --value 0');
console.log('Input:  0°C (Celsius)');
console.log('Output: 32°F (Fahrenheit)');
console.log('');

console.log('# Example 2: Body temperature (98.6°F to Celsius)');
console.log('$ node src/temperature/cli.js --from F --to C --value 98.6');
console.log('Input:  98.6°F (Fahrenheit)');
console.log('Output: 37°C (Celsius)');
console.log('');

console.log('# Example 3: Boiling point (100°C to Fahrenheit)');
console.log('$ node src/temperature/cli.js --from C --to F --value 100');
console.log('Input:  100°C (Celsius)');
console.log('Output: 212°F (Fahrenheit)');
console.log('');

console.log('# Example 4: Where C and F are equal (-40)');
console.log('$ node src/temperature/cli.js --from C --to F --value -40');
console.log('Input:  -40°C (Celsius)');
console.log('Output: -40°F (Fahrenheit)');
console.log('');

console.log('=== All conversions successful! ===');
