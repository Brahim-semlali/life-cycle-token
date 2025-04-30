import { PREDEFINED_PROFILES } from './predefinedProfiles';
import api from '../services/api';

// Utilisateurs prédéfinis par défaut
const defaultUsers = {
    'admin@titrit.com': {
        id: 'admin',
        password: 'Admin@123',
        profile: PREDEFINED_PROFILES.ADMIN,
        email: 'admin@titrit.com',
        firstName: 'Admin',
        lastName: 'System',
        username: 'admin',
        status: 'active',
        isPredefined: true
    },
    'security@titrit.com': {
        id: 'security',
        password: 'Security@123',
        profile: PREDEFINED_PROFILES.SECURITY_TEAM,
        email: 'security@titrit.com',
        firstName: 'Security',
        lastName: 'Team',
        username: 'security',
        status: 'active',
        isPredefined: true
    },
    'bank@titrit.com': {
        id: 'bank',
        password: 'Bank@123',
        profile: PREDEFINED_PROFILES.BANK_TEAM,
        email: 'bank@titrit.com',
        firstName: 'Bank',
        lastName: 'Team',
        username: 'bank',
        status: 'active',
        isPredefined: true
    },
    'callcenter@titrit.com': {
        id: 'callcenter',
        password: 'CallCenter@123',
        profile: PREDEFINED_PROFILES.CALL_CENTER_TEAM,
        email: 'callcenter@titrit.com',
        firstName: 'Call Center',
        lastName: 'Team',
        username: 'callcenter',
        status: 'active',
        isPredefined: true
    }
};

// Fonction pour obtenir tous les utilisateurs
export const getAllUsers = async () => {
    try {
        const response = await api.request('/users/', 'GET');
        return response || Object.values(defaultUsers);
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return Object.values(defaultUsers);
    }
};

// Fonction pour sauvegarder un nouvel utilisateur
export const saveCustomUser = async (newUser) => {
    try {
        const response = await api.request('/users/', 'POST', newUser);
        return response ? true : false;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
};

// Fonction pour vérifier les identifiants
export const checkUserCredentials = async (email, password) => {
    try {
        const response = await api.request('/user/login/', 'POST', { email, password });
        return response;
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
};

// Fonction pour supprimer un utilisateur
export const deleteUser = async (userId) => {
    try {
        const response = await api.request(`/users/${userId}`, 'DELETE');
        return response ? true : false;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return false;
    }
};

export default defaultUsers; 