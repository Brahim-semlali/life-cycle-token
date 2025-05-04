import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { loadModulesAndMenus } from '../services/ProfileService';

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
  const [userModules, setUserModules] = useState([]);
  const [userMenus, setUserMenus] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [allMenus, setAllMenus] = useState([]);

  // Charger les modules et menus disponibles
  useEffect(() => {
    const initModulesAndMenus = async () => {
      try {
        const { modules, menus } = await loadModulesAndMenus();
        setAllModules(modules);
        setAllMenus(menus);
      } catch (error) {
        console.error('Error loading modules and menus:', error);
      }
    };

    if (isAuthenticated) {
      initModulesAndMenus();
    }
  }, [isAuthenticated]);

  // Mettre à jour les modules et menus de l'utilisateur lorsque l'utilisateur change
  useEffect(() => {
    if (user && user.profile) {
      // Extraire les IDs des modules et menus du profil de l'utilisateur
      const profileModules = user.profile.modules || [];
      const profileMenus = user.profile.menus || [];
      
      setUserModules(profileModules);
      setUserMenus(profileMenus);
    } else {
      setUserModules([]);
      setUserMenus([]);
    }
  }, [user]);

  const login = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setUserModules([]);
      setUserMenus([]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Vérification de l'accès aux modules
  const checkModuleAccess = (moduleCode) => {
    if (!isAuthenticated) return false;
    
    // Si aucun module n'est défini, autoriser l'accès à tous (temporaire pour le développement)
    if (!userModules || userModules.length === 0) return true;
    
    // Trouver le module par son code
    const module = allModules.find(m => 
      m.code.toLowerCase() === moduleCode.toLowerCase()
    );
    
    // Vérifier si l'utilisateur a accès à ce module
    return module ? userModules.includes(module.id) : false;
  };

  // Vérification de l'accès aux sous-modules (menus)
  const checkSubModuleAccess = (moduleCode, subModuleCode) => {
    if (!isAuthenticated) return false;
    
    // Si aucun sous-module n'est défini, autoriser l'accès à tous (temporaire pour le développement)
    if (!userMenus || userMenus.length === 0) return true;
    
    // Trouver le module par son code
    const module = allModules.find(m => 
      m.code.toLowerCase() === moduleCode.toLowerCase()
    );
    
    if (!module) return false;
    
    // Trouver le menu par son code et le module associé
    const menu = allMenus.find(m => 
      m.code.toLowerCase() === subModuleCode.toLowerCase() && 
      m.module === module.id
    );
    
    // Vérifier si l'utilisateur a accès à ce menu
    return menu ? userMenus.includes(menu.id) : false;
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    checkModuleAccess,
    checkSubModuleAccess,
    userModules,
    userMenus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;