import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMenu } from "../../context/MenuContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import ModuleService from "../../services/ModuleService";
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
    const { allModules, allMenus, userModules, userMenus, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Structure des modules et sous-modules accessibles à l'utilisateur
    const [userModuleStructure, setUserModuleStructure] = useState([]);

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
            try {
                // Charger les modules et menus si nécessaire
                if (allModules.length === 0 || allMenus.length === 0) {
                    await ModuleService.loadModulesAndMenus();
                }
                
                // Construire la structure des modules et sous-menus pour l'utilisateur
                const moduleStructure = ModuleService.buildModuleStructure(userModules, userMenus);
                
                // Ajouter les icônes par défaut si elles ne sont pas définies
                const structureWithIcons = moduleStructure.map(module => ({
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
                
                console.log("Structure des modules pour l'utilisateur:", structureWithIcons);
                setUserModuleStructure(structureWithIcons);
            } catch (error) {
                console.error("Erreur lors du chargement des modules et menus:", error);
            }
        };
        
        // Charger les modules uniquement si l'utilisateur a des modules accessibles
        if (userModules.length > 0) {
            loadModulesData();
        } else if (allModules.length > 0) {
            // Si pas de modules utilisateur mais des modules système, construire à partir des données déjà chargées
            const moduleStructure = ModuleService.buildModuleStructure(
                allModules.map(m => m.id), // En mode développement, donner accès à tous les modules
                allMenus.map(m => m.id)    // Et à tous les menus
            );
            
            // Ajouter les icônes par défaut et corriger les chemins
            const structureWithIcons = moduleStructure.map(module => ({
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
            
            console.log("Structure des modules pour le développement:", structureWithIcons);
            setUserModuleStructure(structureWithIcons);
        }
    }, [allModules, allMenus, userModules, userMenus]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // Fonction pour gérer la navigation vers un sous-module
    const handleSubmoduleNavigation = (path) => {
        // Vérifier si le chemin a une correspondance spéciale
        const targetPath = ROUTE_MAPPING[path] || path;
        navigate(targetPath);
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
