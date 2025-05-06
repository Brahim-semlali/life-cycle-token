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
    if (!userModuleIds || !Array.isArray(userModuleIds)) {
        return [];
    }
    
    return cachedModules.filter(module => userModuleIds.includes(module.id));
};

/**
 * Récupère les menus accessibles pour un utilisateur
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Menus complets accessibles à l'utilisateur
 */
export const getUserMenus = (userMenuIds) => {
    if (!userMenuIds || !Array.isArray(userMenuIds)) {
        return [];
    }
    
    return cachedMenus.filter(menu => userMenuIds.includes(menu.id));
};

/**
 * Construit la structure complète des modules avec leurs sous-menus pour l'utilisateur
 * @param {Array} userModuleIds - IDs des modules auxquels l'utilisateur a accès
 * @param {Array} userMenuIds - IDs des menus auxquels l'utilisateur a accès
 * @returns {Array} Structure complète pour la sidebar
 */
export const buildModuleStructure = (userModuleIds, userMenuIds) => {
    // Récupérer les modules et menus de l'utilisateur
    const userModules = getUserModules(userModuleIds);
    const userMenus = getUserMenus(userMenuIds);
    
    // Construire la structure complète
    return userModules.map(module => ({
        id: module.id,
        code: module.code || `MODULE_${module.id}`,
        title: module.title || module.name || `Module ${module.id}`,
        icon: module.icon || 'dashboard',
        // Filtrer les sous-menus qui appartiennent à ce module
        submodules: userMenus
            .filter(menu => menu.moduleId === module.id || menu.module === module.id)
            .map(menu => ({
                id: menu.id,
                code: menu.code || `MENU_${menu.id}`,
                title: menu.title || menu.name || `Menu ${menu.id}`,
                path: menu.path || `/dashboard/${module.code?.toLowerCase()}/${menu.code?.toLowerCase()}`
            })),
        // Chemin direct pour les modules sans sous-menus
        path: `/dashboard/${module.code?.toLowerCase()}`
    }));
};

export default {
    loadModules,
    loadMenus,
    loadModulesAndMenus,
    getUserModules,
    getUserMenus,
    buildModuleStructure
}; 