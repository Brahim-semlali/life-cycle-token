import api from './api';

class AuthService {
    async login(email, password) {
        try {
            const response = await api.request('/user/login/', 'POST', { email, password });
            if (response.jwt) {
                localStorage.setItem('token', response.jwt);
                console.log('Login successful, token stored');
            }
            return response;
        } catch (error) {
            console.error('Login error details:', error.message);
            throw new Error(error.message || 'Authentication failed');
        }
    }

    async logout() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No token found');
            }
            
            await api.request('/user/logout/', 'POST', {}, token);
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Logout error:', error.message);
            localStorage.removeItem('token');
            throw error;
        }
    }

    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUserFromToken() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
}

export default new AuthService();