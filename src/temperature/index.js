/**
<<<<<<< HEAD
=======
 * Validates that the temperature input is a valid number
 * @param {any} temp - Temperature value to validate
 * @param {string} label - Label for error message (e.g., "Celsius", "Fahrenheit")
 * @throws {Error} If temperature is not a valid number
 */
function validateTemperature(temp, label) {
  if (typeof temp !== 'number' || isNaN(temp) || !isFinite(temp)) {
    throw new Error(`${label} temperature must be a number`);
  }
}

/**
>>>>>>> e4a76857885b4876461d23e508d639917bdedbb1
 * Converts Celsius to Fahrenheit
 * Formula: F = (C × 9/5) + 32
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 * @throws {Error} If input is not a valid number
 */
export function cToF(celsius) {
  if (typeof celsius !== 'number' || isNaN(celsius)) {
    throw new Error('Temperature must be a number');
  }
  return (celsius * 9) / 5 + 32;
}

/**
 * Converts Fahrenheit to Celsius
 * Formula: C = (F - 32) × 5/9
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 * @throws {Error} If input is not a valid number
 */
export function fToC(fahrenheit) {
  if (typeof fahrenheit !== 'number' || isNaN(fahrenheit)) {
    throw new Error('Temperature must be a number');
  }
  return ((fahrenheit - 32) * 5) / 9;
}

/**
 * Validates conversion options
 * @param {string} from - Source unit ('C' or 'F')
 * @param {string} to - Target unit ('C' or 'F')
 * @throws {Error} If units are invalid or conversion is not allowed
 */
export function validateOptions(from, to) {
  const validUnits = ['C', 'F'];
  
  // Check if units are strings
  if (typeof from !== 'string' || typeof to !== 'string') {
    throw new Error('Units must be strings');
  }
  
  // Check if from unit is valid
  if (!validUnits.includes(from)) {
    throw new Error(`Invalid unit: ${from}. Valid units are: C, F`);
  }
  
  // Check if to unit is valid
  if (!validUnits.includes(to)) {
    throw new Error(`Invalid unit: ${to}. Valid units are: C, F`);
  }
  
  // Check if trying to convert to same unit
  if (from === to) {
    throw new Error(`Cannot convert from ${from} to ${to}. Units must be different`);
  }
}

/**
 * Converts temperature between Celsius and Fahrenheit
 * @param {number} value - Temperature value
 * @param {string} from - Source unit ('C' or 'F')
 * @param {string} to - Target unit ('C' or 'F')
 * @returns {number} Converted temperature
 * @throws {Error} If validation fails
 */
export function convert(value, from, to) {
  validateOptions(from, to);
  
  if (from === 'C' && to === 'F') {
    return cToF(value);
  } else if (from === 'F' && to === 'C') {
    return fToC(value);
  }
  
}
