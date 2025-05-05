import api from './api';
import { getAllProfiles } from './ProfileService';

class UserService {
    async getAllUsers() {
        try {
            const response = await api.request('/user/getall/', 'POST');
            console.log('Users fetched successfully:', response);
            
            // Récupérer tous les profils
            const profiles = await getAllProfiles();
            console.log('Available profiles for association:', profiles);
            
            // Associer les profils aux utilisateurs
            if (Array.isArray(response) && profiles.length > 0) {
                return response.map(user => {
                    // Extraire le profile_id de toutes les sources possibles
                    let profileId = null;
                    
                    // Vérifier les différentes façons dont le profile_id peut être présent
                    if (user.profile_id !== undefined && user.profile_id !== null) {
                        profileId = typeof user.profile_id === 'string' 
                            ? parseInt(user.profile_id, 10) 
                            : user.profile_id;
                    } else if (user.profile !== undefined && user.profile !== null) {
                        if (typeof user.profile === 'number') {
                            profileId = user.profile;
                        } else if (typeof user.profile === 'string' && user.profile) {
                            profileId = parseInt(user.profile, 10);
                        } else if (typeof user.profile === 'object' && user.profile !== null) {
                            if (user.profile.id) {
                                profileId = user.profile.id;
                            } else if (user.profile.profile_id) {
                                profileId = user.profile.profile_id;
                            }
                        }
                    }
                    
                    // Si profileId n'est pas un nombre valide, le réinitialiser
                    if (profileId !== null && isNaN(profileId)) {
                        console.warn(`Invalid profile ID format for user ${user.id || user.email}:`, user.profile_id || user.profile);
                        profileId = null;
                    }
                    
                    console.log(`User ${user.id || user.email} processed profile_id:`, profileId);
                    
                    // Trouver le profil correspondant à l'utilisateur
                    const userProfile = profileId !== null
                        ? profiles.find(p => p.id === profileId)
                        : null;
                    
                    if (profileId && !userProfile) {
                        console.warn(`Profile with ID ${profileId} not found for user ${user.id || user.email}`);
                    } else if (userProfile) {
                        console.log(`User ${user.id || user.email} associated with profile:`, userProfile.name);
                    }
                    
                    // Normaliser les champs d'utilisateur
                    return {
                        ...user,
                        // Normaliser les noms de champs pour être cohérent avec le frontend
                        firstName: user.firstName || user.first_name || '',
                        lastName: user.lastName || user.last_name || '',
                        // Associer le profil à l'utilisateur
                        profile: userProfile,
                        profileId: profileId,
                        // S'assurer que profile_id est conservé même si le profil n'est pas trouvé
                        profile_id: profileId
                    };
                });
            }
            
            return response;
        } catch (error) {
            console.error('Error fetching users:', error.message);
            throw error;
        }
    }

