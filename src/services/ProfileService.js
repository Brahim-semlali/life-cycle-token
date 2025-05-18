import api from './api';

// Cache local des profils
let profiles = [];
let modules = [];
let menus = [];

// Initialiser les profils
export const initializeProfiles = async () => {
    try {
        // Utiliser la méthode API spécifique pour récupérer les profils
        const loadedProfiles = await api.getProfiles();
        console.log('Raw profiles from API:', loadedProfiles);
        
        if (loadedProfiles && loadedProfiles.length > 0) {
            // Transformer les données de l'API pour correspondre à notre structure interne
            profiles = loadedProfiles.map(p => ({
                id: p.id,
                name: p.title || p.name,
                title: p.title || p.name,
                description: p.description || '',
                code: p.code || `PROF_${Date.now()}${Math.floor(Math.random()*1000)}`,
                status: p.status || "active",
                modules: p.modules || [],
                menus: p.menus || []
            }));
            
            console.log('Profils chargés avec succès:', profiles.length);
            return profiles;
        } else {
            console.warn('Aucun profil trouvé dans la base de données');
            
            // Vérifier dans la base de données PostgreSQL selon la capture d'écran
            try {
                console.log('Tentative de récupération des profils directement depuis PG...');
                const pgProfiles = await api.request('/profile/listfromdb/', 'POST');
                
                if (pgProfiles && (Array.isArray(pgProfiles) ? pgProfiles.length > 0 : Object.keys(pgProfiles).length > 0)) {
                    // Traiter les profils selon le format PG
                    const profilesToUse = Array.isArray(pgProfiles) ? pgProfiles : Object.values(pgProfiles);
                    
                    profiles = profilesToUse.map(p => ({
                        id: p.id,
                        name: p.title || p.name,
                        title: p.title || p.name,
                        description: p.description || '',
                        code: p.code || `PROF_${Date.now()}${Math.floor(Math.random()*1000)}`,
                        status: p.status || "active",
                        modules: p.modules || [],
                        menus: p.menus || []
                    }));
                    
                    console.log('Profils chargés avec succès depuis PG:', profiles.length);
                    return profiles;
                }
            } catch (pgError) {
                console.error('Échec de la récupération des profils depuis PG:', pgError);
            }
            
            profiles = [];
        }
        
        return profiles;
    } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        profiles = [];
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

// Récupérer les utilisateurs associés à un profil
export const getUsersByProfileId = async (profileId) => {
    try {
        // Import dynamique pour éviter les problèmes de dépendance circulaire
        const userServiceModule = await import('./UserService');
        const userService = userServiceModule.default;
        
        const allUsers = await userService.getAllUsers();
        return allUsers.filter(user => {
            // Considérer plusieurs façons dont le profile_id peut être présent
            if (user.profileId === profileId) return true;
            if (user.profile_id === profileId) return true;
            if (user.profile && typeof user.profile === 'object' && user.profile.id === profileId) return true;
            return false;
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs par profil:', error);
        return [];
    }
};

// Charger tous les modules et menus
export const loadModulesAndMenus = async () => {
    try {
        // Utiliser les méthodes API spécifiques
        modules = await api.getModules();
        menus = await api.getMenus();
        
        console.log('Modules et menus chargés avec succès:', { modules: modules.length, menus: menus.length });
        return { modules, menus };
    } catch (error) {
        console.error('Erreur lors du chargement des modules et menus:', error);
        
        // Renvoyer des tableaux vides en cas d'erreur
        modules = [];
        menus = [];
        
        return { modules, menus };
    }
};

// Charger tous les menus
export const loadMenus = async () => {
    try {
        menus = await api.getMenus();
        console.log('Menus chargés avec succès:', menus.length);
        return menus;
    } catch (error) {
        console.error('Erreur lors du chargement des menus:', error);
        
        // Renvoyer un tableau vide en cas d'erreur
        menus = [];
        
        return menus;
    }
};

// Créer un nouveau profil
export const createProfile = async (profile) => {
    try {
        const apiProfile = {
            title: profile.name || profile.title,
            description: profile.description,
            code: profile.code || `PROF_${Date.now()}`,
            modules: profile.modules?.map(m => m.id || m) || [],
            menus: profile.menus?.map(m => m.id || m) || []
        };
        
        console.log("Sending profile to API:", apiProfile);
        
        // Utiliser directement l'endpoint /profile/create/ qui fonctionne
        const response = await api.request('/profile/create/', 'POST', apiProfile);

        if (response) {
            // Adapter le format de réponse de l'API à notre modèle interne
        const newProfile = {
                id: response.id,
                name: response.title,
                title: response.title,
                description: response.description,
                code: response.code,
                status: response.status || "active",
                modules: response.modules || [],
                menus: response.menus || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

            profiles.push(newProfile);
            return newProfile;
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
        const apiProfile = {
            id: id,
            title: updatedProfile.name || updatedProfile.title,
            description: updatedProfile.description,
            code: updatedProfile.code,
            modules: updatedProfile.modules?.map(m => m.id || m) || [],
            menus: updatedProfile.menus?.map(m => m.id || m) || []
        };
        
        console.log("Updating profile:", apiProfile);
        
        // Utiliser directement l'endpoint /profile/update/ qui fonctionne
        const response = await api.request('/profile/update/', 'POST', apiProfile);

        if (response) {
            // Adapter le format de réponse de l'API à notre modèle interne
            const profile = {
                id: response.id,
                name: response.title,
                title: response.title,
                description: response.description,
                code: response.code,
                status: response.status || "active",
                modules: response.modules || [],
                menus: response.menus || [],
                updatedAt: new Date().toISOString()
            };
            
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = {...profiles[index], ...profile};
            }
            return profiles[index];
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
        console.log("Deleting profile with ID:", id);
        
        // Check if profile is associated with any users first
        const associatedUsers = await getUsersByProfileId(id);
        
        if (associatedUsers && associatedUsers.length > 0) {
            console.log(`Profile ${id} is associated with ${associatedUsers.length} users and cannot be deleted`);
            return {
                success: false,
                message: `This profile cannot be deleted because it is associated with ${associatedUsers.length} user(s).`,
                users: associatedUsers
            };
        }
        
        // Use the dedicated API method that handles the proper format and fallbacks
        const result = await api.deleteProfile(id);
        
        if (result.success) {
            // Remove profile from local cache after successful server deletion
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles.splice(index, 1);
            }
            return { 
                success: true,
                message: `Profile deleted successfully`
            };
        } else {
            // Server deletion failed but we're in development mode - remove locally
            if (process.env.NODE_ENV === 'development') {
                console.log("Development mode: Removing profile locally despite server error");
                const index = profiles.findIndex(p => p.id === id);
                if (index !== -1) {
                    profiles.splice(index, 1);
                }
                return { 
                    success: true,
                    message: `Profile removed locally only. Server sync failed. The API endpoint is not properly implemented on the server.`
                };
            }
            
            // Return error information
            const errorDetails = result.error 
                ? (typeof result.error === 'string' ? result.error : JSON.stringify(result.error))
                : 'Unknown server error';
                
            return {
                success: false,
                message: `Could not delete the profile on the server: ${errorDetails}. Please ensure the API endpoint is correctly implemented.`
            };
        }
    } catch (error) {
        console.error('Error in deleteProfile function:', error);
        
        // In development mode, still allow local deletion for better UX
        if (process.env.NODE_ENV === 'development') {
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles.splice(index, 1);
                return {
                    success: true,
                    message: `Profile removed locally only. An error occurred while communicating with the server.`
                };
            }
        }
        
        return { 
            success: false, 
            message: 'An unexpected error occurred while deleting the profile.'
        };
    }
};

// Vérifier si un profil existe et le créer s'il n'existe pas
export const ensureProfileExists = async (profile) => {
    try {
        const existingProfile = profiles.find(p => p.id === profile.id || p.code === profile.code);
        if (existingProfile) {
            return existingProfile;
        }

        return await createProfile(profile);
    } catch (error) {
        console.error('Erreur lors de la vérification/création du profil:', error);
        return null;
    }
};

// Convertir les modules et sous-modules en format API
export const convertModulesToApiFormat = (modulesObj) => {
    const moduleIds = [];
    const menuIds = [];
    
    // Parcourir les modules et sous-modules activés
    Object.entries(modulesObj).forEach(([moduleName, moduleData]) => {
        if (moduleData?.access) {
            // Trouver l'ID du module dans la liste des modules
            const module = modules.find(m => 
                m.code?.toLowerCase() === moduleName.toLowerCase() ||
                m.code === moduleName.toUpperCase()
            );
            
            if (module) {
                moduleIds.push(module.id);
                
                // Parcourir les sous-modules activés
                Object.entries(moduleData.subModules || {}).forEach(([subModuleName, isEnabled]) => {
                    if (isEnabled) {
                        // Trouver l'ID du menu dans la liste des menus
                        const menu = menus.find(m => 
                            m.code?.toLowerCase() === subModuleName.toLowerCase() ||
                            m.code === subModuleName.toUpperCase()
                        );
                        
                        if (menu) {
                            menuIds.push(menu.id);
                        }
                    }
                });
            }
        }
    });
    
    return { modules: moduleIds, menus: menuIds };
};

export default {
    initializeProfiles,
    getAllProfiles,
    getProfileById,
    createProfile,
    updateProfile,
    deleteProfile,
    ensureProfileExists,
    loadModulesAndMenus,
    loadMenus,
    convertModulesToApiFormat,
    getUsersByProfileId
};
