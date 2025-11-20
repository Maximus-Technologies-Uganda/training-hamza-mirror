import { test, expect, describe } from 'vitest';
import { cToF, fToC, validateOptions } from '../src/temperature/index.js';

describe('Temperature Conversion', () => {
  describe('cToF - Celsius to Fahrenheit', () => {
    test('should convert 0°C to 32°F', () => {
      expect(cToF(0)).toBe(32);
    });

    test('should convert 100°C to 212°F', () => {
      expect(cToF(100)).toBe(212);
    });

    test('should convert -40°C to -40°F', () => {
      expect(cToF(-40)).toBe(-40);
    });

    test('should convert 37°C to 98.6°F (body temperature)', () => {
      expect(cToF(37)).toBeCloseTo(98.6, 1);
    });

    test('should handle negative temperatures', () => {
      expect(cToF(-273.15)).toBeCloseTo(-459.67, 1);
    });
  });

  describe('fToC - Fahrenheit to Celsius', () => {
    test('should convert 32°F to 0°C', () => {
      expect(fToC(32)).toBe(0);
    });

    test('should convert 212°F to 100°C', () => {
      expect(fToC(212)).toBe(100);
    });

    test('should convert -40°F to -40°C', () => {
      expect(fToC(-40)).toBe(-40);
    });

    test('should convert 98.6°F to 37°C (body temperature)', () => {
      expect(fToC(98.6)).toBeCloseTo(37, 1);
    });

    test('should handle negative temperatures', () => {
      expect(fToC(-459.67)).toBeCloseTo(-273.15, 1);
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
