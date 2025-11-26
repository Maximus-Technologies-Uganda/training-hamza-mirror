/**
 * Sample quotes database
 */
const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
];

/**
 * Get all quotes
 * @returns {Array} Array of quote objects
 */
export function getAllQuotes() {
  return [...quotes];
}

/**
 * Get a random quote from the collection
 * @param {Array} quotesList - Optional array of quotes to select from
 * @returns {Object} Random quote object with text and author
 */
export function getRandomQuote(quotesList = quotes) {
  if (!Array.isArray(quotesList) || quotesList.length === 0) {
    throw new Error('No quotes available');
  }
  const randomIndex = Math.floor(Math.random() * quotesList.length);
  return quotesList[randomIndex];
}

/**
 * Filter quotes by author (case-insensitive)
 * @param {string} author - Author name to filter by
 * @param {Array} quotesList - Optional array of quotes to filter
 * @returns {Array} Array of quotes by the specified author
 */
export function filterByAuthor(author, quotesList = quotes) {
  if (!author || typeof author !== 'string') {
    throw new Error('Author must be a non-empty string');
  }
  
  const normalizedAuthor = author.toLowerCase().trim();
  return quotesList.filter(quote => 
    quote.author.toLowerCase().includes(normalizedAuthor)
  );
}

/**
 * Format a quote for display
 * @param {Object} quote - Quote object with text and author
 * @returns {string} Formatted quote string
 */
export function formatQuote(quote) {
  if (!quote || typeof quote !== 'object') {
    throw new Error('Quote must be an object');
  }
  if (!quote.text || !quote.author) {
    throw new Error('Quote must have text and author properties');
  }
  return `"${quote.text}"\n  — ${quote.author}`;
}
