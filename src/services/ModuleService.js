import api from './api';

// Cache pour les modules et menus
let cachedModules = [];
let cachedMenus = [];

/**
 * Charge tous les modules depuis l'API
 * @returns {Promise<Array>} Liste des modules
 */
export const loadModules = async () => {
    try {
        // Utiliser l'API pour récupérer les modules
        const modules = await api.getModules();
        
        if (modules && Array.isArray(modules)) {
            console.log(`${modules.length} modules chargés avec succès`);
            cachedModules = modules;
            return modules;
        }
        
        console.warn("Aucun module n'a été retourné par l'API");
        return [];
    } catch (error) {
        console.error('Erreur lors du chargement des modules:', error);
        return [];
    }
};

/**
 * Charge tous les menus (sous-modules) depuis l'API
 * @returns {Promise<Array>} Liste des menus
 */
export const loadMenus = async () => {
    try {
        // Utiliser l'API pour récupérer les menus
        const menus = await api.getMenus();
        
        if (menus && Array.isArray(menus)) {
            console.log(`${menus.length} menus chargés avec succès`);
            cachedMenus = menus;
            return menus;
        }
        
        console.warn("Aucun menu n'a été retourné par l'API");
        return [];
    } catch (error) {
        console.error('Erreur lors du chargement des menus:', error);
        return [];
    }
};

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
    console.log("getUserModules called with:", userModuleIds);
    console.log("cachedModules available:", cachedModules.length);
    
    if (!userModuleIds || !Array.isArray(userModuleIds) || userModuleIds.length === 0) {
        console.warn("Aucun ID de module fourni");
        return [];
    }
    
    // Vérifier si le cache de modules est vide
    if (cachedModules.length === 0) {
        console.warn("Cache de modules vide - impossible de récupérer les modules");
        return [];
    }
    
    // Filtrer les modules en fonction des IDs fournis
    const modules = cachedModules.filter(module => userModuleIds.includes(module.id));
    console.log(`Trouvé ${modules.length} modules correspondant aux IDs`);
    
    return modules;
};

/**
 * Récupère les menus accessibles pour un utilisateur
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Menus complets accessibles à l'utilisateur
 */
export const getUserMenus = (userMenuIds) => {
    console.log("getUserMenus called with:", userMenuIds);
    console.log("cachedMenus available:", cachedMenus.length);
    
    if (!userMenuIds || !Array.isArray(userMenuIds) || userMenuIds.length === 0) {
        console.warn("Aucun ID de menu fourni");
        return [];
    }
    
    // Vérifier si le cache de menus est vide
    if (cachedMenus.length === 0) {
        console.warn("Cache de menus vide - impossible de récupérer les menus");
        return [];
    }
    
    // Filtrer les menus en fonction des IDs fournis
    const menus = cachedMenus.filter(menu => userMenuIds.includes(menu.id));
    console.log(`Trouvé ${menus.length} menus correspondant aux IDs`);
    
    return menus;
};

/**
 * Construit la structure complète des modules avec leurs sous-menus pour l'utilisateur
 * @param {Array} userModuleIds - IDs des modules auxquels l'utilisateur a accès
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Structure complète pour la sidebar
 */
export const buildModuleStructure = (userModuleIds, userMenuIds) => {
    console.log("buildModuleStructure called with:", { 
        userModuleIds: JSON.stringify(userModuleIds), 
        userMenuIds: JSON.stringify(userMenuIds),
        cachedModules: cachedModules.length,
        cachedMenus: cachedMenus.length
    });
    
    // Normalisation des IDs (peut être des objets ou des nombres)
    const normalizedModuleIds = (userModuleIds || []).map(id => {
        if (typeof id === 'object' && id !== null) {
            return id.id;
        }
        return id;
    }).filter(id => id !== undefined && id !== null);
    
    // Normalisation des menus (peut être des objets avec module ID)
    const normalizedMenus = (userMenuIds || []).map(menu => {
        if (typeof menu === 'object' && menu !== null) {
            return {
                id: menu.id,
                code: menu.code,
                title: menu.title,
                module: menu.module || menu.moduleId
            };
        }
        return { id: menu };
    }).filter(menu => menu.id !== undefined && menu.id !== null);
    
    console.log("Normalized data:", { 
        moduleIds: normalizedModuleIds, 
        menus: normalizedMenus 
    });
    
    // Si aucun module n'est autorisé, ne pas en ajouter automatiquement
    if (normalizedModuleIds.length === 0) {
        console.log("Aucun module autorisé pour cet utilisateur");
        return [];
    }
    
    // Récupérer les modules de l'utilisateur
    const userModules = getUserModules(normalizedModuleIds);
    console.log("Modules récupérés:", userModules);
    
    // Construire la structure complète
    const structure = userModules.map(module => {
        // Filtrer les sous-menus qui appartiennent à ce module
        const moduleMenus = normalizedMenus.filter(menu => 
            menu.module === module.id
        );
        
        console.log(`Menus pour le module ${module.code}:`, moduleMenus);
        
        // Convertir le code du module en chemin URL
        const getModulePath = (code) => {
            switch(code?.toLowerCase()) {
                case 'lcm': return 'token-manager';
                case 'itcp': return 'issuer-tsp';
                default: return code?.toLowerCase();
            }
        };

        // Convertir le code du menu en chemin URL
        const getMenuPath = (code) => {
            switch(code?.toLowerCase()) {
                case 'risk_mgmt': return 'risk-management';
                case 'step_up': return 'step-up';
                case 'fraud_team': return 'fraud-team';
                case 'call_center': return 'call-center';
                default: return code?.toLowerCase();
            }
        };

        const modulePath = getModulePath(module.code);
        
        return {
            id: module.id,
            code: module.code || `MODULE_${module.id}`,
            title: module.title || module.name || `Module ${module.id}`,
            icon: module.icon || 'dashboard',
            // Transformer les menus en sous-modules
            submodules: moduleMenus.map(menu => ({
                id: menu.id,
                code: menu.code || `MENU_${menu.id}`,
                title: menu.title || menu.name || `Menu ${menu.id}`,
                path: `/dashboard/${modulePath}/${getMenuPath(menu.code)}`
            })),
            // Chemin direct pour les modules sans sous-menus
            path: `/dashboard/${modulePath}`
        };
    });
    
    console.log("Structure finale des modules:", structure);
    return structure;
};

export default {
    loadModules,
    loadMenus,
    loadModulesAndMenus,
    getUserModules,
    getUserMenus,
    buildModuleStructure
}; 