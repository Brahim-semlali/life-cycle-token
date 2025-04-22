import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

    const toggleAdmin = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAdminOpen(!isAdminOpen);
    };

    const toggleMenu = () => {
        setIsMinimized(!isMinimized);
    };

    const handleLogout = () => {
        logout();
        localStorage.clear(); // Nettoie tout le localStorage
        navigate('/'); // Redirige vers la page de connexion
    };

    return (
        <div className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
            <div className="sidebar-header">
                <h2>{t('dashboard.title')}</h2>
                <button className="toggle-menu" onClick={toggleMenu}>
                    {isMinimized ? '►' : '◄'}
                </button>
            </div>
            <nav>
                <ul>
                    {checkModuleAccess('administration') && (
                        <li className="admin-item">
                            <div className="admin-toggle" onClick={toggleAdmin}>
                                <span className="material-icons">admin_panel_settings</span>
                                <span className="menu-text">{t('admin.title')} {isAdminOpen ? '▼' : '▶'}</span>
                            </div>
                            <ul className={`admin-submenu ${isAdminOpen ? 'open' : ''}`}>
                                <li>
                                    <Link to="/dashboard/admin/profiles">
                                        <span className="material-icons">person</span>
                                        <span className="menu-text">{t('profiles.title')}</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/admin/users">
                                        <span className="material-icons">group</span>
                                        <span className="menu-text">{t('users.title')}</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dashboard/admin/security">
                                        <span className="material-icons">security</span>
                                        <span className="menu-text">{t('security.title')}</span>
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    )}
                    
                    {checkModuleAccess('issuerTSP') && (
                        <li>
                            <Link to="/dashboard/issuer-tsp">
                                <span className="material-icons">token</span>
                                <span className="menu-text">{t('issuerTsp.title')}</span>
                            </Link>
                        </li>
                    )}
                    
                    {checkModuleAccess('tokenManager') && (
                        <li>
                            <Link to="/dashboard/token-manager">
                                <span className="material-icons">manage_accounts</span>
                                <span className="menu-text">{t('tokenManager.title')}</span>
                            </Link>
                        </li>
                    )}
                    
                    {/* Settings est toujours visible pour tous les utilisateurs */}
                    <li>
                        <Link to="/dashboard/settings">
                            <span className="material-icons">settings</span>
                            <span className="menu-text">{t('settings.title')}</span>
                        </Link>
                    </li>

                    {/* Bouton de déconnexion */}
                    <li>
                        <button onClick={handleLogout} style={{ width: '100%', padding: '10px', marginTop: '20px' }}>
                            <span className="material-icons">logout</span>
                            <span className="menu-text">Déconnexion</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
