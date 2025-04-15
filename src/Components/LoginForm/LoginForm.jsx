import React, { useState } from "react";
import './LoginForm.css';
import { FaUser, FaLock } from "react-icons/fa";
import logo from '../Assets/logo2.png';

const LoginForm = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // bloque l'envoi classique

        try {
            const response = await fetch("https://localhost:3000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            console.log("Réponse login :", data);

            // tu peux ensuite stocker le token, rediriger, etc.

        } catch (error) {
            console.error("Erreur de login :", error);
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
                    <input type="text" name="username" placeholder="Username" required onChange={handleChange} />
                    <FaUser className="icon" />
                </div>

                <div className="input-box">
                    <input type="password" name="password" placeholder="Password" required onChange={handleChange} />
                    <FaLock className="icon" />
                </div>

                <div className="remember-forgot">
                    <label> <input type="checkbox" />Remember me</label>
                    <a href="#">Forgot password?</a>
                </div>

                <button type="submit">Login</button>


            </form>
        </div>
    );
};

export default LoginForm;
