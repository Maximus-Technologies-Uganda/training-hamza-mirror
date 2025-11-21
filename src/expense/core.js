/**
 * Valid expense categories
 */
export const VALID_CATEGORIES = ['food', 'transport', 'entertainment', 'utilities', 'other'];

/**
 * Valid months (1-12)
 */
export const VALID_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Parse expense data from CSV-like format
 * Expected format: "amount,category,month,description"
 * @param {string} data - CSV data string
 * @returns {Array} Array of expense objects
 */
export function parseExpenses(data) {
  if (!data || typeof data !== 'string') {
    throw new Error('Data must be a non-empty string');
  }

  const lines = data.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return [];
  }

  return lines.map((line, index) => {
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length < 4) {
      throw new Error(`Invalid expense format at line ${index + 1}: expected 4 fields`);
    }

    const amount = parseFloat(parts[0]);
    if (isNaN(amount) || amount < 0) {
      throw new Error(`Invalid amount at line ${index + 1}: must be a non-negative number`);
    }

    const category = parts[1].toLowerCase();
    const month = parseInt(parts[2]);
    const description = parts[3];

    return { amount, category, month, description };
  });
}

/**
 * Validate month parameter
 * @param {number} month - Month number (1-12)
 * @throws {Error} If month is invalid
 */
export function validateMonth(month) {
  if (typeof month !== 'number' || !Number.isInteger(month)) {
    throw new Error('Month must be an integer');
  }
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }
}

/**
 * Validate category parameter
 * @param {string} category - Category name
 * @throws {Error} If category is invalid
 */
export function validateCategory(category) {
  if (!category || typeof category !== 'string') {
    throw new Error('Category must be a non-empty string');
  }
  const normalized = category.toLowerCase();
  if (!VALID_CATEGORIES.includes(normalized)) {
    throw new Error(`Invalid category: ${category}. Valid categories are: ${VALID_CATEGORIES.join(', ')}`);
  }
}

/**
 * Filter expenses by month
 * @param {Array} expenses - Array of expense objects
 * @param {number} month - Month number (1-12)
 * @returns {Array} Filtered expenses
 */
export function filterByMonth(expenses, month) {
  validateMonth(month);
  return expenses.filter(expense => expense.month === month);
}

/**
 * Filter expenses by category
 * @param {Array} expenses - Array of expense objects
 * @param {string} category - Category name
 * @returns {Array} Filtered expenses
 */
export function filterByCategory(expenses, category) {
  validateCategory(category);
  const normalized = category.toLowerCase();
  return expenses.filter(expense => expense.category === normalized);
}

/**
 * Calculate total of expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Sum of all expense amounts
 */
export function calculateTotal(expenses) {
  if (!Array.isArray(expenses)) {
    throw new Error('Expenses must be an array');
  }
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Format expense for display
 * @param {Object} expense - Expense object
 * @returns {string} Formatted expense string
 */
export function formatExpense(expense) {
  return `$${expense.amount.toFixed(2)} - ${expense.category} (Month ${expense.month}): ${expense.description}`;
}
