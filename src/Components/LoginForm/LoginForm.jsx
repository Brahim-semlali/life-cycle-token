import React, { useState, useEffect } from "react";
import './LoginForm.css';
import { FaUser, FaLock } from "react-icons/fa";
import logo from '../Assets/logo2.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const success = await login(credentials.email, credentials.password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred during login');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="wrapper">
            <form onSubmit={handleSubmit}>
                <div className="company-logo">
                    <img src={logo} alt="TITRIT TECHNOLOGIES" />
                </div>
                <h1>Login</h1>

                {error && (
                    <div className="error-message" style={{
                        color: 'red',
                        marginBottom: '10px',
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        borderRadius: '4px',
                        border: '1px solid #ffcdd2'
                    }}>
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
                    />
                    <FaUser className="icon" />
                </div>

                <div className="input-box">
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                        value={credentials.password}
                        onChange={handleChange}
                    />
                    <FaLock className="icon" />
                </div>

                <div className="remember-forgot">
                    <label>
                        <input type="checkbox" /> Remember me
                    </label>
                    <a href="#">Forgot password?</a>
                </div>

                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginForm;
