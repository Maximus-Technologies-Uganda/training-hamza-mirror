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
  },
});
