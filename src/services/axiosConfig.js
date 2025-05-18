import axios from 'axios';
import TokenStorage from './TokenStorage';

// Créer une instance axios avec la configuration de base
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
    config => {
        // Ajouter le token JWT à chaque requête s'il existe
        const token = TokenStorage.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
    response => {
        return response;
    },
    async error => {
        const originalRequest = error.config;
        
        // Si l'erreur est due à un token expiré (401) et que nous n'avons pas déjà tenté de rafraîchir
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Pour l'instant, nous gérons simplement la déconnexion car le backend ne supporte
            // pas encore le rafraîchissement de token
            if (TokenStorage.getToken()) {
                console.log('Token expiré ou invalide, déconnexion en cours...');
                TokenStorage.clear();
                
                // Rediriger vers la page de connexion
                window.location.href = '/login';
            }
            
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);

export default apiClient; 