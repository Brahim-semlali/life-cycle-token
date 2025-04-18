import React, { useState } from "react";
import './LoginForm.css';
import { FaUser, FaLock } from "react-icons/fa";
import logo from '../Assets/logo2.png';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LoginForm = () => {


    useEffect(() => {
        // Ajouter une classe spécifique au body
        document.body.classList.add('login-body');

        // Nettoyage : retirer la classe quand on quitte LoginForm
        return () => {
            document.body.classList.remove('login-body');
        };
    }, []);


    const navigate = useNavigate();

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 🔒 Vérification locale (sans API)
        const userTest = {
            email: "admin@gmail.com",
            password: "admin123"
        };

        if (
            credentials.username === userTest.username &&
            credentials.password === userTest.password
        ) {
            // Simulation de token
            localStorage.setItem("token", "fake-jwt-token");
            navigate("/dashboard");
        } else {
            alert("Identifiants incorrects !");
        }
    };

    return (
        <div className="wrapper">
            <form onSubmit={handleSubmit}>
                <div className="company-logo">
                    <img src={logo} alt="TITRIT TECHNOLOGIES" />
                </div>
                <h1>Login</h1>

                <div className="input-box">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
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
                        onChange={handleChange}/>
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
