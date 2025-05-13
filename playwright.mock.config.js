// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration spécifique pour les tests mockés
 * Ces tests n'ont pas besoin que le backend soit en cours d'exécution
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  // Maximum time one test can run
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: 'html',
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Ignore HTTPS errors for local development with self-signed certificates
        ignoreHTTPSErrors: true,
      },
    },
  ],

  // Web server to start before tests - Pour les tests mockés, nous n'avons besoin que du frontend
  webServer: [
    {
      command: 'npm start',
      url: 'https://localhost:3001',
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
      timeout: 120 * 1000,
    }
  ],

  // Use the same directory as the project
  outputDir: 'test-results/',

  // Configure use of global setup and teardown scripts
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  
  // Spécifier quels fichiers de test exécuter
  testMatch: '**/login.mock.spec.js',
}); 