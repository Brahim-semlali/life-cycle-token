import { PREDEFINED_PROFILES, getPredefinedProfilesArray } from '../config/predefinedProfiles';

// Stockage local des profils
let profiles = [];

// Initialiser les profils prédéfinis
export const initializeProfiles = () => {
    // Charger les profils prédéfinis
    const predefinedProfiles = getPredefinedProfilesArray();
    const predefinedIds = predefinedProfiles.map(p => p.id);
    
    // Vérifier si des profils existent déjà dans le stockage local
    const storedProfiles = localStorage.getItem('profiles');
    
    if (!storedProfiles) {
        // Si aucun profil n'existe, initialiser avec les profils prédéfinis
        profiles = predefinedProfiles;
    } else {
        try {
            // Charger les profils existants
            const existingProfiles = JSON.parse(storedProfiles);
            
            // Séparer les profils personnalisés des prédéfinis
            const customProfiles = existingProfiles.filter(profile => 
                !predefinedIds.includes(profile.id) && profile.id.startsWith('custom-')
            );
            
            // Fusionner les profils prédéfinis avec les profils personnalisés
            profiles = [...predefinedProfiles, ...customProfiles];
            
            console.log('Profils chargés:', profiles);
        } catch (error) {
            console.error('Erreur lors du chargement des profils:', error);
            profiles = predefinedProfiles;
        }
    }

    // Sauvegarder les profils fusionnés
    localStorage.setItem('profiles', JSON.stringify(profiles));
    return profiles;
};

// Récupérer tous les profils
export const getAllProfiles = () => {
    // S'assurer que les profils sont initialisés
    if (profiles.length === 0) {
        return initializeProfiles();
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
export const createProfile = (profile) => {
    // Vérifier si c'est un profil prédéfini
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

    profiles.push(newProfile);
    localStorage.setItem('profiles', JSON.stringify(profiles));
    return newProfile;
};

// Mettre à jour un profil existant
export const updateProfile = (id, updatedProfile) => {
    // Vérifier si c'est un profil prédéfini
    const predefinedProfiles = getPredefinedProfilesArray();
    const isPredefined = predefinedProfiles.some(p => p.id === id);
    
    if (isPredefined) {
        console.warn('Impossible de modifier un profil prédéfini');
        return null;
    }

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
    // Vérifier si c'est un profil prédéfini
    const predefinedProfiles = getPredefinedProfilesArray();
    const isPredefined = predefinedProfiles.some(p => p.id === id);
    
    if (isPredefined) {
        console.warn('Impossible de supprimer un profil prédéfini');
        return false;
    }

    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles.splice(index, 1);
        localStorage.setItem('profiles', JSON.stringify(profiles));
        return true;
    }
    return false;
};

// Charger les profils depuis le localStorage
const loadProfiles = () => {
    try {
        const storedProfiles = localStorage.getItem('profiles');
        return storedProfiles ? JSON.parse(storedProfiles) : [];
    } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        return [];
    }
};

// Sauvegarder les profils dans le localStorage
const saveProfiles = (profiles) => {
    try {
        localStorage.setItem('profiles', JSON.stringify(profiles));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des profils:', error);
        throw error;
    }
};

// Vérifier si un profil existe et le créer s'il n'existe pas
export const ensureProfileExists = (profile) => {
    try {
        // Charger les profils existants
        let profiles = loadProfiles();
        
        // Vérifier si le profil existe déjà
        const existingProfile = profiles.find(p => p.id === profile.id);
        if (existingProfile) {
            console.log('Profil existant trouvé:', existingProfile);
            return existingProfile;
        }

        // Ajouter le nouveau profil
        const newProfile = {
            ...profile,
            updatedAt: new Date().toISOString()
        };

        profiles.push(newProfile);
        
        // Sauvegarder les profils mis à jour
        saveProfiles(profiles);
        
        console.log('Nouveau profil créé:', newProfile);
        return newProfile;
    } catch (error) {
        console.error('Erreur lors de la création du profil:', error);
        throw error;
    }
};
