import { test, expect, describe } from 'vitest';
import { formatTime, createStopwatch } from '../src/stopwatch/index.js';

describe('formatTime', () => {
  test('should format zero milliseconds', () => {
    expect(formatTime(0)).toBe('00:00.000');
  });

  test('should format milliseconds only', () => {
    expect(formatTime(123)).toBe('00:00.123');
  });

  test('should format seconds and milliseconds', () => {
    expect(formatTime(5432)).toBe('00:05.432');
  });

  test('should format minutes, seconds, and milliseconds', () => {
    expect(formatTime(125432)).toBe('02:05.432');
  });

  test('should handle large numbers correctly', () => {
    expect(formatTime(3661000)).toBe('61:01.000');
  });

  test('should pad single digits correctly', () => {
    expect(formatTime(1001)).toBe('00:01.001');
  });
});

describe('Stopwatch - Valid sequences', () => {
  test('should start, wait, and stop successfully', () => {
    const sw = createStopwatch();
    sw.start();
    expect(sw.elapsedMs()).toBeGreaterThanOrEqual(0);
    sw.stop();
    const elapsed = sw.elapsedMs();
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  test('should track lap times', () => {
    const sw = createStopwatch();
    sw.start();
    const lap1 = sw.lap();
    expect(lap1).toBeGreaterThanOrEqual(0);
    const lap2 = sw.lap();
    expect(lap2).toBeGreaterThanOrEqual(lap1);
  });

  test('should allow multiple start-stop cycles', () => {
    const sw = createStopwatch();
    sw.start();
    sw.stop();
    const firstElapsed = sw.elapsedMs();
    
    sw.start();
    sw.stop();
    const secondElapsed = sw.elapsedMs();
    
    expect(secondElapsed).toBeGreaterThanOrEqual(0);
  });
});

describe('Stopwatch - Invalid sequences', () => {
  test('should throw error when lap called before start', () => {
    const sw = createStopwatch();
    expect(() => sw.lap()).toThrow('Stopwatch not started');
  });

  test('should throw error when stop called before start', () => {
    const sw = createStopwatch();
    expect(() => sw.stop()).toThrow('Stopwatch not started');
  });

  test('should throw error when start called twice without stop', () => {
    const sw = createStopwatch();
    sw.start();
    expect(() => sw.start()).toThrow('Stopwatch already running');
  });

  test('should throw error when elapsedMs called before start', () => {
    const sw = createStopwatch();
    expect(() => sw.elapsedMs()).toThrow('Stopwatch not started');
  });
});
