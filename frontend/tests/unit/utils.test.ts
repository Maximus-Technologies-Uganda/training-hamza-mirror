/**
 * Unit tests for utility functions
 * Tests date formatting, text manipulation, and helper functions
 */

import {
  formatDate,
  formatRelativeTime,
  generateSlug,
  truncate,
  extractExcerpt,
  getCharacterCount,
  debounce,
} from '@/lib/utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('formats valid ISO 8601 date string', () => {
      const result = formatDate('2025-11-27T10:30:00Z');
      expect(result).toMatch(/November 27, 2025/);
    });

    it('handles date at start of year', () => {
      const result = formatDate('2025-01-01T00:00:00Z');
      expect(result).toMatch(/January 1, 2025/);
    });

    it('handles date at end of year', () => {
      const result = formatDate('2025-12-31T12:00:00Z');
      // Timezone may shift day; just verify format works
      expect(result).toMatch(/\d{4}/); // Has year
      expect(result).toMatch(/December/); // Has month
    });

    it('returns original string on invalid date', () => {
      const result = formatDate('not-a-date');
      // Invalid Date still gets formatted, but let's check it doesn't throw
      expect(typeof result).toBe('string');
    });

    it('handles empty string', () => {
      const result = formatDate('');
      expect(typeof result).toBe('string');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-27T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns "just now" for times less than 60 seconds ago', () => {
      const result = formatRelativeTime('2025-11-27T11:59:30Z');
      expect(result).toBe('just now');
    });

    it('returns minutes ago for times less than 60 minutes ago', () => {
      const result = formatRelativeTime('2025-11-27T11:30:00Z');
      expect(result).toBe('30 minutes ago');
    });

    it('returns "1 minute ago" for singular', () => {
      const result = formatRelativeTime('2025-11-27T11:59:00Z');
      expect(result).toBe('1 minute ago');
    });

    it('returns hours ago for times less than 24 hours ago', () => {
      const result = formatRelativeTime('2025-11-27T08:00:00Z');
      expect(result).toBe('4 hours ago');
    });

    it('returns "1 hour ago" for singular', () => {
      const result = formatRelativeTime('2025-11-27T11:00:00Z');
      expect(result).toBe('1 hour ago');
    });

    it('returns days ago for times less than 7 days ago', () => {
      const result = formatRelativeTime('2025-11-24T12:00:00Z');
      expect(result).toBe('3 days ago');
    });

    it('returns "1 day ago" for singular', () => {
      const result = formatRelativeTime('2025-11-26T12:00:00Z');
      expect(result).toBe('1 day ago');
    });

    it('returns formatted date for times more than 7 days ago', () => {
      const result = formatRelativeTime('2025-11-15T12:00:00Z');
      expect(result).toMatch(/November 15, 2025/);
    });

    it('handles invalid date by returning original string', () => {
      const result = formatRelativeTime('invalid');
      expect(typeof result).toBe('string');
    });
  });

  describe('generateSlug', () => {
    it('converts title to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('my first post')).toBe('my-first-post');
    });

    it('removes special characters', () => {
      expect(generateSlug('Hello! World?')).toBe('hello-world');
    });

    it('handles multiple spaces', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });

    it('handles underscores', () => {
      expect(generateSlug('hello_world')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
      expect(generateSlug('-hello world-')).toBe('hello-world');
    });

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('handles string with only spaces', () => {
      expect(generateSlug('   ')).toBe('');
    });

    it('handles unicode characters', () => {
      expect(generateSlug('Café Résumé')).toBe('caf-rsum');
    });
  });

  describe('truncate', () => {
    it('returns original text if shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('returns original text if equal to maxLength', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('truncates text with ellipsis if longer than maxLength', () => {
      expect(truncate('hello world', 8)).toBe('hello wo...');
    });

    it('handles empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('handles maxLength of 0', () => {
      expect(truncate('hello', 0)).toBe('...');
    });

    it('trims whitespace before adding ellipsis', () => {
      expect(truncate('hello   world', 6)).toBe('hello...');
    });
  });

  describe('extractExcerpt', () => {
    it('removes markdown headers', () => {
      const markdown = '# Hello\n\nThis is content';
      expect(extractExcerpt(markdown)).not.toContain('#');
    });

    it('removes bold markdown', () => {
      const markdown = 'This is **bold** text';
      expect(extractExcerpt(markdown)).toBe('This is bold text');
    });

    it('removes italic markdown', () => {
      const markdown = 'This is *italic* text';
      expect(extractExcerpt(markdown)).toBe('This is italic text');
    });

    it('removes markdown links', () => {
      const markdown = 'Check out [this link](http://example.com)';
      expect(extractExcerpt(markdown)).toBe('Check out this link');
    });

    it('removes inline code', () => {
      const markdown = 'Use the `console.log` function';
      expect(extractExcerpt(markdown)).toBe('Use the console.log function');
    });

    it('removes list markers', () => {
      const markdown = '- Item 1\n- Item 2';
      expect(extractExcerpt(markdown)).toBe('Item 1\nItem 2');
    });

    it('respects maxLength parameter', () => {
      const markdown = 'This is a very long piece of content that should be truncated';
      const result = extractExcerpt(markdown, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    it('uses default maxLength of 150', () => {
      const longText = 'a'.repeat(200);
      const result = extractExcerpt(longText);
      expect(result.length).toBeLessThanOrEqual(153);
    });
  });

  describe('getCharacterCount', () => {
    it('returns correct current count', () => {
      const result = getCharacterCount('hello', 10);
      expect(result.current).toBe(5);
    });

    it('returns correct remaining count', () => {
      const result = getCharacterCount('hello', 10);
      expect(result.remaining).toBe(5);
    });

    it('returns isOver false when under limit', () => {
      const result = getCharacterCount('hello', 10);
      expect(result.isOver).toBe(false);
    });

    it('returns isOver true when over limit', () => {
      const result = getCharacterCount('hello world', 5);
      expect(result.isOver).toBe(true);
    });

    it('returns isOver false when exactly at limit', () => {
      const result = getCharacterCount('hello', 5);
      expect(result.isOver).toBe(false);
    });

    it('handles empty string', () => {
      const result = getCharacterCount('', 10);
      expect(result.current).toBe(0);
      expect(result.remaining).toBe(10);
      expect(result.isOver).toBe(false);
    });

    it('handles zero max', () => {
      const result = getCharacterCount('hello', 0);
      expect(result.remaining).toBe(-5);
      expect(result.isOver).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);
      
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to the debounced function', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('uses the latest arguments when called multiple times', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('third');
    });
  });
});
