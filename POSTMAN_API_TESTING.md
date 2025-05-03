# Guide de test API pour Profile Management avec Postman

Ce guide vous explique comment configurer et tester les endpoints de l'API de gestion de profils via Postman.

## Configuration initiale pour HTTPS avec mkcert

Puisque vous utilisez HTTPS avec mkcert, vous devez:

1. **Désactiver la vérification SSL dans Postman**:
   - Ouvrez Postman et cliquez sur l'icône d'engrenage (Settings) en haut à droite
   - Allez dans l'onglet "General"
   - Désactivez l'option "SSL Certificate Verification"

2. **Si nécessaire, importez le certificat**:
   - Allez dans Settings > Certificates
   - Ajoutez votre certificat mkcert pour le domaine "localhost"

3. **Configurer la gestion des cookies**:
   - Dans Postman, allez dans les paramètres de la requête
   - Activez l'option "Send cookies" dans l'onglet "Cookies"
   - Assurez-vous que l'option "Store cookies automatically" est également activée

## Authentication

Cette API utilise l'authentification par cookies. Vous devez d'abord vous connecter à l'API avant de pouvoir accéder aux endpoints protégés:

```
Méthode: POST
URL: https://localhost:8000/user/login/
Headers: 
  Content-Type: application/json
Body: 
{
  "email": "admin@example.com",
  "password": "votreMotDePasse"
}
```

Si la connexion réussit, le serveur définira un cookie de session dans votre navigateur ou client Postman. Ce cookie sera automatiquement envoyé avec toutes les requêtes suivantes.

## Endpoints fonctionnels et requêtes de test

D'après les logs et le code de l'application, voici les endpoints qui fonctionnent correctement:

### 1. Récupérer tous les profils

```
Méthode: POST
URL: https://localhost:8000/profile/getall/
Headers: 
  Content-Type: application/json
Body: {}
```

Réponse attendue: Liste des profils

### 2. Lister les modules

```
Méthode: POST
URL: https://localhost:8000/profile/listmodule/
Headers: 
  Content-Type: application/json
Body: {}
```

Réponse attendue: Liste des modules disponibles

### 3. Lister les menus

```
Méthode: POST
URL: https://localhost:8000/profile/listmenu/
Headers: 
  Content-Type: application/json
Body: {}
```

Réponse attendue: Liste des menus disponibles

### 4. Créer un profil

```
Méthode: POST
URL: https://localhost:8000/profile/create/
Headers: 
  Content-Type: application/json
Body: 
{
  "title": "Nom du profil",
  "description": "Description du profil",
  "code": "PROF_TEST",
  "modules": [],
  "menus": []
}
```

Réponse attendue: Le profil créé avec un code 201

### 5. Mettre à jour un profil

```
Méthode: POST
URL: https://localhost:8000/profile/update/
Headers: 
  Content-Type: application/json
Body: 
{
  "id": 1,
  "title": "Nom modifié",
  "description": "Description modifiée",
  "code": "PROF_TEST",
  "modules": [],
  "menus": []
}
```

Réponse attendue: Le profil mis à jour

### 6. Supprimer un profil

```
Méthode: POST
URL: https://localhost:8000/profile/delete/
Headers: 
  Content-Type: application/json
Body: 
{
  "id": 1
}
```

Réponse attendue: Un statut 204 ou un message de succès

## Endpoints de gestion des utilisateurs

Pour accéder aux endpoints de gestion des utilisateurs, vous devez être connecté avec un compte administrateur (les cookies de session sont vérifiés côté serveur).

### 1. Récupérer tous les utilisateurs

```
Méthode: POST
URL: https://localhost:8000/user/getall/
Headers: 
  Content-Type: application/json
Body: {}
```

Réponse attendue: Liste des utilisateurs

### 2. Créer un utilisateur

```
Méthode: POST
URL: https://localhost:8000/user/create/
Headers: 
  Content-Type: application/json
Body: 
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "profile_id": 1,
  "status": "ACTIVE",
  "is_staff": true,
  "is_active": true,
  "phone": "+1234567890"
}
```

Réponse attendue: L'utilisateur créé avec un code 201

**Note importante**: Si vous recevez une erreur 403 Forbidden, assurez-vous que:
1. Vous êtes bien connecté à l'API (vérifiez que le cookie de session est présent)
2. Vous utilisez un compte administrateur
3. Vous pouvez essayer des variantes alternatives pour cet endpoint:
   - `/users/create/`
   - `/user/add/`
   - `/users/add/`

### 3. Mettre à jour un utilisateur

```
Méthode: POST
URL: https://localhost:8000/user/update/
Headers: 
  Content-Type: application/json
Body: 
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "profile_id": 1,
  "status": "ACTIVE",
  "is_active": true,
  "phone": "+1234567890"
}
```

Réponse attendue: L'utilisateur mis à jour

### 4. Supprimer un utilisateur

```
Méthode: POST
URL: https://localhost:8000/user/delete/
Headers: 
  Content-Type: application/json
Body: 
{
  "id": 1
}
```

Réponse attendue: Un statut 204 ou un message de succès

## Création d'une Collection Postman

Pour faciliter les tests, vous pouvez créer une collection dans Postman:

1. Cliquez sur "New Collection"
2. Nommez-la "Profile Management API"
3. Ajoutez les requêtes ci-dessus à la collection
4. Utilisez des variables d'environnement pour l'URL de base:
   - Créez un environnement "Local Development"
   - Ajoutez une variable `base_url` avec la valeur `https://localhost:8000`
   - Utilisez `{{base_url}}` dans vos requêtes
5. Organisez les requêtes avec une requête de connexion au début

## Dépannage des erreurs courantes

### Erreur 404 Not Found

Si vous obtenez une erreur 404, vérifiez:
- Que l'URL est correcte et correspond aux logs du serveur
- Que la méthode HTTP (POST/GET) est correcte

### Erreur 403 Forbidden

Si vous obtenez une erreur 403, vérifiez:
- Que vous vous êtes bien connecté à l'API et que le cookie de session est présent
- Que votre compte a les privilèges administrateur nécessaires
- Que la session n'a pas expiré (reconnectez-vous si nécessaire)

### Erreur TLS/SSL

Si vous avez des erreurs de certificat:
- Assurez-vous que la vérification SSL est bien désactivée dans Postman
- Vérifiez que mkcert est bien configuré sur votre système

### Erreur Content-Type

Si l'API rejette votre requête:
- Vérifiez que vous avez bien spécifié le Content-Type: application/json
- Vérifiez que le corps de la requête est bien au format JSON

### Erreur de cookies

Si l'authentification ne fonctionne pas:
- Vérifiez que les cookies sont bien envoyés avec vos requêtes
- Essayez de vous reconnecter pour obtenir un nouveau cookie de session
- Assurez-vous que l'option "Send cookies" est activée dans Postman

## Exemple de flux de test complet

1. **Se connecter** pour obtenir un cookie de session
2. **Récupérer la liste des modules** (pour avoir les IDs)
3. **Récupérer la liste des menus** (pour avoir les IDs)
4. **Créer un nouveau profil** en spécifiant quelques modules et menus
5. **Vérifier que le profil est bien créé** en récupérant tous les profils
6. **Mettre à jour le profil** créé pour modifier ses propriétés
7. **Supprimer le profil** de test 