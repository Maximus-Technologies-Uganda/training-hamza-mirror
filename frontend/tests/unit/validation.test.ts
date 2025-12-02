/**
 * Unit tests for validation module
 * Tests react-hook-form validation rules
 */

import {
  titleValidation,
  bodyValidation,
  postValidationRules,
} from '@/lib/validation';

describe('Validation Rules', () => {
  describe('titleValidation', () => {
    it('has required rule', () => {
      expect(titleValidation.required).toBe('Title is required');
    });

    it('has minLength rule of 1', () => {
      expect(titleValidation.minLength.value).toBe(1);
      expect(titleValidation.minLength.message).toContain('at least 1');
    });

    it('has maxLength rule of 200', () => {
      expect(titleValidation.maxLength.value).toBe(200);
      expect(titleValidation.maxLength.message).toContain('200');
    });

    it('has notEmpty validator', () => {
      expect(titleValidation.validate.notEmpty).toBeDefined();
      expect(typeof titleValidation.validate.notEmpty).toBe('function');
    });

    describe('notEmpty validator', () => {
      it('returns true for valid title', () => {
        expect(titleValidation.validate.notEmpty('Valid Title')).toBe(true);
      });

      it('returns error message for whitespace only', () => {
        expect(titleValidation.validate.notEmpty('   ')).toBe('Title cannot be only whitespace');
      });

      it('returns error message for empty string after trim', () => {
        expect(titleValidation.validate.notEmpty('  ')).toBe('Title cannot be only whitespace');
      });

      it('accepts title with leading/trailing whitespace', () => {
        expect(titleValidation.validate.notEmpty('  Valid  ')).toBe(true);
      });
    });
  });

  describe('bodyValidation', () => {
    it('has required rule', () => {
      expect(bodyValidation.required).toBe('Body content is required');
    });

    it('has minLength rule of 1', () => {
      expect(bodyValidation.minLength.value).toBe(1);
      expect(bodyValidation.minLength.message).toContain('at least 1');
    });

    it('has maxLength rule of 50000', () => {
      expect(bodyValidation.maxLength.value).toBe(50000);
      expect(bodyValidation.maxLength.message).toContain('50,000');
    });

    it('has notEmpty validator', () => {
      expect(bodyValidation.validate.notEmpty).toBeDefined();
      expect(typeof bodyValidation.validate.notEmpty).toBe('function');
    });

    describe('notEmpty validator', () => {
      it('returns true for valid body', () => {
        expect(bodyValidation.validate.notEmpty('Valid content')).toBe(true);
      });

      it('returns error message for whitespace only', () => {
        expect(bodyValidation.validate.notEmpty('   ')).toBe('Body cannot be only whitespace');
      });

      it('returns error message for tabs and newlines only', () => {
        expect(bodyValidation.validate.notEmpty('\t\n\r')).toBe('Body cannot be only whitespace');
      });

      it('accepts body with whitespace around content', () => {
        expect(bodyValidation.validate.notEmpty('  Content  ')).toBe(true);
      });
    });
  });

  describe('postValidationRules', () => {
    it('contains title validation', () => {
      expect(postValidationRules.title).toBe(titleValidation);
    });

    it('contains body validation', () => {
      expect(postValidationRules.body).toBe(bodyValidation);
    });

    it('has both title and body keys', () => {
      expect(Object.keys(postValidationRules)).toEqual(['title', 'body']);
    });
  });

  describe('Integration with react-hook-form patterns', () => {
    // These tests verify the shape matches react-hook-form expectations
    
    it('title validation has correct shape for react-hook-form', () => {
      expect(titleValidation).toHaveProperty('required');
      expect(titleValidation).toHaveProperty('minLength');
      expect(titleValidation).toHaveProperty('maxLength');
      expect(titleValidation).toHaveProperty('validate');
    });

    it('body validation has correct shape for react-hook-form', () => {
      expect(bodyValidation).toHaveProperty('required');
      expect(bodyValidation).toHaveProperty('minLength');
      expect(bodyValidation).toHaveProperty('maxLength');
      expect(bodyValidation).toHaveProperty('validate');
    });

    it('minLength has value and message properties', () => {
      expect(titleValidation.minLength).toHaveProperty('value');
      expect(titleValidation.minLength).toHaveProperty('message');
    });

    it('maxLength has value and message properties', () => {
      expect(titleValidation.maxLength).toHaveProperty('value');
      expect(titleValidation.maxLength).toHaveProperty('message');
    });

    it('validate contains named validator functions', () => {
      expect(titleValidation.validate).toHaveProperty('notEmpty');
      expect(bodyValidation.validate).toHaveProperty('notEmpty');
    });
  });
});
