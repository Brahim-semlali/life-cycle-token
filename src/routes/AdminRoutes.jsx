import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Profiles from '../Components/Dashboard/Admin/Profiles';
import Users from '../Components/Dashboard/Admin/Users';
import Security from '../Components/Dashboard/Admin/Security';
import Settings from '../Components/Dashboard/Admin/Settings';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="profiles" element={<Profiles />} />
            <Route path="users" element={<Users />} />
            <Route path="security" element={<Security />} />
            <Route path="settings" element={<Settings />} />
        </Routes>
    );
};

export default AdminRoutes; 