// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration pour les tests qui n'ont pas besoin de serveur
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
        // Configuration des mocks
        baseURL: 'https://localhost:3001', // URL de base simulée
      },
    },
  ],

  // Pas de serveur web - tous les appels HTTP seront mockés
  webServer: [], // Tableau vide = pas de serveur à démarrer

  // Use the same directory as the project
  outputDir: 'test-results/',

  // Spécifier quels fichiers de test exécuter
  testMatch: '**/login.mock.spec.js',
}); 