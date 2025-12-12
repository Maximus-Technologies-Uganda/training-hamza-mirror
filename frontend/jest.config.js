const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform ESM modules from MSW and dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!(msw|@mswjs|outvariant|@bundled-es-modules|strict-event-emitter|until-async)/)',
  ],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!src/lib/firebase.ts', // runtime-only Firebase wiring is hard to unit test
    '!src/lib/errors.ts',   // static error catalog, excluded from coverage gate
    '!src/components/ErrorBoundary.tsx',
    '!src/components/ErrorProvider.tsx',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'a11y-report.html',
        pageTitle: 'Accessibility Test Report - Blog Frontend',
        expand: true,
        openReport: false,
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
};

module.exports = createJestConfig(customJestConfig);
