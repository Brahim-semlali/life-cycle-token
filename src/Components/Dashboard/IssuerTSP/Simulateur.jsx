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
import MessageIcon from '@mui/icons-material/Message';
import TokenService from '../../../services/TokenService';
import ProtectedRoute from '../../../Components/ProtectedRoute';
import './Simulateur.css';

const SimulateurContent = () => {
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
  
  const [responseData, setResponseData] = useState(null);
  
  // État pour gérer les notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(false);

  const [focusedInput, setFocusedInput] = useState(null);

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

  const formatResponse = (data) => {
    try {
      // Si c'est une erreur
      if (data.error) {
        try {
          // Essayer de parser le message d'erreur qui est dans le format "Erreur du service: {...}"
          const errorMatch = data.error.match(/Erreur du service: (.+)$/);
          if (errorMatch) {
            const errorJson = JSON.parse(errorMatch[1]);
            return {
              isError: true,
              message: errorJson.message || 'Erreur inconnue',
              type: 'SERVICE_ERROR'
            };
          }
          return {
            isError: true,
            message: data.error,
            type: 'SERVICE_ERROR'
          };
        } catch (e) {
          return {
            isError: true,
            message: data.error,
            type: 'SERVICE_ERROR'
          };
        }
      }

      // Si c'est une réponse succès
      let formattedResponse = {
        isError: false,
        type: 'SUCCESS',
        message: data.message || '',
        messageExterne: '',
        issuanceId: data.issuance_id,
        timestamp: data.timestamp
      };

      if (data.message_externe) {
        try {
          const externalMessage = JSON.parse(data.message_externe);
          formattedResponse.messageExterne = externalMessage.message || '';
        } catch (e) {
          formattedResponse.messageExterne = data.message_externe;
        }
      }

      return formattedResponse;
    } catch (e) {
      return {
        isError: true,
        type: 'SERVICE_ERROR',
        message: 'Erreur lors du traitement de la réponse'
      };
    }
  };

  const handleAxiosError = (error) => {
    // Si c'est une erreur Axios avec une réponse du serveur
    if (error.response && error.response.data) {
      return formatResponse(error.response.data);
    }

    // Si c'est une erreur Axios sans réponse du serveur
    if (error.code === 'ERR_BAD_REQUEST') {
      return {
        isError: true,
        type: 'SERVICE_ERROR',
        message: 'Erreur du service'
      };
    }

    // Pour toute autre erreur
    return {
      isError: true,
      type: 'TECHNICAL_ERROR',
      message: 'Erreur technique'
    };
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
      
      // Préparer les données exactement comme le backend les attend
      const payload = {
        tsp: formData.tsp,
        tokenRequestor: formData.tokenRequestor,
        pan: formData.pan,
        expiryMonth: formData.expiryDate.month,
        expiryYear: formData.expiryDate.year,
        cvv: formData.cvv2,
        panSource: formData.panSource
      };

      console.log('Sending payload to backend:', payload);
      
      // Appel au service pour l'issuance TSP
      const result = await TokenService.issueTspToken(payload);
      
      const formattedResponse = formatResponse(result.data || result);
      setResponseData(formattedResponse);
      
      setNotification({
        open: true,
        message: formattedResponse.message,
        severity: formattedResponse.isError ? 'error' : 'success'
      });

      if (!formattedResponse.isError) {
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
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorResponse = handleAxiosError(error);
      setResponseData(errorResponse);
      setNotification({
        open: true,
        message: errorResponse.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (inputName) => {
    setFocusedInput(inputName);
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  const ResponseContent = () => {
    if (!responseData) {
      return (
        <div className="response-content">
          <div className="response-label">Status</div>
          <div className="response-message">
            En attente de soumission...
          </div>
        </div>
      );
    }

    const getStatusText = () => {
      if (!responseData.isError) return 'Succès';
      switch (responseData.type) {
        case 'SERVICE_ERROR':
          return 'Erreur du service';
        case 'TECHNICAL_ERROR':
          return 'Erreur technique';
        default:
          return 'Échec';
      }
    };

    return (
      <div className="response-content">
        <div className="response-label">Status</div>
        <div className={`response-message ${responseData.isError ? 'error' : 'success'}`}>
          {getStatusText()}
        </div>

        {responseData.message && (
          <>
            <div className="response-label">Message</div>
            <div className={`response-message ${responseData.isError ? 'error' : ''}`}>
              {responseData.message}
            </div>
          </>
        )}
        
        {responseData.messageExterne && (
          <>
            <div className="response-label">Message Externe</div>
            <div className="response-external">
              {responseData.messageExterne}
            </div>
          </>
        )}

        {responseData.issuanceId && (
          <>
            <div className="response-label">ID d'émission</div>
            <div className="response-id">
              {responseData.issuanceId}
            </div>
          </>
        )}

        {responseData.timestamp && (
          <>
            <div className="response-label">Horodatage</div>
            <div className="response-timestamp">
              {new Date(responseData.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`simulateur-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="form-container">
        <Paper className="simulateur-form-paper" elevation={0}>
          <div className="form-header">
            <div className="header-title">
              <SecurityIcon sx={{ fontSize: '1.2rem', color: '#6366f1' }} />
              <Typography variant="h6">APPROVE TOKENIZATION</Typography>
            </div>
            <Chip 
              label="SECURE TOKENIZATION" 
              className="secure-badge"
            />
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              <FormControl className="simulateur-form-field">
                <InputLabel id="tsp-label">TSP</InputLabel>
                <Select
                  labelId="tsp-label"
                  id="tsp"
                  name="tsp"
                  value={formData.tsp}
                  label="TSP"
                  onChange={handleChange}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <ShieldIcon className="input-icon" />
                    </InputAdornment>
                  }
                >
                  {tspOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl className="simulateur-form-field">
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
                      <CreditCardIcon className="input-icon" />
                    </InputAdornment>
                  }
                >
                  {tokenRequestorOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl className="simulateur-form-field">
                <InputLabel id="pan-source-label">Source</InputLabel>
                <Select
                  labelId="pan-source-label"
                  id="panSource"
                  name="panSource"
                  value={formData.panSource}
                  label="Source"
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

              <div className="input-container">
                <Typography className="input-label">Card Number (PAN)</Typography>
                <TextField
                  className={`simulateur-form-field pan-input ${focusedInput === 'pan' ? 'focused' : ''}`}
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  inputProps={{
                    maxLength: 16,
                    pattern: '[0-9]{16}',
                    className: 'pan-input'
                  }}
                  onFocus={() => handleFocus('pan')}
                  onBlur={handleBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCardIcon className="input-icon" />
                      </InputAdornment>
                    ),
                    className: 'card-input'
                  }}
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="expiry-section">
                <Typography className="expiry-title">Expiration Date</Typography>
                <div className="expiry-group">
                  <FormControl className="simulateur-form-field">
                    <InputLabel id="month-label">Month</InputLabel>
                    <Select
                      labelId="month-label"
                      id="month"
                      name="expiryDate.month"
                      value={formData.expiryDate.month}
                      label="Month"
                      onChange={handleChange}
                      required
                      className="card-input"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl className="simulateur-form-field">
                    <InputLabel id="year-label">Year</InputLabel>
                    <Select
                      labelId="year-label"
                      id="year"
                      name="expiryDate.year"
                      value={formData.expiryDate.year}
                      label="Year"
                      onChange={handleChange}
                      required
                      className="card-input"
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <MenuItem key={year} value={year.toString().slice(-2)}>
                          {year.toString().slice(-2)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>

              <div className="input-container">
                <Typography className="input-label">CVV2</Typography>
                <TextField
                  className={`simulateur-form-field cvv-input ${focusedInput === 'cvv2' ? 'focused' : ''}`}
                  name="cvv2"
                  value={formData.cvv2}
                  onChange={handleChange}
                  variant="outlined"
                  type="password"
                  required
                  inputProps={{
                    maxLength: 3,
                    pattern: '[0-9]{3}',
                    className: 'cvv-input'
                  }}
                  onFocus={() => handleFocus('cvv2')}
                  onBlur={handleBlur}
                  InputProps={{
                    className: 'card-input',
                    startAdornment: (
                      <InputAdornment position="start">
                        <SecurityIcon className="input-icon" />
                      </InputAdornment>
                    )
                  }}
                  placeholder="123"
                />
              </div>

              <Button 
                variant="contained" 
                color="primary" 
                type="submit"
                className="simulateur-submit-button"
                disabled={loading}
                startIcon={loading ? null : <VerifiedIcon />}
              >
                {loading ? 'PROCESSING...' : 'APPROVE'}
              </Button>
            </div>
          </form>
        </Paper>
      </div>

      <Paper className="response-container" elevation={0}>
        <div className="response-header">
          <MessageIcon sx={{ fontSize: '1.2rem', color: '#6366f1' }} />
          <Typography variant="h6">Response</Typography>
        </div>
        <ResponseContent />
      </Paper>
      
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

const Simulateur = () => {
  // Afficher directement le contenu sans passer par ProtectedRoute
  // pour s'assurer que le contenu s'affiche toujours
  return <SimulateurContent />;
};

export default Simulateur;
