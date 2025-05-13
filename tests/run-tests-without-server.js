// @ts-check
const { exec } = require('child_process');

/**
 * Ce script permet d'exécuter les tests mockés sans démarrer de serveur.
 * Utile quand vous ne pouvez pas ou ne voulez pas démarrer le backend.
 */

// Fonction pour exécuter les tests avec Playwright CLI sans serveur
function runMockedTests() {
  console.log('Executing mock tests without starting servers...');
  
  // Commande pour exécuter les tests sans démarrer de WebServer
  const command = 'npx playwright test --config=playwright.noserver.config.js';
  
  // Exécution de la commande
  const child = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  
  child.on('exit', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}

// Si ce script est exécuté directement, lancer les tests
if (require.main === module) {
  runMockedTests();
}

module.exports = { runMockedTests };