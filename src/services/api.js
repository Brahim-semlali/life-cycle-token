import authService from './AuthService';
import userService from './UserService';

const api = {
    // URL de base de l'API, utilise la variable d'environnement ou localhost par défaut
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    
    // Fonction principale pour faire les requêtes API
    async request(endpoint, method = 'GET', data = null) {
        // En-têtes de base pour toutes les requêtes
        const headers = {
            'Content-Type': 'application/json',
        };

        // Configuration de la requête fetch
        const fetchOptions = {
            method,                    // Méthode HTTP (GET, POST, etc.)
            headers,                   // En-têtes HTTP
            body: data ? JSON.stringify(data) : null,  // Corps de la requête si des données sont fournies
            credentials: 'include',    // Important: inclut les cookies dans la requête
            mode: 'cors',             // Active le mode CORS pour les requêtes cross-origin
        };

        try {
            // Exécution de la requête
            const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);

            // Gestion des erreurs HTTP
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error details:', errorData); 
                throw new Error(errorData.detail || 'Request failed');
            }

            // Retourne la réponse en JSON
            return response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

// Export des services
export { authService, userService };
export default api;