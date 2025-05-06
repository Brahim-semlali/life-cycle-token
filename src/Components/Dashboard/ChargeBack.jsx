import React from 'react';
import { useMenu } from "../../context/MenuContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

const ChargeBack = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    return (
        <Box className={`chargeback-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
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
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '@media (max-width: 768px)': {
                    marginLeft: '0',
                    width: '100%',
                    padding: '1.5rem'
                }
            }}
        >
            <Typography variant="h2" sx={{
                background: 'linear-gradient(90deg, #16a34a 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700,
                textAlign: 'center'
            }}>
                Gestion des ChargeBack
            </Typography>
        </Box>
    );
};

export default ChargeBack; 