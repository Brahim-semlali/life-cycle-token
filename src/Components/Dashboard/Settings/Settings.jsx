import React, { useEffect, useRef, useState } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiUpload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { en } from '../../../translations/en';
import { fr } from '../../../translations/fr';
import { es } from '../../../translations/es';
import { ar } from '../../../translations/ar';
import './Settings.css';

const Settings = () => {
  const { isMinimized } = useMenu();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  // Language options
  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'es', name: 'Español' }
  ];

  // Fonction pour aplatir un objet de traduction
  const flattenTranslations = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
        return { ...acc, ...flattenTranslations(obj[key], newKey) };
      }
      return { ...acc, [newKey]: obj[key] };
    }, {});
  };

  // Fonction pour convertir les traductions en format Excel
  const prepareTranslationsForExcel = () => {
    const flatEn = flattenTranslations(en);
    const flatFr = flattenTranslations(fr);
    const flatEs = flattenTranslations(es);
    const flatAr = flattenTranslations(ar);

    const allKeys = [...new Set([
      ...Object.keys(flatEn),
      ...Object.keys(flatFr),
      ...Object.keys(flatEs),
      ...Object.keys(flatAr)
    ])];

    return allKeys.map(key => ({
      key,
      en: flatEn[key] || '',
      fr: flatFr[key] || '',
      es: flatEs[key] || '',
      ar: flatAr[key] || ''
    }));
  };

  // Fonction pour exporter les traductions
  const handleExportTranslations = () => {
    const translations = prepareTranslationsForExcel();
    const ws = XLSX.utils.json_to_sheet(translations);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Translations');
    XLSX.writeFile(wb, 'translations.xlsx');
  };

  // Fonction pour reconstruire l'objet de traduction
  const unflattenTranslations = (flatObj) => {
    const result = {};
    Object.keys(flatObj).forEach(key => {
      const keys = key.split('.');
      let current = result;
      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          current[k] = flatObj[key];
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      });
    });
    return result;
  };

  // Fonction pour importer les traductions
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let translations;
          if (file.name.endsWith('.cab')) {
            // Traitement des fichiers CSV
            const text = e.target?.result;
            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0];
            translations = rows.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header.trim()] = row[index]?.trim() || '';
              });
              return obj;
            });
          } else {
            // Traitement des fichiers Excel
            const data = new Uint8Array(e.target?.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            translations = XLSX.utils.sheet_to_json(firstSheet);
          }

          // Validation et traitement des traductions
          if (!translations.length || !translations[0].key) {
            throw new Error('Format invalide');
          }

          // Regrouper les traductions par langue
          const translationsByLang = {
            en: {}, fr: {}, es: {}, ar: {}
          };

          translations.forEach(row => {
            ['en', 'fr', 'es', 'ar'].forEach(lang => {
              if (row[lang]) {
                translationsByLang[lang][row.key] = row[lang];
              }
            });
          });

          // Mettre à jour les traductions dans i18n
          Object.keys(translationsByLang).forEach(lang => {
            const unflattened = unflattenTranslations(translationsByLang[lang]);
            i18n.addResourceBundle(lang, 'translation', unflattened, true, true);
          });

          alert(t('translations.importSuccess'));
        } catch (error) {
          console.error('Erreur de parsing:', error);
          alert(t('translations.invalidFormat'));
        }
      };

      reader.onerror = () => {
        alert(t('translations.importError'));
      };

      if (file.name.endsWith('.cab')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Erreur d\'importation:', error);
      alert(t('translations.importError'));
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    i18n.changeLanguage(newLanguage);
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
  };

  // Handle theme change
  const handleThemeChange = (e) => {
    const newTheme = e.target.value === 'dark';
    if (newTheme !== isDarkMode) {
      toggleTheme();
    }
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply initial language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div className={`settings-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <h2>{t('settings.title')}</h2>
      
      <div className="settings-section">
        <h3>{t('settings.theme')}</h3>
        <div className="setting-item">
          <label htmlFor="theme-select">{t('settings.selectTheme')}</label>
          <select
            id="theme-select"
            value={isDarkMode ? 'dark' : 'light'}
            onChange={handleThemeChange}
            className="theme-select"
          >
            <option value="light">{t('settings.theme.light')}</option>
            <option value="dark">{t('settings.theme.dark')}</option>
          </select>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>{t('settings.language')}</h3>
        <div className="setting-item">
          <label htmlFor="language-select">{t('settings.selectLanguage')}</label>
          <select
            id="language-select"
            value={i18n.language}
            onChange={handleLanguageChange}
            className="language-select"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="translation-buttons">
          <button 
            className="settings-button"
            onClick={handleExportTranslations}
          >
            <FiDownload className="button-icon" />
            {t('translations.downloadTemplate')}
          </button>
          <button 
            className="settings-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <FiUpload className="button-icon" />
            {importing ? t('translations.processing') : t('translations.importTranslations')}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx,.xls,.cab"
            onChange={handleFileImport}
          />
        </div>
      </div>
      
      <div className="settings-section">
        <h3>{t('settings.about')}</h3>
        <div className="setting-item">
          <p>{t('app.title')}</p>
          <p>{t('settings.version')} 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings; 