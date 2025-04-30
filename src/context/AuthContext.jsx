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

  const login = async (email, password) => {
    console.log('Tentative de connexion pour:', email);

    const authenticatedUser = checkUserCredentials(email, password);
    
    if (authenticatedUser) {
      console.log('Utilisateur authentifié:', { ...authenticatedUser, password: '***' });
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      return true;
    }

    console.log('Échec de la connexion');
    return false;
  };

  const logout = () => {
    console.log('Déconnexion...');
    setUser(null);
    localStorage.removeItem('user');
  };

  // Toujours retourner true pour donner un accès complet
  const checkModuleAccess = (moduleName) => {
    return true;
  };

  // Toujours retourner true pour donner un accès complet
  const checkSubModuleAccess = (moduleName, subModuleName) => {
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
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