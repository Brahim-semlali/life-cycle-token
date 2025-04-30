import React, { useState, useEffect } from "react";
import './LoginForm.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import logo from '../Assets/logo2.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.body.classList.add('login-body');
        return () => {
            document.body.classList.remove('login-body');
        };
    }, []);

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
        // Effacer le message d'erreur quand l'utilisateur commence à taper
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.login(credentials.email, credentials.password);
            
            if (response.jwt) {
                localStorage.setItem('token', response.jwt);
                await login(response.jwt);
                navigate('/dashboard');
            } else {
                setError('Invalid response from server');
                console.error('Invalid response structure:', response);
            }
        } catch (err) {
            console.error('Login error details:', err);
            if (err.response) {
                // Erreur avec réponse du serveur
                setError(err.response.data?.detail || 'Invalid credentials');
            } else if (err.request) {
                // Erreur sans réponse du serveur
                setError('Unable to reach the server. Please check your connection.');
            } else {
                // Erreur de configuration de la requête
                setError('An error occurred while processing your request.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="wrapper">
            <form onSubmit={handleSubmit}>
                <div className="company-logo">
                    <img src={logo} alt="TITRIT TECHNOLOGIES" />
                </div>
                <h1>Login</h1>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="input-box">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        value={credentials.email}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    <FaUser className="icon" />
                </div>

                <div className="input-box">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        required
                        value={credentials.password}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                    <FaLock className="icon" />
                    <div className="password-toggle" onClick={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </div>
                </div>

                <div className="remember-forgot">
                    <label>
                        <input type="checkbox" /> Remember me
                    </label>
                    <a href="#">Forgot password?</a>
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
