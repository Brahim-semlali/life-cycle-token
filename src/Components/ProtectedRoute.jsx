import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TokenStorage from '../services/TokenStorage';

/**
 * Composant de protection pour les routes qui vérifie les permissions de l'utilisateur et la validité du token JWT
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
  const { isAuthenticated, checkModuleAccess, checkSubModuleAccess, logout } = useAuth();
  const navigate = useNavigate();
  
  // Vérifie la validité du token à chaque rendu de la route protégée
  useEffect(() => {
    // Si le token existe mais est expiré, déconnecter l'utilisateur automatiquement
    if (TokenStorage.getToken() && !TokenStorage.isTokenValid()) {
      console.log('Token expiré détecté, déconnexion automatique');
      logout().then(() => {
        navigate(redirectTo);
      });
    }
  }, [logout, navigate, redirectTo]);
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Vérifier l'accès au module
  // Cas spécial pour ISSUER_TSP: toujours autoriser l'accès
  const hasModulePermission = moduleName === 'ISSUER_TSP' ? true : checkModuleAccess(moduleName);
  
  // Si un sous-module est spécifié, vérifier également l'accès à ce sous-module
  // Cas spécial pour SIM: toujours autoriser l'accès
  const hasSubModulePermission = subModuleName === 'SIM' 
    ? true 
    : (subModuleName 
      ? checkSubModuleAccess(moduleName, subModuleName) 
      : true);
  
  // Si l'utilisateur n'a pas les permissions nécessaires, rediriger
  if (!hasModulePermission || !hasSubModulePermission) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si l'utilisateur a les permissions nécessaires, afficher le contenu
  return children;
};

export default ProtectedRoute; 