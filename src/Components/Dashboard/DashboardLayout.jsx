import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { Outlet } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout; 