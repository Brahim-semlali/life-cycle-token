import axios from 'axios';
import TokenStorage from './TokenStorage';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('API URL being used:', API_URL);

// Créer une instance axios avec la configuration de base
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    // Add timeout to avoid hanging requests
    timeout: 15000
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
    config => {
        // Ne pas logger les requêtes silencieuses
        if (!config.silent) {
            console.log('API Request:', config.method.toUpperCase(), config.url, config.data);
        }
        
        // Ajouter le token d'authentification s'il existe
        const token = TokenStorage.getToken();
        if (token) {
            if (!config.silent) {
                console.log('Request with auth token');
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
    response => {
        // Ne pas logger les réponses silencieuses
        if (!response.config.silent) {
            console.log('API Response:', response.status, response.config.url);
        }
        return response;
    },
    error => {
        // Ne pas logger les erreurs 404 pour les requêtes silencieuses
        const isSilent = error.config && error.config.silent;
        const is404 = error.response && error.response.status === 404;
        
        // Suppression spécifique des erreurs 404 pour les endpoints de vérification de mot de passe
        const isPasswordVerificationEndpoint = 
            error.config && 
            (error.config.url === '/auth/verify/' || 
             error.config.url === '/auth/login/' || 
             error.config.url === '/user/login/');
        
        if ((isSilent && is404) || (is404 && isPasswordVerificationEndpoint)) {
            // Ne pas logger les erreurs 404 pour les endpoints de vérification de mot de passe
            // ou pour les requêtes silencieuses
            return Promise.reject(error);
        }
        
        console.log('API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        // Si le token est expiré, déconnecter l'utilisateur
        if (error.response && error.response.status === 401) {
            // Vérifier si l'erreur est liée à un token expiré
            const isTokenExpired = 
                error.response.data?.detail?.includes('expired') || 
                error.response.data?.message?.includes('expired') ||
                error.response.data?.error?.includes('expired');
            
            if (isTokenExpired) {
                console.warn('Token expired, logging out...');
                TokenStorage.removeToken();
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient; 