import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import Dashboard from "./Components/Dashboard/Dashboard";

// Mapping des composants pour les routes dynamiques
const COMPONENT_MAPPING = {
  // Administration
  'admin/profiles': Profiles,
  'admin/users': Users,
  'admin/security': Security,
  'admin/customer': Customer,
  
  // Token Manager
  'token-manager/risk-management': RiskManagement,
  'token-manager/step-up': StepUp,
  'token-manager/fraud-team': FraudTeam,
  'token-manager/call-center': CallCenter,
  
  // Issuer TSP
  'issuer-tsp/token': Token,
  'issuer-tsp/mdes': MDES,
  'issuer-tsp/vts': VTS,
  
  // Modules sans sous-menus
  'chargeback': ChargeBack,
  'transactions': Transactions,
  'dashboard': Dashboard,
};

// Hook qui génère dynamiquement les routes en fonction des modules et sous-menus de l'API
const useDynamicRoutes = () => {
  const { allModules, allMenus, userModules, userMenus } = useAuth();
  const [dynamicRoutes, setDynamicRoutes] = useState([]);
  
  useEffect(() => {
    const generateRoutes = async () => {
      if (allModules.length > 0 && allMenus.length > 0) {
        const structure = ModuleService.buildModuleStructure(
          userModules.length > 0 ? userModules : allModules.map(m => m.id),
          userMenus.length > 0 ? userMenus : allMenus.map(m => m.id)
        );
        
        const routes = [];
        
        structure.forEach(module => {
          const moduleCode = module.code?.toLowerCase();
          let modulePath = moduleCode;
          
          // Convertir les codes en chemins URL valides
          switch(moduleCode) {
            case 'lcm':
              modulePath = 'token-manager';
              break;
            case 'itcp':
              modulePath = 'issuer-tsp';
              break;
            default:
              modulePath = moduleCode;
          }

          if (!module.submodules || module.submodules.length === 0) {
            const path = `/dashboard/${modulePath}`;
            const Component = COMPONENT_MAPPING[modulePath] || (() => <div>Module {module.title}</div>);
            
            routes.push(
              <Route key={path} path={path} element={<Component />} />
            );
          } else {
            module.submodules.forEach(submenu => {
              const menuCode = submenu.code?.toLowerCase();
              let menuPath = menuCode;
              
              // Convertir les codes de menu en chemins URL valides
              switch(menuCode) {
                case 'risk_mgmt':
                  menuPath = 'risk-management';
                  break;
                case 'step_up':
                  menuPath = 'step-up';
                  break;
                case 'fraud_team':
                  menuPath = 'fraud-team';
                  break;
                case 'call_center':
                  menuPath = 'call-center';
                  break;
                default:
                  menuPath = menuCode.toLowerCase();
              }

              const path = `/dashboard/${modulePath}/${menuPath}`;
              const mappingKey = `${modulePath}/${menuPath}`;
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

// Composant pour gérer la redirection intelligente du dashboard
const DashboardIndex = () => {
  const { allModules, allMenus, userModules, userMenus, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToFirstAvailablePage = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Redirect to Dashboard page by default
      navigate('/dashboard/dashboard');
      setIsLoading(false);
      return;

      // Original redirection logic below (commented out)
      /*
      // Attendre un court instant pour s'assurer que les modules sont chargés
      if (userModules.length === 0 && allModules.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Construire la structure des modules pour l'utilisateur
      const structure = ModuleService.buildModuleStructure(
        userModules.length > 0 ? userModules : allModules.map(m => m.id),
        userMenus.length > 0 ? userMenus : allMenus.map(m => m.id)
      );

      console.log("Structure disponible pour la redirection:", structure);

      // Trouver le premier module accessible avec ses sous-modules
      if (structure.length > 0) {
        const firstModule = structure[0];
        console.log("Premier module trouvé:", firstModule);

        if (firstModule.submodules && firstModule.submodules.length > 0) {
          // Rediriger vers le premier sous-module du premier module
          const firstSubmodule = firstModule.submodules[0];
          console.log("Redirection vers le premier sous-module:", firstSubmodule.path);
          navigate(firstSubmodule.path);
        } else {
          // Rediriger vers le module lui-même s'il n'a pas de sous-modules
          console.log("Redirection vers le module:", firstModule.path);
          navigate(firstModule.path);
        }
      } else {
        // Si toujours aucun module n'est accessible après l'attente
        console.log("Aucun module accessible trouvé - redirection vers settings");
        navigate('/dashboard/settings');
      }
      setIsLoading(false);
      */
    };

    redirectToFirstAvailablePage();
  }, [userModules, userMenus, allModules, allMenus, navigate, isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Chargement...
      </div>
    );
  }

  return null;
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
          <Route index element={<DashboardIndex />} />
          
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
          
          {/* Fix for token route mismatch */}
          <Route path="token/token" element={<Navigate to="/dashboard/issuer-tsp/token" replace />} />
          
          <Route path="chargeback" element={<ChargeBack />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="settings" element={<Settings />} />
          
          {/* Routes dynamiques générées depuis l'API */}
          {dynamicRoutes}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
