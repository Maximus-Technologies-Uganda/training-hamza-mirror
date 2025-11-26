import { test, expect, describe } from 'vitest';
import {
  parseExpenses,
  validateMonth,
  validateCategory,
  filterByMonth,
  filterByCategory,
  calculateTotal,
  formatExpense,
  VALID_CATEGORIES
} from '../src/expense/core.js';

describe('Expense CLI Core', () => {
  describe('parseExpenses', () => {
    test('should parse valid expense data', () => {
      const data = '100.50,food,1,Groceries\n50,transport,2,Bus fare';
      const expenses = parseExpenses(data);
      
      expect(expenses).toHaveLength(2);
      expect(expenses[0]).toEqual({
        amount: 100.50,
        category: 'food',
        month: 1,
        description: 'Groceries'
      });
    });

    test('should handle single expense', () => {
      const data = '25.99,entertainment,3,Movie ticket';
      const expenses = parseExpenses(data);
      
      expect(expenses).toHaveLength(1);
      expect(expenses[0].amount).toBe(25.99);
    });

    test('should return empty array for empty data', () => {
      expect(parseExpenses('   \n  \n  ')).toEqual([]);
    });

    test('should throw error for non-string data', () => {
      expect(() => parseExpenses(null)).toThrow('Data must be a non-empty string');
      expect(() => parseExpenses(123)).toThrow('Data must be a non-empty string');
    });

    test('should throw error for invalid format', () => {
      const data = '100,food';
      expect(() => parseExpenses(data)).toThrow('Invalid expense format');
    });

    test('should throw error for invalid amount', () => {
      const data = 'abc,food,1,Groceries';
      expect(() => parseExpenses(data)).toThrow('Invalid amount');
    });

    test('should throw error for negative amount', () => {
      const data = '-50,food,1,Refund';
      expect(() => parseExpenses(data)).toThrow('Invalid amount');
    });

    test('should normalize category to lowercase', () => {
      const data = '100,FOOD,1,Groceries';
      const expenses = parseExpenses(data);
      expect(expenses[0].category).toBe('food');
    });
  });

  describe('validateMonth', () => {
    test('should accept valid months 1-12', () => {
      for (let month = 1; month <= 12; month++) {
        expect(() => validateMonth(month)).not.toThrow();
      }
    });

    test('should reject month 0', () => {
      expect(() => validateMonth(0)).toThrow('Month must be between 1 and 12');
    });

    test('should reject month 13', () => {
      expect(() => validateMonth(13)).toThrow('Month must be between 1 and 12');
    });

    test('should reject negative months', () => {
      expect(() => validateMonth(-1)).toThrow('Month must be between 1 and 12');
    });

    test('should reject non-integer months', () => {
      expect(() => validateMonth(1.5)).toThrow('Month must be an integer');
    });

    test('should reject non-number types', () => {
      expect(() => validateMonth('1')).toThrow('Month must be an integer');
      expect(() => validateMonth(null)).toThrow('Month must be an integer');
    });
  });

  describe('validateCategory', () => {
    test('should accept valid categories', () => {
      VALID_CATEGORIES.forEach(category => {
        expect(() => validateCategory(category)).not.toThrow();
      });
    });

    test('should accept categories case-insensitively', () => {
      expect(() => validateCategory('FOOD')).not.toThrow();
      expect(() => validateCategory('Food')).not.toThrow();
    });

    test('should reject invalid category', () => {
      expect(() => validateCategory('invalid')).toThrow('Invalid category');
    });

    test('should reject empty string', () => {
      expect(() => validateCategory('')).toThrow('Category must be a non-empty string');
    });

    test('should reject non-string types', () => {
      expect(() => validateCategory(null)).toThrow('Category must be a non-empty string');
      expect(() => validateCategory(123)).toThrow('Category must be a non-empty string');
    });
  });

  describe('filterByMonth', () => {
    const sampleExpenses = [
      { amount: 100, category: 'food', month: 1, description: 'Jan expense' },
      { amount: 200, category: 'transport', month: 2, description: 'Feb expense' },
      { amount: 150, category: 'food', month: 1, description: 'Another Jan expense' },
    ];

    test('should filter expenses by month', () => {
      const result = filterByMonth(sampleExpenses, 1);
      expect(result).toHaveLength(2);
      result.forEach(expense => expect(expense.month).toBe(1));
    });

    test('should return empty array for month with no expenses', () => {
      const result = filterByMonth(sampleExpenses, 12);
      expect(result).toEqual([]);
    });

    test('should throw error for invalid month', () => {
      expect(() => filterByMonth(sampleExpenses, 13)).toThrow();
    });
  });

  describe('filterByCategory', () => {
    const sampleExpenses = [
      { amount: 100, category: 'food', month: 1, description: 'Groceries' },
      { amount: 200, category: 'transport', month: 2, description: 'Bus' },
      { amount: 150, category: 'food', month: 3, description: 'Restaurant' },
    ];

    test('should filter expenses by category', () => {
      const result = filterByCategory(sampleExpenses, 'food');
      expect(result).toHaveLength(2);
      result.forEach(expense => expect(expense.category).toBe('food'));
    });

    test('should filter case-insensitively', () => {
      const result = filterByCategory(sampleExpenses, 'FOOD');
      expect(result).toHaveLength(2);
    });

    test('should return empty array for category with no expenses', () => {
      const result = filterByCategory(sampleExpenses, 'utilities');
      expect(result).toEqual([]);
    });

    test('should throw error for invalid category', () => {
      expect(() => filterByCategory(sampleExpenses, 'invalid')).toThrow();
    });
  });

  describe('calculateTotal', () => {
    test('should calculate sum of expenses', () => {
      const expenses = [
        { amount: 100.50 },
        { amount: 200.25 },
        { amount: 50.00 }
      ];
      expect(calculateTotal(expenses)).toBeCloseTo(350.75, 2);
    });

    test('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    test('should throw error for non-array input', () => {
      expect(() => calculateTotal(null)).toThrow('Expenses must be an array');
    });
  });

  describe('formatExpense', () => {
    test('should format expense correctly', () => {
      const expense = {
        amount: 100.50,
        category: 'food',
        month: 1,
        description: 'Groceries'
      };
      const formatted = formatExpense(expense);
      expect(formatted).toContain('$100.50');
      expect(formatted).toContain('food');
      expect(formatted).toContain('Month 1');
      expect(formatted).toContain('Groceries');
    });

    test('should format amount with 2 decimal places', () => {
      const expense = { amount: 50, category: 'transport', month: 2, description: 'Bus' };
      const formatted = formatExpense(expense);
      expect(formatted).toContain('$50.00');
    });
  });

  describe('Table-driven validation tests', () => {
    const monthTests = [
      { month: 1, valid: true, description: 'January' },
      { month: 6, valid: true, description: 'June' },
      { month: 12, valid: true, description: 'December' },
      { month: 0, valid: false, description: 'zero' },
      { month: 13, valid: false, description: 'thirteen' },
      { month: -1, valid: false, description: 'negative' },
    ];

    monthTests.forEach(({ month, valid, description }) => {
      test(`should ${valid ? 'accept' : 'reject'} month ${description}`, () => {
        if (valid) {
          expect(() => validateMonth(month)).not.toThrow();
        } else {
          expect(() => validateMonth(month)).toThrow();
        }
      });
    });

    const categoryTests = [
      { category: 'food', valid: true },
      { category: 'FOOD', valid: true },
      { category: 'Food', valid: true },
      { category: 'transport', valid: true },
      { category: 'invalid', valid: false },
      { category: 'grocery', valid: false },
    ];

    categoryTests.forEach(({ category, valid }) => {
      test(`should ${valid ? 'accept' : 'reject'} category "${category}"`, () => {
        if (valid) {
          expect(() => validateCategory(category)).not.toThrow();
        } else {
          expect(() => validateCategory(category)).toThrow();
        }
      });
    });
  });
});
