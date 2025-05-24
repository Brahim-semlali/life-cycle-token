import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel,
  Grid,
  Paper,
  Select,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import ShieldIcon from '@mui/icons-material/Shield';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import TokenService from '../../../services/TokenService';
import './Simulateur.css';

const Simulateur = () => {
  const { t } = useTranslation();
  const { isMinimized } = useMenu();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    tsp: '',
    tokenRequestor: '',
    pan: '',
    expiryDate: {
      month: '',
      year: ''
    },
    cvv2: '',
    panSource: '',
  });
  
  // État pour gérer les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(false);

  const tspOptions = [
    { value: 'MDES', label: 'MDES' },
    { value: 'VTS', label: 'VTS' }
  ];

  const tokenRequestorOptions = [
    { value: 'Apple', label: 'Apple Pay' },
    { value: 'Google', label: 'Google Pay' },
    { value: 'Samsung', label: 'Samsung Pay' },
    { value: 'Issuer Wallet', label: 'Issuer Wallet' },
    { value: 'ECommerce', label: 'E-Commerce' }
  ];

  const panSourceOptions = [
    { value: 'Application', label: 'Application' },
    { value: 'Added Manually', label: 'Manual Entry' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Form submitted with data:', formData);
      
      // Validation des données
      if (formData.pan.length !== 16 || !/^\d{16}$/.test(formData.pan)) {
        throw new Error('Le numéro de carte doit contenir exactement 16 chiffres');
      }
      
      if (formData.cvv2.length !== 3 || !/^\d{3}$/.test(formData.cvv2)) {
        throw new Error('Le code CVV doit contenir exactement 3 chiffres');
      }
      
      // Vérifier que la date d'expiration est dans le futur
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100; // Obtenir les 2 derniers chiffres de l'année
      const currentMonth = currentDate.getMonth() + 1; // getMonth() retourne 0-11
      
      const expiryYear = parseInt(formData.expiryDate.year, 10);
      const expiryMonth = parseInt(formData.expiryDate.month, 10);
      
      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        throw new Error('La date d\'expiration doit être dans le futur');
      }
      
      // Appel au service pour l'issuance TSP
      const result = await TokenService.issueTspToken({
        tsp: formData.tsp,
        tokenRequestor: formData.tokenRequestor,
        pan: formData.pan,
        expiryMonth: formData.expiryDate.month,
        expiryYear: formData.expiryDate.year,
        cvv: formData.cvv2,
        panSource: formData.panSource
      });
      
      if (result.success) {
        setNotification({
          open: true,
          message: `Tokenisation approuvée avec succès! ID: ${result.data.issuance_id}`,
          severity: 'success'
        });
        
        // Réinitialiser le formulaire après succès
        setFormData({
          tsp: '',
          tokenRequestor: '',
          pan: '',
          expiryDate: {
            month: '',
            year: ''
          },
          cvv2: '',
          panSource: '',
        });
      } else {
        throw new Error(result.error || 'Échec de la tokenisation');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setNotification({
        open: true,
        message: error.message || 'Une erreur est survenue lors de la tokenisation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`simulateur-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
      <Paper className="simulateur-form-paper" elevation={0}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <SecurityIcon sx={{ fontSize: '2rem', color: '#6366f1' }} />
            <Chip 
              label="SECURE TOKENIZATION" 
              variant="outlined" 
              sx={{ 
                borderColor: '#6366f1', 
                color: '#6366f1',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: 'rgba(99, 102, 241, 0.05)'
              }} 
            />
            <VerifiedIcon sx={{ fontSize: '2rem', color: '#06b6d4' }} />
          </Box>
          <Typography 
            variant="h1"
            className="simulateur-title"
          >
            APPROVE
            <br />
            TOKENIZATION
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <div className="form-content">
            {/* TSP and Token Requestor Row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth className="simulateur-form-field">
                <InputLabel id="tsp-label">Token Service Provider (TSP)</InputLabel>
                <Select
                  labelId="tsp-label"
                  id="tsp"
                  name="tsp"
                  value={formData.tsp}
                  label="Token Service Provider (TSP)"
                  onChange={handleChange}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <ShieldIcon />
                    </InputAdornment>
                  }
                >
                  {tspOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldIcon sx={{ fontSize: '1.2rem', color: '#6366f1' }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth className="simulateur-form-field">
                <InputLabel id="token-requestor-label">Token Requestor</InputLabel>
                <Select
                  labelId="token-requestor-label"
                  id="tokenRequestor"
                  name="tokenRequestor"
                  value={formData.tokenRequestor}
                  label="Token Requestor"
                  onChange={handleChange}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <CreditCardIcon />
                    </InputAdornment>
                  }
                >
                  {tokenRequestorOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCardIcon sx={{ fontSize: '1.2rem', color: '#8b5cf6' }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ 
              my: 2, 
              background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
              height: '2px',
              border: 'none'
            }} />

            {/* PAN Input */}
            <TextField
              fullWidth
              className="simulateur-form-field"
              label="Card Number (PAN)"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              variant="outlined"
              required
              inputProps={{
                maxLength: 16,
                pattern: '[0-9]{16}'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" size="small">
                      <InfoOutlinedIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              helperText="Enter a valid 16-digit card number"
            />

            {/* Card Details Group */}
            <Box className="card-input-group">
              <Typography 
                variant="h6" 
                sx={{ 
                  gridColumn: '1 / -1', 
                  mb: 2, 
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SecurityIcon sx={{ color: '#6366f1' }} />
                Card Security Details
              </Typography>
              
              <FormControl className="simulateur-form-field">
                <InputLabel id="month-label">Expiry Month</InputLabel>
                <Select
                  labelId="month-label"
                  id="month"
                  name="expiryDate.month"
                  value={formData.expiryDate.month}
                  label="Expiry Month"
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl className="simulateur-form-field">
                <InputLabel id="year-label">Expiry Year</InputLabel>
                <Select
                  labelId="year-label"
                  id="year"
                  name="expiryDate.year"
                  value={formData.expiryDate.year}
                  label="Expiry Year"
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <MenuItem key={year} value={year.toString().slice(-2)}>
                      {year.toString().slice(-2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                className="simulateur-form-field"
                label="CVV2/CVC2"
                name="cvv2"
                value={formData.cvv2}
                onChange={handleChange}
                variant="outlined"
                type="password"
                required
                inputProps={{
                  maxLength: 3,
                  pattern: '[0-9]{3}'
                }}
                helperText="3-digit security code"
              />

              <FormControl className="simulateur-form-field">
                <InputLabel id="pan-source-label">PAN Source</InputLabel>
                <Select
                  labelId="pan-source-label"
                  id="panSource"
                  name="panSource"
                  value={formData.panSource}
                  label="PAN Source"
                  onChange={handleChange}
                  required
                >
                  {panSourceOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </div>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              className="simulateur-submit-button"
              disabled={loading}
              startIcon={loading ? null : <VerifiedIcon />}
            >
              {loading ? 'TRAITEMENT...' : 'APPROVE TOKENIZATION'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Simulateur;
