import React, { useState, useEffect } from 'react';
import { useMenu } from "../../context/MenuContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import './Dashboard.css';

// Define translations
const translations = {
  en: {
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome, {{name}}',
      welcomeGeneric: 'Welcome to your dashboard',
      personalInfo: 'Personal Information',
      accountInfo: 'Account Information',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
      language: 'Language',
      userId: 'User ID',
      profileId: 'Profile ID',
      startValidity: 'Start Validity',
      endValidity: 'End Validity',
      errorFetchingData: 'Error fetching user data'
    }
  },
  fr: {
    dashboard: {
      title: 'Tableau de bord',
      welcome: 'Bienvenue, {{name}}',
      welcomeGeneric: 'Bienvenue dans votre tableau de bord',
      personalInfo: 'Informations personnelles',
      accountInfo: 'Informations du compte',
      fullName: 'Nom complet',
      email: 'Email',
      phone: 'Téléphone',
      status: 'Statut',
      language: 'Langue',
      userId: 'ID Utilisateur',
      profileId: 'ID Profil',
      startValidity: 'Début de validité',
      endValidity: 'Fin de validité',
      errorFetchingData: 'Erreur lors du chargement des données utilisateur'
    }
  }
};

const Dashboard = () => {
  const { isMinimized } = useMenu();
  const { isDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add translations to i18n
  useEffect(() => {
    const currentLang = i18n.language || 'fr';
    if (translations[currentLang]) {
      i18n.addResourceBundle(
        currentLang,
        'translation',
        { dashboard: translations[currentLang].dashboard },
        true,
        true
      );
    }
  }, [i18n]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Always fetch from API to ensure we have the latest data
        console.log('Attempting to fetch user data from API...');
        const response = await api.request('/user/get/', 'POST');
        console.log('User data API response:', response);
        
        if (response) {
          // Check if the response has the expected structure
          if (typeof response === 'object') {
            console.log('Processing user data from API response');
            
            // Process and normalize user data
            const processedUserData = {
              id: response.id || '',
              first_name: response.first_name || '',
              last_name: response.last_name || '',
              email: response.email || '',
              phone: response.phone || '-',
              status: response.status || 'ACTIF',
              language: response.language || 'FR',
              profile: response.profile || '-',
              start_validity: response.start_validity || null,
              end_validity: response.end_validity || null
            };
            
            console.log('Processed user data:', processedUserData);
            setUserData(processedUserData);
          } else {
            console.error('Invalid response format:', response);
            throw new Error('Invalid API response format');
          }
        } else if (authUser) {
          // Fallback to auth context if API fails but we have user data
          console.log('Using auth context as fallback:', authUser);
          setUserData(authUser);
        } else {
          console.error('No user data available from API or auth context');
          throw new Error('No user data available');
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        
        // Try to extract more detailed error information
        if (err.response) {
          console.error('API Error Response:', err.response.status, err.response.data);
        }
        
        setError(t('dashboard.errorFetchingData', 'Error fetching user data'));
        
        // Try to use auth context data as fallback
        if (authUser) {
          console.log('Using auth context as fallback after error:', authUser);
          setUserData(authUser);
          setError(null); // Clear error if we have fallback data
        }
        
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, t]);

  // Function to get initials from name
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR').format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Box
      className={`dashboard-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
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
      <Box sx={{ 
        mb: 4,
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <Box 
          sx={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '180px',
            background: 'linear-gradient(180deg, rgba(63, 104, 208, 0.08) 0%, rgba(63, 104, 208, 0) 100%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            zIndex: -1
          }}
        />
        <Typography variant="h2" className="gradient-text dashboard-title" sx={{
          fontWeight: 700,
          mb: 2,
          fontSize: '3.5rem',
          background: 'linear-gradient(90deg, #3968d0 0%, #4f46e5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.02em',
          textAlign: 'center'
        }}>
          {t('dashboard.title', 'Dashboard')}
        </Typography>
        
        <Typography variant="h6" sx={{ 
          color: '#64748b', 
          mb: 4, 
          maxWidth: '800px',
          margin: '0 auto',
          fontWeight: 400,
          fontSize: '1.1rem',
          letterSpacing: '0.01em'
        }}>
          {userData && userData.first_name ? 
            t('dashboard.welcome', 'Welcome, {{name}}', { name: `${userData.first_name} ${userData.last_name}` }) :
            t('dashboard.welcomeGeneric', 'Welcome to your dashboard')}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ 
          p: 3, 
          bgcolor: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          borderRadius: '12px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <Typography>{error}</Typography>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Grid container spacing={3} justifyContent="center">
            {/* User Information Card */}
            <Grid item xs={12} md={10} lg={8}>
              <Card sx={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
              }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ 
                    p: 4, 
                    bgcolor: 'primary.main', 
                    borderTopLeftRadius: '16px', 
                    borderTopRightRadius: '16px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: 'white', 
                        color: 'primary.main',
                        fontWeight: 'bold',
                        fontSize: '2rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {getInitials(userData?.first_name, userData?.last_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {userData?.first_name} {userData?.last_name}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                        {userData?.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ p: 4 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 3,
                      flexWrap: 'wrap',
                      gap: 2
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('dashboard.personalInfo', 'Informations personnelles')}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          }
                        }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(79, 70, 229, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <span className="material-icons" style={{ color: '#4f46e5', fontSize: '24px' }}>person</span>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('dashboard.fullName', 'Nom complet')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {userData?.first_name} {userData?.last_name}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          }
                        }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(79, 70, 229, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <span className="material-icons" style={{ color: '#4f46e5', fontSize: '24px' }}>email</span>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('dashboard.email', 'Email')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {userData?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          }
                        }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(79, 70, 229, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <span className="material-icons" style={{ color: '#4f46e5', fontSize: '24px' }}>phone</span>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('dashboard.phone', 'Téléphone')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {userData?.phone || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          }
                        }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(79, 70, 229, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <span className="material-icons" style={{ color: '#4f46e5', fontSize: '24px' }}>circle</span>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('dashboard.status', 'Statut')}
                            </Typography>
                            <Chip 
                              label={userData?.status || 'ACTIF'} 
                              color={userData?.status === 'ACTIF' ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 500, mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          }
                        }}>
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(79, 70, 229, 0.1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <span className="material-icons" style={{ color: '#4f46e5', fontSize: '24px' }}>language</span>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('dashboard.language', 'Langue')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {userData?.language || 'FR'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 