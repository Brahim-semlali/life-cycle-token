import api from './api';
import TokenStorage from './TokenStorage';

// Cache pour les modules et menus
let cachedModules = [];
let cachedMenus = [];

/**
 * Charge tous les modules depuis l'API
 * @returns {Promise<Array>} Liste des modules
 */
export const loadModules = async () => {
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!TokenStorage.isTokenValid()) {
            return [];
        }

        // Utiliser l'API pour récupérer les modules
        try {
            const modules = await api.getModules();
            
            if (modules && Array.isArray(modules)) {
                cachedModules = modules;
                return modules;
            }
            
            return [];
        } catch (apiError) {
            // Silence 403 errors
            if (apiError.response && apiError.response.status === 403) {
                return [];
            }
            console.error('Erreur lors du chargement des modules:', apiError);
            cachedModules = [];
            return [];
        }
    } catch (error) {
        cachedModules = [];
        return [];
    }
};

// Fonction utilitaire pour obtenir un nom de module plus descriptif par ID
export function getModuleNameById(moduleId) {
    // D'abord, chercher dans le cache des modules
    if (cachedModules.length > 0) {
        const module = cachedModules.find(m => m.id === moduleId);
        if (module && module.title) {
            return module.title;
        }
    }
    
    // Mapping des IDs de modules connus vers des noms plus descriptifs
    const moduleNames = {
        1: 'Administration',
        2: 'Issuer TSP',
        3: 'Token Manager',
        4: 'ChargeBack',
        5: 'Transactions',
        6: 'Security',
        7: 'Dashboard',
        8: 'Settings',
        9: 'Reports',
        10: 'Audit',
    };
    
    return moduleNames[moduleId] || `Module ${moduleId}`;
}

// Fonction utilitaire pour obtenir un code de module par ID
export function getModuleCodeById(moduleId) {
    // D'abord, chercher dans le cache des modules
    if (cachedModules.length > 0) {
        const module = cachedModules.find(m => m.id === moduleId);
        if (module && module.code) {
            return module.code;
        }
    }
    
    // Mapping des IDs de modules connus vers des codes
    const moduleCodes = {
        1: 'ADMIN',
        2: 'ITSP',
        3: 'TOKEN',
        4: 'CHARGEBACK',
        5: 'TRANSACTIONS',
        6: 'SECURITY',
        7: 'DASHBOARD',
        8: 'SETTINGS',
        9: 'REPORTS',
        10: 'AUDIT',
    };
    
    return moduleCodes[moduleId] || `MODULE_${moduleId}`;
}

/**
 * Charge tous les menus (sous-modules) depuis l'API
 * @returns {Promise<Array>} Liste des menus
 */
export const loadMenus = async () => {
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!TokenStorage.isTokenValid()) {
            return [];
        }

        // Utiliser l'API pour récupérer les menus
        try {
            const menus = await api.getMenus();
            
            if (menus && Array.isArray(menus)) {
                cachedMenus = menus;
                return menus;
            }
            
            return [];
        } catch (apiError) {
            // Silence 403 errors
            if (apiError.response && apiError.response.status === 403) {
                return [];
            }
            console.error('Erreur lors du chargement des menus:', apiError);
            cachedMenus = [];
            return [];
        }
    } catch (error) {
        cachedMenus = [];
        return [];
    }
};

// Fonction utilitaire pour obtenir un nom de menu plus descriptif par ID
export function getMenuNameById(menuId) {
    // D'abord, chercher dans le cache des menus
    if (cachedMenus.length > 0) {
        const menu = cachedMenus.find(m => m.id === menuId);
        if (menu && menu.title) {
            return menu.title;
        }
    }
    
    // Mapping des IDs de menus connus vers des noms plus descriptifs
    const menuNames = {
        1: 'Profiles',
        2: 'Users',
        3: 'Security',
        4: 'Certificates',
        5: 'Validation',
        6: 'Settings',
        7: 'Tokens',
        8: 'Distribution',
        9: 'Monitoring',
        10: 'Management',
        11: 'Contracts',
        12: 'Billing',
        13: 'Dashboard',
        14: 'Reports',
        15: 'Audit',
    };
    
    return menuNames[menuId] || `Menu ${menuId}`;
}

