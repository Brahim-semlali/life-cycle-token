import { PREDEFINED_PROFILES, getPredefinedProfilesArray } from '../config/predefinedProfiles';

// Stockage local des profils
let profiles = [];

// Initialiser les profils prédéfinis
export const initializeProfiles = () => {
    // Vérifier si des profils existent déjà dans le stockage local
    const storedProfiles = localStorage.getItem('profiles');
    if (!storedProfiles) {
        // Si aucun profil n'existe, initialiser avec les profils prédéfinis
        profiles = getPredefinedProfilesArray();
        localStorage.setItem('profiles', JSON.stringify(profiles));
    } else {
        // Sinon, charger les profils existants
        profiles = JSON.parse(storedProfiles);
    }
};

// Récupérer tous les profils
export const getAllProfiles = () => {
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
export const createProfile = (profile) => {
    const newProfile = {
        ...profile,
        id: `profile-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    localStorage.setItem('profiles', JSON.stringify(profiles));
    return newProfile;
};

// Mettre à jour un profil existant
export const updateProfile = (id, updatedProfile) => {
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles[index] = {
            ...updatedProfile,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('profiles', JSON.stringify(profiles));
        return profiles[index];
    }
    return null;
};

// Supprimer un profil
export const deleteProfile = (id) => {
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles.splice(index, 1);
        localStorage.setItem('profiles', JSON.stringify(profiles));
        return true;
    }
    return false;
};
