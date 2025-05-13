// @ts-check

/**
 * @type {import('@playwright/test').FullConfig}
 */
module.exports = async config => {
  // Nettoyer après l'exécution de tous les tests
  console.log('Starting Playwright global teardown...');
  
  // Vous pouvez ajouter ici des nettoyages comme:
  // - Suppression des utilisateurs de test créés durant le setup
  // - Restauration de l'état de la base de données
  // - Fermeture de connexions ou processus persistants
  
  console.log('Playwright global teardown complete!');
}; 