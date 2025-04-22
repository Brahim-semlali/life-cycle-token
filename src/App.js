import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { MenuProvider } from './context/MenuContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import LoginForm from "./Components/LoginForm/LoginForm";
import DashboardLayout from "./Components/Dashboard/DashboardLayout";
import Profiles from "./Components/Dashboard/Admin/Profiles";
import Security from "./Components/Dashboard/Admin/Security";
import Users from "./Components/Dashboard/Admin/Users";
import Settings from "./Components/Dashboard/Settings/Settings";
import IssuerTSP from "./Components/Dashboard/IssuerTSP";
import TokenManager from "./Components/Dashboard/TokenManager";

function App() {
    const { i18n } = useTranslation();

    useEffect(() => {
        // Set initial direction based on language
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    return (
        <AuthProvider>
            <ThemeProvider>
                <LanguageProvider>
                    <MenuProvider>
                        <Router>
                            <Routes>
                                <Route path="/" element={<LoginForm />} />
                                <Route path="/dashboard" element={<DashboardLayout />}>
                                    <Route path="admin/profiles" element={<Profiles />} />
                                    <Route path="admin/security" element={<Security />} />
                                    <Route path="admin/users" element={<Users />} />
                                    <Route path="issuer-tsp" element={<IssuerTSP />} />
                                    <Route path="token-manager" element={<TokenManager />} />
                                    <Route path="settings" element={<Settings />} />
                                </Route>
                            </Routes>
                        </Router>
                    </MenuProvider>
                </LanguageProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
