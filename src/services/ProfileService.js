import { PREDEFINED_PROFILES, getPredefinedProfilesArray } from '../config/predefinedProfiles';
import api from './api';

// Cache local des profils
let profiles = [];

// Initialiser les profils prédéfinis
export const initializeProfiles = async () => {
    try {
        // Charger les profils depuis l'API
        const response = await api.request('/profiles/', 'GET');
        if (response) {
            profiles = response;
        } else {
            // Fallback aux profils prédéfinis si l'API échoue
            profiles = getPredefinedProfilesArray();
        }
        return profiles;
    } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        // Fallback aux profils prédéfinis en cas d'erreur
        profiles = getPredefinedProfilesArray();
        return profiles;
    }
};

// Récupérer tous les profils
export const getAllProfiles = async () => {
    if (profiles.length === 0) {
        return await initializeProfiles();
    }
    return [...profiles];
};

// Récupérer un profil par son ID
export const getProfileById = (id) => {
    return profiles.find(profile => profile.id === id);
};

// Vérifier l'accès à un module
export const hasModuleAccess = (profileId, moduleName) => {
    const profile = getProfileById(profileId);
    if (!profile || !profile.modules || !profile.modules[moduleName]) {
        return false;
    }
    return profile.modules[moduleName].access;
};

// Vérifier l'accès à un sous-module
export const hasSubModuleAccess = (profileId, moduleName, subModuleName) => {
    const profile = getProfileById(profileId);
    if (!profile || !profile.modules || !profile.modules[moduleName] || !profile.modules[moduleName].subModules) {
        return false;
    }
    return profile.modules[moduleName].subModules[subModuleName];
};

// Créer un nouveau profil
export const createProfile = async (profile) => {
    try {
        const predefinedProfiles = getPredefinedProfilesArray();
        const isPredefined = predefinedProfiles.some(p => p.id === profile.id);
        
        if (isPredefined) {
            console.warn('Impossible de modifier un profil prédéfini');
            return null;
        }

        const newProfile = {
            ...profile,
            id: profile.id || `profile-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await api.request('/profiles/', 'POST', newProfile);
        if (response) {
            profiles.push(response);
            return response;
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la création du profil:', error);
        return null;
    }
};

// Mettre à jour un profil existant
export const updateProfile = async (id, updatedProfile) => {
    try {
        const predefinedProfiles = getPredefinedProfilesArray();
        const isPredefined = predefinedProfiles.some(p => p.id === id);
        
        if (isPredefined) {
            console.warn('Impossible de modifier un profil prédéfini');
            return null;
        }

        const response = await api.request(`/profiles/${id}`, 'PUT', {
            ...updatedProfile,
            updatedAt: new Date().toISOString()
        });

        if (response) {
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = response;
            }
            return response;
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return null;
    }
};

// Supprimer un profil
export const deleteProfile = async (id) => {
    try {
        const predefinedProfiles = getPredefinedProfilesArray();
        const isPredefined = predefinedProfiles.some(p => p.id === id);
        
        if (isPredefined) {
            console.warn('Impossible de supprimer un profil prédéfini');
            return false;
        }

        const response = await api.request(`/profiles/${id}`, 'DELETE');
        if (response) {
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles.splice(index, 1);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur lors de la suppression du profil:', error);
        return false;
    }
};

// Vérifier si un profil existe et le créer s'il n'existe pas
export const ensureProfileExists = async (profile) => {
    try {
        const existingProfile = profiles.find(p => p.id === profile.id);
        if (existingProfile) {
            return existingProfile;
        }

        const response = await api.request('/profiles/', 'POST', {
            ...profile,
            updatedAt: new Date().toISOString()
        });

        if (response) {
            profiles.push(response);
            return response;
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la création du profil:', error);
        return null;
    }
};
