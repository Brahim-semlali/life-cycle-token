import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { MenuProvider } from './context/MenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ModuleService from './services/ModuleService';
import './App.css';
import LoginForm from "./Components/LoginForm/LoginForm";
import DashboardLayout from "./Components/Dashboard/DashboardLayout";
import Profiles from "./Components/Dashboard/Admin/Profiles";
import Security from "./Components/Dashboard/Admin/Security";
import Users from "./Components/Dashboard/Admin/Users";
import Customer from "./Components/Dashboard/Admin/Customer";
import Settings from "./Components/Dashboard/Settings";
import RiskManagement from "./Components/Dashboard/TokenManager/RiskManagement";
import StepUp from "./Components/Dashboard/TokenManager/StepUp";
import FraudTeam from "./Components/Dashboard/TokenManager/FraudTeam";
import CallCenter from "./Components/Dashboard/TokenManager/CallCenter";
import Token from "./Components/Dashboard/IssuerTSP/Token";
import MDES from "./Components/Dashboard/IssuerTSP/MDES";
import VTS from "./Components/Dashboard/IssuerTSP/VTS";
import ChargeBack from "./Components/Dashboard/ChargeBack";
import Transactions from "./Components/Dashboard/Transactions";

// Mapping des composants pour les routes dynamiques
const COMPONENT_MAPPING = {
  // Administration
  'ADMIN/PROFILES': Profiles,
  'ADMIN/USERS': Users,
  'ADMIN/SECURITY': Security,
  'ADMIN/CUSTOMER': Customer,
  
  // Token Manager
  'LCM/RISK_MGMT': RiskManagement,
  'LCM/STEP_UP': StepUp,
  'LCM/FRAUD_TEAM': FraudTeam,
  'LCM/CALL_CENTER': CallCenter,
  
  // Issuer TSP
  'ITCP/TOKEN': Token,
  'ITCP/MDES': MDES,
  'ITCP/VTS': VTS,
  
  // Modules sans sous-menus
  'CHARGEBACK': ChargeBack,
  'TRANSACTIONS': Transactions,
};

// Hook qui génère dynamiquement les routes en fonction des modules et sous-menus de l'API
const useDynamicRoutes = () => {
  const { allModules, allMenus, userModules, userMenus } = useAuth();
  const [dynamicRoutes, setDynamicRoutes] = useState([]);
  
  useEffect(() => {
    const generateRoutes = async () => {
      // Si nous avons des modules et des menus
      if (allModules.length > 0 && allMenus.length > 0) {
        // Construire la structure des modules et sous-menus
        const structure = ModuleService.buildModuleStructure(
          // En mode développement, utiliser tous les modules
          userModules.length > 0 ? userModules : allModules.map(m => m.id),
          // Et tous les menus
          userMenus.length > 0 ? userMenus : allMenus.map(m => m.id)
        );
        
        // Générer les routes
        const routes = [];
        
        structure.forEach(module => {
          // Pour les modules sans sous-menus, ajouter une route directe
          if (!module.submodules || module.submodules.length === 0) {
            const path = `/dashboard/${module.code.toLowerCase()}`;
            const Component = COMPONENT_MAPPING[module.code] || (() => <div>Module {module.title}</div>);
            
            routes.push(
              <Route key={path} path={path} element={<Component />} />
            );
          } else {
            // Pour les modules avec sous-menus, ajouter une route pour chaque sous-menu
            module.submodules.forEach(submenu => {
              const path = submenu.path || `/dashboard/${module.code.toLowerCase()}/${submenu.code.toLowerCase()}`;
              const mappingKey = `${module.code}/${submenu.code}`;
              const Component = COMPONENT_MAPPING[mappingKey] || (() => <div>Sous-menu {submenu.title}</div>);
              
              routes.push(
                <Route key={path} path={path} element={<Component />} />
              );
            });
          }
        });
        
        setDynamicRoutes(routes);
      }
    };
    
    generateRoutes();
  }, [allModules, allMenus, userModules, userMenus]);
  
  return dynamicRoutes;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <MenuProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </MenuProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

function AppContent() {
  const { t } = useTranslation();
  document.title = t('app.title');
  
  // Utiliser le hook pour générer les routes dynamiques
  const dynamicRoutes = useDynamicRoutes();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/admin/profiles" replace />} />
          
          {/* Routes statiques */}
          <Route path="admin/profiles" element={<Profiles />} />
          <Route path="admin/users" element={<Users />} />
          <Route path="admin/security" element={<Security />} />
          <Route path="admin/customer" element={<Customer />} />
          
          <Route path="token-manager/risk-management" element={<RiskManagement />} />
          <Route path="token-manager/step-up" element={<StepUp />} />
          <Route path="token-manager/fraud-team" element={<FraudTeam />} />
          <Route path="token-manager/call-center" element={<CallCenter />} />
          
          <Route path="issuer-tsp/token" element={<Token />} />
          <Route path="issuer-tsp/mdes" element={<MDES />} />
          <Route path="issuer-tsp/vts" element={<VTS />} />
          
          <Route path="chargeback" element={<ChargeBack />} />
          <Route path="transactions" element={<Transactions />} />
          
          <Route path="settings" element={<Settings />} />
          
          {/* Routes dynamiques générées depuis l'API */}
          {dynamicRoutes}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
