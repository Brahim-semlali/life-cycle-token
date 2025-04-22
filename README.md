# Titrit Technologies Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [User Management](#user-management)
5. [Getting Started](#getting-started)

## Overview
This project is a web application developed with React.js, implementing a modern user interface with authentication, user management, and dashboard features.

## Technologies Used

### Frontend
- **React.js** (v19.1.0) - JavaScript framework for building user interfaces
- **React Router DOM** (v7.5.0) - Routing management in the application
- **Axios** (v1.8.4) - HTTP client for API requests
- **React Icons** (v5.5.0) - Icon library
- **CSS Modules** - For component styling

### Development Tools
- **Create React App** - Initial project setup
- **ESLint** - Code linting
- **Jest** - Unit testing
- **Web Vitals** - Performance measurement

## Project Structure

```
src/
├── Components/           # React Components
│   ├── LoginForm/       # Login form
│   ├── Sidebar/         # Navigation sidebar
│   ├── Dashboard/       # Dashboard components
│   │   ├── Admin/       # Admin components (Users, Profiles)
│   │   └── ...         # Other dashboard sections
│   └── Assets/          # Static resources
├── context/             # React Context providers
│   ├── MenuContext.jsx  # Menu management
│   ├── AuthContext.jsx  # Authentication management
│   └── ...             # Other contexts
├── config/              # Configuration files
│   ├── predefinedUsers.js    # User management
│   └── predefinedProfiles.js # Profile management
├── index.js            # Entry point
└── App.css             # Global styles
```

## User Management

### Predefined Users
The system includes several predefined user accounts with different access levels:

1. **Admin Account**
   - Email: admin@titrit.com
   - Password: Admin@123
   - Access: Full administrative access

2. **Security Team**
   - Email: security@titrit.com
   - Password: Security@123
   - Access: Security management features

3. **Bank Team**
   - Email: bank@titrit.com
   - Password: Bank@123
   - Access: Banking operations

4. **Call Center Team**
   - Email: callcenter@titrit.com
   - Password: CallCenter@123
   - Access: Customer service features

### Creating New Users
Administrators can create new users through the admin interface:

1. Log in as admin
2. Navigate to Dashboard > Admin > Users
3. Click "Create User" and fill in the details:
   - First Name
   - Last Name
   - Email
   - Username
   - Password
   - Profile Selection
   - Status (Active/Inactive)

### User Persistence
- New users created by administrators are automatically added to the system's predefined users
- User data persists between sessions using localStorage
- User profiles and access rights are managed through the profile system

### Profile Management
Users can be assigned different profiles with specific access rights:
- Admin Profile: Full system access
- Security Team: Security management
- Bank Team: Banking operations
- Call Center: Customer service
- Custom profiles can be created and managed

## Components

### LoginForm
- User authentication management
- Validation of forms
- Integration with the authentication API
- Support for predefined and custom users

### Sidebar
- Dynamic navigation based on user profile
- Menu state management via MenuContext
- Responsive interface
- Access control based on user permissions

### Dashboard/Admin
- User Management Interface
- Profile Management
- Security Settings
- Access Control Management

## Configuration

### Environment Variables
The project uses HTTPS in development with local SSL certificates:
- SSL_CRT_FILE=cert/localhost.pem
- SSL_KEY_FILE=cert/localhost-key.pem

### Scripts Available
- `npm start` - Launches the HTTPS development server
- `npm build` - Creates a production version
- `npm test` - Launches tests
- `npm eject` - Ejects CRA configuration

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Launch the development server:
```bash
npm start
```

3. Access the application:
- URL: https://localhost:3000
- Use predefined admin credentials to start:
  - Email: admin@titrit.com
  - Password: Admin@123

## Security
- Use of HTTPS in development
- Secure token management
- Protection of sensitive routes
- Role-based access control
- Password encryption
- Session management

## Performance
- Image and asset optimization
- Lazy loading of components
- Monitoring via Web Vitals
- Efficient state management

## Maintenance
- Modular and reusable code
- Component documentation
- Unit tests for critical features
- User management documentation

