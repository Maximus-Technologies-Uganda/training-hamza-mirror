# Training Hamza

CLI applications to demonstrate testing, TDD, and development workflows.

## Installation

```bash
npm install
```

## Usage

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
│   └── stopwatch/
│       ├── index.js      # Core stopwatch logic (TDD)
│       └── cli.js        # Stopwatch CLI wrapper
├── tests/
│   ├── sanity.test.js    # Basic sanity check
│   ├── hello.test.js     # Tests for formatGreeting
│   └── stopwatch.test.js # Tests for stopwatch (TDD)
├── docs/
│   ├── review-packet-chapter1.md   # Hello CLI review
│   └── review-packet-chapter3.md   # Stopwatch review
├── package.json
└── README.md
```
