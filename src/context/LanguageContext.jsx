import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

// Create the language context
const LanguageContext = createContext();

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default language is English

  // Function to change the language
  const changeLanguage = async (languageCode) => {
    try {
      // Convert to uppercase for API but keep lowercase for UI
      const apiLanguageCode = languageCode.toUpperCase();
      const uiLanguageCode = languageCode.toLowerCase();
      
      // Utiliser la méthode spécifique pour mettre à jour la langue
      const response = await api.updateUserLanguage(apiLanguageCode);
      if (response && response.success) {
        setCurrentLanguage(uiLanguageCode);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Load the saved language preference on initial render
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Utiliser la méthode spécifique pour obtenir la langue actuelle
        const response = await api.getUserLanguage();
        if (response && response.language) {
          setCurrentLanguage(response.language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 