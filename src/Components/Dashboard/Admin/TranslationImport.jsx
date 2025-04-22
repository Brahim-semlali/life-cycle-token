import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import './TranslationImport.css';

const TranslationImport = () => {
    const { t, i18n } = useTranslation();
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processXLSFile = async (file) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const translations = {};
            jsonData.forEach(row => {
                const key = row.key;
                delete row.key;
                Object.keys(row).forEach(lang => {
                    if (!translations[lang]) {
                        translations[lang] = {};
                    }
                    translations[lang][key] = row[lang];
                });
            });

            // Mettre à jour les traductions dans i18n
            Object.keys(translations).forEach(lang => {
                i18n.addResourceBundle(lang, 'translation', translations[lang], true, true);
            });

            setSuccess(t('translations.importSuccess'));
            setError('');
        } catch (err) {
            setError(t('translations.importError'));
            console.error('Error processing XLS file:', err);
        }
    };

    const processCABFile = async (file) => {
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const translations = {};

            lines.forEach(line => {
                const [key, ...values] = line.split(',').map(v => v.trim());
                if (key && values.length) {
                    const [fr, en, es, ar] = values;
                    if (fr) translations.fr = { ...translations.fr, [key]: fr };
                    if (en) translations.en = { ...translations.en, [key]: en };
                    if (es) translations.es = { ...translations.es, [key]: es };
                    if (ar) translations.ar = { ...translations.ar, [key]: ar };
                }
            });

            // Mettre à jour les traductions dans i18n
            Object.keys(translations).forEach(lang => {
                i18n.addResourceBundle(lang, 'translation', translations[lang], true, true);
            });

            setSuccess(t('translations.importSuccess'));
            setError('');
        } catch (err) {
            setError(t('translations.importError'));
            console.error('Error processing CAB file:', err);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setProcessing(true);
        setError('');
        setSuccess('');

        const file = e.dataTransfer.files[0];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            await processXLSFile(file);
        } else if (fileExtension === 'cab') {
            await processCABFile(file);
        } else {
            setError(t('translations.invalidFileType'));
        }

        setProcessing(false);
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setProcessing(true);
            setError('');
            setSuccess('');

            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                await processXLSFile(file);
            } else if (fileExtension === 'cab') {
                await processCABFile(file);
            } else {
                setError(t('translations.invalidFileType'));
            }

            setProcessing(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['key', 'fr', 'en', 'es', 'ar'],
            ['example.key', 'Exemple', 'Example', 'Ejemplo', 'مثال']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Translations');
        XLSX.writeFile(wb, 'translation_template.xlsx');
    };

    return (
        <div className="translation-import-container">
            <h2>{t('translations.importTitle')}</h2>
            
            <div className="template-section">
                <button onClick={downloadTemplate} className="template-button">
                    {t('translations.downloadTemplate')}
                </button>
                <p className="template-info">{t('translations.templateInfo')}</p>
            </div>

            <div 
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".xlsx,.xls,.cab"
                    onChange={handleFileInput}
                    className="file-input"
                />
                <div className="drop-zone-content">
                    {processing ? (
                        <div className="processing-indicator">
                            {t('translations.processing')}
                        </div>
                    ) : (
                        <>
                            <i className="upload-icon">📁</i>
                            <p>{t('translations.dropzoneText')}</p>
                            <button className="browse-button">
                                {t('translations.browse')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="format-info">
                <h3>{t('translations.supportedFormats')}</h3>
                <ul>
                    <li>
                        <strong>XLSX/XLS:</strong> {t('translations.xlsFormat')}
                    </li>
                    <li>
                        <strong>CAB:</strong> {t('translations.cabFormat')}
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default TranslationImport; 