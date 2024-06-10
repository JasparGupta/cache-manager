const { defaults } = require('jest-config');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...defaults,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    }
  },
  transform: {
    'node_modules/superjson/.+\\.(j|t)sx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(superjson))'
  ]
};