    async createUser(userData) {
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

            console.log('Creating user with profile ID:', profileId);

            // Format 1: Envoi avec profile_id en tant que nombre
            const dataWithNumericId = {
                email: userData.email,
                password: userData.password || 'defaultPassword123',
                first_name: userData.firstName,
                last_name: userData.lastName,
                profile_id: profileId,
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                phone: userData.phone || ''
            };

            // Format 2: Envoi avec profile_id en tant que chaîne (si profileId existe)
            const dataWithStringId = profileId !== null ? {
                ...dataWithNumericId,
                profile_id: String(profileId)
            } : dataWithNumericId;

            // Essayons d'abord avec le format numérique
            console.log('Trying with numeric profile_id:', dataWithNumericId);
            
            try {
                let createdUser = await api.request('/user/create/', 'POST', dataWithNumericId);
                console.log('User created successfully with numeric profile_id:', createdUser);
                
                // Si le profil n'est pas correctement associé, faire une mise à jour immédiate
                if (profileId && (!createdUser.profile_id || createdUser.profile_id != profileId)) {
                    console.log('Profile ID not set correctly, attempting update');
                    
                    try {
                        // Mise à jour spécifique pour le profile_id uniquement
                        const updateData = {
                            id: createdUser.id,
                            profile_id: profileId
                        };
                        
                        await api.request('/user/update/', 'POST', updateData);
                        console.log('Profile ID updated successfully after creation');
                        
                        // Récupérer l'utilisateur mis à jour
                        const updatedUsers = await this.getAllUsers();
                        const updatedUser = updatedUsers.find(u => u.id === createdUser.id);
                        
                        if (updatedUser) {
                            console.log('Retrieved updated user with profile_id:', updatedUser);
                            return updatedUser;
                        }
                        
                        // Si nous ne pouvons pas récupérer l'utilisateur mis à jour, retourner l'original avec le profile_id forcé
                        return {
                            ...createdUser,
                            profile_id: profileId
                        };
                    } catch (updateError) {
                        console.error('Failed to update profile_id after creation:', updateError);
                        // Continuons avec l'utilisateur tel qu'il a été créé
                        return createdUser;
                    }
                }
                
                return createdUser;
            } catch (numericError) {
                // Si échec avec ID numérique, essayer avec ID chaîne
                console.warn('Failed to create user with numeric profile_id:', numericError);
                console.log('Trying with string profile_id:', dataWithStringId);
                
                try {
                    let createdUser = await api.request('/user/create/', 'POST', dataWithStringId);
                    console.log('User created successfully with string profile_id:', createdUser);
                    
                    // Si le profil n'est pas correctement associé, faire une mise à jour immédiate
                    if (profileId && (!createdUser.profile_id || createdUser.profile_id != profileId)) {
                        console.log('Profile ID not set correctly, attempting update');
                        
                        try {
                            // Mise à jour spécifique pour le profile_id uniquement
                            const updateData = {
                                id: createdUser.id,
                                profile_id: String(profileId)
                            };
                            
                            await api.request('/user/update/', 'POST', updateData);
                            console.log('Profile ID updated successfully after creation');
                            
                            // Récupérer l'utilisateur mis à jour
                            const updatedUsers = await this.getAllUsers();
                            const updatedUser = updatedUsers.find(u => u.id === createdUser.id);
                            
                            if (updatedUser) {
                                console.log('Retrieved updated user with profile_id:', updatedUser);
                                return updatedUser;
                            }
                            
                            // Si nous ne pouvons pas récupérer l'utilisateur mis à jour, retourner l'original avec le profile_id forcé
                            return {
                                ...createdUser,
                                profile_id: profileId
                            };
                        } catch (updateError) {
                            console.error('Failed to update profile_id after creation:', updateError);
                            // Continuons avec l'utilisateur tel qu'il a été créé
                            return createdUser;
                        }
                    }
                    
                    return createdUser;
                } catch (stringError) {
                    console.error('Failed to create user with both numeric and string profile_id:', stringError);
                    throw new Error('Could not create user');
                }
            }
        } catch (error) {
            console.error('Error in user creation process:', error);
            throw error;
        }
    }
    
    async updateUser(id, userData) {
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

            // Format 1: Envoi avec profile_id en tant que nombre
            const dataWithNumericId = {
                id: id,
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                profile_id: profileId,
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                phone: userData.phone || ''
            };

            if (userData.password && userData.password.trim()) {
                dataWithNumericId.password = userData.password;
            }

            // Format 2: Envoi avec profile_id en tant que chaîne (si profileId existe)
            const dataWithStringId = profileId !== null ? {
                ...dataWithNumericId,
                profile_id: String(profileId)
            } : dataWithNumericId;

            console.log('Trying with numeric profile_id:', dataWithNumericId);
            
            try {
                let updatedUser = await api.request('/user/update/', 'POST', dataWithNumericId);
                console.log('User updated successfully with numeric profile_id:', updatedUser);
                
                // Si le profil n'est pas correctement associé, faire une mise à jour immédiate
                if (profileId && (!updatedUser.profile_id || updatedUser.profile_id != profileId)) {
                    console.log('Profile ID not set correctly, attempting additional update');
                    
                    try {
                        // Mise à jour spécifique pour le profile_id uniquement
                        const updateData = {
                            id: id,
                            profile_id: profileId
                        };
                        
                        await api.request('/user/update/', 'POST', updateData);
                        console.log('Profile ID updated with specific update');
                        
                        // Récupérer l'utilisateur mis à jour
                        const updatedUsers = await this.getAllUsers();
                        const freshUpdatedUser = updatedUsers.find(u => u.id === id);
                        
                        if (freshUpdatedUser) {
                            console.log('Retrieved updated user with profile_id:', freshUpdatedUser);
                            return freshUpdatedUser;
                        }
                        
                        // Si nous ne pouvons pas récupérer l'utilisateur mis à jour, retourner l'original avec le profile_id forcé
                        return {
                            ...updatedUser,
                            profile_id: profileId
                        };
                    } catch (updateError) {
                        console.error('Failed to update profile_id with specific update:', updateError);
                        // Continuons avec l'utilisateur tel qu'il a été mis à jour
                        return updatedUser;
                    }
                }
                
                return updatedUser;
            } catch (numericError) {
                // Si échec avec ID numérique, essayer avec ID chaîne
                console.warn('Failed with numeric profile_id:', numericError);
                console.log('Trying with string profile_id:', dataWithStringId);
                
                try {
                    let updatedUser = await api.request('/user/update/', 'POST', dataWithStringId);
                    console.log('User updated successfully with string profile_id:', updatedUser);
                    
                    // Si le profil n'est pas correctement associé, faire une mise à jour immédiate
                    if (profileId && (!updatedUser.profile_id || updatedUser.profile_id != profileId)) {
                        console.log('Profile ID not set correctly, attempting additional update');
                        
                        try {
                            // Mise à jour spécifique pour le profile_id uniquement
                            const updateData = {
                                id: id,
                                profile_id: String(profileId)
                            };
                            
                            await api.request('/user/update/', 'POST', updateData);
                            console.log('Profile ID updated with specific string update');
                            
                            // Récupérer l'utilisateur mis à jour
                            const updatedUsers = await this.getAllUsers();
                            const freshUpdatedUser = updatedUsers.find(u => u.id === id);
                            
                            if (freshUpdatedUser) {
                                console.log('Retrieved updated user with profile_id:', freshUpdatedUser);
                                return freshUpdatedUser;
                            }
                            
                            // Si nous ne pouvons pas récupérer l'utilisateur mis à jour, retourner l'original avec le profile_id forcé
                            return {
                                ...updatedUser,
                                profile_id: profileId
                            };
                        } catch (updateError) {
                            console.error('Failed to update profile_id with specific string update:', updateError);
                            // Continuons avec l'utilisateur tel qu'il a été mis à jour
                            return updatedUser;
                        }
                    }
                    
                    return updatedUser;
                } catch (stringError) {
                    console.error('Failed to update user with both numeric and string profile_id:', stringError);
                    throw new Error('Could not update user');
                }
            }
        } catch (error) {
            console.error('Error in user update process:', error);
            throw error;
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