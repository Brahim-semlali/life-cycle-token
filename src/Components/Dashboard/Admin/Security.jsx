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
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        passwordExpiration: 90, // days
        preventPasswordReuse: 5, // number of previous passwords
        maxLoginAttempts: 3,
        lockoutDuration: 30, // minutes
        minPasswordAge: 1, // days
        sessionTimeout: 30 // minutes
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

    // Charger les règles depuis l'API au démarrage
    useEffect(() => {
        const loadPasswordRules = async () => {
            try {
                const response = await api.request('/security/password-rules/', 'GET');
                if (response) {
                    setPasswordRules(response);
                }
            } catch (error) {
                console.error('Error loading password rules:', error);
            }
        };
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
            await api.request('/security/password-rules/', 'POST', passwordRules);
            setSaveStatus({
                open: true,
                success: true,
                message: t('security.saveSuccess')
            });
        } catch (error) {
            console.error('Error saving password rules:', error);
            setSaveStatus({
                open: true,
                success: false,
                message: t('security.saveError')
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
        const feedback = [];
        let score = 0;
        let level = 0;
        let label = t('security.passwordStrength.veryWeak');

        if (!password) {
            setPasswordStrength({ score: 0, level: 0, label: '', feedback: [] });
            return;
        }

        // Minimum length
        if (password.length >= passwordRules.minLength) {
            score += 20;
        } else {
            feedback.push(t('security.passwordRules.minLengthError', { length: passwordRules.minLength }));
        }

        // Uppercase
        if (passwordRules.requireUppercase && /[A-Z]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireUppercase) {
            feedback.push(t('security.passwordRules.uppercaseError'));
        }

        // Lowercase
        if (passwordRules.requireLowercase && /[a-z]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireLowercase) {
            feedback.push(t('security.passwordRules.lowercaseError'));
        }

        // Numbers
        if (passwordRules.requireNumbers && /\d/.test(password)) {
            score += 20;
        } else if (passwordRules.requireNumbers) {
            feedback.push(t('security.passwordRules.numberError'));
        }

        // Special characters
        if (passwordRules.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 20;
        } else if (passwordRules.requireSpecialChars) {
            feedback.push(t('security.passwordRules.specialError'));
        }

        // Additional strength factors
        if (password.length > passwordRules.minLength + 4) {
            score += 10;
        }

        if (password.length > passwordRules.minLength + 8) {
            score += 10;
        }

        // Cap at 100
        score = Math.min(score, 100);

        // Determine level and label based on score
        if (score >= 0 && score < 20) {
            level = 1;
            label = t('security.passwordStrength.veryWeak');
        } else if (score >= 20 && score < 40) {
            level = 2;
            label = t('security.passwordStrength.weak');
        } else if (score >= 40 && score < 60) {
            level = 3;
            label = t('security.passwordStrength.medium');
        } else if (score >= 60 && score < 80) {
            level = 4;
            label = t('security.passwordStrength.strong');
        } else {
            level = 5;
            label = t('security.passwordStrength.veryStrong');
        }

        setPasswordStrength({ score, level, label, feedback });
    };

    const handleTestPasswordChange = (e) => {
        const password = e.target.value;
        setTestPassword(password);
        validatePassword(password);
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
                            value={passwordRules.minLength}
                            onChange={(e) => handleRuleChange('minLength', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.passwordExpiration')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.passwordExpiration}
                            onChange={(e) => handleRuleChange('passwordExpiration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.passwordHistory')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.preventPasswordReuse}
                            onChange={(e) => handleRuleChange('preventPasswordReuse', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.maxLoginAttempts')}</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.maxLoginAttempts}
                            onChange={(e) => handleRuleChange('maxLoginAttempts', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.lockoutDuration')}</label>
                        <input
                            type="number"
                            min="1"
                            value={passwordRules.lockoutDuration}
                            onChange={(e) => handleRuleChange('lockoutDuration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.minPasswordAge')}</label>
                        <input
                            type="number"
                            min="0"
                            value={passwordRules.minPasswordAge}
                            onChange={(e) => handleRuleChange('minPasswordAge', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('security.sessionTimeout')}</label>
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
                        {t('security.requireUppercase')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireLowercase}
                            onChange={(e) => handleRuleChange('requireLowercase', e.target.checked)}
                        />
                        {t('security.requireLowercase')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireNumbers}
                            onChange={(e) => handleRuleChange('requireNumbers', e.target.checked)}
                        />
                        {t('security.requireNumbers')}
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={passwordRules.requireSpecialChars}
                            onChange={(e) => handleRuleChange('requireSpecialChars', e.target.checked)}
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