const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'mapbox-gl': '<rootDir>/__mocks__/mapbox-gl.js',
  },
  collectCoverageFrom: [
    'components/map-view.tsx',
    'app/map/page.tsx',
    'app/browse/page.tsx',
    'app/browse/loading.tsx',
    'app/cart/page.tsx',
    'app/orders/page.tsx',
    'app/owner/page.tsx',
    'app/profile/page.tsx',
    'app/signup/page.tsx',
    'app/login/page.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  coverageThreshold: {
    global: {
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'text-summary'],
}

module.exports = createJestConfig(customJestConfig)

