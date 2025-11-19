# Training Hamza

A simple CLI greeting application to demonstrate testing and development workflows.

## Installation

```bash
npm install
```

## Usage

### Basic Greeting

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
│   └── hello/
│       ├── index.js      # Core formatGreeting function
│       └── cli.js        # CLI wrapper
├── tests/
│   ├── sanity.test.js    # Basic sanity check
│   └── hello.test.js     # Tests for formatGreeting
├── package.json
└── README.md
```
