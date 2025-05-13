// @ts-check
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration des tests
const configs = [
  { 
    name: 'Tests avec mocks', 
    command: 'npx playwright test tests/login.mock.spec.js',
    description: 'Tests du formulaire de connexion avec mock des API',
    skipServerStart: true
  },
  { 
    name: 'Tests de formulaire de connexion', 
    command: 'npx playwright test tests/login.spec.js',
    description: 'Tests du formulaire de connexion avec validation des champs'
  },
  { 
    name: 'Tests de flux d\'authentification', 
    command: 'npx playwright test tests/auth-flow.spec.js',
    description: 'Tests du flux complet d\'authentification et navigation'
  },
  { 
    name: 'Tests de gestion des profils', 
    command: 'npx playwright test tests/profiles.spec.js',
    description: 'Tests CRUD pour la gestion des profils'
  },
  { 
    name: 'Tests de gestion des utilisateurs', 
    command: 'npx playwright test tests/users.spec.js',
    description: 'Tests CRUD pour la gestion des utilisateurs'
  },
];

// Fonction pour exécuter les tests
function runTests() {
  console.log(`${colors.cyan}=== Démarrage des tests E2E ====${colors.reset}`);
  
  // Créer le répertoire de résultats s'il n'existe pas
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Exécuter chaque configuration de test
  let successCount = 0;
  let failureCount = 0;
  
  for (const config of configs) {
    console.log(`\n${colors.magenta}=== ${config.name} ====${colors.reset}`);
    console.log(`${colors.blue}Description: ${config.description}${colors.reset}`);
    
    try {
      // Exécuter la commande de test
      console.log(`${colors.yellow}Exécution de: ${config.command}${colors.reset}`);
      execSync(config.command, { 
        stdio: 'inherit', 
        env: { 
          ...process.env,
          // Ajouter des variables d'environnement supplémentaires si nécessaire
          TEST_ENV: 'e2e',
          NODE_ENV: 'test'
        } 
      });
      console.log(`${colors.green}✓ ${config.name} terminé avec succès${colors.reset}`);
      successCount++;
    } catch (error) {
      console.log(`${colors.red}✗ ${config.name} a échoué: ${error.message}${colors.reset}`);
      failureCount++;
    }
  }
  
  // Afficher le résumé
  console.log(`\n${colors.cyan}=== Résumé des tests ====${colors.reset}`);
  console.log(`${colors.green}Tests réussis: ${successCount}${colors.reset}`);
  console.log(`${colors.red}Tests échoués: ${failureCount}${colors.reset}`);
  console.log(`Total: ${successCount + failureCount}`);
  
  if (failureCount > 0) {
    console.log(`\n${colors.yellow}Consultez les rapports détaillés dans le dossier: ${resultsDir}${colors.reset}`);
  }
  
  return failureCount === 0;
}

// Exécuter les tests
const success = runTests();
process.exit(success ? 0 : 1); 