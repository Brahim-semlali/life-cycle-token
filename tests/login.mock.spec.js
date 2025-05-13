// @ts-check
const { test, expect } = require('@playwright/test');
const { setupLoginMocks, setupFailedAttemptsLoginMock } = require('./api-mocks');

// Test configuration
const TEST_CREDENTIALS = {
  valid: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  invalid: {
    email: 'admin@example.com',
    password: 'wrong_password'
  },
  locked: {
    email: 'locked@example.com',
    password: 'any_password'
  }
};

// Tests de la page de connexion avec mocks d'API
test.describe('Tests de LoginForm avec mocks d\'API', () => {
  
  // Test case: Connexion réussie
  test('Connexion réussie avec identifiants valides (mock)', async ({ page }) => {
    // Configurer les mocks pour ce test
    await setupLoginMocks(page);
    
    // Naviguer vers la page de connexion
    await page.goto('https://localhost:3001/');
    
    // Attendre que le formulaire soit chargé
    await expect(page.locator('form')).toBeVisible();
    
    // Saisir les identifiants valides
    await page.fill('input[name="email"]', TEST_CREDENTIALS.valid.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.valid.password);
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // La redirection vers le dashboard devrait se produire après une connexion réussie
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
  
  // Test case: Échec de connexion
  test('Échec de connexion avec mot de passe incorrect (mock)', async ({ page }) => {
    // Configurer les mocks pour ce test
    await setupLoginMocks(page);
    
    // Naviguer vers la page de connexion
    await page.goto('https://localhost:3001/');
    
    // Attendre que le formulaire soit chargé
    await expect(page.locator('form')).toBeVisible();
    
    // Saisir des identifiants invalides
    await page.fill('input[name="email"]', TEST_CREDENTIALS.valid.email);
    await page.fill('input[name="password"]', 'wrong_password');
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Vérifier que le message d'erreur s'affiche
    await expect(page.locator('.error-box')).toBeVisible();
    
    // Le message d'erreur devrait indiquer combien de tentatives restantes
    const errorText = await page.locator('.error-box').textContent() || '';
    expect(errorText).toContain('tentatives');
    
    // L'utilisateur devrait rester sur la page de connexion
    await expect(page).toHaveURL('https://localhost:3001/');
  });
  
  // Test case: Compte verrouillé
  test('Affichage d\'un compte déjà verrouillé (mock)', async ({ page }) => {
    // Configurer les mocks pour ce test
    await setupLoginMocks(page);
    
    // Naviguer vers la page de connexion
    await page.goto('https://localhost:3001/');
    
    // Attendre que le formulaire soit chargé
    await expect(page.locator('form')).toBeVisible();
    
    // Saisir des identifiants d'un compte verrouillé
    await page.fill('input[name="email"]', TEST_CREDENTIALS.locked.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.locked.password);
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Vérifier que le message d'erreur s'affiche
    await expect(page.locator('.error-box')).toBeVisible();
    
    // Le message d'erreur devrait indiquer un temps d'attente
    const errorText = await page.locator('.error-box').textContent() || '';
    expect(errorText).toContain('patienter');
    
    // Vérifier que le bouton est désactivé ou indique le blocage
    const buttonIsLocked = (await page.locator('button[type="submit"]').getAttribute('disabled') !== null) ||
                          ((await page.locator('button[type="submit"]').textContent() || '').includes('BLOQUÉ'));
    expect(buttonIsLocked).toBeTruthy();
  });
  
  // Test case: Verrouillage progressif du compte
  test('Verrouillage progressif après plusieurs tentatives (mock)', async ({ page }) => {
    // Configurer le mock pour simuler des tentatives échouées
    await setupFailedAttemptsLoginMock(page, 3);
    
    // Naviguer vers la page de connexion
    await page.goto('https://localhost:3001/');
    
    // Fonction pour effectuer une tentative de connexion
    const attemptLogin = async (attempt) => {
      await page.fill('input[name="email"]', TEST_CREDENTIALS.valid.email);
      await page.fill('input[name="password"]', `wrong_password_${attempt}`);
      await page.click('button[type="submit"]');
      // Attendre que la réponse soit traitée
      await page.waitForTimeout(500);
    };
    
    // Effectuer trois tentatives de connexion
    for (let i = 0; i < 3; i++) {
      await attemptLogin(i);
      
      // Vérifier l'affichage du message d'erreur
      await expect(page.locator('.error-box')).toBeVisible();
      
      const errorText = await page.locator('.error-box').textContent() || '';
      console.log(`Tentative ${i+1}, message d'erreur:`, errorText);
      
      // À la 3e tentative, le compte devrait être verrouillé
      if (i === 2) {
        expect(errorText).toContain('patienter');
        
        // Le bouton devrait être désactivé ou montrer que le compte est bloqué
        const buttonIsLocked = (await page.locator('button[type="submit"]').getAttribute('disabled') !== null) ||
                              ((await page.locator('button[type="submit"]').textContent() || '').includes('BLOQUÉ'));
        expect(buttonIsLocked).toBeTruthy();
      } else {
        // Avant le verrouillage, le message devrait indiquer les tentatives restantes
        expect(errorText).toContain('tentatives');
      }
    }
  });
  
  // Test de visibilité du mot de passe
  test('Basculement de visibilité du mot de passe (mock)', async ({ page }) => {
    // Naviguer vers la page de connexion
    await page.goto('https://localhost:3001/');
    
    // Attendre que le formulaire soit chargé
    await expect(page.locator('form')).toBeVisible();
    
    // Saisir un mot de passe
    await page.fill('input[name="password"]', 'secret_password');
    
    // Vérifier que le mot de passe est masqué initialement
    expect(await page.locator('input[name="password"]').getAttribute('type')).toBe('password');
    
    // Cliquer sur l'icône pour afficher le mot de passe
    await page.click('.password-toggle');
    
    // Vérifier que le mot de passe est visible
    expect(await page.locator('input[name="password"]').getAttribute('type')).toBe('text');
    
    // Cliquer à nouveau pour masquer le mot de passe
    await page.click('.password-toggle');
    
    // Vérifier que le mot de passe est à nouveau masqué
    expect(await page.locator('input[name="password"]').getAttribute('type')).toBe('password');
  });
}); 