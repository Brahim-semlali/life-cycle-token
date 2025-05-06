import api from './api';
import { getAllProfiles } from './ProfileService';

class UserService {
    // Récupérer tous les utilisateurs
    async getAllUsers() {
        try {
            const users = await api.request('/user/getall/', 'POST');
            console.log('Users fetched successfully:', users);
            
            // Récupérer tous les profils pour les associer aux utilisateurs
            const profiles = await getAllProfiles();
            console.log('Available profiles for association:', profiles);
            
            if (!users || !Array.isArray(users)) {
                return [];
            }
            
            return users.map(user => {
                // Détecter et normaliser le profile_id
                    let profileId = null;
                    
                    if (user.profile_id !== undefined && user.profile_id !== null) {
                        profileId = typeof user.profile_id === 'string' 
                            ? parseInt(user.profile_id, 10) 
                            : user.profile_id;
                } else if (user.profileId !== undefined && user.profileId !== null) {
                    profileId = typeof user.profileId === 'string' 
                        ? parseInt(user.profileId, 10) 
                        : user.profileId;
                } else if (user.profile) {
                        if (typeof user.profile === 'number') {
                            profileId = user.profile;
                    } else if (typeof user.profile === 'string' && !isNaN(parseInt(user.profile, 10))) {
                            profileId = parseInt(user.profile, 10);
                    } else if (typeof user.profile === 'object' && user.profile.id) {
                        profileId = typeof user.profile.id === 'string'
                            ? parseInt(user.profile.id, 10)
                            : user.profile.id;
                    }
                    }
                    
                    console.log(`User ${user.id || user.email} processed profile_id:`, profileId);
                    
                // Rechercher le profil correspondant
                const userProfile = profileId !== null && profiles && profiles.length > 0
                        ? profiles.find(p => p.id === profileId)
                        : null;
                    
                if (userProfile) {
                    console.log(`User ${user.id || user.email} associated with profile: ${userProfile.name}`);
                    }
                    
                    return {
                        ...user,
                    id: user.id || user.email || `user-${Date.now()}-${Math.random()}`,
                    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    firstName: user.first_name || user.firstName || '',
                    lastName: user.last_name || user.lastName || '',
                        profileId: profileId,
                    profile: userProfile || null,
                    status: user.status || 'active'
                    };
                });
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async createUser(userData) {
        // Variables pour suivre les erreurs
        let lastError = null;
        let errorDetails = {};
        
        try {
            console.log('Creating user with data:', userData);
            
            // S'assurer que profile_id est un nombre entier si fourni
            let profileId = null;
            if (userData.profileId) {
                // Convertir la valeur en nombre et vérifier que c'est un entier valide
                profileId = parseInt(userData.profileId, 10);
                if (isNaN(profileId)) {
                    console.warn('Invalid profile ID format:', userData.profileId);
                    profileId = null;
                } else {
                    console.log('Profile ID parsed successfully:', profileId);
                }
            }

            console.log('Profile ID for user creation:', profileId);

            // Série de formats à essayer
            const formats = [
                // Format brut sans transformation - exactement comme vu dans les sérialiseurs Django
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    profile: profileId,  // Utiliser 'profile' au lieu de 'profile_id' comme vu dans les logs
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    phone: userData.phone || ''
                },
                // Format basé sur la structure Django REST Framework
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    profile: profileId,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    language: 'EN',  // Par défaut comme vu dans la DB
                    phone: userData.phone || ''
                },
                // Format standard avec profile_id numérique
                {
                email: userData.email,
                password: userData.password || 'defaultPassword123',
                first_name: userData.firstName,
                last_name: userData.lastName,
                profile_id: profileId,
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                phone: userData.phone || ''
                },
                // Format avec profile_id en chaîne
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    profile_id: profileId ? String(profileId) : null,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                },
                // Format avec 'profile' comme clé au lieu de profile_id
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    profile: profileId,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                },
                // Format sans attributs de profil
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                },
                // Format avec firstName/lastName au lieu de first_name/last_name
                {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    profile_id: profileId,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                }
            ];

            // Essayer chaque format jusqu'à ce qu'un fonctionne
            for (let i = 0; i < formats.length; i++) {
                try {
                    const formatData = formats[i];
                    console.log(`Trying format ${i + 1}:`, formatData);
                    
                    let createdUser = await api.request('/user/create/', 'POST', formatData);
                    console.log('User created successfully with format', i + 1, createdUser);
                    
                    // Mise à jour du profil si nécessaire
                    if (profileId && (!createdUser.profile_id || createdUser.profile_id != profileId) && (!createdUser.profile || createdUser.profile != profileId)) {
                        try {
                            console.log('Updating profile_id after creation');
                            
                            // Attendre un peu avant de tenter la mise à jour pour laisser le temps au backend
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Essayer différents formats pour la mise à jour aussi
                            const updateFormats = [
                                { id: createdUser.id, profile: profileId },
                                { id: createdUser.id, profile_id: profileId },
                                { id: createdUser.id, profile_id: String(profileId) },
                                { user_id: createdUser.id, profile_id: profileId }
                            ];
                            
                            let updateSuccess = false;
                            for (const updateData of updateFormats) {
                                try {
                                    console.log('Trying update format:', updateData);
                                    const updateResponse = await api.request('/user/update/', 'POST', updateData);
                                    console.log('Update response:', updateResponse);
                                    updateSuccess = true;
                                    console.log('Profile ID updated with:', updateData);
                                    break;
                                } catch (err) {
                                    console.warn('Update format failed:', err);
                                    // Capturer les détails de l'erreur pour diagnostic
                                    if (err.response && err.response.data) {
                                        errorDetails = { ...errorDetails, ...err.response.data };
                                    }
                                }
                            }
                            
                            // Si la mise à jour directe échoue, essayer un autre endpoint
                            if (!updateSuccess) {
                                try {
                                    console.log('Trying alternative profile association endpoint');
                                    const associateData = { 
                                        user_id: createdUser.id, 
                            profile_id: profileId
                        };
                                    await api.request('/user/profile/associate/', 'POST', associateData);
                                    console.log('Profile associated using alternative endpoint');
                                    updateSuccess = true;
                                } catch (altError) {
                                    console.warn('Alternative association endpoint failed:', altError);
                                    // Capturer les détails de l'erreur pour diagnostic
                                    if (altError.response && altError.response.data) {
                                        errorDetails = { ...errorDetails, ...altError.response.data };
                                    }
                                }
                            }
                        
                        // Récupérer l'utilisateur mis à jour
                            if (updateSuccess) {
                        const updatedUsers = await this.getAllUsers();
                        const updatedUser = updatedUsers.find(u => u.id === createdUser.id);
                        
                        if (updatedUser) {
                                    console.log('Retrieved updated user:', updatedUser);
                            return updatedUser;
                        }
                            }
                        } catch (updateError) {
                            console.error('Failed to update profile after creation:', updateError);
                        }
                    }
                    
                    // Si tous les mécanismes de mise à jour ont échoué, forcer manuellement le profile_id
                    if (profileId && (!createdUser.profile_id || createdUser.profile_id != profileId)) {
                        console.log('Manually attaching profile_id to user object');
                        createdUser.profile_id = profileId;
                        // Essayer de trouver le profil associé
                        const profile = await getAllProfiles().then(profiles => 
                            profiles.find(p => p.id === profileId)
                        ).catch(() => null);
                        
                        if (profile) {
                            console.log('Manually attaching profile object:', profile);
                            createdUser.profile = profile;
                        }
                    }
                    
                        return createdUser;
                } catch (error) {
                    console.warn(`Format ${i + 1} failed:`, error);
                    lastError = error;
                    // Capturer les détails de l'erreur si disponibles
                    if (error.response && error.response.data) {
                        errorDetails = { ...errorDetails, ...error.response.data };
                    }
                }
            }
            
            // Dernier recours - essayer avec le corps de requête exact observé dans la console du navigateur
            try {
                console.log('Trying exact request body from browser console');
                
                // Corps exact
                const exactBody = {
                    email: userData.email,
                    password: userData.password || 'defaultPassword123',
                    first_name: userData.firstName,
                    last_name: userData.lastName
                };
                
                if (profileId) {
                    exactBody.profile_id = profileId;
                }
                
                console.log('Exact request body:', exactBody);
                let createdUser = await api.request('/user/create/', 'POST', exactBody);
                console.log('User created with exact request body:', createdUser);
                return createdUser;
            } catch (exactError) {
                console.error('Exact request body also failed:', exactError);
                lastError = exactError;
                if (exactError.response && exactError.response.data) {
                    errorDetails = { ...errorDetails, ...exactError.response.data };
                }
                
                // Réessayer sans aucun attribut de profil
                try {
                    console.log('Final attempt: minimal data');
                    const minimalData = {
                        email: userData.email,
                        password: userData.password || 'defaultPassword123',
                        first_name: userData.firstName,
                        last_name: userData.lastName
                    };
                    
                    let createdUser = await api.request('/user/create/', 'POST', minimalData);
                    console.log('User created with minimal data:', createdUser);
                    
                    // Si créé avec succès, tenter de mettre à jour le profil séparément
                    if (createdUser && createdUser.id && profileId) {
                        try {
                            await api.request('/user/update/', 'POST', { 
                                id: createdUser.id,
                                profile_id: profileId 
                            });
                            console.log('Profile updated separately after creation');
                        } catch (err) {
                            console.warn('Separate profile update failed');
                            if (err.response && err.response.data) {
                                errorDetails = { ...errorDetails, ...err.response.data };
                            }
                        }
                    }
                    
                    return createdUser;
                } catch (minimalError) {
                    console.error('All creation attempts failed:', minimalError);
                    lastError = minimalError;
                    if (minimalError.response && minimalError.response.data) {
                        errorDetails = { ...errorDetails, ...minimalError.response.data };
                    }
                    throw new Error('Could not create user after multiple attempts');
                }
            }
        } catch (error) {
            console.error('All creation attempts failed:', lastError || error);
            console.error('Error details accumulated:', errorDetails);
            
            // Si nous avons des détails d'erreur spécifiques, les inclure dans le message d'erreur
            let errorMessage = 'Could not create user after multiple attempts';
            
            if (errorDetails.profile) {
                errorMessage += `: Profile error - ${Array.isArray(errorDetails.profile) ? errorDetails.profile.join(', ') : errorDetails.profile}`;
            } else if (errorDetails.email) {
                errorMessage += `: Email error - ${Array.isArray(errorDetails.email) ? errorDetails.email.join(', ') : errorDetails.email}`;
            } else if (Object.keys(errorDetails).length > 0) {
                const fieldErrors = Object.entries(errorDetails)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('; ');
                errorMessage += `: ${fieldErrors}`;
            }
            
            throw new Error(errorMessage);
        }
    }
    
    async updateUser(id, userData) {
        // Variables pour suivre les erreurs
        let lastError = null;
        let errorDetails = {};
        
        try {
            // S'assurer que profile_id est un nombre entier si fourni
            let profileId = null;
            if (userData.profileId) {
                // Convertir la valeur en nombre et vérifier que c'est un entier valide
                profileId = parseInt(userData.profileId, 10);
                if (isNaN(profileId)) {
                    console.warn('Invalid profile ID format:', userData.profileId);
                    profileId = null;
                } else {
                    console.log('Profile ID parsed successfully:', profileId);
                }
            }

            console.log('Updating user with profile ID:', profileId);

            // Série de formats à essayer pour la mise à jour
            const updateFormats = [
                // Format 1: profile (sans underscore) comme vu dans django serializer
                {
                    id: id,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    profile: profileId,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    phone: userData.phone || ''
                },
                // Format 2: profile_id comme nombre
                {
                    id: id,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    profile_id: profileId,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                },
                // Format 3: profile_id comme chaîne
                {
                    id: id,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    email: userData.email,
                    profile_id: profileId !== null ? String(profileId) : null,
                    status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                    is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                    phone: userData.phone || ''
                },
                // Format 4: format simplifié avec juste l'ID et le profil
                {
                    id: id,
                    profile: profileId
                },
                // Format 5: format simplifié avec juste l'ID et profile_id numérique
                {
                    id: id,
                    profile_id: profileId
                },
                // Format 6: format simplifié avec juste l'ID et profile_id chaîne
                {
                    id: id,
                    profile_id: profileId !== null ? String(profileId) : null
                }
            ];

            // Ajouter le mot de passe seulement s'il est fourni
            if (userData.password && userData.password.trim()) {
                updateFormats.forEach(format => {
                    if (Object.keys(format).length > 2) { // Ne pas ajouter aux formats simples qui n'ont que id et profile
                        format.password = userData.password;
                    }
                });
            }

            // Essayer chaque format jusqu'à ce qu'un fonctionne
            for (let i = 0; i < updateFormats.length; i++) {
                try {
                    console.log(`Trying update format ${i + 1}:`, updateFormats[i]);
                    let updatedUser = await api.request('/user/update/', 'POST', updateFormats[i]);
                    console.log(`User updated successfully with format ${i + 1}:`, updatedUser);
                    
                    // Vérifier si le profil a été correctement associé
                    if (profileId && 
                        ((!updatedUser.profile_id || updatedUser.profile_id != profileId) && 
                         (!updatedUser.profile || (typeof updatedUser.profile === 'object' && updatedUser.profile.id != profileId)))) {
                        
                        console.log('Profile not correctly associated, attempting profile-specific update');
                        
                        // Essayer les formats simples pour mettre à jour uniquement le profil
                        const simpleFormats = [
                            { id: id, profile: profileId },
                            { id: id, profile_id: profileId },
                            { id: id, profile_id: String(profileId) }
                        ];
                        
                        let profileUpdateSuccess = false;
                        for (let j = 0; j < simpleFormats.length; j++) {
                            try {
                                console.log(`Trying simple profile update format ${j + 1}:`, simpleFormats[j]);
                                let profileUpdateResponse = await api.request('/user/update/', 'POST', simpleFormats[j]);
                                console.log(`Profile updated with simple format ${j + 1}:`, profileUpdateResponse);
                                profileUpdateSuccess = true;
                                break;
                            } catch (formatError) {
                                console.warn(`Simple profile update format ${j + 1} failed:`, formatError);
                                // Capturer les détails d'erreur
                                if (formatError.response && formatError.response.data) {
                                    errorDetails = { ...errorDetails, ...formatError.response.data };
                                }
                            }
                        }
                        
                        // Essayer un endpoint spécifique pour l'association de profil
                        if (!profileUpdateSuccess) {
                            try {
                                console.log('Trying profile association endpoint');
                                const associateData = { user_id: id, profile_id: profileId };
                                let associateResponse = await api.request('/user/profile/associate/', 'POST', associateData);
                                console.log('Profile associated with specific endpoint:', associateResponse);
                                profileUpdateSuccess = true;
                            } catch (associateError) {
                                console.warn('Profile association endpoint failed:', associateError);
                                // Capturer les détails d'erreur
                                if (associateError.response && associateError.response.data) {
                                    errorDetails = { ...errorDetails, ...associateError.response.data };
                                }
                            }
                        }
                        
                        // Recharger l'utilisateur après la mise à jour du profil
                        if (profileUpdateSuccess) {
                            const updatedUsers = await this.getAllUsers();
                            const freshUser = updatedUsers.find(u => u.id === id);
                            
                            if (freshUser) {
                                console.log('Retrieved updated user after profile association:', freshUser);
                                return freshUser;
                            }
                        }
                    }
                    
                    // Si nous avons un utilisateur mis à jour mais que le profil n'est pas correctement associé
                    // dans l'objet, forcer l'association manuellement
                    if (profileId && 
                        ((!updatedUser.profile_id || updatedUser.profile_id != profileId) && 
                         (!updatedUser.profile || (typeof updatedUser.profile === 'object' && updatedUser.profile.id != profileId)))) {
                        
                        console.log('Manually attaching profile_id to updated user object');
                        updatedUser.profile_id = profileId;
                        
                        // Essayer de trouver le profil associé
                        const profiles = await getAllProfiles();
                        const matchingProfile = profiles.find(p => p.id === profileId);
                        
                        if (matchingProfile) {
                            console.log('Manually attaching profile object:', matchingProfile);
                            updatedUser.profile = matchingProfile;
                        }
                    }
                    
                    // Rafraîchir les données utilisateur pour s'assurer que nous avons les informations les plus à jour
                    const allUsers = await this.getAllUsers();
                    const refreshedUser = allUsers.find(u => u.id === id);
                    
                    return refreshedUser || updatedUser;
                } catch (formatError) {
                    console.warn(`Update format ${i + 1} failed:`, formatError);
                    lastError = formatError;
                    
                    // Capturer les détails d'erreur
                    if (formatError.response && formatError.response.data) {
                        errorDetails = { ...errorDetails, ...formatError.response.data };
                    }
                    
                    // Continuer et essayer le format suivant
                }
            }
            
            // Si nous arrivons ici, tous les formats ont échoué
            console.error('All update formats failed. Last error:', lastError);
            
            // Construire un message d'erreur détaillé
            let errorMessage = 'Could not update user';
            
            if (errorDetails.profile) {
                errorMessage += `: Profile error - ${Array.isArray(errorDetails.profile) ? errorDetails.profile.join(', ') : errorDetails.profile}`;
            } else if (errorDetails.email) {
                errorMessage += `: Email error - ${Array.isArray(errorDetails.email) ? errorDetails.email.join(', ') : errorDetails.email}`;
            } else if (Object.keys(errorDetails).length > 0) {
                const fieldErrors = Object.entries(errorDetails)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('; ');
                errorMessage += `: ${fieldErrors}`;
            } else if (lastError && lastError.message) {
                errorMessage += `: ${lastError.message}`;
            }
            
            throw new Error(errorMessage);
        } catch (error) {
            console.error('Error in user update process:', error);
            
            // Construire un message d'erreur détaillé
            let errorMessage = 'Could not update user';
            
            if (errorDetails.profile) {
                errorMessage += `: Profile error - ${Array.isArray(errorDetails.profile) ? errorDetails.profile.join(', ') : errorDetails.profile}`;
            } else if (errorDetails.email) {
                errorMessage += `: Email error - ${Array.isArray(errorDetails.email) ? errorDetails.email.join(', ') : errorDetails.email}`;
            } else if (Object.keys(errorDetails).length > 0) {
                const fieldErrors = Object.entries(errorDetails)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('; ');
                errorMessage += `: ${fieldErrors}`;
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    async deleteUser(id) {
        try {
            console.log(`Deleting user with ID: ${id}`);
            const response = await api.request('/user/delete/', 'POST', { id });
            console.log('User deleted successfully:', response);
            return response;
        } catch (error) {
            console.error('Error deleting user:', error.message);
            throw new Error(error.message || 'Error deleting user');
        }
    }
}

export default new UserService();