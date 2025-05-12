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
      const themeValue = newTheme ? 'dark' : 'light';
      
      // Save to localStorage first as fallback
      localStorage.setItem('userTheme', themeValue);
      
      // Then try to update via API
      const response = await api.updateUserTheme(themeValue);
      if (response && response.success) {
        setIsDarkMode(newTheme);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Still update the UI even if API fails
      setIsDarkMode(!isDarkMode);
    }
  };

  // Charger le thème initial
  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        // First try to get from localStorage as fallback
        const savedTheme = localStorage.getItem('userTheme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Then try the API
          const response = await api.getUserTheme();
          if (response && response.theme) {
            setIsDarkMode(response.theme === 'dark');
            // Save to localStorage for future use
            localStorage.setItem('userTheme', response.theme);
          }
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