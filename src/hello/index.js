/**
 * Formats a greeting message
 * @param {string} name - The name to greet
 * @param {boolean} shout - Whether to shout the greeting (uppercase)
 * @returns {string} The formatted greeting
 */
export function formatGreeting(name, shout = false) {
  if (!name || name.trim() === '') {
    throw new Error('Name is required');
  }

  const greeting = `Hello, ${name}!`;
  return shout ? greeting.toUpperCase() : greeting;
}
