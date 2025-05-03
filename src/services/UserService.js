import api from './api';

class UserService {
    async getAllUsers() {
        try {
            const response = await api.request('/user/getall/', 'POST');
            console.log('Users fetched successfully:', response);
            return response;
        } catch (error) {
            console.error('Error fetching users:', error.message);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const formattedData = {
                email: userData.email,
                password: userData.password,
                first_name: userData.firstName,
                last_name: userData.lastName,
                profile_id: userData.profileId ? parseInt(userData.profileId) : null,
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                is_staff: true,
                is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                phone: userData.phone || ''
            };

            console.log('Creating user with data:', formattedData);
            
            // Try different variations of the endpoint path
            const endpoints = [
                '/user/create/',     // Standard pattern that works for profiles
                '/users/create/',    // Alternate plural path
                '/user/add/',        // Alternative verb
                '/users/add/'        // Alternative verb with plural
            ];
            
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to create user with endpoint: ${endpoint}`);
                    const response = await api.request(endpoint, 'POST', formattedData);
                    console.log(`User created successfully with endpoint: ${endpoint}`, response);
                    return response;
                } catch (endpointError) {
                    console.warn(`Failed to create user with endpoint ${endpoint}:`, endpointError);
                    lastError = endpointError;
                }
            }
            
            // If all endpoints failed, throw the last error
            throw lastError || new Error('All user creation endpoints failed');
        } catch (error) {
            console.error('Error creating user:', error.message);
            throw new Error(error.message || 'Error creating user');
        }
    }

    async updateUser(id, userData) {
        try {
            const formattedData = {
                id: id,
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                profile_id: userData.profileId ? parseInt(userData.profileId) : null,
                status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
                is_active: userData.status ? userData.status.toLowerCase() === 'active' : true,
                phone: userData.phone || ''
            };

            if (userData.password && userData.password.trim()) {
                formattedData.password = userData.password;
            }

            console.log('Updating user with data:', formattedData);
            const response = await api.request('/user/update/', 'POST', formattedData);
            console.log('User updated successfully:', response);
            return response;
        } catch (error) {
            console.error('Error updating user:', error.message);
            throw new Error(error.message || 'Error updating user');
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