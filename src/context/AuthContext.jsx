import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import ModuleService from '../services/ModuleService';
import TokenStorage from '../services/TokenStorage';

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
  const [user, setUser] = useState(TokenStorage.getUser());
  const [userModules, setUserModules] = useState([]);
  const [userMenus, setUserMenus] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState(null);

  // Vérification si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return TokenStorage.isTokenValid() && !!user;
  };

  // Vérifier l'authentification et charger les données utilisateur au démarrage
  useEffect(() => {
    const checkAuthOnStartup = async () => {
      // Si le token est valide, charger les données de l'utilisateur
      if (TokenStorage.isTokenValid()) {
        try {
          // Récupérer les données utilisateur depuis le localStorage ou depuis l'API si nécessaire
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
            // Démarrer le timer de rafraîchissement du token
            startTokenRefreshTimer();
          } else {
            // Si pas d'utilisateur malgré un token valide, nettoyer l'état
            TokenStorage.clear();
            setUser(null);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
          // En cas d'erreur, supposer que le token est invalide
          TokenStorage.clear();
          setUser(null);
        }
      } else {
        // Si le token n'est pas valide, s'assurer que l'utilisateur est déconnecté
        TokenStorage.clear();
        setUser(null);
      }
    };
    
    checkAuthOnStartup();
    
    // Nettoyer le timer de rafraîchissement si existant
    return () => {
      if (tokenRefreshTimer) {
        clearInterval(tokenRefreshTimer);
      }
    };
  }, []);

  // Charger les modules et menus disponibles
  useEffect(() => {
    const initModulesAndMenus = async () => {
      try {
        // Seulement charger les modules et menus si l'utilisateur est authentifié
        if (!TokenStorage.isTokenValid()) {
          console.log("Utilisateur non authentifié - pas de chargement des modules et menus");
          setAllModules([]);
          setAllMenus([]);
          setUserModules([]);
          setUserMenus([]);
          return;
        }
        
        console.log("Chargement des modules et menus...");
        const { modules, menus } = await ModuleService.loadModulesAndMenus();
        console.log("Modules et menus chargés avec succès:", { 
          modulesCount: modules?.length, 
          menusCount: menus?.length 
        });
        setAllModules(modules || []);
        setAllMenus(menus || []);
        
        // Ne pas assigner automatiquement de modules ou menus si l'utilisateur n'a pas de profil
        if (!TokenStorage.isTokenValid() || !user || !user.profile) {
          console.log("Utilisateur sans profil défini - pas d'attribution automatique de modules/menus");
          setUserModules([]);
          setUserMenus([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules et menus:", error);
        setAllModules([]);
        setAllMenus([]);
        setUserModules([]);
        setUserMenus([]);
      }
    };

    initModulesAndMenus();
  }, [user]);

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
    } else if (!TokenStorage.isTokenValid()) {
      // Lorsque l'utilisateur n'est pas authentifié, ne pas lui donner accès aux modules/menus
      console.log("Utilisateur non authentifié - aucun module/menu attribué");
      setUserModules([]);
      setUserMenus([]);
    } else if (!user) {
      setUserModules([]);
      setUserMenus([]);
    }
  }, [user, allModules, allMenus]);

  // Timer pour rafraîchir/vérifier le token périodiquement
  const startTokenRefreshTimer = () => {
    // Annuler tout timer existant
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
    }
    
    // Vérifier le statut du token toutes les minutes
    const timer = setInterval(() => {
      // Vérifier le temps restant du token
      const timeLeft = TokenStorage.getTimeToExpiry();
      console.log(`Token expiration check: ${timeLeft} seconds remaining`);
      
      // Si le token a moins de 5 minutes restantes, déconnecter l'utilisateur
      // (à l'avenir, on pourrait implémenter un rafraîchissement silencieux du token)
      if (timeLeft < 300) {
        console.warn('Token near expiration, logging out...');
        logout();
      }
    }, 60000); // Vérifier chaque minute
    
    setTokenRefreshTimer(timer);
  };

  const login = async (userData) => {
    try {
      // Stocker les données utilisateur
      setUser(userData);
      TokenStorage.setUser(userData);
      
      // Démarrer le timer de rafraîchissement du token
      startTokenRefreshTimer();
      
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
      // Arrêter le timer de rafraîchissement
      if (tokenRefreshTimer) {
        clearInterval(tokenRefreshTimer);
        setTokenRefreshTimer(null);
      }
      
      // Appeler le service de déconnexion
      await authService.logout();
      
      // Nettoyer les états
      setUser(null);
      setUserModules([]);
      setUserMenus([]);
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, nettoyer l'état local
      setUser(null);
      setUserModules([]);
      setUserMenus([]);
    }
  };

  // Vérification de l'accès aux modules
  const checkModuleAccess = (moduleCode) => {
    if (!isAuthenticated()) return false;
    
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
    if (!isAuthenticated()) return false;
    
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
    user,
    isAuthenticated,
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