import api from './api';

class AuthService {
    // Fonction de connexion
    async login(email, password) {
        try {
            // Envoi des identifiants au serveur
            // Le serveur définira un cookie de session sécurisé
            await api.request('/user/login/', 'POST', { email, password });
            console.log('Login successful');
            return true;
        } catch (error) {
            console.error('Login error:', error.message);
            throw new Error(error.message || 'Authentication failed');
        }
    }

    // Fonction de déconnexion
    async logout() {
        try {
            // Le serveur invalidera le cookie de session
            await api.request('/user/logout/', 'POST', {});
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error.message);
            throw error;
        }
    }

    // Vérifie si l'utilisateur est authentifié
    // Le serveur vérifiera automatiquement le cookie de session
    isAuthenticated() {
        // La vérification se fait côté serveur via le cookie de session
        return true;
    }
}

export default new AuthService();