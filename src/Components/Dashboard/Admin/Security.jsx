import React, { useState, useEffect } from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import "./Security.css";
import { Save as SaveIcon, LockOutlined, ShieldOutlined, VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { Button, Snackbar, Alert } from '@mui/material';
import api from '../../../services/api';

const Security = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    
    const [passwordRules, setPasswordRules] = useState({
        min_length: 8,
        require_uppercase: false,
        require_lowercase: true,
        require_number: true,
        require_special_char: true,
        max_login_attempts: 3,
        lockout_duration: 30,
        password_expiration: 90,
        prevent_password_reuse: 5,
        min_password_age: 1,
        session_timeout: 30
    });

    const [testPassword, setTestPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        level: 0,
        label: '',
        feedback: []
    });
    const [showPassword, setShowPassword] = useState(false);
    const [saveStatus, setSaveStatus] = useState({
        open: false,
        success: false,
        message: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Déplacer loadPasswordRules en dehors de useEffect
    const loadPasswordRules = async () => {
        try {
            // Utiliser la méthode getPasswordPolicy de l'API
            const rules = await api.getPasswordPolicy();
            
            if (rules) {
                // S'assurer que les valeurs booléennes sont correctement interprétées
                setPasswordRules({
                    min_length: parseInt(rules.min_length) || 8,
                    require_uppercase: Boolean(rules.require_uppercase),
                    require_lowercase: Boolean(rules.require_lowercase),
                    require_number: Boolean(rules.require_number),
                    require_special_char: Boolean(rules.require_special_char),
                    max_login_attempts: parseInt(rules.max_login_attempts) || 3,
                    lockout_duration: parseInt(rules.lockout_duration) || 30,
                    password_expiration: parseInt(rules.password_expiration) || 90,
                    prevent_password_reuse: parseInt(rules.prevent_password_reuse) || 5,
                    min_password_age: parseInt(rules.min_password_age) || 1,
                    session_timeout: parseInt(rules.session_timeout) || 30
                });
            }
        } catch (error) {
            console.error('Error loading password rules from database:', error);
            // En cas d'erreur, utiliser les valeurs par défaut
            setPasswordRules({
                min_length: 8,
                require_uppercase: false,
                require_lowercase: false,
                require_number: false,
                require_special_char: false,
                max_login_attempts: 3,
                lockout_duration: 30,
                password_expiration: 90,
                prevent_password_reuse: 5,
                min_password_age: 1,
                session_timeout: 30
            });
        }
    };

    // Charger les règles de mot de passe au démarrage
    useEffect(() => {
        loadPasswordRules();
    }, []);

    const handleRuleChange = (name, value) => {
        setPasswordRules(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // S'assurer que les valeurs booléennes sont explicitement converties en true/false
            const formattedData = {
                min_length: parseInt(passwordRules.min_length),
                require_uppercase: Boolean(passwordRules.require_uppercase),
                require_lowercase: Boolean(passwordRules.require_lowercase),
                require_number: Boolean(passwordRules.require_number),
                require_special_char: Boolean(passwordRules.require_special_char),
                max_login_attempts: parseInt(passwordRules.max_login_attempts),
                lockout_duration: parseInt(passwordRules.lockout_duration),
                password_expiration: parseInt(passwordRules.password_expiration),
                prevent_password_reuse: parseInt(passwordRules.prevent_password_reuse),
                min_password_age: parseInt(passwordRules.min_password_age),
                session_timeout: parseInt(passwordRules.session_timeout)
            };

            console.log('Saving password rules:', formattedData);

            // Utiliser la méthode dédiée pour mettre à jour la politique de mot de passe
            await api.updatePasswordPolicy(formattedData);
            
            setSaveStatus({
                open: true,
                success: true,
                message: t('security.saveSuccess')
            });

            // Recharger les règles pour vérifier que les changements ont été appliqués
            loadPasswordRules();
        } catch (error) {
            console.error('Error saving password rules:', error);
            
            let errorMessage = t('security.saveError');
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = t('security.invalidDataError');
                } else if (error.response.status === 401) {
                    errorMessage = t('security.unauthorizedError');
                } else if (error.response.status === 403) {
                    errorMessage = t('security.forbiddenError');
                } else if (error.response.status === 500) {
                    errorMessage = t('security.serverError');
                }
            }

            setSaveStatus({
                open: true,
                success: false,
                message: errorMessage
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSaveStatus({
            ...saveStatus,
            open: false
        });
    };

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < passwordRules.min_length) {
            errors.push(t('security.passwordRules.minLengthError', { length: passwordRules.min_length }));
        }

        if (passwordRules.require_uppercase && !/[A-Z]/.test(password)) {
            errors.push(t('security.passwordRules.uppercaseError'));
        }

        if (passwordRules.require_lowercase && !/[a-z]/.test(password)) {
            errors.push(t('security.passwordRules.lowercaseError'));
        }

        if (passwordRules.require_number && !/\d/.test(password)) {
            errors.push(t('security.passwordRules.numberError'));
        }

        if (passwordRules.require_special_char && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(t('security.passwordRules.specialError'));
        }

        return errors;
    };

    const handleTestPasswordChange = (e) => {
        const password = e.target.value;
        setTestPassword(password);
        const errors = validatePassword(password);
        setPasswordStrength({
            score: 100 - (errors.length * 20),
            level: 5 - errors.length,
            label: errors.length === 0 
                ? t('security.passwordStrength.veryStrong')
                : errors.length >= 4 
                    ? t('security.passwordStrength.veryWeak')
                    : t(`security.passwordStrength.${['strong', 'medium', 'weak'][errors.length - 1]}`),
            feedback: errors
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`security-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="security-header">
                <h2>{t('security.settings')}</h2>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    className={`save-button ${isSaving ? 'loading' : ''}`}
                    disabled={isSaving}
                >
                    {isSaving ? t('security.saving') : t('security.save')}
                </Button>
            </div>

            <div className="security-section">
                <h3>
                    <LockOutlined style={{ fontSize: 24 }} />
                    {t('security.passwordRules')}
                </h3>
                <div className="rules-grid">
                    <div className="form-group">
                        <label>{t('security.minimumLength')}</label>
                        <input
                            type="number"
                            min="6"
                            max="32"
                            value={passwordRules.min_length}
                            onChange={(e) => handleRuleChange('min_length', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.passwordExpiration')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.password_expiration}
                            onChange={(e) => handleRuleChange('password_expiration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.passwordHistory')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.prevent_password_reuse}
                            onChange={(e) => handleRuleChange('prevent_password_reuse', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.maxLoginAttempts')}</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.max_login_attempts}
                            onChange={(e) => handleRuleChange('max_login_attempts', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.lockoutDuration')}</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.lockout_duration}
                            onChange={(e) => handleRuleChange('lockout_duration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.minPasswordAge')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.min_password_age}
                            onChange={(e) => handleRuleChange('min_password_age', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.sessionTimeout')}</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.session_timeout}
                            onChange={(e) => handleRuleChange('session_timeout', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="checkbox-rules">
                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.require_uppercase}
                            onChange={(e) => handleRuleChange('require_uppercase', e.target.checked)}
                        />
                        {t('security.requireUppercase')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.require_lowercase}
                            onChange={(e) => handleRuleChange('require_lowercase', e.target.checked)}
                        />
                        {t('security.requireLowercase')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.require_number}
                            onChange={(e) => handleRuleChange('require_number', e.target.checked)}
                        />
                        {t('security.requireNumbers')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.require_special_char}
                            onChange={(e) => handleRuleChange('require_special_char', e.target.checked)}
                        />
                        {t('security.requireSpecial')}
                    </label>
                </div>
            </div>

            <div className="security-section">
                <h3>
                    <ShieldOutlined style={{ fontSize: 24 }} />
                    {t('security.passwordTester')}
                </h3>
                <div className="password-tester">
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('security.testPassword')}
                            value={testPassword}
                            onChange={handleTestPasswordChange}
                            className="test-password-input"
                        />
                        <button 
                            type="button" 
                            onClick={togglePasswordVisibility}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDarkMode ? '#a0aec0' : '#4a5568',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                        </button>
                    </div>
                    
                    {testPassword && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div 
                                    className="strength-fill"
                                    data-strength={passwordStrength.level}
                                    style={{ width: `${passwordStrength.score}%` }}
                                ></div>
                            </div>
                            <div className="strength-label">
                                <span>{t('security.passwordStrength.label')}:</span> 
                                <span className="strength-text" data-strength={passwordStrength.level}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        </div>
                    )}
                    
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

            <Snackbar 
                open={saveStatus.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={saveStatus.success ? "success" : "error"}
                    sx={{ width: '100%' }}
                >
                    {saveStatus.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Security;