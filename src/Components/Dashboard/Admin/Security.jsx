import React, { useState } from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import "./Security.css";

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

        setPasswordStrength({ score, feedback });
    };

    const handleTestPasswordChange = (e) => {
        const password = e.target.value;
        setTestPassword(password);
        validatePassword(password);
    };

    return (
        <div className={`security-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
            <h2>{t('security.settings')}</h2>

            <div className="security-section">
                <h3>{t('security.passwordRules')}</h3>
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
                <h3>{t('security.passwordTester')}</h3>
                <div className="password-tester">
                    <input
                        type="text"
                        placeholder={t('security.testPassword')}
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
                            {t('security.passwordStrength')}: {passwordStrength.score}%
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