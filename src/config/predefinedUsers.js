import { PREDEFINED_PROFILES } from './predefinedProfiles';

// Clé pour le stockage localStorage
const CUSTOM_USERS_KEY = 'customUsers';

// Fonction pour charger les utilisateurs prédéfinis initiaux et personnalisés
const loadInitialUsers = () => {
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

    // Charger les utilisateurs personnalisés sauvegardés
    const savedPredefinedUsers = localStorage.getItem('predefinedUsers');
    if (savedPredefinedUsers) {
        try {
            const parsedUsers = JSON.parse(savedPredefinedUsers);
            return { ...defaultUsers, ...parsedUsers };
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs prédéfinis:', error);
        }
    }

    return defaultUsers;
};

// Initialiser les utilisateurs prédéfinis
export let PREDEFINED_USERS = loadInitialUsers();

// Fonction pour obtenir les utilisateurs personnalisés du localStorage
const getCustomUsersFromStorage = () => {
    try {
        const stored = localStorage.getItem(CUSTOM_USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erreur lors de la lecture des utilisateurs personnalisés:', error);
        return [];
    }
};

// Fonction pour sauvegarder les utilisateurs personnalisés dans le localStorage
const saveCustomUsersToStorage = (users) => {
    try {
        localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
        return false;
    }
};

// Fonction pour ajouter un nouvel utilisateur aux prédéfinis
const addToPredefinedUsers = (newUser) => {
    PREDEFINED_USERS = {
        ...PREDEFINED_USERS,
        [newUser.email]: {
            ...newUser,
            isPredefined: true
        }
    };
    // Sauvegarder les utilisateurs prédéfinis mis à jour
    const predefinedUsersToSave = Object.fromEntries(
        Object.entries(PREDEFINED_USERS).filter(([email]) => 
            !['admin@titrit.com', 'security@titrit.com', 'bank@titrit.com', 'callcenter@titrit.com'].includes(email)
        )
    );
    localStorage.setItem('predefinedUsers', JSON.stringify(predefinedUsersToSave));
};

// Fonction pour obtenir tous les utilisateurs
export const getAllUsers = () => {
    try {
        console.log('Chargement de tous les utilisateurs...');
        return Object.values(PREDEFINED_USERS);
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return [];
    }
};

// Fonction pour sauvegarder un nouvel utilisateur
export const saveCustomUser = (newUser) => {
    try {
        console.log('Sauvegarde d\'un utilisateur:', newUser.email);
        
        // Ajouter directement aux utilisateurs prédéfinis
        addToPredefinedUsers(newUser);
        
        console.log('Utilisateur ajouté aux prédéfinis avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
};

// Fonction pour vérifier les identifiants
export const checkUserCredentials = (email, password) => {
    try {
        console.log('Vérification des identifiants pour:', email);
        
        const user = PREDEFINED_USERS[email];
        if (user && user.password === password && user.status === 'active') {
            console.log('Authentification réussie pour:', email);
            return user;
        }
        
        console.log('Échec de l\'authentification');
        return null;
    } catch (error) {
        console.error('Erreur lors de la vérification des identifiants:', error);
        return null;
    }
};

// Fonction pour supprimer un utilisateur
export const deleteUser = (userId) => {
    try {
        console.log('Suppression de l\'utilisateur:', userId);
        
        // Créer un nouvel objet sans l'utilisateur à supprimer
        const updatedUsers = Object.fromEntries(
            Object.entries(PREDEFINED_USERS).filter(([_, user]) => user.id !== userId)
        );
        
        // Mettre à jour PREDEFINED_USERS
        PREDEFINED_USERS = updatedUsers;
        
        // Sauvegarder dans localStorage
        const predefinedUsersToSave = Object.fromEntries(
            Object.entries(updatedUsers).filter(([email]) => 
                !['admin@titrit.com', 'security@titrit.com', 'bank@titrit.com', 'callcenter@titrit.com'].includes(email)
            )
        );
        localStorage.setItem('predefinedUsers', JSON.stringify(predefinedUsersToSave));
        
        console.log('Utilisateur supprimé avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return false;
    }
}; 