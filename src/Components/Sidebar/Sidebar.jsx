import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMenu } from "../../context/MenuContext";
import "./Sidebar.css";

const Sidebar = () => {
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const { isMinimized, setIsMinimized } = useMenu();
    const location = useLocation();

    const toggleAdmin = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAdminOpen(!isAdminOpen);
    };

    const toggleMenu = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <div className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
            <div className="sidebar-header">
                <h2>Dashboard</h2>
                <button className="toggle-menu" onClick={toggleMenu}>
                    {isMinimized ? '►' : '◄'}
                </button>
            </div>
            <ul>
                <li className="admin-item">
                    <div className="admin-toggle" onClick={toggleAdmin}>
                        <span className="material-icons">admin_panel_settings</span>
                        <span className="menu-text">Administration {isAdminOpen ? '▼' : '▶'}</span>
                    </div>
                    <ul className={`admin-submenu ${isAdminOpen ? '' : 'open'}`}>
                        <li>
                            <Link to="/dashboard/admin/profiles">
                                <span className="material-icons">person</span>
                                <span className="menu-text">Profiles</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/admin/users">
                                <span className="material-icons">group</span>
                                <span className="menu-text">Users</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/admin/security">
                                <span className="material-icons">security</span>
                                <span className="menu-text">Security</span>
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link to="/dashboard/issuer-tsp">
                        <span className="material-icons">token</span>
                        <span className="menu-text">Issuer TSP</span>
                    </Link>
                </li>
                <li>
                    <Link to="/dashboard/token-manager">
                        <span className="material-icons">manage_accounts</span>
                        <span className="menu-text">Token Manager</span>
                    </Link>
                </li>
                <li>
                    <Link to="/dashboard/clients">
                        <span className="material-icons">business</span>
                        <span className="menu-text">Clients / Institutions</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
