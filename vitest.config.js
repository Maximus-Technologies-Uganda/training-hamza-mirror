import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Exclude frontend tests - they use Jest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'frontend/**',
    ],
    // Include only the backend tests
    include: ['tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Environment variables for tests - use memory storage to avoid needing Firestore emulator
    env: {
      STORAGE_TYPE: 'memory',
      NODE_ENV: 'test',
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,mjs,cjs,ts}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/*.test.{js,ts}',
        '**/*.config.{js,ts}',
        'src/hello/**',
        'src/expense/**',
        'src/quote/**',
        'src/stopwatch/**',
        'src/temperature/**',
        'src/todo/**',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
