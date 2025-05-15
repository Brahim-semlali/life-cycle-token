import React from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import TokenList from './TokenList';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { CreditCard as TokenIcon, History as HistoryIcon, Settings as SettingsIcon } from '@mui/icons-material';
import './Token.css';

const Token = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

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
                
                <Paper 
                    elevation={0} 
                    sx={{ 
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(226, 232, 240, 0.8)'
                    }}
                >
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                py: 2
                            },
                            '& .Mui-selected': {
                                color: '#4f46e5',
                                fontWeight: 600
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#4f46e5',
                                height: 3
                            }
                        }}
                    >
                        <Tab 
                            icon={<TokenIcon sx={{ mr: 1 }} />} 
                            label={t('token.tabs.tokens', 'Tokens')} 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<HistoryIcon sx={{ mr: 1 }} />} 
                            label={t('token.tabs.history', 'History')} 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<SettingsIcon sx={{ mr: 1 }} />} 
                            label={t('token.tabs.settings', 'Settings')} 
                            iconPosition="start"
                        />
                    </Tabs>
                </Paper>
            </Box>
            
            {tabValue === 0 && <TokenList />}
            {tabValue === 1 && (
                <Paper 
                    elevation={0}
                    className="coming-soon-section"
                    sx={{ 
                        p: 4, 
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#4b5563', mb: 2 }}>
                        {t('token.historyComingSoon', 'Token History')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        {t('token.historyDescription', 'The token history feature will be available soon.')}
                    </Typography>
                </Paper>
            )}
            {tabValue === 2 && (
                <Paper 
                    elevation={0}
                    className="coming-soon-section"
                    sx={{ 
                        p: 4, 
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#4b5563', mb: 2 }}>
                        {t('token.settingsComingSoon', 'Token Settings')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        {t('token.settingsDescription', 'The token settings feature will be available soon.')}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default Token; 