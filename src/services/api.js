import authService from './AuthService';
import userService from './UserService';

const api = {
    // URL de base de l'API, utilise la variable d'environnement ou localhost par défaut
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',

    
    // Fonction principale pour faire les requêtes API
    async request(endpoint, method = 'GET', data = null) {
        console.log(`API Request: ${method} ${this.baseURL}${endpoint}`, data);
        
        // En-têtes de base pour toutes les requêtes
        const headers = {
            'Content-Type': 'application/json',
        };

        // Configuration de la requête fetch avec les cookies
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

            // Log de la réponse pour le débogage
            console.log(`API Response status: ${response.status}`);

            // Gestion des erreurs HTTP
            if (!response.ok) {
                try {
                const errorData = await response.json();
                console.error('Error details:', errorData); 
                    throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
                } catch (jsonError) {
                    // Si la réponse n'est pas du JSON, utiliser le statut HTTP
                    throw new Error(`Request failed with status ${response.status}`);
                }
            }

            // Si la réponse est 204 No Content, retourne un objet vide
            if (response.status === 204) {
                return { success: true };
            }

            // Retourne la réponse en JSON
            const jsonData = await response.json();
            console.log('API Response data:', jsonData);
            return jsonData;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },
    
    // Méthode spécifique pour la récupération des profils
    async getProfiles() {
        // Utiliser uniquement les endpoints qui fonctionnent - sans le préfixe /api
        const endpoints = [
            '/profile/getall/',
            '/profile/list/'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying to fetch profiles from ${endpoint}`);
                // Utilisons POST car c'est ce qui fonctionne avec l'API actuelle
                const profiles = await this.request(endpoint, 'POST');
                if (profiles && Array.isArray(profiles)) {
                    console.log(`Successfully fetched ${profiles.length} profiles from ${endpoint}`);
                    return profiles;
                }
            } catch (error) {
                console.warn(`Failed to fetch profiles from ${endpoint}:`, error);
            }
        }
        
        // Si aucun endpoint n'a fonctionné, essayons une solution de contournement
        try {
            // Essayer de récupérer à partir des modules
            const modules = await this.request('/profile/listmodule/', 'POST');
            if (modules && Array.isArray(modules)) {
                console.log('Fetching profiles from modules:', modules);
                // Créer des profils factices basés sur les modules disponibles
                const dummyProfiles = [];
                return dummyProfiles;
            }
        } catch (moduleError) {
            console.warn('Failed to fetch modules:', moduleError);
        }
        
        console.error('All profile endpoints failed.');
        return [];
    },
    
    // Méthode pour récupérer les modules
    async getModules() {
        try {
            // Utiliser l'endpoint qui fonctionne
            return await this.request('/profile/listmodule/', 'POST');
        } catch (error) {
            console.error('Failed to fetch modules:', error);
            return [];
        }
    },
    
    // Méthode pour récupérer les menus
    async getMenus() {
        try {
            // Essayer d'abord l'endpoint spécifique pour les menus
            return await this.request('/profile/listmenu/', 'POST');
        } catch (error) {
            console.error('Failed to fetch menus:', error);
            // Si ça échoue, extraire les menus des modules
            try {
                const modules = await this.getModules();
                const menus = [];
                if (modules && Array.isArray(modules)) {
                    modules.forEach(module => {
                        if (module.menus && Array.isArray(module.menus)) {
                            menus.push(...module.menus);
                        }
                    });
                }
                return menus;
            } catch (moduleError) {
                console.error('Failed to extract menus from modules:', moduleError);
                return [];
            }
        }
    }
};

// Export des services
export { authService, userService };
export default api;