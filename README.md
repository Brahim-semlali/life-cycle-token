# Titrit Technologies - Plateforme de Gestion des Tokens

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Technologies utilisées](#technologies-utilisées)
3. [Structure du projet](#structure-du-projet)
4. [Fonctionnalités principales](#fonctionnalités-principales)
5. [Installation et configuration](#installation-et-configuration)
6. [Configuration de l'API](#configuration-de-lapi)
7. [Authentification et sécurité](#authentification-et-sécurité)
8. [Gestion des utilisateurs et des profils](#gestion-des-utilisateurs-et-des-profils)
9. [Internationalisation (i18n)](#internationalisation-i18n)
10. [Thème et personnalisation](#thème-et-personnalisation)
11. [Notifications système](#notifications-système)
12. [Documentation technique](#documentation-technique)
13. [Documentation des Tests End-to-End (E2E)](#documentation-des-tests-end-to-end-e2e)

## Vue d'ensemble
Titrit Technologies est une application web moderne développée avec React.js qui fournit une interface utilisateur complète pour la gestion des tokens, des utilisateurs, des profils, de la sécurité et d'autres fonctionnalités administratives. L'application est conçue avec une approche modulaire permettant d'activer ou de désactiver des fonctionnalités spécifiques en fonction des besoins des utilisateurs.

## Technologies utilisées

### Frontend
- **React.js (v18.2.0)** - Bibliothèque JavaScript pour la création d'interfaces utilisateur
- **React Router (v7.5.0)** - Gestion du routage dans l'application
- **Material UI (v7.0.2)** - Composants UI modernes et réactifs
- **MUI X Data Grid (v8.0.0)** - Tableaux de données avancés
- **Axios (v1.9.0)** - Client HTTP pour les requêtes API
- **i18next (v25.0.1)** - Bibliothèque d'internationalisation
- **Notistack (v3.0.2)** - Système de notifications empilables
- **XLSX (v0.18.5)** - Manipulation de fichiers Excel pour l'import/export de traductions

### Développement
- **React Scripts** - Configuration de développement
- **React App Rewired** - Personnalisation de la configuration webpack
- **ESLint** - Analyse statique du code
- **Autoprefixer & PostCSS** - Optimisation CSS
- **HTTPS en développement** - Utilisation de certificats SSL locaux (mkcert)

## Structure du projet

```
src/
├── Components/             # Composants React
│   ├── LoginForm/         # Formulaire de connexion
│   ├── Sidebar/           # Barre latérale de navigation
│   ├── Dashboard/         # Composants du tableau de bord
│   │   ├── Admin/         # Gestion administrative (utilisateurs, profils, sécurité)
│   │   ├── TokenManager/  # Gestion des tokens
│   │   ├── IssuerTSP/     # Émetteur TSP
│   │   ├── ChargeBack/    # Gestion des remboursements
│   │   └── Transactions/  # Gestion des transactions
│   └── Utils/             # Composants utilitaires
├── context/               # Contextes React pour la gestion d'état globale
│   ├── AuthContext.jsx    # Gestion de l'authentification
│   ├── ThemeContext.jsx   # Gestion du thème (clair/sombre)
│   ├── LanguageContext.jsx # Gestion des langues
│   └── MenuContext.jsx    # Gestion de l'état du menu
├── services/              # Services d'API et utilitaires
│   ├── api.js             # Service principal d'API
│   ├── AuthService.js     # Services d'authentification
│   ├── UserService.js     # Services de gestion des utilisateurs
│   ├── ProfileService.js  # Services de gestion des profils
│   └── ModuleService.js   # Services de gestion des modules
├── translations/          # Fichiers de traduction
│   ├── en.js             # Traductions anglaises
│   ├── fr.js             # Traductions françaises
│   ├── ar.js             # Traductions arabes
│   └── es.js             # Traductions espagnoles
├── routes/                # Configuration des routes
├── config/                # Fichiers de configuration
├── App.js                 # Composant principal de l'application
└── index.js              # Point d'entrée de l'application
```

## Fonctionnalités principales

### Administration
- **Gestion des utilisateurs** - Création, modification, suppression et recherche d'utilisateurs
- **Gestion des profils** - Définition de rôles et de permissions pour les utilisateurs
- **Paramètres de sécurité** - Configuration des règles de mot de passe et des politiques de sécurité
- **Gestion des clients** - Interface pour la gestion des clients et leur configuration

### Token Manager
- **Gestion des risques** - Évaluation et gestion des risques liés aux tokens
- **Step-Up** - Authentification renforcée pour les transactions sensibles
- **Équipe anti-fraude** - Outils pour l'équipe de gestion des fraudes
- **Centre d'appel** - Interface pour le support client

### Issuer TSP
- **Gestion des tokens** - Création et gestion des tokens
- **MDES** - Intégration avec Mastercard Digital Enablement Service
- **VTS** - Intégration avec Visa Token Service

### Autres modules
- **ChargeBack** - Gestion des remboursements et des contestations
- **Transactions** - Suivi et gestion des transactions

### Fonctionnalités transversales
- **Multi-langue** - Support de plusieurs langues (anglais, français, arabe, espagnol)
- **Thème sombre/clair** - Personnalisation de l'interface utilisateur
- **Interface responsive** - Adaptation à différentes tailles d'écran
- **Contrôle d'accès** - Accès basé sur les rôles et les permissions
- **Système de notifications** - Affichage de messages d'information et d'erreur
- **Import/Export** - Fonctionnalités pour importer et exporter des données (notamment les traductions)

## Installation et configuration

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Serveur API backend fonctionnel

### Installation
1. Clonez le dépôt
```bash
git clone https://github.com/votre-organisation/titrit-technologies.git
cd titrit-technologies
```

2. Installez les dépendances
```bash
npm install
# ou
yarn install
```

3. Créez des certificats SSL locaux pour le développement HTTPS
```bash
# Installez mkcert si nécessaire
mkcert -install
mkcert localhost

# Assurez-vous que les fichiers sont nommés:
# - localhost.pem
# - localhost-key.pem
```

4. Démarrez le serveur de développement
```bash
npm start
# ou
yarn start
```

L'application sera accessible à l'adresse https://localhost:3001

### Configuration des ports
Par défaut, l'application frontend utilise le port 3001. Vous pouvez modifier ce port dans le fichier `package.json` en ajustant la variable d'environnement `PORT` dans la commande de démarrage.

## Configuration de l'API

### Configuration du service API
L'application utilise un service API centralisé dans `src/services/api.js` avec les fonctionnalités suivantes:
- URL de base configurable via variable d'environnement
- Gestion automatique des cookies de session
- Gestion des erreurs et des tentatives de reconnexion
- Support pour différents endpoints et méthodes

### Variables d'environnement
Créez un fichier `.env` à la racine du projet avec le contenu suivant:
```
REACT_APP_API_URL=https://localhost:8000
```

### Exemple d'utilisation de l'API
```javascript
import api from '../services/api';

// Récupérer les données d'utilisateur
const getUserData = async (userId) => {
  try {
    const response = await api.request(`/user/${userId}/`, 'GET');
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
};
```

## Authentification et sécurité

### Processus d'authentification
1. L'utilisateur saisit ses identifiants sur la page de connexion
2. Les identifiants sont envoyés à l'API d'authentification
3. Un cookie de session est défini après une authentification réussie
4. Ce cookie est automatiquement inclus dans toutes les requêtes suivantes

### Sécurité des mots de passe
L'application applique des règles strictes pour les mots de passe:
- Longueur minimale (8 caractères par défaut)
- Combinaison de lettres majuscules et minuscules
- Inclusion de chiffres
- Caractères spéciaux (facultatif mais recommandé)

### Protection des routes
Toutes les routes protégées utilisent des composants d'autorisation qui vérifient:
- L'authentification de l'utilisateur
- Les permissions basées sur le profil de l'utilisateur
- L'accès aux modules spécifiques

### HTTPS en développement
L'application utilise HTTPS même en environnement de développement pour assurer la sécurité des cookies et des données transmises. Cette configuration utilise mkcert pour générer des certificats SSL locaux.

## Gestion des utilisateurs et des profils

### Création d'utilisateurs
Les administrateurs peuvent créer de nouveaux utilisateurs avec les informations suivantes:
- Informations personnelles (nom, prénom, email)
- Profil assigné (détermine les permissions)
- Statut (actif, inactif, bloqué, etc.)
- Informations de contact

### Profils et permissions
Les profils définissent l'accès aux différents modules et fonctionnalités:
- Chaque profil peut être configuré avec des permissions spécifiques
- Les permissions sont organisées par modules et menus
- Les utilisateurs héritent des permissions de leur profil assigné

### Interface de gestion avancée
- Tableaux de données interactifs avec MUI X Data Grid
- Pagination, tri et filtrage des listes d'utilisateurs et de profils
- Opérations par lots (suppression multiple, changement de statut, etc.)
- Recherche avancée

## Internationalisation (i18n)

### Langues supportées
- Anglais (en)
- Français (fr)
- Arabe (ar)
- Espagnol (es)

### Gestion des traductions
1. Les traductions sont stockées dans des fichiers JavaScript par langue
2. L'interface permet d'exporter et d'importer des traductions via Excel
3. L'application adapte automatiquement la direction du texte pour l'arabe (RTL)

### Modèle de traduction
Un modèle Excel est disponible dans `public/assets/templates/translations_template.xlsx` pour faciliter l'ajout de nouvelles traductions.

### Exemple d'utilisation des traductions
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.description')}</p>
    </div>
  );
};
```

## Thème et personnalisation

### Système de thème
L'application implémente un système de thèmes permettant aux utilisateurs de basculer entre les modes clair et sombre.

### Composants adaptés au thème
- Tous les composants réagissent au changement de thème
- La barre latérale, les formulaires, les tableaux et autres éléments sont stylisés pour les deux modes
- Les préférences de thème sont sauvegardées pour chaque utilisateur

### Personnalisation de l'interface
L'interface utilisateur peut être personnalisée de plusieurs façons:
- Barre latérale rétractable pour maximiser l'espace de travail
- Adaptation aux différentes tailles d'écran (responsive design)
- Options d'accessibilité conformes aux normes WCAG

## Notifications système

### Système de notifications
L'application utilise Notistack pour afficher des notifications contextuelles aux utilisateurs:
- Messages de succès (opérations réussies)
- Messages d'erreur (échecs d'opérations)
- Messages d'information (conseils et informations générales)
- Messages d'avertissement (actions potentiellement risquées)

### Utilisation des notifications
```javascript
import { useSnackbar } from 'notistack';

const MyComponent = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  const handleAction = () => {
    try {
      // Effectuer une action
      enqueueSnackbar('Action réussie', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Erreur: ' + error.message, { variant: 'error' });
    }
  };
  
  return (
    <button onClick={handleAction}>Effectuer l'action</button>
  );
};
```

## Documentation technique

### API Postman
Une documentation détaillée des endpoints API est disponible dans le fichier `POSTMAN_API_TESTING.md`. Cette documentation inclut:
- Configuration de Postman pour tester l'API
- Exemples de requêtes pour chaque endpoint
- Dépannage des erreurs courantes

### Architecture de l'application
L'application est construite avec une architecture modulaire:
- **Contextes React** pour la gestion d'état globale
- **Services** pour l'interaction avec l'API
- **Composants** pour l'interface utilisateur
- **Hooks personnalisés** pour la logique réutilisable

### Compatibilité navigateur
L'application est compatible avec les navigateurs modernes:
- Chrome (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Edge (dernières versions)

### Contribuer au projet
1. Forker le dépôt
2. Créer une branche pour vos modifications:
```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```
3. Valider vos modifications:
```bash
git commit -am 'Ajouter une nouvelle fonctionnalité'
```
4. Pousser vers la branche:
```bash
git push origin feature/ma-nouvelle-fonctionnalite
```
5. Créer une Pull Request

### Bonnes pratiques de développement
- Suivre les conventions de nommage existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter le code et les API
- Respecter la structure modulaire du projet

# Documentation des Tests End-to-End (E2E) pour Titrit Technologies

Cette documentation décrit l'architecture, la configuration et l'utilisation des tests end-to-end pour l'application web Titrit Technologies, implémentés avec Playwright.

## Table des matières

1. [Introduction](#introduction)
2. [Architecture des tests](#architecture-des-tests)
3. [Configuration](#configuration)
4. [Exécution des tests](#exécution-des-tests)
5. [Tests disponibles](#tests-disponibles)
6. [Mocking d'API](#mocking-dapi)
7. [Extension des tests](#extension-des-tests)
8. [Résolution des problèmes](#résolution-des-problèmes)

## Introduction

Les tests end-to-end (E2E) permettent de valider le fonctionnement de l'application du point de vue de l'utilisateur final, en simulant des interactions réelles avec l'interface utilisateur. Cette suite de tests utilise Playwright, un framework moderne de test d'automatisation de navigateur développé par Microsoft.

Ces tests couvrent les fonctionnalités principales de l'application :
- Authentification (login/logout)
- Gestion des profils
- Gestion des utilisateurs  
- Navigation dans l'application

## Architecture des tests

La structure des tests E2E est organisée comme suit :

```
├── playwright.config.js           # Configuration principale de Playwright
├── playwright.mock.config.js      # Configuration pour tests avec API mockée
├── playwright.noserver.config.js  # Configuration pour tests sans serveur
├── tests/
│   ├── api-mocks.js               # Utilitaires pour mocker les API
│   ├── auth-flow.spec.js          # Tests du flux d'authentification complet
│   ├── global-setup.js            # Configuration globale avant les tests
│   ├── global-teardown.js         # Nettoyage global après les tests
│   ├── login.spec.js              # Tests basiques du formulaire de login
│   ├── login.mock.spec.js         # Tests du login avec API mockée
│   ├── login.integration.spec.js  # Tests d'intégration du login
│   ├── profiles.spec.js           # Tests de la gestion des profils
│   ├── users.spec.js              # Tests de la gestion des utilisateurs
│   └── run-tests-without-server.js # Script pour exécuter les tests sans serveur
```

## Configuration

Trois configurations distinctes sont disponibles pour répondre à différents besoins de test :

### 1. Configuration standard (playwright.config.js)

Cette configuration démarre le serveur frontend React sur le port 3001 avant l'exécution des tests.

```javascript
webServer: [
  {
    command: 'npm start',
    url: 'https://localhost:3001',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 120 * 1000,
  }
]
```

### 2. Configuration pour tests avec API mockée (playwright.mock.config.js)

Cette configuration est optimisée pour les tests utilisant des mocks d'API, sans dépendance au backend réel.

### 3. Configuration sans serveur (playwright.noserver.config.js)

Utilisée lorsque l'application est déjà en cours d'exécution, cette configuration n'essaie pas de démarrer un serveur.

## Exécution des tests

Plusieurs commandes sont disponibles dans le fichier `package.json` pour exécuter les tests :

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter les tests avec interface utilisateur
npm run test:e2e:ui

# Exécuter les tests en mode débogage
npm run test:e2e:debug

# Afficher le rapport des tests
npm run test:e2e:report

# Exécuter uniquement les tests du formulaire de login
npm run test:login

# Exécuter les tests de login avec API mockée
npm run test:login:mock

# Exécuter les tests sans démarrer de serveur
npm run test:login:mock:no-server
```

## Tests disponibles

### Tests d'authentification

1. **Tests basiques de login (login.spec.js)**
   - Vérification du chargement du formulaire
   - Connexion avec identifiants valides
   - Tentative de connexion avec identifiants invalides
   - Test de visibilité du mot de passe

2. **Tests de login avec API mockée (login.mock.spec.js)**
   - Connexion réussie (API mockée)
   - Échec de connexion avec mot de passe incorrect
   - Affichage d'un compte déjà verrouillé
   - Verrouillage progressif après plusieurs tentatives
   - Basculement de visibilité du mot de passe

3. **Tests du flux d'authentification (auth-flow.spec.js)**
   - Connexion et navigation dans le tableau de bord
   - Tentative de connexion avec identifiants invalides
   - Redirection vers la connexion si accès au dashboard sans être authentifié

### Tests de gestion des profils (profiles.spec.js)

- Navigation vers la page des profils
- Création d'un nouveau profil
- Modification d'un profil existant
- Suppression d'un profil
- Vérification des fonctionnalités de filtrage et de recherche

### Tests de gestion des utilisateurs (users.spec.js)

- Navigation vers la page des utilisateurs
- Création d'un nouvel utilisateur
- Modification d'un utilisateur existant
- Suppression d'un utilisateur
- Gestion des statuts d'utilisateur (actif/inactif)

## Mocking d'API

Le fichier `api-mocks.js` contient des utilitaires pour intercepter les appels API et retourner des réponses simulées. Ces mocks sont utilisés dans les tests pour éviter la dépendance au backend réel.

Exemple d'utilisation :

```javascript
// Configuration des mocks pour un test de login
await setupLoginMocks(page);

// Configuration des mocks pour simuler des tentatives échouées
await setupFailedAttemptsLoginMock(page, 3);
```

## Extension des tests

Pour ajouter de nouveaux tests :

1. Créez un nouveau fichier `.spec.js` dans le répertoire `tests/`
2. Importez les utilitaires Playwright nécessaires
3. Définissez vos cas de test en utilisant la syntaxe `test('description', async ({ page }) => { ... })`
4. Utilisez les fonctions d'assertion pour vérifier les comportements attendus

Exemple :

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Ma nouvelle fonctionnalité', () => {
  test('devrait se comporter correctement', async ({ page }) => {
    // Naviguer vers la page
    await page.goto('https://localhost:3001/ma-page');
    
    // Interagir avec l'interface
    await page.click('#mon-bouton');
    
    // Vérifier le résultat attendu
    await expect(page.locator('.resultat')).toContainText('Succès');
  });
});
```

## Résolution des problèmes

### Problèmes de démarrage du serveur

Si vous rencontrez des problèmes lors du démarrage du serveur pour les tests :

1. Vérifiez que le port 3001 n'est pas déjà utilisé
2. Utilisez `playwright.noserver.config.js` si l'application est déjà en cours d'exécution
3. Augmentez le timeout dans la configuration si nécessaire

### Problèmes d'authentification

Si les tests d'authentification échouent :

1. Vérifiez que les identifiants de test sont corrects dans les fichiers de test
2. Vérifiez que les sélecteurs CSS utilisés pour les tests correspondent à la structure actuelle du DOM

### Tests instables

Pour les tests qui échouent de manière intermittente :

1. Augmentez les timeouts dans les assertions
2. Utilisez `page.waitForSelector()` pour attendre que les éléments soient disponibles
3. Ajoutez des délais supplémentaires avec `page.waitForTimeout()` si nécessaire
