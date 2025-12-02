/**
 * Form validation rules for Blog Frontend
 * Used with react-hook-form for client-side validation
 */

/**
 * Validation rules for post title field
 */
export const titleValidation = {
  required: 'Title is required',
  minLength: {
    value: 1,
    message: 'Title must be at least 1 character',
  },
  maxLength: {
    value: 200,
    message: 'Title must be 200 characters or less',
  },
  validate: {
    notEmpty: (value: string) =>
      value.trim().length > 0 || 'Title cannot be only whitespace',
  },
};

/**
 * Validation rules for post body field
 */
export const bodyValidation = {
  required: 'Body content is required',
  minLength: {
    value: 1,
    message: 'Body must be at least 1 character',
  },
  maxLength: {
    value: 50000,
    message: 'Body must be 50,000 characters or less',
  },
  validate: {
    notEmpty: (value: string) =>
      value.trim().length > 0 || 'Body cannot be only whitespace',
  },
};

/**
 * Combined validation schema for post forms
 */
export const postValidationRules = {
  title: titleValidation,
  body: bodyValidation,
};
