import api from './api';
import userService from './UserService';

class AuthService {
    // Récupérer un utilisateur par son email
    async getUserByEmail(email) {
        try {
            const users = await api.request('/user/getall/', 'POST');
            if (Array.isArray(users)) {
                return users.find(u => u.email === email);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Récupérer les informations de l'utilisateur connecté (par email)
    async getCurrentUser(email) {
        return await this.getUserByEmail(email);
    }
    
    // Fonction de connexion
    async login(email, password) {
        try {
            // Envoi des identifiants au serveur
            await api.request('/user/login/', 'POST', { email, password });
            console.log('Login successful - cookie established');
            // Récupérer l'utilisateur par email
            const currentUser = await this.getUserByEmail(email);
            return currentUser || true;
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
    async isAuthenticated(email) {
        try {
            const currentUser = await this.getCurrentUser(email);
            return !!currentUser;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            return false;
        }
    }
}

export default new AuthService();