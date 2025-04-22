import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getAllProfiles } from '../services/ProfileService';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Charger les profils disponibles
  useEffect(() => {
    const availableProfiles = getAllProfiles();
    setProfiles(availableProfiles);
    
    // Sélectionner le premier profil par défaut
    if (availableProfiles.length > 0) {
      setSelectedProfile(availableProfiles[0].id);
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validation simple
    if (!username || !password) {
      setError(t('login.errorMissingFields'));
      return;
    }
    
    if (!selectedProfile) {
      setError(t('login.errorNoProfile'));
      return;
    }
    
    // Simuler une connexion réussie
    // Dans un cas réel, vous feriez une requête API pour vérifier les identifiants
    login(username, selectedProfile);
    
    // Rediriger vers le tableau de bord
    navigate('/dashboard');
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{t('login.title')}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('login.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.usernamePlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="profile">{t('login.selectProfile')}</label>
            <select
              id="profile"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
            >
              <option value="">{t('login.selectProfilePlaceholder')}</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="login-button">
            {t('login.login')}
          </button>
        </form>
        
        <div className="login-help">
          <p>{t('login.helpText')}</p>
          <ul>
            <li>
              <strong>{t('login.securityTeam')}:</strong> {t('login.securityTeamDesc')}
            </li>
            <li>
              <strong>{t('login.bankTeam')}:</strong> {t('login.bankTeamDesc')}
            </li>
            <li>
              <strong>{t('login.callCenterTeam')}:</strong> {t('login.callCenterTeamDesc')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login; 