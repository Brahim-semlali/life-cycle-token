import React, { createContext, useContext, useState } from 'react';
import { PREDEFINED_PROFILES } from '../config/predefinedProfiles';
import { checkUserCredentials } from '../config/predefinedUsers';

// Création du contexte d'authentification
const AuthContext = createContext(null);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const login = async (email, password) => {
    console.log('Tentative de connexion pour:', email);

    const authenticatedUser = checkUserCredentials(email, password);
    
    if (authenticatedUser) {
      console.log('Utilisateur authentifié:', { ...authenticatedUser, password: '***' });
      setUser(authenticatedUser);
      setProfile(authenticatedUser.profile);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      return true;
    }

    console.log('Échec de la connexion');
    return false;
  };

  const logout = () => {
    console.log('Déconnexion...');
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
  };

  const checkModuleAccess = (moduleName) => {
    if (!profile) {
      console.log('Pas de profil, accès refusé pour:', moduleName);
      return false;
    }
    const hasAccess = profile.modules[moduleName]?.access || false;
    console.log('Vérification accès module:', moduleName, 'Résultat:', hasAccess);
    return hasAccess;
  };

  const checkSubModuleAccess = (moduleName, subModuleName) => {
    if (!profile) {
      console.log('Pas de profil, accès sous-module refusé pour:', moduleName, subModuleName);
      return false;
    }
    const hasAccess = profile.modules[moduleName]?.subModules[subModuleName] || false;
    console.log('Vérification accès sous-module:', moduleName, subModuleName, 'Résultat:', hasAccess);
    return hasAccess;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      logout,
      checkModuleAccess,
      checkSubModuleAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 