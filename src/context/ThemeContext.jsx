import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

// Create the theme context
const ThemeContext = createContext(null);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      const response = await api.request('/user/preferences/theme', 'POST', { theme: newTheme ? 'dark' : 'light' });
      if (response && response.success) {
        setIsDarkMode(newTheme);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Charger le thème initial
  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await api.request('/user/preferences/theme', 'GET');
        if (response && response.theme) {
          setIsDarkMode(response.theme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // En cas d'erreur, on garde le thème par défaut (light)
      }
    };
    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 