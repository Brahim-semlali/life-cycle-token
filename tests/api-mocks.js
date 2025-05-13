// @ts-check
const { test } = require('@playwright/test');

/**
 * Configure les mocks d'API pour simuler différentes réponses du backend
 * @param {import('@playwright/test').Page} page - L'instance de page Playwright
 */
async function setupLoginMocks(page) {
  // Configuration pour simuler une connexion réussie
  await page.route('**/user/login/', async (route) => {
    // Vérifier le corps de la requête pour déterminer la réponse
    const requestBody = JSON.parse(route.request().postData() || '{}');
    
    if (requestBody.email === 'admin@example.com' && requestBody.password === 'admin123') {
      // Simuler une connexion réussie
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    } else if (requestBody.email === 'locked@example.com') {
      // Simuler un compte bloqué
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: "Account locked. Please try again later.",
          remaining_time_minutes: "10",
          remaining_time_seconds: "30",
          max_attempts: 3,
          remaining_attempts: 0
        })
      });
    } else {
      // Simuler une tentative de connexion échouée
      const remainingAttempts = 2; // Vous pouvez adapter cette valeur selon la logique de test
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: "Invalid credentials.",
          max_attempts: 3,
          remaining_attempts: remainingAttempts
        })
      });
    }
  });

  // Configuration pour simuler la récupération de l'utilisateur
  await page.route('**/user/getall/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          status: 'ACTIVE',
          profile: {
            id: 1,
            name: 'Administrator',
            modules: [1, 2, 3],
            menus: [1, 2, 3, 4]
          }
        }
      ])
    });
  });
}

/**
 * Configure les mocks d'API pour simuler plusieurs tentatives de connexion échouées
 * @param {import('@playwright/test').Page} page - L'instance de page Playwright
 * @param {number} maxAttempts - Nombre maximum de tentatives avant verrouillage
 */
async function setupFailedAttemptsLoginMock(page, maxAttempts = 3) {
  let attempts = 0;
  
  await page.route('**/user/login/', async (route) => {
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Compte bloqué après trop de tentatives
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: "Account locked. Please try again later.",
          remaining_time_minutes: "5",
          remaining_time_seconds: "0",
          max_attempts: maxAttempts,
          remaining_attempts: 0
        })
      });
    } else {
      // Tentative échouée, mais pas encore bloqué
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: "Invalid credentials.",
          max_attempts: maxAttempts,
          remaining_attempts: maxAttempts - attempts
        })
      });
    }
  });
}

module.exports = {
  setupLoginMocks,
  setupFailedAttemptsLoginMock
}; 