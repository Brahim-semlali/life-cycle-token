import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { useMenu } from '../../../context/MenuContext';
import { FiDownload, FiUpload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import './Settings.css';

const Settings = () => {
    const { t, i18n } = useTranslation();
    const { isDarkMode, toggleTheme } = useTheme();
    const { isMinimized } = useMenu();
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/assets/templates/translations_template.xlsx';
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

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
                        // Traitement des fichiers .cab (CSV)
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

                    // Validation du format
                    if (!translations.length || !translations[0].key || !translations[0].fr || 
                        !translations[0].en || !translations[0].es || !translations[0].ar) {
                        throw new Error('Format invalide');
                    }

                    console.log('Translations importées:', translations);
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
            event.target.value = ''; // Réinitialise l'input file
        }
    };

    return (
        <div className={`settings-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
            <h1>{t('settings.title')}</h1>
            
            <div className="settings-section">
                <h2>{t('settings.language')}</h2>
                
                {/* Sélecteur de langue */}
                <div className="settings-control">
                    <label>{t('settings.selectLanguage')}</label>
                    <select 
                        value={i18n.language}
                        onChange={handleLanguageChange}
                        className="settings-select"
                    >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="ar">العربية</option>
                    </select>
                </div>

                {/* Boutons de gestion des traductions */}
                <div className="buttons-container">
                    <button 
                        className="settings-button"
                        onClick={handleDownloadTemplate}
                    >
                        <FiDownload className="button-icon" />
                        {t('translations.downloadTemplate')}
                    </button>
                    <button 
                        className="settings-button"
                        onClick={handleImportClick}
                        disabled={importing}
                    >
                        <FiUpload className="button-icon" />
                        {importing ? t('translations.processing') : t('translations.importTranslations')}
                    </button>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.cab"
                    onChange={handleFileImport}
                />
            </div>

            <div className="settings-section">
                <h2>{t('settings.theme')}</h2>
                <div className="settings-control">
                    <label>{t('settings.selectTheme')}</label>
                    <select 
                        value={isDarkMode ? 'dark' : 'light'}
                        onChange={(e) => toggleTheme()}
                        className="settings-select"
                    >
                        <option value="light">{t('settings.theme.light')}</option>
                        <option value="dark">{t('settings.theme.dark')}</option>
                    </select>
                </div>
            </div>

            <div className="settings-section">
                <h2>{t('settings.about')}</h2>
                <div className="about-info">
                    <p>Titrit Technologies</p>
                    <p>{t('settings.version')}: 1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default Settings; 