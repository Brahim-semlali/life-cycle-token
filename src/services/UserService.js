import api from './api';
import AuthService from './AuthService';

class UserService {
    async getAllUsers() {
    try {
        const token = AuthService.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await api.request('/user/getall/', 'POST', null, token);
        console.log('Users fetched successfully:', response);
        return response;
    } catch (error) {
        console.error('Error fetching users:', error.message);
        throw error;
    }
}

    async createUser (userData) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formattedData = {
                email: userData.email,
                password: userData.password,
                first_name: userData.firstName,
                last_name: userData.lastName,
                profile_id: parseInt(userData.profileId),
                status: 'ACTIVE',
                is_staff: true,
                is_active: true
            };

            console.log('Creating user with data:', formattedData);

            const response = await api.request('/user/create/', 'POST', formattedData, token);
            console.log('User  created successfully:', response);
            return response;
        } catch (error) {
            console.error('Error creating user:', error.message);
            throw new Error(error.message || 'Error creating user');
        }
    }

    async updateUser (id, userData) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formattedData = {
                id: id,  // Ajoutez l'ID de l'utilisateur à mettre à jour
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                profile_id: parseInt(userData.profileId),
                status: 'ACTIVE'
            };

            // Ajouter le mot de passe seulement s'il est fourni
            if (userData.password && userData.password.trim()) {
                formattedData.password = userData.password;
            }

            console.log('Updating user with data:', formattedData);

            const response = await api.request('/user/update/', 'POST', formattedData, token);
            console.log('User  updated successfully:', response);
            return response;
        } catch (error) {
            console.error('Error updating user:', error.message);
            throw new Error(error.message || 'Error updating user');
        }
    }

    async deleteUser (id) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log(`Deleting user with ID: ${id}`);

            const response = await api.request('/user/delete/', 'POST', { id }, token);
            console.log('User  deleted successfully:', response);
            return response;
        } catch (error) {
            console.error('Error deleting user:', error.message);
            throw new Error(error.message || 'Error deleting user');
        }
    }
}

export default new UserService();