import api from './api';

class AuthService {
    // Fonction de connexion
    async login(email, password) {
        try {
            // Envoi des identifiants au serveur
            const response = await api.request('/user/login/', 'POST', { email, password });
            
            // Le serveur va définir un cookie de session automatiquement
            // grâce à credentials: 'include' dans la requête
            console.log('Login successful, session cookie set');
            return response;
        } catch (error) {
            console.error('Login error details:', error.message);
            throw new Error(error.message || 'Authentication failed');
        }
    }

    // Fonction de déconnexion
    async logout() {
        try {
            // Appel au serveur pour invalider la session
            await api.request('/user/logout/', 'POST', {});
            console.log('Logout successful, session cookie cleared');
        } catch (error) {
            console.error('Logout error:', error.message);
            throw error;
        }
    }

    // Vérifie si l'utilisateur est authentifié
    // Le serveur vérifiera automatiquement le cookie de session
    isAuthenticated() {
        return true; // La vérification se fait côté serveur via les cookies
    }

    // Cette fonction n'est plus nécessaire car nous utilisons les cookies
    // mais nous la gardons pour la compatibilité
    getToken() {
        return null;
    }

    // Cette fonction n'est plus nécessaire car nous utilisons les cookies
    // mais nous la gardons pour la compatibilité
    getUserFromToken() {
        return null;
    }
}

export default new AuthService();