// Fonction utilitaire pour obtenir un code de menu par ID
export function getMenuCodeById(menuId) {
    // D'abord, chercher dans le cache des menus
    if (cachedMenus.length > 0) {
        const menu = cachedMenus.find(m => m.id === menuId);
        if (menu && menu.code) {
            return menu.code;
        }
    }
    
    // Mapping des IDs de menus connus vers des codes
    const menuCodes = {
        1: 'PROFILES',
        2: 'USERS',
        3: 'SECURITY',
        4: 'CERTIFICATES',
        5: 'VALIDATION',
        6: 'SETTINGS',
        7: 'TOKENS',
        8: 'DISTRIBUTION',
        9: 'MONITORING',
        10: 'MANAGEMENT',
        11: 'CONTRACTS',
        12: 'BILLING',
        13: 'DASHBOARD',
        14: 'REPORTS',
        15: 'AUDIT',
    };
    
    return menuCodes[menuId] || `MENU_${menuId}`;
}

/**
 * Charge à la fois les modules et les menus
 * @returns {Promise<Object>} Objet contenant les modules et menus
 */
export const loadModulesAndMenus = async () => {
    try {
        // Charger les modules et menus en parallèle
        const [modules, menus] = await Promise.all([
            loadModules(),
            loadMenus()
        ]);
        
        return { modules, menus };
    } catch (error) {
        console.error('Erreur lors du chargement des modules et menus:', error);
        return { modules: [], menus: [] };
    }
};

/**
 * Récupère les modules accessibles pour un utilisateur
 * @param {Array} userModuleIds - IDs des modules auxquels l'utilisateur a accès
 * @returns {Array} Modules complets accessibles à l'utilisateur
 */
export const getUserModules = (userModuleIds) => {
    if (!userModuleIds || !Array.isArray(userModuleIds) || userModuleIds.length === 0) {
        return [];
    }
    
    // Normaliser les IDs de modules
    const normalizedIds = userModuleIds.map(moduleId => {
        // Si moduleId est un objet (comme retourné par l'API)
        if (typeof moduleId === 'object' && moduleId !== null) {
            // Retourner directement l'objet module
            return moduleId;
        }
        // Si moduleId est un nombre ou une chaîne
        return typeof moduleId === 'string' && !isNaN(parseInt(moduleId)) 
            ? parseInt(moduleId, 10) 
            : moduleId;
    }).filter(id => id !== undefined && id !== null);
    
    // Si le cache est vide, retourner les modules de l'API directement
    if (cachedModules.length === 0) {
        // Si les modules sont déjà des objets complets (comme retournés par l'API)
        const apiModules = normalizedIds.filter(module => 
            typeof module === 'object' && module !== null && (module.id || module.code || module.title)
        );
        
        if (apiModules.length > 0) {
            return apiModules;
        }
        
        return [];
    }
    
    // Sinon, filtrer les modules du cache
    return normalizedIds.map(moduleId => {
        // Si moduleId est déjà un objet module complet
        if (typeof moduleId === 'object' && moduleId !== null) {
            return moduleId;
        }
        
        // Sinon, chercher dans le cache par ID
        const module = cachedModules.find(m => m.id === moduleId);
        return module || { id: moduleId, code: `MODULE_${moduleId}`, title: `Module ${moduleId}` };
    });
};

/**
 * Récupère les menus accessibles pour un utilisateur
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Menus complets accessibles à l'utilisateur
 */
export const getUserMenus = (userMenuIds) => {
    if (!userMenuIds || !Array.isArray(userMenuIds) || userMenuIds.length === 0) {
        return [];
    }
    
    // Normaliser les IDs de menus
    const normalizedIds = userMenuIds.map(menuId => {
        // Si menuId est un objet (comme retourné par l'API)
        if (typeof menuId === 'object' && menuId !== null) {
            // Retourner directement l'objet menu
            return menuId;
        }
        // Si menuId est un nombre ou une chaîne
        return typeof menuId === 'string' && !isNaN(parseInt(menuId)) 
            ? parseInt(menuId, 10) 
            : menuId;
    }).filter(id => id !== undefined && id !== null);
    
    // Si le cache est vide, retourner les menus de l'API directement
    if (cachedMenus.length === 0) {
        // Si les menus sont déjà des objets complets (comme retournés par l'API)
        const apiMenus = normalizedIds.filter(menu => 
            typeof menu === 'object' && menu !== null && (menu.id || menu.code || menu.title)
        );
        
        if (apiMenus.length > 0) {
            return apiMenus;
        }
        
        return [];
    }
    
    // Sinon, filtrer les menus du cache
    return normalizedIds.map(menuId => {
        // Si menuId est déjà un objet menu complet
        if (typeof menuId === 'object' && menuId !== null) {
            return menuId;
        }
        
        // Sinon, chercher dans le cache par ID
        const menu = cachedMenus.find(m => m.id === menuId);
        return menu || { id: menuId, code: `MENU_${menuId}`, title: `Menu ${menuId}` };
    });
};

