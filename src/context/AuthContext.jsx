import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = async () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Vérification des accès basée sur les cookies de session
  const checkModuleAccess = (moduleName) => {
    return isAuthenticated;
  };

  const checkSubModuleAccess = (moduleName, subModuleName) => {
    return isAuthenticated;
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkModuleAccess,
    checkSubModuleAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;