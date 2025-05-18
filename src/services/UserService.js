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
            
            // Format adapté au backend - d'après les erreurs de validation du backend
            const userDataFormatted = {
                email: userData.email,
                password: userData.password || 'defaultPassword123',
                first_name: userData.firstName || '',
                last_name: userData.lastName || '',
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                phone: userData.phone || null, // Envoyer null au lieu de chaîne vide pour éviter l'erreur de validation
                profile: profileId // Utiliser le champ "profile" au lieu de "profile_id"
            };
            
            console.log('Sending create user request with format:', userDataFormatted);
            
            try {
                // Faire la requête API
                const response = await api.request('/user/create/', 'POST', userDataFormatted);
                console.log('User created successfully:', response);
                return response;
            } catch (error) {
                console.error('Create user request failed:', error);
                
                // Récupérer les détails d'erreur pour le diagnostic
                if (error.response && error.response.data) {
                    console.error('API error details:', error.response.data);
                    errorDetails = { ...errorDetails, ...error.response.data };
                    
                    // Essayer différents formats selon les erreurs
                    if (errorDetails.profile) {
                        // Format alternatif avec profile_id au lieu de profile
                        const alternativeFormat = {
                            email: userData.email,
                            password: userData.password || 'defaultPassword123',
                            first_name: userData.firstName || '',
                            last_name: userData.lastName || '',
                            status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                            phone: null, // Envoyer null pour éviter l'erreur de validation du téléphone
                            profile_id: profileId
                        };
                        
                        console.log('Trying alternative format with profile_id:', alternativeFormat);
                        
                        try {
                            const response = await api.request('/user/create/', 'POST', alternativeFormat);
                            console.log('User created with alternative format:', response);
                            return response;
                        } catch (altError) {
                            console.error('Alternative format also failed:', altError);
                            if (altError.response && altError.response.data) {
                                console.error('Alternative format error details:', altError.response.data);
                                errorDetails = { ...errorDetails, ...altError.response.data };
                            }
                        }
                    }
                    
                    // Si l'erreur vient du téléphone, essayons sans téléphone
                    if (errorDetails.phone) {
                        const noPhoneFormat = {
                            email: userData.email,
                            password: userData.password || 'defaultPassword123',
                            first_name: userData.firstName || '',
                            last_name: userData.lastName || '',
                            status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                            profile: profileId
                        };
                        
                        console.log('Trying format without phone field:', noPhoneFormat);
                        
                        try {
                            const response = await api.request('/user/create/', 'POST', noPhoneFormat);
                            console.log('User created without phone field:', response);
                            return response;
                        } catch (noPhoneError) {
                            console.error('Format without phone also failed:', noPhoneError);
                            if (noPhoneError.response && noPhoneError.response.data) {
                                console.error('No phone format error details:', noPhoneError.response.data);
                                errorDetails = { ...errorDetails, ...noPhoneError.response.data };
                            }
                        }
                    }
                    
                    // Essayer le format le plus minimaliste possible
                    const minimumUserData = {
                        email: userData.email,
                        password: userData.password || 'defaultPassword123',
                        first_name: userData.firstName || '',
                        last_name: userData.lastName || ''
                    };
                    
                    console.log('Trying minimal format as last resort:', minimumUserData);
                    
                    try {
                        const response = await api.request('/user/create/', 'POST', minimumUserData);
                        console.log('User created with minimal format:', response);
                        
                        // Si nous avons réussi à créer l'utilisateur, essayer de mettre à jour son profil séparément
                        if (response && response.id && profileId) {
                            try {
                                console.log('Updating profile separately after minimal creation');
                                await api.request('/user/update/', 'POST', {
                                    id: response.id,
                                    profile: profileId
                                });
                                console.log('Profile updated separately after minimal creation');
                            } catch (updateError) {
                                console.warn('Failed to update profile separately:', updateError);
                            }
                        }
                        
                        return response;
                    } catch (minimalError) {
                        console.error('Even minimal format failed:', minimalError);
                        if (minimalError.response && minimalError.response.data) {
                            console.error('Minimal format error details:', minimalError.response.data);
                            errorDetails = { ...errorDetails, ...minimalError.response.data };
                        }
                    }
                }
                
                throw error;
            }
        } catch (error) {
            console.error('All creation attempts failed:', error);
            
            if (error.response && error.response.data) {
                console.error('Error response data:', error.response.data);
                errorDetails = { ...errorDetails, ...error.response.data };
            }
            
            console.error('Error details accumulated:', errorDetails);
            
            // Construire un message d'erreur informatif
            let errorMessage = 'Could not create user after multiple attempts';
            
            if (errorDetails.profile) {
                errorMessage += `: Profile error - ${Array.isArray(errorDetails.profile) ? errorDetails.profile.join(', ') : errorDetails.profile}`;
            } else if (errorDetails.phone) {
                errorMessage += `: Phone error - ${Array.isArray(errorDetails.phone) ? errorDetails.phone.join(', ') : errorDetails.phone}`;
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