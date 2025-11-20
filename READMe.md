# Training Hamza

CLI applications to demonstrate testing, TDD, and development workflows.

## Chapter 1 Summary

This project contains **three CLI applications** built incrementally to practice:
- **Test-Driven Development (TDD)**
- **Input validation and error handling**
- **GitHub Actions CI/CD**
- **Code review workflows**

### CLIs Overview

| CLI | Purpose | Key Features | Tests |
|-----|---------|--------------|-------|
| **Hello CLI** | Greeting generator | Name parameter, shout mode | 6 tests |
| **Stopwatch CLI** | Time tracking | Start, lap, stop commands | 13 tests |
| **Temperature CLI** | Unit converter | C↔F conversion, validation | 24 tests |

**Total: 44 comprehensive tests** (+ 1 sanity check)

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Try each CLI
node src/hello/cli.js --name Alice
node src/stopwatch/cli.js start
node src/temperature/cli.js --from C --to F --value 100
```

## Installation

```bash
npm install
```

## Usage

### Temperature Converter CLI

Convert temperatures between Celsius and Fahrenheit with input validation.

#### Basic Conversion

Convert from Celsius to Fahrenheit:

```bash
node src/temperature/cli.js --from C --to F --value 0
```

Output:
```
Input:  0°C (Celsius)
Output: 32°F (Fahrenheit)
```

Convert from Fahrenheit to Celsius:

```bash
node src/temperature/cli.js --from F --to C --value 98.6
```

Output:
```
Input:  98.6°F (Fahrenheit)
Output: 37°C (Celsius)
```

#### More Examples

```bash
# Body temperature
node src/temperature/cli.js --from C --to F --value 37
# Input:  37°C (Celsius)
# Output: 98.6°F (Fahrenheit)

# Freezing point
node src/temperature/cli.js --from F --to C --value 32
# Input:  32°F (Fahrenheit)
# Output: 0°C (Celsius)

# Negative temperatures
node src/temperature/cli.js --from C --to F --value -40
# Input:  -40°C (Celsius)
# Output: -40°F (Fahrenheit)
```

#### Temperature Converter Error Cases

**Missing required flags:**
```bash
node src/temperature/cli.js --from C --to F
# Error: --value flag is required
# [Shows usage help]
```

**Invalid temperature value:**
```bash
node src/temperature/cli.js --from C --to F --value hot
# Error: Invalid temperature value 'hot'
# Temperature must be a valid number
```

**Converting to same unit:**
```bash
node src/temperature/cli.js --from C --to C --value 100
# Error: Cannot convert from C to C. Units must be different
# You must convert between different units.
```

**Invalid unit:**
```bash
node src/temperature/cli.js --from K --to F --value 273
# Error: Invalid unit: K. Valid units are: C, F
# Valid units are:
#   C - Celsius
#   F - Fahrenheit
```

**Lowercase units (case-sensitive):**
```bash
node src/temperature/cli.js --from c --to f --value 100
# Error: Invalid unit: c. Valid units are: C, F
```

#### Using the Temperature Module

Import and use functions in your code:

```javascript
import { cToF, fToC, convert } from './src/temperature/index.js';

// Direct conversion
console.log(cToF(0));    // 32
console.log(fToC(212));  // 100

// Generic convert function with validation
console.log(convert(37, 'C', 'F'));  // 98.6
```

### Stopwatch CLI

A stopwatch with start, lap, and stop functionality.

#### Starting the Stopwatch

```bash
node src/stopwatch/cli.js start
```

Output: `Stopwatch started`

#### Recording Lap Times

While the stopwatch is running, record lap times:

```bash
node src/stopwatch/cli.js lap
```

Output: `Lap: 00:05.432`

#### Stopping the Stopwatch

```bash
node src/stopwatch/cli.js stop
```

Output: `Stopped: 00:10.876`

#### Example Session

```bash
# Start the stopwatch
node src/stopwatch/cli.js start
# Stopwatch started

# Record first lap
node src/stopwatch/cli.js lap
# Lap: 00:03.245

# Record second lap
node src/stopwatch/cli.js lap
# Lap: 00:07.891

# Stop the stopwatch
node src/stopwatch/cli.js stop
# Stopped: 00:12.456
```

#### Stopwatch Error Cases

**Starting twice without stopping:**
```bash
node src/stopwatch/cli.js start
node src/stopwatch/cli.js start
# Error: Stopwatch already running
```

**Lap before starting:**
```bash
node src/stopwatch/cli.js lap
# Error: Stopwatch not started
```

**Stop before starting:**
```bash
node src/stopwatch/cli.js stop
# Error: Stopwatch not started
```

#### Using the Stopwatch Module

Import and use the stopwatch in your code:

```javascript
import { createStopwatch, formatTime } from './src/stopwatch/index.js';

const sw = createStopwatch();
sw.start();

setTimeout(() => {
  console.log(`Lap: ${formatTime(sw.lap())}`);
}, 1000);

setTimeout(() => {
  sw.stop();
  console.log(`Total: ${formatTime(sw.elapsedMs())}`);
}, 2000);
```

### Hello CLI (Greeting)

#### Basic Greeting

Greet someone by name:

```bash
node src/hello/cli.js --name Alice
```

Output: `Hello, Alice!`

### Shouting Greeting

Add the `--shout` flag to make the greeting uppercase:

```bash
node src/hello/cli.js --name Bob --shout
```

Output: `HELLO, BOB!`

### Using the formatGreeting Function

You can also import and use the function directly in your code:

```javascript
import { formatGreeting } from './src/hello/index.js';

// Normal greeting
console.log(formatGreeting('Charlie')); // Hello, Charlie!

// Shouting greeting
console.log(formatGreeting('Diana', true)); // HELLO, DIANA!
```

## Error Cases

### Missing Name

If you don't provide a `--name` argument:

```bash
node src/hello/cli.js --shout
```

Output:
```
Error: --name argument is required
Usage: node cli.js --name <name> [--shout]
```
Exit code: `1`

### Empty or Whitespace Name

If the name is empty or only whitespace, an error will be thrown:

```javascript
formatGreeting(''); // Throws: Error: Name is required
formatGreeting('   '); // Throws: Error: Name is required
```

## Running Tests

Run all tests once:

```bash
npm test
```

Run tests in watch mode (auto-rerun on file changes):

```bash
npm run test:watch
```

## Development

This project uses:
- **Vitest** for testing
- **ES Modules** (type: "module")
- **GitHub Actions** for CI/CD

## Project Structure

```
training-hamza/
├── src/
│   ├── hello/
│   │   ├── index.js      # Core formatGreeting function
│   │   └── cli.js        # CLI wrapper
│   ├── stopwatch/
│   │   ├── index.js      # Core stopwatch logic (TDD)
│   │   └── cli.js        # Stopwatch CLI wrapper
│   └── temperature/
│       ├── index.js      # Temperature conversion with validation
│       └── cli.js        # Temperature CLI wrapper
├── tests/
│   ├── sanity.test.js       # Basic sanity check
│   ├── hello.test.js        # Tests for formatGreeting
│   ├── stopwatch.test.js    # Tests for stopwatch (TDD)
│   └── temperature.test.js  # Tests for temperature (25 tests)
├── docs/
│   ├── review-packet-chapter1.md   # Hello CLI review
│   ├── review-packet-chapter3.md   # Stopwatch review (TDD)
│   └── review-packet-chapter4.md   # Temperature review (Validation)
├── package.json
└── README.md
```
