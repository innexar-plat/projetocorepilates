import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@/lib/db$': '<rootDir>/src/test/__mocks__/db.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/modules/**/dtos/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  restoreMocks: true,
};

export default config;
