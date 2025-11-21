import { test, expect, describe, vi } from 'vitest';
import { getAllQuotes, getRandomQuote, filterByAuthor, formatQuote } from '../src/quote/core.js';

describe('Quote CLI Core', () => {
  describe('getAllQuotes', () => {
    test('should return an array of quotes', () => {
      const quotes = getAllQuotes();
      expect(Array.isArray(quotes)).toBe(true);
      expect(quotes.length).toBeGreaterThan(0);
    });

    test('should return quotes with text and author', () => {
      const quotes = getAllQuotes();
      quotes.forEach(quote => {
        expect(quote).toHaveProperty('text');
        expect(quote).toHaveProperty('author');
        expect(typeof quote.text).toBe('string');
        expect(typeof quote.author).toBe('string');
      });
    });
  });

  describe('getRandomQuote', () => {
    test('should return a quote object', () => {
      const quote = getRandomQuote();
      expect(quote).toHaveProperty('text');
      expect(quote).toHaveProperty('author');
    });

    test('should return a quote from provided list', () => {
      const customQuotes = [
        { text: 'Test quote', author: 'Test Author' }
      ];
      const quote = getRandomQuote(customQuotes);
      expect(quote).toEqual(customQuotes[0]);
    });

    test('should throw error for empty array', () => {
      expect(() => getRandomQuote([])).toThrow('No quotes available');
    });

    test('should throw error for non-array input', () => {
      expect(() => getRandomQuote(null)).toThrow('No quotes available');
    });

    test('should return different quotes over multiple calls', () => {
      const quotes = getAllQuotes();
      if (quotes.length > 1) {
        const results = new Set();
        for (let i = 0; i < 20; i++) {
          results.add(getRandomQuote().text);
        }
        // With 8+ quotes and 20 calls, we should see some variety
        expect(results.size).toBeGreaterThan(1);
      }
    });
  });

  describe('filterByAuthor', () => {
    test('should filter quotes by exact author name', () => {
      const quotes = filterByAuthor('Steve Jobs');
      expect(quotes.length).toBeGreaterThan(0);
      quotes.forEach(quote => {
        expect(quote.author).toBe('Steve Jobs');
      });
    });

    test('should filter quotes case-insensitively', () => {
      const quotes = filterByAuthor('steve jobs');
      expect(quotes.length).toBeGreaterThan(0);
      quotes.forEach(quote => {
        expect(quote.author.toLowerCase()).toContain('steve jobs');
      });
    });

    test('should filter quotes by partial author name', () => {
      const quotes = filterByAuthor('Jobs');
      expect(quotes.length).toBeGreaterThan(0);
      quotes.forEach(quote => {
        expect(quote.author.toLowerCase()).toContain('jobs');
      });
    });

    test('should return empty array for non-existent author', () => {
      const quotes = filterByAuthor('Nonexistent Author');
      expect(quotes).toEqual([]);
    });

    test('should throw error for empty author string', () => {
      expect(() => filterByAuthor('')).toThrow('Author must be a non-empty string');
    });

    test('should throw error for non-string author', () => {
      expect(() => filterByAuthor(null)).toThrow('Author must be a non-empty string');
      expect(() => filterByAuthor(123)).toThrow('Author must be a non-empty string');
    });

    test('should trim whitespace from author name', () => {
      const quotes = filterByAuthor('  Steve Jobs  ');
      expect(quotes.length).toBeGreaterThan(0);
    });

    test('should filter from custom quotes list', () => {
      const customQuotes = [
        { text: 'Quote 1', author: 'Alice' },
        { text: 'Quote 2', author: 'Bob' },
      ];
      const filtered = filterByAuthor('Alice', customQuotes);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].author).toBe('Alice');
    });
  });

  describe('formatQuote', () => {
    test('should format quote with text and author', () => {
      const quote = { text: 'Test quote', author: 'Test Author' };
      const formatted = formatQuote(quote);
      expect(formatted).toContain('Test quote');
      expect(formatted).toContain('Test Author');
      expect(formatted).toContain('"');
      expect(formatted).toContain('—');
    });

    test('should format quotes consistently', () => {
      const quote = { text: 'Hello world', author: 'Someone' };
      const formatted = formatQuote(quote);
      expect(formatted).toBe('"Hello world"\n  — Someone');
    });

    test('should throw error for null quote', () => {
      expect(() => formatQuote(null)).toThrow('Quote must be an object');
    });

    test('should throw error for quote without text', () => {
      expect(() => formatQuote({ author: 'Someone' })).toThrow('Quote must have text and author properties');
    });

    test('should throw error for quote without author', () => {
      expect(() => formatQuote({ text: 'Something' })).toThrow('Quote must have text and author properties');
    });
  });

  describe('Table-driven tests for filterByAuthor', () => {
    const testCases = [
      { author: 'Steve Jobs', expectedMin: 2, description: 'exact match' },
      { author: 'STEVE JOBS', expectedMin: 2, description: 'uppercase' },
      { author: 'steve jobs', expectedMin: 2, description: 'lowercase' },
      { author: 'Jobs', expectedMin: 2, description: 'partial last name' },
      { author: 'Steve', expectedMin: 2, description: 'partial first name' },
    ];

    testCases.forEach(({ author, expectedMin, description }) => {
      test(`should filter quotes by ${description}`, () => {
        const quotes = filterByAuthor(author);
        expect(quotes.length).toBeGreaterThanOrEqual(expectedMin);
        quotes.forEach(quote => {
          expect(quote.author.toLowerCase()).toContain(author.toLowerCase().trim());
        });
      });
    });
  });
});
