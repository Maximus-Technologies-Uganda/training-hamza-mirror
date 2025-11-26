import { test, expect, describe } from 'vitest';
import { formatGreeting } from '../src/hello/index.js';
import { execSync } from 'child_process';

describe('formatGreeting', () => {
  test('should return a normal greeting when shout is false', () => {
    const result = formatGreeting('Alice', false);
    expect(result).toBe('Hello, Alice!');
  });

  test('should return a normal greeting when shout is not provided', () => {
    const result = formatGreeting('Bob');
    expect(result).toBe('Hello, Bob!');
  });

  test('should return an uppercase greeting when shout is true', () => {
    const result = formatGreeting('Charlie', true);
    expect(result).toBe('HELLO, CHARLIE!');
  });

  test('should throw an error when name is missing', () => {
    expect(() => formatGreeting()).toThrow('Name is required');
  });

  test('should throw an error when name is empty string', () => {
    expect(() => formatGreeting('')).toThrow('Name is required');
  });

  test('should throw an error when name is only whitespace', () => {
    expect(() => formatGreeting('   ')).toThrow('Name is required');
  });
});

describe('Hello CLI Integration', () => {
  test('should exit with non-zero code and show correct error when --name is missing', () => {
    let exitCode = 0;
    let stderr = '';
    
    try {
      execSync('node src/hello/cli.js --shout', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error) {
      exitCode = error.status;
      stderr = error.stderr;
    }

    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error: --name argument is required');
    expect(stderr).toContain('Usage: node src/hello/cli.js --name <name> [--shout]');
  });

  test('should output greeting when --name is provided', () => {
    const output = execSync('node src/hello/cli.js --name Alice', {
      encoding: 'utf-8'
    });
    
    expect(output.trim()).toBe('Hello, Alice!');
  });

  test('should output shouted greeting when --name and --shout are provided', () => {
    const output = execSync('node src/hello/cli.js --name Bob --shout', {
      encoding: 'utf-8'
    });
    
    expect(output.trim()).toBe('HELLO, BOB!');
  });
});
