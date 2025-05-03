import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMenu } from "../../context/MenuContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const { isMinimized, setIsMinimized } = useMenu();
    const { t } = useTranslation();
    const { checkModuleAccess, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Vérifier si on est dans une route admin
    const isAdminRoute = location.pathname.includes('/dashboard/admin');

    // Ouvrir automatiquement le menu admin si on est sur une route admin
    useEffect(() => {
        if (isAdminRoute && !isMinimized) {
            setIsAdminOpen(true);
        }
    }, [location.pathname, isMinimized]);

    const toggleAdmin = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isMinimized) {
            setIsAdminOpen(!isAdminOpen);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const toggleSidebar = () => {
        setIsMinimized(!isMinimized);
        if (!isMinimized && !isAdminRoute) {
            setIsAdminOpen(false);
        }
    };

    // Ferme le sous-menu admin uniquement si on n'est pas sur une route admin
    useEffect(() => {
        if (isMinimized && !isAdminRoute) {
            setIsAdminOpen(false);
        }
    }, [isMinimized, isAdminRoute]);

    return (
        <div className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
            <button 
                className="toggle-sidebar" 
                onClick={toggleSidebar} 
                title={isMinimized ? t('common.expand') : t('common.collapse')}
                aria-label={isMinimized ? t('common.expand') : t('common.collapse')}
            >
                <span className="material-icons">
                    {isMinimized ? 'chevron_right' : 'chevron_left'}
                </span>
            </button>
            <div className="sidebar-content">
                <div className="sidebar-header">
                    {!isMinimized && <h2>{t('dashboard.title')}</h2>}
                </div>
                <nav>
                    <ul>
                        {checkModuleAccess('administration') && (
                            <li className="admin-item">
                                <div 
                                    className={`admin-toggle ${isAdminRoute ? 'active' : ''}`}
                                    onClick={toggleAdmin}
                                >
                                    <span className="material-icons">admin_panel_settings</span>
                                    <span className="menu-text">{t('admin.title')} {isAdminOpen ? '▼' : '▶'}</span>
                                </div>
                                <ul className={`admin-submenu ${isAdminOpen ? 'open' : ''}`}>
                                    <li>
                                        <Link 
                                            to="/dashboard/admin/profiles"
                                            className={location.pathname === '/dashboard/admin/profiles' ? 'active' : ''}
                                        >
                                            <span className="material-icons">person</span>
                                            <span className="menu-text">{t('profiles.title')}</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/dashboard/admin/users"
                                            className={location.pathname === '/dashboard/admin/users' ? 'active' : ''}
                                        >
                                            <span className="material-icons">group</span>
                                            <span className="menu-text">{t('users.title')}</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/dashboard/admin/security"
                                            className={location.pathname === '/dashboard/admin/security' ? 'active' : ''}
                                        >
                                            <span className="material-icons">security</span>
                                            <span className="menu-text">{t('security.title')}</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        )}
                        
                        {checkModuleAccess('issuerTSP') && (
                            <li>
                                <Link 
                                    to="/dashboard/issuer-tsp"
                                    className={location.pathname === '/dashboard/issuer-tsp' ? 'active' : ''}
                                >
                                    <span className="material-icons">token</span>
                                    <span className="menu-text">{t('issuerTsp.title')}</span>
                                </Link>
                            </li>
                        )}
                        
                        {checkModuleAccess('tokenManager') && (
                            <li>
                                <Link 
                                    to="/dashboard/token-manager"
                                    className={location.pathname === '/dashboard/token-manager' ? 'active' : ''}
                                >
                                    <span className="material-icons">manage_accounts</span>
                                    <span className="menu-text">{t('tokenManager.title')}</span>
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="sidebar-bottom">
                    <Link 
                        to="/dashboard/settings"
                        className={location.pathname === '/dashboard/settings' ? 'active' : ''}
                    >
                        <span className="material-icons">settings</span>
                        <span className="menu-text">{t('settings.title')}</span>
                    </Link>
                    <button onClick={handleLogout}>
                        <span className="material-icons">logout</span>
                        <span className="menu-text">{t('common.logout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
