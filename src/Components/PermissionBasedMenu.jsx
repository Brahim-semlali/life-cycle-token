import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Composant qui affiche les éléments de menu en fonction des permissions de l'utilisateur
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.className - Classe CSS pour le conteneur du menu
 * @returns {React.ReactNode} Le menu filtré selon les permissions
 */
const PermissionBasedMenu = ({ className = '' }) => {
  const { checkModuleAccess, checkSubModuleAccess } = useAuth();
  const { t } = useTranslation();
  
  // Structure du menu avec les permissions requises
  const menuStructure = [
    {
      title: t('modules.administration.title'),
      icon: 'admin_panel_settings',
      module: 'administration',
      subItems: [
        {
          title: t('modules.administration.profiles'),
          path: '/admin/profiles',
          subModule: 'profiles'
        },
        {
          title: t('modules.administration.users'),
          path: '/admin/users',
          subModule: 'users'
        },
        {
          title: t('modules.administration.security'),
          path: '/admin/security',
          subModule: 'security'
        }
      ]
    },
    {
      title: t('modules.issuerTSP.title'),
      icon: 'verified',
      module: 'issuerTSP',
      subItems: [
        {
          title: t('modules.issuerTSP.certificates'),
          path: '/issuer-tsp/certificates',
          subModule: 'certificates'
        },
        {
          title: t('modules.issuerTSP.validation'),
          path: '/issuer-tsp/validation',
          subModule: 'validation'
        },
        {
          title: t('modules.issuerTSP.settings'),
          path: '/issuer-tsp/settings',
          subModule: 'settings'
        }
      ]
    },
    {
      title: t('modules.tokenManager.title'),
      icon: 'key',
      module: 'tokenManager',
      subItems: [
        {
          title: t('modules.tokenManager.tokens'),
          path: '/token-manager/tokens',
          subModule: 'tokens'
        },
        {
          title: t('modules.tokenManager.distribution'),
          path: '/token-manager/distribution',
          subModule: 'distribution'
        },
        {
          title: t('modules.tokenManager.monitoring'),
          path: '/token-manager/monitoring',
          subModule: 'monitoring'
        }
      ]
    },
    {
      title: t('modules.clients.title'),
      icon: 'people',
      module: 'clients',
      subItems: [
        {
          title: t('modules.clients.management'),
          path: '/clients/management',
          subModule: 'management'
        },
        {
          title: t('modules.clients.contracts'),
          path: '/clients/contracts',
          subModule: 'contracts'
        },
        {
          title: t('modules.clients.billing'),
          path: '/clients/billing',
          subModule: 'billing'
        }
      ]
    }
  ];
  
  // Filtrer les éléments du menu en fonction des permissions
  const filteredMenu = menuStructure.filter(item => {
    // Vérifier si l'utilisateur a accès au module
    const hasModuleAccess = checkModuleAccess(item.module);
    
    // Si l'utilisateur a accès au module, vérifier s'il a accès à au moins un sous-module
    if (hasModuleAccess) {
      const hasAnySubModuleAccess = item.subItems.some(subItem => 
        checkSubModuleAccess(item.module, subItem.subModule)
      );
      
      return hasAnySubModuleAccess;
    }
    
    return false;
  });
  
  return (
    <div className={`permission-based-menu ${className}`}>
      {filteredMenu.map((item, index) => (
        <div key={index} className="menu-section">
          <div className="menu-section-header">
            <span className="material-icons">{item.icon}</span>
            <h3>{item.title}</h3>
          </div>
          <ul className="menu-items">
            {item.subItems
              .filter(subItem => checkSubModuleAccess(item.module, subItem.subModule))
              .map((subItem, subIndex) => (
                <li key={subIndex} className="menu-item">
                  <Link to={subItem.path}>
                    {subItem.title}
                  </Link>
                </li>
              ))
            }
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PermissionBasedMenu; 