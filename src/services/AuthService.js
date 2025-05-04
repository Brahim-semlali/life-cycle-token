import api from './api';
import userService from './UserService';

class AuthService {
    // Récupérer les informations de l'utilisateur connecté et son profil
    async getCurrentUser() {
        try {
            const userData = await api.request('/user/current/', 'GET');
            if (userData && userData.id) {
                // Obtenez tous les utilisateurs pour trouver celui correspondant avec son profil complet
                const users = await userService.getAllUsers();
                const currentUser = users.find(u => u.id === userData.id);
                return currentUser || userData;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur courant:', error);
            return null;
        }
    }
    
    // Fonction de connexion
    async login(email, password) {
        try {
            // Envoi des identifiants au serveur
            // Le serveur définira un cookie de session sécurisé
            await api.request('/user/login/', 'POST', { email, password });
            console.log('Login successful - cookie established');
            
            // Récupérer les informations de l'utilisateur après la connexion
            const currentUser = await this.getCurrentUser();
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
    // Le serveur vérifiera automatiquement le cookie de session
    async isAuthenticated() {
        try {
            const currentUser = await this.getCurrentUser();
            return !!currentUser;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            return false;
        }
    }
}

export default new AuthService();