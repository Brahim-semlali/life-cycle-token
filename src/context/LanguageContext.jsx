import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';
import TokenStorage from '../services/TokenStorage';

// Create the language context
const LanguageContext = createContext();

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default language is English

  // Function to change the language
  const changeLanguage = async (languageCode) => {
    try {
      if (!languageCode) {
        console.error('Invalid language code: empty or undefined');
        return;
      }
      
      // Convert to uppercase for API but keep lowercase for UI
      const apiLanguageCode = languageCode.toUpperCase();
      const uiLanguageCode = languageCode.toLowerCase();
      
      console.log(`Changing language to: ${apiLanguageCode} (API) / ${uiLanguageCode} (UI)`);
      
      // Special handling for English to debug the issue
      if (uiLanguageCode === 'en') {
        console.log('Processing English language change request');
      }
      
      // Utiliser la méthode spécifique pour mettre à jour la langue
      const response = await api.updateUserLanguage(apiLanguageCode);
      console.log('Language update response:', response);
      
      if (response && (response.success || response.new_language)) {
        console.log(`Setting current language to: ${uiLanguageCode}`);
        setCurrentLanguage(uiLanguageCode);
        
        // Save to localStorage as additional backup
        localStorage.setItem('userLanguage', uiLanguageCode);
        
        return true;
      } else {
        console.warn('Language update response did not contain success flag:', response);
        return false;
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
      return false;
    }
  };

  // Load the saved language preference on initial render
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Try loading from localStorage first as fallback
        const savedLanguage = localStorage.getItem('userLanguage');
        if (savedLanguage) {
          console.log(`Loading language from localStorage: ${savedLanguage}`);
          setCurrentLanguage(savedLanguage.toLowerCase());
        }
        
        // Only try to get from API if user is authenticated
        if (TokenStorage.isTokenValid()) {
          console.log('User is authenticated, fetching language from API...');
          try {
            const response = await api.getUserLanguage();
            console.log('API language response:', response);
            
            if (response && response.language) {
              const apiLanguage = response.language.toLowerCase();
              console.log(`Setting language from API: ${apiLanguage}`);
              setCurrentLanguage(apiLanguage);
              
              // Update localStorage
              localStorage.setItem('userLanguage', apiLanguage);
            }
          } catch (apiError) {
            console.warn('Error loading language from API, using localStorage value instead:', apiError);
          }
        } else {
          console.log('User not authenticated, skipping API language fetch');
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