/**
 * Construit la structure des modules et sous-modules pour l'interface
 * @param {Array} userModuleIds - IDs des modules auxquels l'utilisateur a accès
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Structure des modules et sous-modules pour l'interface
 */
export const buildModuleStructure = (userModuleIds, userMenuIds) => {
    // Normaliser les données d'entrée
    let normalizedModuleIds = [];
    let normalizedMenus = [];
    
    // Traiter les modules
    if (userModuleIds) {
        if (Array.isArray(userModuleIds)) {
            normalizedModuleIds = userModuleIds;
        } else if (typeof userModuleIds === 'string') {
            try {
                const parsed = JSON.parse(userModuleIds);
                normalizedModuleIds = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Erreur lors du parsing des modules:', e);
                normalizedModuleIds = [];
            }
        }
    }
    
    // Traiter les menus
    if (userMenuIds) {
        if (Array.isArray(userMenuIds)) {
            normalizedMenus = userMenuIds;
        } else if (typeof userMenuIds === 'string') {
            try {
                const parsed = JSON.parse(userMenuIds);
                normalizedMenus = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Erreur lors du parsing des menus:', e);
                normalizedMenus = [];
            }
        }
    }
    
    // Récupérer les modules complets
    const modules = getUserModules(normalizedModuleIds);
    
    // Récupérer les menus complets
    const menus = getUserMenus(normalizedMenus);
    
    // Construire la structure des modules et sous-modules
    const structure = modules.map(module => {
        // Trouver les menus associés à ce module
        const moduleMenus = menus.filter(menu => {
            // Check if menu is associated with this module by moduleId property
            if (menu.moduleId && String(menu.moduleId) === String(module.id)) {
                return true;
            }
            
            // Check if menu is associated with this module by code
            if (menu.moduleCode && module.code && 
                menu.moduleCode.toLowerCase() === module.code.toLowerCase()) {
                return true;
            }
            
            // Check if menu is associated with this module by module property
            if (menu.module && String(menu.module) === String(module.id)) {
                return true;
            }
            
            // For menus from API with module property
            if (normalizedMenus.some(nm => 
                typeof nm === 'object' && nm !== null &&
                nm.id === menu.id && 
                nm.module && 
                String(nm.module) === String(module.id)
            )) {
                return true;
            }
            
            return false;
        });
        
        // Convertir le code du module en chemin URL
        const getModulePath = (code) => {
            if (!code) return 'module';
            
            switch(code.toLowerCase()) {
                case 'lcm': return 'token-manager';
                case 'itcp': return 'issuer-tsp';
                case 'semlali': return 'security';
                case 'token': return 'token-manager';
                case 'chargeback': return 'chargeback';
                case 'transactions': return 'transactions';
                case 'dashboard': return 'dashboard';
                default: return code.toLowerCase();
            }
        };

        // Convertir le code du menu en chemin URL
        const getMenuPath = (code) => {
            if (!code) return 'menu';
            
            switch(code.toLowerCase()) {
                case 'risk_mgmt': return 'risk-management';
                case 'step_up': return 'step-up';
                case 'fraud_team': return 'fraud-team';
                case 'call_center': return 'call-center';
                default: return code.toLowerCase();
            }
        };

        const modulePath = getModulePath(module.code);
        
        return {
            id: module.id,
            code: module.code || `MODULE_${module.id}`,
            title: module.title || module.name || `Module ${module.id}`,
            icon: module.icon || 'dashboard',
            path: module.path || `/dashboard/${modulePath}`,
            submodules: moduleMenus.map(menu => ({
                id: menu.id,
                code: menu.code || `MENU_${menu.id}`,
                title: menu.title || menu.name || `Menu ${menu.id}`,
                path: `/dashboard/${modulePath}/${getMenuPath(menu.code)}`
            }))
        };
    });
    
    return structure;
};

export default {
    loadModules,
    loadMenus,
    loadModulesAndMenus,
    getUserModules,
    getUserMenus,
    buildModuleStructure,
    getModuleNameById,
    getModuleCodeById,
    getMenuNameById,
    getMenuCodeById
};