import React from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import TokenList from './TokenList';
import { Box, Typography } from '@mui/material';
import './Token.css';

// Définition des traductions manquantes
const translations = {
    en: {
        token: {
            title: 'Token Management',
            description: 'Manage and monitor your tokens, track their status, and configure token settings.'
        }
    },
    fr: {
        token: {
            title: 'Gestion des Tokens',
            description: 'Gérez et surveillez vos tokens, suivez leur statut et configurez les paramètres des tokens.'
        }
    }
};

const Token = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t, i18n } = useTranslation();

    // Ajouter les traductions manquantes au chargement du composant
    React.useEffect(() => {
        const currentLang = i18n.language || 'en';
        if (translations[currentLang]) {
            i18n.addResourceBundle(
                currentLang,
                'translation',
                { token: translations[currentLang].token },
                true,
                true
            );
        }
    }, [i18n]);

    return (
        <Box 
            className={`token-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
            sx={{
                padding: '2rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginLeft: isMinimized ? '5rem' : '250px',
                width: isMinimized ? 'calc(100% - 5rem)' : 'calc(100% - 250px)',
                minHeight: '100vh',
                position: 'absolute',
                top: 0,
                right: 0,
                overflowY: 'auto',
                backgroundColor: '#f5f7ff',
                color: '#6b7a99',
                '@media (max-width: 768px)': {
                    marginLeft: '0',
                    width: '100%',
                    padding: '1.5rem'
                }
            }}
        >
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" className="gradient-text" sx={{
                    fontWeight: 700,
                    mb: 2
                }}>
                    {t('token.title', 'Token Management')}
                </Typography>
                
                <Typography variant="body1" sx={{ color: '#64748b', mb: 3, maxWidth: '800px' }}>
                    {t('token.description', 'Manage and monitor your tokens, track their status, and configure token settings.')}
                </Typography>
            </Box>
            
            <TokenList />
        </Box>
    );
};

export default Token; 