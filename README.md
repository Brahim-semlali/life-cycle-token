# Titrit Technologies Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [User Management](#user-management)
5. [Getting Started](#getting-started)
6. [API Configuration](#api-configuration)
7. [Environment Variables](#environment-variables)
8. [Password Management](#password-management)
9. [Internationalization](#internationalization)

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

## API Configuration

### API Service Setup
The application uses Axios for API requests with the following features:
- Centralized API configuration in `src/services/api.js`
- Automatic token management for authenticated requests
- Error handling and authentication failure management
- Default headers configuration

### API Usage Example
```javascript
import api from '../services/api';

// GET request
api.get('/endpoint')
  .then(response => {
    // Handle response
  })
  .catch(error => {
    // Handle error
  });

// POST request
api.post('/endpoint', data)
  .then(response => {
    // Handle response
  })
  .catch(error => {
    // Handle error
  });
```

## Environment Variables

### Required Variables
- `REACT_APP_API_URL`: Base URL for API requests (default: http://localhost:3000)

### Development Environment
Create a `.env` file in the project root with the following content:
```
REACT_APP_API_URL=http://localhost:3000
```

### Production Environment
For production, set the environment variables in your hosting platform:
- Heroku: Use the dashboard or CLI
- Netlify: Use the site settings
- Vercel: Use the project settings

### Security Notes
- Never commit `.env` files to version control
- Use `.env.example` as a template for required variables
- Keep sensitive information in environment variables
- Use HTTPS in production environments

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

## Password Management

### Password Security Features
- Password visibility toggle
- Password confirmation requirement
- Password strength validation
- Password rules enforcement:
  - Minimum length (8 characters)
  - Uppercase letters required
  - Lowercase letters required
  - Numbers required
  - Special characters required

### Password Rules Configuration
Password rules can be configured through the security settings:
```javascript
const passwordRules = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
};
```

### Password Validation
The system validates passwords against the following criteria:
- Length requirements
- Character type requirements
- Password confirmation match
- Password history (if enabled)
- Password expiration (if enabled)

## Internationalization

### Supported Languages
The application supports multiple languages:
- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)

### Translation Management
Translations are managed through:
1. Excel template (`public/assets/templates/translations_template.xlsx`)
2. JSON files in `src/translations/`
3. Dynamic import/export functionality

### Translation Structure
The translation system uses a key-value structure:
```javascript
{
  'key': {
    'fr': 'French translation',
    'en': 'English translation',
    'es': 'Spanish translation',
    'ar': 'Arabic translation'
  }
}
```

### Adding New Translations
1. Use the Excel template to add new translations
2. Import translations through the admin interface
3. Translations are automatically synchronized across the application

### Translation Keys
Common translation keys include:
- User interface elements
- Error messages
- Success messages
- Form labels
- Button texts
- Status messages

### Language Switching
Users can switch languages through:
1. User settings
2. Language selector in the header
3. Browser language detection

