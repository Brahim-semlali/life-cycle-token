import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import ModuleService from '../services/ModuleService';

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
        console.log("Chargement des modules et menus...");
        const { modules, menus } = await ModuleService.loadModulesAndMenus();
        console.log("Modules et menus chargés avec succès:", { 
          modulesCount: modules?.length, 
          menusCount: menus?.length 
        });
        setAllModules(modules || []);
        setAllMenus(menus || []);
        
        // Pour le développement, si l'utilisateur n'est pas authentifié
        // on peut lui donner accès à tous les modules/menus
        if (!isAuthenticated || !user || !user.profile) {
          console.log("Mode développement: attribution de tous les modules et menus");
          setUserModules(modules?.map(m => m.id) || []);
          setUserMenus(menus?.map(m => m.id) || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules et menus:", error);
      }
    };

    // Pour le développement, chargeons les modules même si l'utilisateur n'est pas connecté
    initModulesAndMenus();
  }, [isAuthenticated, user]);

  // Mettre à jour les modules et menus de l'utilisateur lorsque l'utilisateur change
  useEffect(() => {
    console.log("Mise à jour des modules utilisateur. Utilisateur connecté:", !!user);
    if (user && user.profile) {
      // Extraire les IDs des modules et menus du profil de l'utilisateur
      const profileModules = user.profile.modules || [];
      const profileMenus = user.profile.menus || [];
      
      console.log("Modules et menus du profil utilisateur:", { 
        profileModules, 
        profileMenus 
      });
      
      setUserModules(profileModules);
      setUserMenus(profileMenus);
    } else if (!isAuthenticated && allModules.length > 0 && allMenus.length > 0) {
      // Pour le développement, si l'utilisateur n'est pas authentifié,
      // lui donner accès à tous les modules et menus
      console.log("Mode développement: attribution de tous les modules et menus");
      setUserModules(allModules.map(m => m.id));
      setUserMenus(allMenus.map(m => m.id));
    } else if (!user) {
      setUserModules([]);
      setUserMenus([]);
    }
  }, [user, isAuthenticated, allModules, allMenus]);

  const login = async (userData) => {
    try {
      setIsAuthenticated(true);
      setUser(userData);
      
      // Charger immédiatement les modules et menus après la connexion
      const { modules, menus } = await ModuleService.loadModulesAndMenus();
      
      // Si l'utilisateur a un profil avec des modules/menus spécifiques
      if (userData.profile) {
        const profileModules = userData.profile.modules || [];
        const profileMenus = userData.profile.menus || [];
        
        console.log("Modules et menus du profil:", {
          modules: profileModules,
          menus: profileMenus
        });
        
        setUserModules(profileModules);
        setUserMenus(profileMenus);
      }
      
      // Mettre à jour les modules et menus disponibles
      setAllModules(modules || []);
      setAllMenus(menus || []);
      
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
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
      m.code?.toLowerCase() === moduleCode?.toLowerCase()
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
      m.code?.toLowerCase() === moduleCode?.toLowerCase()
    );
    
    if (!module) return false;
    
    // Trouver le menu par son code et le module associé
    const menu = allMenus.find(m => 
      m.code?.toLowerCase() === subModuleCode?.toLowerCase() && 
      (m.module === module.id || m.moduleId === module.id)
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
    userMenus,
    allModules,
    allMenus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;