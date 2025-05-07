import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMenu } from "../../context/MenuContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import ModuleService from "../../services/ModuleService";
import api from "../../services/api";
import "./Sidebar.css";

// Correspondance d'icônes par défaut pour les modules
const DEFAULT_ICONS = {
    'ADMIN': 'admin_panel_settings',
    'LCM': 'manage_accounts',
    'ITCP': 'token',
    'CHARGEBACK': 'payments',
    'TRANSACTIONS': 'receipt_long',
    // Ajouter plus d'icônes par défaut si nécessaire
    'DEFAULT': 'dashboard' // Icône par défaut
};

// Correspondance des routes pour les cas spéciaux
const ROUTE_MAPPING = {
    // Mappings pour corriger les routes singulier/pluriel
    '/dashboard/admin/profile': '/dashboard/admin/profiles',
    // Ajouter d'autres mappings si nécessaire
};

const Sidebar = () => {
    const [isModuleOpen, setIsModuleOpen] = useState({});
    const { isMinimized, setIsMinimized } = useMenu();
    const { t } = useTranslation();
    const { allModules, allMenus, userModules, userMenus, logout, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Structure des modules et sous-modules accessibles à l'utilisateur
    const [userModuleStructure, setUserModuleStructure] = useState([]);
    const [userAccessData, setUserAccessData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user-specific access data
    useEffect(() => {
        const fetchUserAccess = async () => {
            if (!user || !isAuthenticated) {
                console.log("Utilisateur non connecté - pas de récupération des droits d'accès");
                setIsLoading(false);
                return;
            }
            
            console.log("Tentative de récupération des données d'accès pour l'utilisateur:", user);
            setIsLoading(true);
            try {
                // Utiliser la méthode implémentée dans l'API
                const accessData = await api.getUserProfileAccess(user.id);
                console.log("User access data:", accessData);
                
                // Correction : extraire les menus depuis les modules
                let modules = [];
                let menus = [];
                
                if (accessData && Array.isArray(accessData.modules)) {
                    // Extraire les IDs des modules
                    modules = accessData.modules.map(m => m.id);
                    
                    // Extraire tous les menus imbriqués dans les modules
                    accessData.modules.forEach(module => {
                        if (module.menus && Array.isArray(module.menus)) {
                            menus.push(...module.menus.map(menu => ({
                                ...menu,
                                module: module.id  // Ajouter l'ID du module parent
                            })));
                        }
                    });
                }
                
                console.log("Données d'accès extraites:", {
                    modules: modules,
                    menus: menus.map(m => ({ id: m.id, code: m.code, moduleId: m.module }))
                });
                
                setUserAccessData({ modules, menus });
            } catch (error) {
                console.error("Error fetching user access:", error);
                setUserAccessData(null);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUserAccess();
    }, [user, isAuthenticated]);

    // Initialisation des états d'ouverture des modules
    useEffect(() => {
        if (location.pathname && userModuleStructure.length > 0) {
            // Mettre à jour l'état d'ouverture des modules en fonction du chemin actuel
            const initialOpenState = {};
            userModuleStructure.forEach(module => {
                // Vérifier si un des sous-modules correspond au chemin actuel
                const hasActiveSubmodule = module.submodules && module.submodules.length > 0 
                    ? module.submodules.some(submodule => location.pathname === submodule.path)
                    : location.pathname === module.path;
                initialOpenState[module.code] = hasActiveSubmodule;
            });
            setIsModuleOpen(initialOpenState);
        }
    }, [location.pathname, userModuleStructure]);

    // Effet pour garder ouvert le module parent lorsqu'on navigue entre ses sous-modules
    useEffect(() => {
        userModuleStructure.forEach(module => {
            let isModuleActive = false;
            
            if (module.submodules && module.submodules.length > 0) {
                isModuleActive = module.submodules.some(submodule => 
                    location.pathname === submodule.path || 
                    location.pathname.startsWith(submodule.path + '/')
                );
            } else if (module.path) {
                isModuleActive = location.pathname === module.path || 
                                  location.pathname.startsWith(module.path + '/');
            }
            
            if (isModuleActive && !isModuleOpen[module.code]) {
                setIsModuleOpen(prev => ({
                    ...prev,
                    [module.code]: true
                }));
            }
        });
    }, [location.pathname, isModuleOpen, userModuleStructure]);

    // Basculer l'état d'ouverture d'un module
    const toggleModule = (moduleCode) => {
        // Si le module a un chemin direct (pas de sous-menus), naviguer vers ce chemin
        const module = userModuleStructure.find(m => m.code === moduleCode);
        if (module && (!module.submodules || module.submodules.length === 0) && module.path) {
            const targetPath = ROUTE_MAPPING[module.path] || module.path;
            navigate(targetPath);
        } else {
            // Sinon, basculer l'ouverture du module pour afficher les sous-menus
            setIsModuleOpen(prevState => ({
                ...prevState,
                [moduleCode]: !prevState[moduleCode]
            }));
        }
    };

    // Vérifier si un sous-module est actif
    const isSubmoduleActive = (path) => {
        // Vérifier à la fois le chemin original et le chemin mappé
        const normalizedPath = ROUTE_MAPPING[path] || path;
        return location.pathname === normalizedPath || 
               location.pathname.startsWith(normalizedPath + '/') ||
               (ROUTE_MAPPING[location.pathname] && ROUTE_MAPPING[location.pathname] === path);
    };

    // Vérifier si un module principal est actif (pour les modules sans sous-menus)
    const isModuleActive = (path, code) => {
        if (!path) return false;
        
        // Utiliser la route mappée si elle existe
        const normalizedPath = ROUTE_MAPPING[path] || path;
        return location.pathname === normalizedPath || 
               location.pathname.startsWith(normalizedPath + '/') || 
               location.pathname.includes(`/${code.toLowerCase()}`);
    };

    // Charger les données des modules et sous-modules depuis l'API via le service
    useEffect(() => {
        const loadModulesData = async () => {
            console.log("loadModulesData - État actuel:", {
                isAuthenticated,
                user: user ? "présent" : "absent",
                userAccessData: userAccessData ? "présent" : "absent",
                userModules: userModules.length,
                allModules: allModules.length
            });

            if (user) {
                console.log("Données utilisateur complètes:", JSON.stringify(user));
            }

            try {
                // Charger les modules et menus si nécessaire
                if (allModules.length === 0 || allMenus.length === 0) {
                    console.log("Chargement des modules et menus de base");
                    await ModuleService.loadModulesAndMenus();
                }
                
                // Si l'utilisateur est connecté - utiliser strictement ses droits d'accès
                if (isAuthenticated && user) {
                    console.log("Utilisateur authentifié:", user.id);
                    
                    // Utiliser uniquement les données d'accès spécifiques à l'utilisateur
                    if (userAccessData && (
                        (Array.isArray(userAccessData.modules) && userAccessData.modules.length > 0) || 
                        (Array.isArray(userAccessData.menus) && userAccessData.menus.length > 0)
                    )) {
                        console.log("Construction de la structure avec les données d'accès:", userAccessData);
                        
                        // Construire la structure en utilisant les modules et menus
                        const moduleStructure = ModuleService.buildModuleStructure(
                            userAccessData.modules,
                            userAccessData.menus
                        );
                
                        // Ajouter les icônes par défaut
                        const structureWithIcons = addIconsToStructure(moduleStructure);
                        console.log("Structure finale des modules:", structureWithIcons);
                        setUserModuleStructure(structureWithIcons);
                    } else if (user.profile && user.profile.modules) {
                        // Fallback sur le profil de l'utilisateur si pas de données d'accès
                        console.log("Utilisation du profil utilisateur comme fallback");
                        const moduleStructure = ModuleService.buildModuleStructure(
                            user.profile.modules,
                            user.profile.menus || []
                        );
                        
                        const structureWithIcons = addIconsToStructure(moduleStructure);
                        setUserModuleStructure(structureWithIcons);
                    } else {
                        console.log("Aucune donnée d'accès ni profil disponible");
                        setUserModuleStructure([]);
                    }
                } else if (!isAuthenticated && process.env.REACT_APP_DEV_MODE === 'true') {
                    console.log("Mode développement - affichage de tous les modules");
                    const moduleStructure = ModuleService.buildModuleStructure(
                        allModules.map(m => m.id),
                        allMenus.map(m => m.id)
                    );
                    
                    const structureWithIcons = addIconsToStructure(moduleStructure);
                    setUserModuleStructure(structureWithIcons);
                } else {
                    console.log("Aucun utilisateur authentifié - aucun module affiché");
                    setUserModuleStructure([]);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des modules et menus:", error);
                // En cas d'erreur, ne rien afficher plutôt que d'afficher tout
                setUserModuleStructure([]);
            }
        };
        
        // Charger les modules uniquement si l'API a terminé de charger les données d'accès
        // ou si nous avons des modules dans le contexte d'authentification
        if (!isLoading || userModules.length > 0 || allModules.length > 0) {
            loadModulesData();
        }
    }, [allModules, allMenus, userModules, userMenus, userAccessData, isLoading, isAuthenticated, user]);

    // Fonction pour ajouter les icônes et corriger les chemins
    const addIconsToStructure = (moduleStructure) => {
        return moduleStructure.map(module => ({
                ...module,
                icon: module.icon || DEFAULT_ICONS[module.code] || DEFAULT_ICONS.DEFAULT,
                // Corriger les sous-modules pour les cas spéciaux
                submodules: module.submodules.map(submenu => {
                    // Pour le sous-module "Profil", s'assurer qu'il pointe vers "profiles" (pluriel)
                    if (submenu.title === 'Profil' && module.code === 'ADMIN') {
                        return {
                            ...submenu,
                            path: '/dashboard/admin/profiles'
                        };
                    }
                    return submenu;
                })
            }));
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className={`sidebar ${isMinimized ? "minimized" : ""}`}>
            <div className="sidebar-header">
                <div className="logo">
                    {!isMinimized ? (
                        <div className="logo-full">
                            <h2>Titrit</h2>
                            <span>Technologies</span>
                        </div>
                    ) : (
                        <div className="logo-icon">
                            <span>T</span>
                        </div>
                    )}
                </div>
                <button
                    className="toggle-button"
                    onClick={() => setIsMinimized(!isMinimized)}
                    title={isMinimized ? t('common.expand') : t('common.collapse')}
                >
                    <span className="material-icons">
                        {isMinimized ? "chevron_right" : "chevron_left"}
                    </span>
                </button>
            </div>
            <div className="sidebar-content">
                {userModuleStructure.map((module) => (
                    <div key={module.id} className="module-section">
                        {/* Module principal - Cliquer pour ouvrir ou pour accéder directement si pas de sous-menus */}
                        {module.submodules && module.submodules.length > 0 ? (
                            // Module avec sous-menus
                            <div
                                className={`module-item ${isModuleActive(module.path, module.code) ? "active" : ""}`}
                                onClick={() => toggleModule(module.code)}
                            >
                                <span className="material-icons module-icon">
                                    {module.icon}
                                </span>
                                {!isMinimized && (
                                    <>
                                        <div className="module-text">{module.title}</div>
                                        <span className={`material-icons module-toggle ${isModuleOpen[module.code] ? 'open' : ''}`}>
                                            expand_more
                                        </span>
                                    </>
                                )}
                            </div>
                        ) : (
                            // Module sans sous-menus - lien direct
                            <Link 
                                to={ROUTE_MAPPING[module.path] || module.path}
                                className={`module-item ${isModuleActive(module.path, module.code) ? "active" : ""}`}
                            >
                                <span className="material-icons module-icon">
                                    {module.icon}
                                </span>
                                {!isMinimized && (
                                    <div className="module-text">{module.title}</div>
                                )}
                                {isMinimized && (
                                    <span className="tooltip-text">{module.title}</span>
                                )}
                            </Link>
                        )}
                        
                        {/* Sous-menus (si présents) */}
                        {module.submodules && module.submodules.length > 0 && (!isMinimized || (isMinimized && isModuleOpen[module.code])) && (
                            <div className={`module-submenu ${isModuleOpen[module.code] ? "open" : ""}`}>
                                {module.submodules.map((submodule) => (
                                    <Link
                                        key={submodule.id}
                                        to={ROUTE_MAPPING[submodule.path] || submodule.path}
                                        className={isSubmoduleActive(submodule.path) ? "active" : ""}
                                    >
                                        {isMinimized ? (
                                            <span className="tooltip-text">{submodule.title}</span>
                                        ) : (
                                            <>{submodule.title}</>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                <div className="sidebar-footer">
                    <div className="settings-link">
                        <Link to="/dashboard/settings" className={location.pathname === "/dashboard/settings" ? "active" : ""}>
                            <span className="material-icons">settings</span>
                            {!isMinimized && <span>Settings</span>}
                        </Link>
                    </div>
                    <div className="logout-button" onClick={handleLogout}>
                        <span className="material-icons">logout</span>
                        {!isMinimized && <span>{t('common.logout')}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
