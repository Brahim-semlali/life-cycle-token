import React, { useState } from 'react';
import { useMenu } from "../../../context/MenuContext";
import "./Security.css";

const Security = () => {
    const { isMinimized } = useMenu();
    const [passwordRules, setPasswordRules] = useState({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiration: 90, // jours
        preventPasswordReuse: 5, // nombre de mots de passe précédents
        maxLoginAttempts: 3,
        lockoutDuration: 30, // minutes
        minPasswordAge: 1, // jours
        sessionTimeout: 30 // minutes
    });

    const [testPassword, setTestPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: []
    });

    const handleRuleChange = (name, value) => {
        setPasswordRules(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validatePassword = (password) => {
        const feedback = [];
        let score = 0;

        // Longueur minimale
        if (password.length >= passwordRules.minLength) {
            score += 20;
        } else {
            feedback.push(`Le mot de passe doit contenir au moins ${passwordRules.minLength} caractères`);
        }

        // Majuscules
        if (passwordRules.requireUppercase && /[A-Z]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireUppercase) {
            feedback.push('Le mot de passe doit contenir au moins une majuscule');
        }

        // Minuscules
        if (passwordRules.requireLowercase && /[a-z]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireLowercase) {
            feedback.push('Le mot de passe doit contenir au moins une minuscule');
        }

        // Chiffres
        if (passwordRules.requireNumbers && /\d/.test(password)) {
            score += 20;
        } else if (passwordRules.requireNumbers) {
            feedback.push('Le mot de passe doit contenir au moins un chiffre');
        }

        // Caractères spéciaux
        if (passwordRules.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireSpecialChars) {
            feedback.push('Le mot de passe doit contenir au moins un caractère spécial');
        }

        setPasswordStrength({ score, feedback });
    };

    const handleTestPasswordChange = (e) => {
        const password = e.target.value;
        setTestPassword(password);
        validatePassword(password);
    };

    return (
        <div className={`security-container ${isMinimized ? 'minimized' : ''}`}>
            <h2>Paramètres de Sécurité</h2>

            <div className="security-section">
                <h3>Règles de Mot de Passe</h3>
                <div className="rules-grid">
                    <div className="form-group">
                        <label>Longueur minimale</label>
                        <input
                            type="number"
                            min="6"
                            max="32"
                            value={passwordRules.minLength}
                            onChange={(e) => handleRuleChange('minLength', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Expiration du mot de passe (jours)</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.passwordExpiration}
                            onChange={(e) => handleRuleChange('passwordExpiration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Historique des mots de passe</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.preventPasswordReuse}
                            onChange={(e) => handleRuleChange('preventPasswordReuse', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tentatives de connexion max</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.maxLoginAttempts}
                            onChange={(e) => handleRuleChange('maxLoginAttempts', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Durée de verrouillage (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.lockoutDuration}
                            onChange={(e) => handleRuleChange('lockoutDuration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Âge minimum du mot de passe (jours)</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.minPasswordAge}
                            onChange={(e) => handleRuleChange('minPasswordAge', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Expiration de session (minutes)</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.sessionTimeout}
                            onChange={(e) => handleRuleChange('sessionTimeout', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="checkbox-rules">
                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireUppercase}
                            onChange={(e) => handleRuleChange('requireUppercase', e.target.checked)}
                        />
                        Exiger des majuscules
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireLowercase}
                            onChange={(e) => handleRuleChange('requireLowercase', e.target.checked)}
                        />
                        Exiger des minuscules
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireNumbers}
                            onChange={(e) => handleRuleChange('requireNumbers', e.target.checked)}
                        />
                        Exiger des chiffres
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireSpecialChars}
                            onChange={(e) => handleRuleChange('requireSpecialChars', e.target.checked)}
                        />
                        Exiger des caractères spéciaux
                    </label>
                </div>
            </div>

            <div className="security-section">
                <h3>Testeur de Mot de Passe</h3>
                <div className="password-tester">
                    <input
                        type="text"
                        placeholder="Testez un mot de passe"
                        value={testPassword}
                        onChange={handleTestPasswordChange}
                        className="test-password-input"
                    />
                    <div className="password-strength">
                        <div className="strength-bar">
                            <div 
                                className="strength-fill"
                                style={{ width: `${passwordStrength.score}%` }}
                            ></div>
                        </div>
                        <div className="strength-label">
                            Force: {passwordStrength.score}%
                        </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                        <div className="password-feedback">
                            <ul>
                                {passwordStrength.feedback.map((feedback, index) => (
                                    <li key={index}>{feedback}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Security;