module.exports = {
  preset: 'ts-jest',
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    },
  },
  projects: [
    {
      displayName: "backend",
      testMatch: ["<rootDir>/earnings_dashboard/**/*.test.{ts,tsx,js,jsx}", "<rootDir>/**/*.test.{ts,tsx,js,jsx}"],
      testEnvironment: "node"
    },
    {
      displayName: "frontend",
      testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
      testEnvironment: "jsdom"
    }
  ]
};
