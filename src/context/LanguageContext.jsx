import React, { createContext, useState, useContext } from 'react';

// Create the language context
const LanguageContext = createContext();

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en'); // Default language is English

  // Function to change the language
  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    // Store the language preference in localStorage for persistence
    localStorage.setItem('appLanguage', languageCode);
  };

  // Load the saved language preference on initial render
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
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