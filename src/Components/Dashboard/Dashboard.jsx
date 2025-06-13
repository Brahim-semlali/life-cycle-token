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
        padding: { xs: '1.5rem', md: '2rem' },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginLeft: { xs: 0, md: isMinimized ? '5rem' : '250px' },
        width: { xs: '100%', md: isMinimized ? 'calc(100% - 5rem)' : 'calc(100% - 250px)' },
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        color: isDarkMode ? '#e0e0e0' : '#6b7a99',
        backgroundColor: isDarkMode ? '#121212' : '#f6f8ff',
      }}
    >
      {/* Animated background elements */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: { xs: '150px', md: '250px' },
              height: { xs: '150px', md: '250px' },
              background: `linear-gradient(135deg, ${isDarkMode ? 'rgba(79, 70, 229, 0.03)' : 'rgba(79, 70, 229, 0.05)'} 0%, ${isDarkMode ? 'rgba(63, 104, 208, 0.03)' : 'rgba(63, 104, 208, 0.05)'} 100%)`,
              borderRadius: '50%',
              filter: 'blur(40px)',
              animation: `float ${Math.random() * 10 + 15}s ease-in-out infinite`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </Box>

      <Box sx={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          textAlign: 'center',
          mb: 4,
          pt: { xs: 2, md: 4 }
        }}>
          <Typography variant="h2" className="gradient-text dashboard-title">
            {t('dashboard.title', 'Dashboard')}
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
              mb: 4,
              maxWidth: '800px',
              margin: '0 auto',
              fontWeight: 400,
              fontSize: '1.1rem',
              letterSpacing: '0.01em',
              opacity: 0,
              animation: 'slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              animationDelay: '0.3s'
            }}
          >
            {userData && userData.first_name ? 
              t('dashboard.welcome', 'Welcome, {{name}}', { name: `${userData.first_name} ${userData.last_name}` }) :
              t('dashboard.welcomeGeneric', 'Welcome to your dashboard')}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flex: 1
          }}>
            <div className="loading-spinner" />
          </Box>
        ) : error ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            px: 2
          }}>
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: 'linear-gradient(45deg, transparent, rgba(239, 68, 68, 0.1), transparent)',
                  animation: 'shine 2s infinite',
                }}
              />
              <Typography>{error}</Typography>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1,
            width: '100%',
            px: { xs: 2, md: 3 }
          }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={10} lg={8}>
                <Card className="card-animation">
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                      p: { xs: 3, md: 4 }, 
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3968d0 100%)',
                      borderTopLeftRadius: '16px', 
                      borderTopRightRadius: '16px',
                      color: 'white',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      gap: 3,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
                        }}
                      />
                      <Avatar 
                        sx={{ 
                          width: { xs: 70, md: 80 }, 
                          height: { xs: 70, md: 80 }, 
                          bgcolor: 'white', 
                          color: '#4f46e5',
                          fontWeight: 'bold',
                          fontSize: { xs: '1.8rem', md: '2rem' }
                        }}
                      >
                        {getInitials(userData?.first_name, userData?.last_name)}
                      </Avatar>
                      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 600, 
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          mb: 0.5
                        }}>
                          {userData?.first_name} {userData?.last_name}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          opacity: 0.9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: { xs: 'center', sm: 'flex-start' },
                          gap: 1
                        }}>
                          <span className="material-icons" style={{ fontSize: '18px' }}>email</span>
                          {userData?.email}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ p: { xs: 2, md: 4 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #4f46e5 0%, #3968d0 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <span className="material-icons" style={{ 
                            fontSize: '24px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #3968d0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            person_outline
                          </span>
                          {t('dashboard.personalInfo', 'Informations personnelles')}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={3}>
                        {[
                          { icon: 'person', label: 'dashboard.fullName', value: `${userData?.first_name} ${userData?.last_name}` },
                          { icon: 'email', label: 'dashboard.email', value: userData?.email },
                          { icon: 'phone', label: 'dashboard.phone', value: userData?.phone || '-' },
                          { icon: 'circle', label: 'dashboard.status', value: userData?.status || 'ACTIF', isStatus: true },
                          { icon: 'language', label: 'dashboard.language', value: userData?.language || 'FR' }
                        ].map((item, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Box className="info-box">
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2
                              }}>
                                <Box className="info-box-icon">
                                  <span className="material-icons">{item.icon}</span>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ 
                                    mb: 0.5,
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {t(item.label)}
                                  </Typography>
                                  {item.isStatus ? (
                                    <Chip 
                                      label={item.value}
                                      className="status-chip"
                                      size="small"
                                    />
                                  ) : (
                                    <Typography variant="body1" sx={{ 
                                      fontWeight: 500,
                                      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a'
                                    }}>
                                      {item.value}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      <style jsx="true" global="true">{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Box>
  );
};

export default Dashboard; 