/**
 * Type definitions for jest-axe
 * Provides TypeScript support for accessibility testing
 */

declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core';

  export function axe(
    html: Element | Document | string,
    options?: RunOptions | Spec
  ): Promise<AxeResults>;

  export function toHaveNoViolations(results: AxeResults): {
    message(): string;
    pass: boolean;
  };

  export function configureAxe(options?: RunOptions | Spec): typeof axe;
}

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
