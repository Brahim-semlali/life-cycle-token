import React, { useState, useEffect } from "react";
import './LoginForm.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import logo from '../Assets/logo2.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const LoginForm = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState({
        remainingAttempts: null,
        maxAttempts: null,
        isLocked: false,
        remainingTimeMinutes: null,
        remainingTimeSeconds: null
    });

    useEffect(() => {
        document.body.classList.add('login-body');
        
        // Rediriger vers le dashboard si déjà authentifié
        if (isAuthenticated()) {
            navigate('/dashboard');
        }
        
        return () => {
            document.body.classList.remove('login-body');
        };
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const formatWaitingMessage = (minutes, seconds) => {
        if (minutes === '0' && seconds) {
            return `Veuillez patienter ${seconds} secondes avant de réessayer votre mot de passe.`;
        } else if (minutes === '1') {
            return `Veuillez patienter 1 minute et ${seconds} secondes avant de réessayer votre mot de passe.`;
        } else {
            return `Veuillez patienter ${minutes} minutes et ${seconds} secondes avant de réessayer votre mot de passe.`;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Appeler le service d'authentification pour obtenir un token JWT
            const userData = await authService.login(credentials.email, credentials.password);
            
            // Appeler la fonction login du context qui utilisera les données stockées
            await login(userData);
            
            // Rediriger vers le dashboard
            navigate('/dashboard');
        } catch (error) {
            if (error.response?.data) {
                const responseData = error.response.data;
                setLoginAttempts({
                    isLocked: responseData.detail === "Account locked. Please try again later.",
                    remainingTimeMinutes: responseData.remaining_time_minutes,
                    remainingTimeSeconds: responseData.remaining_time_seconds,
                    maxAttempts: responseData.max_attempts,
                    remainingAttempts: responseData.remaining_attempts
                });

                if (responseData.detail === "Account locked. Please try again later.") {
                    setError(formatWaitingMessage(
                        responseData.remaining_time_minutes,
                        responseData.remaining_time_seconds
                    ));
                } else if (responseData.remaining_attempts) {
                    setError(`Il vous reste ${responseData.remaining_attempts} tentatives sur ${responseData.max_attempts} avant le blocage du compte.`);
                } else if (responseData.detail) {
                    setError(responseData.detail);
                } else {
                    setError('Identifiants incorrects. Veuillez réessayer.');
                }
            } else {
                setError('Une erreur est survenue. Veuillez réessayer plus tard.');
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
            <div className="company-logo">
                <img src={logo} alt="Company Logo" />
            </div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                    />
                    <FaUser className="icon" />
                </div>
                <div className="input-box">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                    <FaLock className="icon" />
                    {showPassword ? (
                        <FaEyeSlash className="password-toggle" onClick={togglePasswordVisibility} />
                    ) : (
                        <FaEye className="password-toggle" onClick={togglePasswordVisibility} />
                    )}
                </div>
                {error && (
                    <div className="error-box">
                        {error}
                    </div>
                )}
                <button 
                    type="submit" 
                    disabled={isLoading || loginAttempts.isLocked}
                    className={loginAttempts.isLocked ? 'locked' : ''}
                >
                    {isLoading ? 'Chargement...' : (loginAttempts.isLocked ? 'COMPTE BLOQUÉ' : 'CONNEXION')}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
