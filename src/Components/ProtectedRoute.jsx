import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Composant de protection pour les routes qui vérifie les permissions de l'utilisateur
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.children - Les enfants du composant
 * @param {string} props.moduleName - Le nom du module requis pour accéder à la route
 * @param {string} [props.subModuleName] - Le nom du sous-module requis pour accéder à la route (optionnel)
 * @param {string} [props.redirectTo] - La route de redirection en cas d'accès refusé (par défaut: '/login')
 * @returns {React.ReactNode} Le composant protégé ou une redirection
 */
const ProtectedRoute = ({ 
  children, 
  moduleName, 
  subModuleName = null, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, checkModuleAccess, checkSubModuleAccess } = useAuth();
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Vérifier l'accès au module
  const hasModulePermission = checkModuleAccess(moduleName);
  
  // Si un sous-module est spécifié, vérifier également l'accès à ce sous-module
  const hasSubModulePermission = subModuleName 
    ? checkSubModuleAccess(moduleName, subModuleName) 
    : true;
  
  // Si l'utilisateur n'a pas les permissions nécessaires, rediriger
  if (!hasModulePermission || !hasSubModulePermission) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Si l'utilisateur a les permissions nécessaires, afficher le contenu
  return children;
};

export default ProtectedRoute; 