import authService from './AuthService';
import userService from './UserService';

const api = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    
    async request(endpoint, method = 'GET', data = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const fetchOptions = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null,
            credentials: 'include',
            mode: 'cors',
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error details:', errorData); 
                throw new Error(errorData.detail || 'Request failed');
            }

            return response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

// Export the services
export { authService, userService };
export default api;