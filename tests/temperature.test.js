import { test, expect, describe } from 'vitest';
import { cToF, fToC, validateOptions, convert, assertValidTemperature } from '../src/temperature/index.js';

describe('Temperature Conversion', () => {
  describe('cToF - Celsius to Fahrenheit (Table-Driven)', () => {
    // Table-driven test pattern: Data and test logic separated
    // Adding new test case = just add one row to the table
    const conversionTable = [
      { celsius: 0, fahrenheit: 32, description: 'freezing point' },
      { celsius: 100, fahrenheit: 212, description: 'boiling point' },
      { celsius: -40, fahrenheit: -40, description: 'intersection point' },
      { celsius: 37, fahrenheit: 98.6, description: 'body temperature', tolerance: 1 },
      { celsius: -273.15, fahrenheit: -459.67, description: 'absolute zero', tolerance: 1 },
      { celsius: 25, fahrenheit: 77, description: 'room temperature' },
    ];

    conversionTable.forEach(({ celsius, fahrenheit, description, tolerance }) => {
      test(`${celsius}°C → ${fahrenheit}°F (${description})`, () => {
        if (tolerance) {
          expect(cToF(celsius)).toBeCloseTo(fahrenheit, tolerance);
        } else {
          expect(cToF(celsius)).toBe(fahrenheit);
        }
      });
    });
  });

  describe('fToC - Fahrenheit to Celsius (Table-Driven)', () => {
    const conversionTable = [
      { fahrenheit: 32, celsius: 0, description: 'freezing point' },
      { fahrenheit: 212, celsius: 100, description: 'boiling point' },
      { fahrenheit: -40, celsius: -40, description: 'intersection point' },
      { fahrenheit: 98.6, celsius: 37, description: 'body temperature', tolerance: 1 },
      { fahrenheit: -459.67, celsius: -273.15, description: 'absolute zero', tolerance: 1 },
      { fahrenheit: 77, celsius: 25, description: 'room temperature', tolerance: 1 },
    ];

    conversionTable.forEach(({ fahrenheit, celsius, description, tolerance }) => {
      test(`${fahrenheit}°F → ${celsius}°C (${description})`, () => {
        if (tolerance) {
          expect(fToC(fahrenheit)).toBeCloseTo(celsius, tolerance);
        } else {
          expect(fToC(fahrenheit)).toBe(celsius);
        }
      });
    });
  });

  describe('Round-trip conversions', () => {
    test('C → F → C should return original value', () => {
      const original = 25;
      const result = fToC(cToF(original));
      expect(result).toBeCloseTo(original, 10);
    });

    test('F → C → F should return original value', () => {
      const original = 77;
      const result = cToF(fToC(original));
      expect(result).toBeCloseTo(original, 10);
    });
  });
});

describe('validateOptions', () => {
  describe('Valid conversions', () => {
    test('should allow C to F conversion', () => {
      expect(() => validateOptions('C', 'F')).not.toThrow();
    });

    test('should allow F to C conversion', () => {
      expect(() => validateOptions('F', 'C')).not.toThrow();
    });
  });

  describe('Invalid conversions', () => {
    test('should reject C to C (same unit)', () => {
      expect(() => validateOptions('C', 'C')).toThrow('Cannot convert from C to C');
    });

    test('should reject F to F (same unit)', () => {
      expect(() => validateOptions('F', 'F')).toThrow('Cannot convert from F to F');
    });

    test('should reject invalid from unit', () => {
      expect(() => validateOptions('K', 'F')).toThrow('Invalid unit: K');
    });

    test('should reject invalid to unit', () => {
      expect(() => validateOptions('C', 'K')).toThrow('Invalid unit: K');
    });

    test('should reject lowercase units', () => {
      expect(() => validateOptions('c', 'f')).toThrow('Invalid unit: c');
    });

    test('should reject empty string units', () => {
      expect(() => validateOptions('', 'F')).toThrow('Invalid unit: ');
    });

    test('should reject null/undefined units', () => {
      expect(() => validateOptions(null, 'F')).toThrow();
      expect(() => validateOptions('C', undefined)).toThrow();
    });
  });
});

describe('Input validation', () => {
  test('cToF should throw on non-numeric input', () => {
    expect(() => cToF('hot')).toThrow('Temperature must be a number');
  });

  test('cToF should throw on NaN', () => {
    expect(() => cToF(NaN)).toThrow('Temperature must be a number');
  });

  test('fToC should throw on non-numeric input', () => {
    expect(() => fToC('cold')).toThrow('Temperature must be a number');
  });
});

describe('convert() function', () => {
  describe('Success cases', () => {
    test('should convert from C to F', () => {
      expect(convert(0, 'C', 'F')).toBe(32);
    });

    test('should convert from F to C', () => {
      expect(convert(32, 'F', 'C')).toBe(0);
    });

    test('should handle decimal values', () => {
      expect(convert(37, 'C', 'F')).toBeCloseTo(98.6, 1);
    });
  });

  describe('Error cases', () => {
    test('should reject invalid from unit', () => {
      expect(() => convert(100, 'K', 'F')).toThrow('Invalid unit: K');
    });

    test('should reject invalid to unit', () => {
      expect(() => convert(100, 'C', 'X')).toThrow('Invalid unit: X');
    });

    test('should reject same unit conversion', () => {
      expect(() => convert(100, 'C', 'C')).toThrow('Cannot convert from C to C');
    });

    test('should reject invalid temperature value', () => {
      expect(() => convert(NaN, 'C', 'F')).toThrow('Temperature must be a number');
    });

    test('should reject non-numeric temperature', () => {
      expect(() => convert('hot', 'C', 'F')).toThrow('Temperature must be a number');
    });
  });
});

describe('assertValidTemperature - Infinity Policy', () => {
  test('should reject positive Infinity (explicit policy)', () => {
    // Infinity Policy Test: We REJECT Infinity because it doesn't represent
    // a physical temperature that can be meaningfully converted.
    // Physical temperatures are bounded by absolute zero (-273.15°C / -459.67°F).
    expect(() => assertValidTemperature(Infinity)).toThrow('Temperature must be a number');
  });

  test('should reject negative Infinity', () => {
    // -Infinity is also rejected for the same physical reality reasons
    expect(() => assertValidTemperature(-Infinity)).toThrow('Temperature must be a number');
  });

  test('should propagate Infinity rejection through cToF', () => {
    // This documents that the policy is enforced at the conversion function level
    expect(() => cToF(Infinity)).toThrow('Temperature must be a number');
  });

  test('should propagate Infinity rejection through fToC', () => {
    expect(() => fToC(-Infinity)).toThrow('Temperature must be a number');
  });

  test('should accept valid boundary values near extremes', () => {
    // Prove we accept very large (but finite) values
    expect(() => assertValidTemperature(1000000)).not.toThrow();
    expect(() => assertValidTemperature(-1000000)).not.toThrow();
  });
});
