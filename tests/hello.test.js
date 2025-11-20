import { test, expect, describe } from 'vitest';
import { formatGreeting } from '../src/hello/index.js';

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
