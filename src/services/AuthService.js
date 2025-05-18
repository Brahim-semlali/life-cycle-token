import apiClient from './axiosConfig';
import TokenStorage from './TokenStorage';

class AuthService {
    // Récupérer un utilisateur par son email
    async getUserByEmail(email) {
        try {
            const response = await apiClient.post('/user/getall/');
            const users = response.data;
            
            if (Array.isArray(users)) {
                return users.find(u => u.email === email);
            }
            return null;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }
    }

    // Récupérer les informations de l'utilisateur connecté
    async getCurrentUser() {
        // Utiliser les données stockées localement
        const user = TokenStorage.getUser();
        if (user) return user;
        
        try {
            // Ou tenter de récupérer l'utilisateur du serveur si un token existe
            if (TokenStorage.isTokenValid()) {
                const response = await apiClient.post('/user/list/');
                if (response.data) {
                    // Mettre à jour les données utilisateur
                    TokenStorage.setUser(response.data);
                    return response.data;
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }
    
    // Fonction de connexion
    async login(email, password) {
        try {
            // Envoi des identifiants au serveur
            const response = await apiClient.post('/user/login/', { email, password });
            console.log('Login response:', response.data);
            
            // Extraire les données de la réponse
            const { access_token, token_type, expires_in, user } = response.data;
            
            // Stocker le token
            TokenStorage.setToken(access_token, expires_in);
            
            // Stocker les données utilisateur
            TokenStorage.setUser(user);
            
            return user;
        } catch (error) {
            console.error('Login error:', error);
            // Si l'erreur contient des données de réponse, les propager telles quelles
            if (error.response?.data) {
                throw error;
            }
            // Sinon, créer une nouvelle erreur
            throw new Error(error.message || 'Authentication failed');
        }
    }

    // Fonction de déconnexion
    async logout() {
        try {
            // Récupérer le token avant de l'effacer
            const token = TokenStorage.getToken();
            
            // Nettoyer les données locales
            TokenStorage.clear();
            
            // Si nous avons un token, informer le serveur de la déconnexion
            if (token) {
                await apiClient.post('/user/logout/');
                console.log('Logout successful on server');
            }
            
            return true;
        } catch (error) {
            console.error('Logout error:', error.message);
            // Même en cas d'erreur, nous nettoyons les données locales
            TokenStorage.clear();
            return true;
        }
    }

    // Vérifie si l'utilisateur est authentifié
    isAuthenticated() {
        return TokenStorage.isTokenValid();
    }
    
    // Récupère le temps restant avant expiration du token
    getTokenRemainingTime() {
        return TokenStorage.getTimeToExpiry();
    }
}

export default new AuthService();