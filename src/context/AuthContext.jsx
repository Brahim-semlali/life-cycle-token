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
            
            // Charger les modules et menus
            await ModuleService.loadModulesAndMenus();
            
            // Récupérer les modules et menus depuis l'API en fonction du profil utilisateur
            if (userData.id) {
              try {
                const userId = userData.id;
                let userAccess = { modules: [], menus: [] };
                
                try {
                  userAccess = await authService.getUserProfileAccess(userId);
                  
                  // If userAccess contains profile data with menus inside modules, extract them
                  if (userAccess.modules && Array.isArray(userAccess.modules)) {
                    // Check if modules have menus property
                    const extractedMenus = [];
                    userAccess.modules = userAccess.modules.map(module => {
                      if (module && module.menus && Array.isArray(module.menus)) {
                        // Add module ID to each menu for proper association
                        const moduleMenus = module.menus.map(menu => ({
                          ...menu,
                          module: module.id,
                          moduleId: module.id,
                          moduleCode: module.code
                        }));
                        
                        extractedMenus.push(...moduleMenus);
                        
                        // Return the module without menus to avoid duplication
                        const { menus, ...moduleWithoutMenus } = module;
                        return moduleWithoutMenus;
                      }
                      return module;
                    });
                    
                    // Combine extracted menus with any existing menus
                    if (extractedMenus.length > 0) {
                      userAccess.menus = [
                        ...(userAccess.menus || []),
                        ...extractedMenus
                      ];
                    }
                  }
                } catch (apiError) {
                  console.log("Erreur API lors de la récupération des accès utilisateur:", apiError.message);
                  // Continue with default empty modules/menus
                }
                
                const { modules: profileModules = [], menus: profileMenus = [] } = userAccess;
                
                console.log("Modules et menus récupérés au démarrage:", { 
                  profileModules: profileModules?.length || 0, 
                  profileMenus: profileMenus?.length || 0 
                });
                
                // Utiliser uniquement les modules provenant de l'API
                setUserModules(profileModules || []);
                setUserMenus(profileMenus || []);
              } catch (error) {
                console.log("Erreur lors du chargement des accès utilisateur au démarrage:", error.message);
                // En cas d'erreur, ne pas ajouter de modules par défaut
                setUserModules([]);
                setUserMenus([]);
              }
            }
          } else {
            // Si pas d'utilisateur malgré un token valide, nettoyer l'état
            TokenStorage.clear();
            setUser(null);
          }
        } catch (error) {
          console.log("Erreur lors de la récupération des données utilisateur:", error.message);
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
    const loadUserAccess = async () => {
      console.log("Mise à jour des modules utilisateur. Utilisateur connecté:", !!user);
      if (user && TokenStorage.isTokenValid()) {
        try {
          // Récupérer les modules et menus depuis l'API en fonction du profil utilisateur
          const userId = user.id;
          let userAccess = { modules: [], menus: [] };
          
          try {
            userAccess = await authService.getUserProfileAccess(userId);
            
            // If userAccess contains profile data with menus inside modules, extract them
            if (userAccess.modules && Array.isArray(userAccess.modules)) {
              // Check if modules have menus property
              const extractedMenus = [];
              userAccess.modules = userAccess.modules.map(module => {
                if (module && module.menus && Array.isArray(module.menus)) {
                  // Add module ID to each menu for proper association
                  const moduleMenus = module.menus.map(menu => ({
                    ...menu,
                    module: module.id,
                    moduleId: module.id,
                    moduleCode: module.code
                  }));
                  
                  extractedMenus.push(...moduleMenus);
                  
                  // Return the module without menus to avoid duplication
                  const { menus, ...moduleWithoutMenus } = module;
                  return moduleWithoutMenus;
                }
                return module;
              });
              
              // Combine extracted menus with any existing menus
              if (extractedMenus.length > 0) {
                userAccess.menus = [
                  ...(userAccess.menus || []),
                  ...extractedMenus
                ];
              }
            }
          } catch (apiError) {
            console.log("Erreur API lors de la récupération des accès utilisateur:", apiError.message);
            // Continue with default empty modules/menus
          }
          
          const { modules: profileModules = [], menus: profileMenus = [] } = userAccess;
          
          console.log("Modules et menus récupérés depuis l'API:", { 
            profileModules: profileModules?.length || 0, 
            profileMenus: profileMenus?.length || 0 
          });
          
          // Utiliser uniquement les modules provenant de l'API
          setUserModules(profileModules || []);
          setUserMenus(profileMenus || []);
          
          console.log("Modules et menus finaux pour l'utilisateur:", { 
            modules: profileModules?.length || 0, 
            menus: profileMenus?.length || 0 
          });
        } catch (error) {
          console.log("Erreur lors du chargement des accès utilisateur:", error.message);
          // En cas d'erreur, ne pas ajouter de modules par défaut
          setUserModules([]);
          setUserMenus([]);
        }
      } else if (!TokenStorage.isTokenValid()) {
        // Lorsque l'utilisateur n'est pas authentifié, ne pas lui donner accès aux modules/menus
        console.log("Utilisateur non authentifié - aucun module/menu attribué");
        setUserModules([]);
        setUserMenus([]);
      } else if (!user) {
        setUserModules([]);
        setUserMenus([]);
      }
    };
    
    loadUserAccess();
  }, [user]);

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
      await ModuleService.loadModulesAndMenus();
      
      // Récupérer les modules et menus depuis l'API en fonction du profil utilisateur
      if (userData && userData.id) {
        try {
          const userId = userData.id;
          let userAccess = { modules: [], menus: [] };
          
          try {
            userAccess = await authService.getUserProfileAccess(userId);
            
            // If userAccess contains profile data with menus inside modules, extract them
            if (userAccess.modules && Array.isArray(userAccess.modules)) {
              // Check if modules have menus property
              const extractedMenus = [];
              userAccess.modules = userAccess.modules.map(module => {
                if (module && module.menus && Array.isArray(module.menus)) {
                  // Add module ID to each menu for proper association
                  const moduleMenus = module.menus.map(menu => ({
                    ...menu,
                    module: module.id,
                    moduleId: module.id,
                    moduleCode: module.code
                  }));
                  
                  extractedMenus.push(...moduleMenus);
                  
                  // Return the module without menus to avoid duplication
                  const { menus, ...moduleWithoutMenus } = module;
                  return moduleWithoutMenus;
                }
                return module;
              });
              
              // Combine extracted menus with any existing menus
              if (extractedMenus.length > 0) {
                userAccess.menus = [
                  ...(userAccess.menus || []),
                  ...extractedMenus
                ];
              }
            }
          } catch (apiError) {
            console.log("Erreur API lors de la récupération des accès utilisateur:", apiError.message);
            // Continue with default empty modules/menus
          }
          
          const { modules: profileModules = [], menus: profileMenus = [] } = userAccess;
          
          console.log("Modules et menus récupérés depuis l'API:", { 
            profileModules: profileModules?.length || 0, 
            profileMenus: profileMenus?.length || 0 
          });
          
          // Utiliser uniquement les modules provenant de l'API
          setUserModules(profileModules || []);
          setUserMenus(profileMenus || []);
          
          console.log("Modules et menus finaux pour l'utilisateur:", { 
            modules: profileModules?.length || 0, 
            menus: profileMenus?.length || 0 
          });
        } catch (error) {
          console.log("Erreur lors du chargement des accès utilisateur:", error.message);
          // En cas d'erreur, ne pas ajouter de modules par défaut
          setUserModules([]);
          setUserMenus([]);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return false;
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