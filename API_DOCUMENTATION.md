# Titrit Technologies - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Authentication APIs](#authentication-apis)
4. [User Management APIs](#user-management-apis)
5. [Core Services](#core-services)
6. [React Context APIs](#react-context-apis)
7. [Components](#components)
8. [Custom Hooks](#custom-hooks)
9. [Routing and Protection](#routing-and-protection)
10. [Internationalization](#internationalization)
11. [Getting Started](#getting-started)
12. [Examples](#examples)

## Overview

Titrit Technologies is a comprehensive React-based fintech platform for payment tokenization management. The application provides secure token management, user administration, risk management, and integration with various payment networks including MDES and VTS.

### Technology Stack

- **Frontend**: React 18.2.0
- **UI Libraries**: Material-UI (MUI), Ant Design, Radix UI
- **State Management**: TanStack Query, React Context
- **Routing**: React Router DOM 7.5.0
- **Authentication**: JWT with automatic refresh
- **HTTP Client**: Axios
- **Testing**: Playwright, Jest
- **Internationalization**: i18next

## Project Architecture

```
src/
├── Components/           # React components
│   ├── Dashboard/       # Dashboard modules
│   │   ├── Admin/       # Admin management
│   │   ├── TokenManager/# Token management
│   │   └── IssuerTSP/   # TSP operations
│   ├── LoginForm/       # Authentication UI
│   └── Sidebar/         # Navigation
├── context/             # React contexts
├── hooks/               # Custom hooks
├── services/            # API services
├── routes/              # Route configurations
└── locales/             # Translation files
```

## Authentication APIs

### AuthService

The `AuthService` class provides authentication functionality with JWT token management.

#### Methods

##### `login(email, password)`

Authenticates a user and stores JWT tokens.

```javascript
import authService from './services/AuthService';

// Usage
try {
  const user = await authService.login('user@example.com', 'password');
  console.log('Logged in user:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** `Promise<Object>` - User object with profile information

**Throws:** Authentication error if credentials are invalid

##### `logout()`

Logs out the current user and clears stored tokens.

```javascript
// Usage
try {
  await authService.logout();
  console.log('User logged out successfully');
} catch (error) {
  console.error('Logout error:', error.message);
}
```

**Returns:** `Promise<boolean>` - Success status

##### `getCurrentUser()`

Retrieves the current authenticated user's information.

```javascript
// Usage
const user = await authService.getCurrentUser();
if (user) {
  console.log('Current user:', user);
} else {
  console.log('No authenticated user');
}
```

**Returns:** `Promise<Object|null>` - User object or null if not authenticated

##### `isAuthenticated()`

Checks if the user is currently authenticated.

```javascript
// Usage
if (authService.isAuthenticated()) {
  console.log('User is authenticated');
} else {
  console.log('User is not authenticated');
}
```

**Returns:** `boolean` - Authentication status

##### `getTokenRemainingTime()`

Gets the remaining time before token expiration.

```javascript
// Usage
const remainingTime = authService.getTokenRemainingTime();
console.log(`Token expires in: ${remainingTime}ms`);
```

**Returns:** `number` - Remaining time in milliseconds

## User Management APIs

### UserService

The `UserService` class handles user management operations.

#### Methods

##### `getAllUsers()`

Retrieves all users with their associated profiles.

```javascript
import UserService from './services/UserService';

// Usage
try {
  const users = await UserService.getAllUsers();
  console.log('All users:', users);
} catch (error) {
  console.error('Error fetching users:', error);
}
```

**Returns:** `Promise<Array>` - Array of user objects with profile associations

**User Object Structure:**
```javascript
{
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  fullName: string,
  profileId: number,
  profile: Object,
  status: string
}
```

##### `createUser(userData)`

Creates a new user in the system.

```javascript
// Usage
const newUserData = {
  email: 'newuser@example.com',
  firstName: 'John',
  lastName: 'Doe',
  profileId: 1,
  status: 'ACTIVE'
};

try {
  const createdUser = await UserService.createUser(newUserData);
  console.log('User created:', createdUser);
} catch (error) {
  console.error('Error creating user:', error);
}
```

**Parameters:**
- `userData` (Object): User data object

**Required Fields:**
- `email` (string): User's email address
- `firstName` (string): User's first name
- `lastName` (string): User's last name

**Optional Fields:**
- `profileId` (number): Associated profile ID
- `status` (string): User status ('ACTIVE', 'INACTIVE')
- `password` (string): User's password (defaults to system-generated)

**Returns:** `Promise<Object>` - Created user object

## Core Services

### API Service

The main `api` service provides centralized HTTP communication with comprehensive error handling and authentication.

#### Configuration

```javascript
import api from './services/api';

// Configuration options
api.baseURL = 'https://your-api-server.com';
api.debugMode = true; // Enable debug logging
```

#### Core Methods

##### `getUserLanguage()`

Retrieves the current user's language preference.

```javascript
// Usage
try {
  const languageData = await api.getUserLanguage();
  console.log('User language:', languageData.language);
} catch (error) {
  console.error('Error getting language:', error);
}
```

**Returns:** `Promise<Object>` - Object with language code

##### `updateUserLanguage(language)`

Updates the user's language preference.

```javascript
// Usage
try {
  await api.updateUserLanguage('FR');
  console.log('Language updated successfully');
} catch (error) {
  console.error('Error updating language:', error);
}
```

**Parameters:**
- `language` (string): Language code ('EN', 'FR', 'AR')

**Returns:** `Promise<Object>` - Updated language data

### TokenService

Manages token operations and lifecycle.

#### Key Features
- Automatic token refresh
- Secure token storage
- Token validation
- Expiration handling

```javascript
import TokenStorage from './services/TokenStorage';

// Check token validity
if (TokenStorage.isTokenValid()) {
  console.log('Token is valid');
}

// Get user data
const user = TokenStorage.getUser();

// Get remaining time
const timeLeft = TokenStorage.getTimeToExpiry();
```

### ModuleService

Handles module and menu management for role-based access control.

```javascript
import ModuleService from './services/ModuleService';

// Load modules and menus
await ModuleService.loadModulesAndMenus();

// Check access
const hasAccess = ModuleService.checkModuleAccess('ADMIN');
```

## React Context APIs

### AuthContext

Provides authentication state and methods throughout the application.

#### Hook Usage

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const {
    user,
    userModules,
    userMenus,
    isAuthenticated,
    checkModuleAccess,
    checkSubModuleAccess,
    login,
    logout
  } = useAuth();

  // Check authentication
  if (!isAuthenticated()) {
    return <div>Please log in</div>;
  }

  // Check module access
  const canAccessAdmin = checkModuleAccess('ADMIN');
  
  // Check sub-module access
  const canAccessUsers = checkSubModuleAccess('ADMIN', 'USERS');

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      {canAccessAdmin && <AdminPanel />}
    </div>
  );
}
```

#### Context Properties

- `user` (Object): Current user information
- `userModules` (Array): User's accessible modules
- `userMenus` (Array): User's accessible menu items
- `allModules` (Array): All available modules
- `allMenus` (Array): All available menu items

#### Context Methods

- `isAuthenticated()`: Check if user is authenticated
- `checkModuleAccess(moduleName)`: Check module access
- `checkSubModuleAccess(moduleName, subModuleName)`: Check sub-module access
- `login(credentials)`: Login user
- `logout()`: Logout user

### ThemeContext

Manages application theme state.

```javascript
import { useTheme } from './context/ThemeContext';

function ThemedComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`theme-${theme}`}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} theme
      </button>
    </div>
  );
}
```

### LanguageContext

Handles internationalization and language switching.

```javascript
import { useLanguage } from './context/LanguageContext';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {availableLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### MenuContext

Manages navigation menu state.

```javascript
import { useMenu } from './context/MenuContext';

function NavigationMenu() {
  const { isMenuOpen, toggleMenu, closeMenu } = useMenu();
  
  return (
    <nav className={isMenuOpen ? 'menu-open' : 'menu-closed'}>
      <button onClick={toggleMenu}>Toggle Menu</button>
      {/* Menu items */}
    </nav>
  );
}
```

## Components

### ProtectedRoute

A higher-order component that protects routes based on user permissions.

#### Props

- `children` (ReactNode): The component to render if access is granted
- `moduleName` (string): Required module name for access
- `subModuleName` (string, optional): Required sub-module name
- `redirectTo` (string, optional): Redirect path if access denied (default: '/login')

#### Usage

```javascript
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      
      {/* Protected admin route */}
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute 
            moduleName="ADMIN" 
            subModuleName="USERS"
            redirectTo="/dashboard"
          >
            <UsersComponent />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected token management route */}
      <Route 
        path="/token-manager" 
        element={
          <ProtectedRoute moduleName="TOKEN_MANAGER">
            <TokenManagerComponent />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### PermissionBasedMenu

Renders menu items based on user permissions.

#### Usage

```javascript
import PermissionBasedMenu from './Components/PermissionBasedMenu';

function Sidebar() {
  return (
    <aside>
      <PermissionBasedMenu 
        userModules={userModules}
        userMenus={userMenus}
        onMenuClick={handleMenuClick}
      />
    </aside>
  );
}
```

### Dashboard Components

#### Dashboard

Main dashboard component with overview widgets.

```javascript
import Dashboard from './Components/Dashboard/Dashboard';

function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
```

#### Admin Components

##### Users

User management component with CRUD operations.

```javascript
import Users from './Components/Dashboard/Admin/Users';

function UsersPage() {
  return (
    <ProtectedRoute moduleName="ADMIN" subModuleName="USERS">
      <Users />
    </ProtectedRoute>
  );
}
```

##### Profiles

Profile management for role-based access control.

```javascript
import Profiles from './Components/Dashboard/Admin/Profiles';

function ProfilesPage() {
  return (
    <ProtectedRoute moduleName="ADMIN" subModuleName="PROFILES">
      <Profiles />
    </ProtectedRoute>
  );
}
```

##### Security

Security settings and audit logs.

```javascript
import Security from './Components/Dashboard/Admin/Security';

function SecurityPage() {
  return (
    <ProtectedRoute moduleName="ADMIN" subModuleName="SECURITY">
      <Security />
    </ProtectedRoute>
  );
}
```

#### Token Manager Components

##### RiskManagement

Risk assessment and management tools.

```javascript
import RiskManagement from './Components/Dashboard/TokenManager/RiskManagement';

function RiskPage() {
  return (
    <ProtectedRoute moduleName="TOKEN_MANAGER" subModuleName="RISK">
      <RiskManagement />
    </ProtectedRoute>
  );
}
```

##### StepUp

Step-up authentication management.

```javascript
import StepUp from './Components/Dashboard/TokenManager/StepUp';

function StepUpPage() {
  return (
    <ProtectedRoute moduleName="TOKEN_MANAGER" subModuleName="STEPUP">
      <StepUp />
    </ProtectedRoute>
  );
}
```

#### Issuer TSP Components

##### TokenList

Comprehensive token listing and management.

```javascript
import TokenList from './Components/Dashboard/IssuerTSP/TokenList';

function TokenListPage() {
  return (
    <ProtectedRoute moduleName="ISSUER_TSP">
      <TokenList />
    </ProtectedRoute>
  );
}
```

##### Simulateur

Token simulation and testing environment.

```javascript
import Simulateur from './Components/Dashboard/IssuerTSP/Simulateur';

function SimulatorPage() {
  return (
    <ProtectedRoute moduleName="ISSUER_TSP" subModuleName="SIM">
      <Simulateur />
    </ProtectedRoute>
  );
}
```

## Custom Hooks

### useSidebarDesign

Manages sidebar design preferences with localStorage persistence.

#### Usage

```javascript
import useSidebarDesign from './hooks/useSidebarDesign';

function Sidebar() {
  const sidebarDesign = useSidebarDesign();
  
  return (
    <aside className={`sidebar sidebar-${sidebarDesign}`}>
      {/* Sidebar content */}
    </aside>
  );
}

// To change the design
function DesignSwitcher() {
  const changeSidebarDesign = (newDesign) => {
    localStorage.setItem('sidebarDesign', newDesign);
    window.dispatchEvent(
      new CustomEvent('sidebarDesignChange', { detail: newDesign })
    );
  };
  
  return (
    <div>
      <button onClick={() => changeSidebarDesign('modern')}>
        Modern Design
      </button>
      <button onClick={() => changeSidebarDesign('classic')}>
        Classic Design
      </button>
    </div>
  );
}
```

#### Features

- Automatic localStorage persistence
- Event-driven updates
- Default fallback value
- Cross-component synchronization

## Routing and Protection

### Route Configuration

The application uses React Router with dynamic route mapping:

```javascript
// Component mapping for dynamic routes
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
  'issuer-tsp/sim': Simulateur,
  
  // Other modules
  'chargeback': ChargeBack,
  'transactions': Transactions
};
```

### Protected Route Implementation

```javascript
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <MenuProvider>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute moduleName="DASHBOARD">
                    <DashboardLayout />
                  </ProtectedRoute>
                } />
                
                {/* Dynamic protected routes */}
                {Object.entries(COMPONENT_MAPPING).map(([path, Component]) => (
                  <Route
                    key={path}
                    path={`/${path}`}
                    element={
                      <ProtectedRoute moduleName={getModuleName(path)}>
                        <Component />
                      </ProtectedRoute>
                    }
                  />
                ))}
              </Routes>
            </MenuProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
```

## Internationalization

### i18n Configuration

The application supports multiple languages with automatic detection:

#### Setup

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });
```

#### Usage in Components

```javascript
import { useTranslation } from 'react-i18next';

function WelcomeMessage() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.message', { name: 'John' })}</p>
      
      <div>
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('fr')}>Français</button>
        <button onClick={() => changeLanguage('ar')}>العربية</button>
      </div>
    </div>
  );
}
```

#### Translation Files Structure

```
src/locales/
├── en/
│   ├── common.json
│   ├── dashboard.json
│   └── admin.json
├── fr/
│   ├── common.json
│   ├── dashboard.json
│   └── admin.json
└── ar/
    ├── common.json
    ├── dashboard.json
    └── admin.json
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- HTTPS certificates for local development

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd titrit-technologies

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API configuration

# Generate HTTPS certificates for local development
# Place localhost.pem and localhost-key.pem in the root directory

# Start the development server
npm start
```

### Environment Variables

```env
# API Configuration
REACT_APP_API_URL=https://localhost:8000

# SSL Configuration (for development)
HTTPS=true
SSL_CRT_FILE=./localhost.pem
SSL_KEY_FILE=./localhost-key.pem
PORT=3001
```

### Build for Production

```bash
# Build the application
npm run build

# The build files will be in the 'build' directory
```

### Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run specific test suites
npm run test:login
npm run test:profiles
npm run test:users

# Run all tests
npm run test:all
```

## Examples

### Complete Authentication Flow

```javascript
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginExample() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials.email, credentials.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials(prev => ({
          ...prev,
          email: e.target.value
        }))}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({
          ...prev,
          password: e.target.value
        }))}
        required
      />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### User Management with Error Handling

```javascript
import React, { useState, useEffect } from 'react';
import UserService from './services/UserService';

function UserManagementExample() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await UserService.getAllUsers();
      setUsers(userList);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const createUser = async (userData) => {
    try {
      const newUser = await UserService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  };
  
  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Users ({users.length})</h2>
      
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.fullName}</h3>
            <p>Email: {user.email}</p>
            <p>Profile: {user.profile?.name || 'No profile assigned'}</p>
            <p>Status: {user.status}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => createUser({
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        profileId: 1
      })}>
        Add Test User
      </button>
    </div>
  );
}
```

### Multi-language Component

```javascript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './context/LanguageContext';

function MultiLanguageExample() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];
  
  return (
    <div className={`content ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('dashboard.welcome')}</h1>
      
      <div className="language-selector">
        <label>{t('settings.language')}:</label>
        <select 
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="dashboard-content">
        <p>{t('dashboard.description')}</p>
        <button>{t('common.actions.continue')}</button>
      </div>
    </div>
  );
}
```

### Permission-based Rendering

```javascript
import React from 'react';
import { useAuth } from './context/AuthContext';

function PermissionExample() {
  const { 
    user, 
    checkModuleAccess, 
    checkSubModuleAccess 
  } = useAuth();
  
  // Check various permissions
  const canViewAdmin = checkModuleAccess('ADMIN');
  const canManageUsers = checkSubModuleAccess('ADMIN', 'USERS');
  const canViewTokens = checkModuleAccess('ISSUER_TSP');
  const canSimulate = checkSubModuleAccess('ISSUER_TSP', 'SIM');
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      
      <nav>
        {canViewAdmin && (
          <div className="nav-section">
            <h3>Administration</h3>
            {canManageUsers && (
              <a href="/admin/users">Manage Users</a>
            )}
            <a href="/admin/profiles">Manage Profiles</a>
          </div>
        )}
        
        {canViewTokens && (
          <div className="nav-section">
            <h3>Token Management</h3>
            <a href="/issuer-tsp/token">Token List</a>
            {canSimulate && (
              <a href="/issuer-tsp/sim">Simulator</a>
            )}
          </div>
        )}
      </nav>
      
      <div className="user-info">
        <h3>Your Permissions:</h3>
        <ul>
          <li>Admin Access: {canViewAdmin ? '✅' : '❌'}</li>
          <li>User Management: {canManageUsers ? '✅' : '❌'}</li>
          <li>Token Access: {canViewTokens ? '✅' : '❌'}</li>
          <li>Simulation: {canSimulate ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
}
```

---

This documentation covers all public APIs, components, and services in the Titrit Technologies platform. For additional support or questions, please refer to the existing README.md and POSTMAN_API_TESTING.md files in the project root.