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
import ErrorIcon from '@mui/icons-material/Error';

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

  const [cardDescriptionData, setCardDescriptionData] = useState({
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

  const handleCardDescriptionChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCardDescriptionData({
        ...cardDescriptionData,
        [parent]: {
          ...cardDescriptionData[parent],
          [child]: value
        }
      });
    } else {
      setCardDescriptionData({
        ...cardDescriptionData,
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

  const formatResponse = (response) => {
    return {
      message: response.message || response.message_erreur,
      messageExterne: response.message_externe || response.message_externe_erreur,
      statusCode: response.status || 200
    };
  };

  const handleAxiosError = (error) => {
    if (error.response) {
      return {
        message: error.response.data?.message_erreur || error.message,
        messageExterne: error.response.data?.message_externe_erreur,
        statusCode: error.response.status
      };
    }
    return {
      message: "Erreur de connexion",
      messageExterne: "",
      statusCode: 500
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        tsp: formData.tsp,
        tokenRequestor: formData.tokenRequestor,
        pan: formData.pan,
        expiryMonth: formData.expiryDate.month,
        expiryYear: formData.expiryDate.year,
        cvv: formData.cvv2,
        panSource: formData.panSource
      };

      const response = await TokenService.issueTspToken(payload);
      const formattedResponse = formatResponse(response);
      
      setResponseData(formattedResponse);
      setNotification({
        open: true,
        message: formattedResponse.message,
        severity: formattedResponse.statusCode >= 400 ? 'error' : 'success'
      });

    } catch (error) {
      console.error('Error in form submission:', error);
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

  const handleCardDescriptionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        tsp: cardDescriptionData.tsp,
        tokenRequestor: cardDescriptionData.tokenRequestor,
        pan: cardDescriptionData.pan,
        expiryMonth: cardDescriptionData.expiryDate.month,
        expiryYear: cardDescriptionData.expiryDate.year,
        cvv: cardDescriptionData.cvv2,
        panSource: cardDescriptionData.panSource
      };

      const response = await TokenService.getCardDescription(payload);
      
      const formattedResponse = {
        message: response.message_erreur,
        messageExterne: response.message_externe_erreur,
        statusCode: response.status,
        cardDescription: response.data
      };
      
      setResponseData(formattedResponse);
      setNotification({
        open: true,
        message: formattedResponse.message,
        severity: formattedResponse.statusCode >= 400 ? 'error' : 'success'
      });

    } catch (error) {
      console.error('Error in card description submission:', error);
      
      const errorResponse = {
        message: error.response?.data?.message_erreur || 'Error retrieving card description',
        messageExterne: error.response?.data?.message_externe_erreur || '',
        statusCode: error.response?.status || 500
      };
      
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

  const parseMessageExterne = (messageExterne) => {
    if (!messageExterne) return '';
    
    try {
      if (typeof messageExterne === 'string') {
        const parsed = JSON.parse(messageExterne);
        return parsed.erreur || parsed.message || messageExterne;
      }
      return messageExterne;
    } catch (e) {
      return messageExterne;
    }
  };

  const ResponseContent = () => {
    if (!responseData) {
      return (
        <div className="response-content">
          <div className="response-message">
            Waiting for submission...
          </div>
        </div>
      );
    }

    const isError = responseData.statusCode >= 400 || responseData.message?.includes('refus');
    const messageClassName = `response-message ${isError ? 'error' : ''}`;
    const externalClassName = `response-external ${isError ? 'error' : ''}`;
    const codeClassName = `response-code ${isError ? 'error' : ''}`;

    return (
      <div className="response-content">
        {responseData.message && (
          <>
            <div className="response-label">MESSAGE</div>
            <div className={messageClassName}>
              {responseData.message}
            </div>
          </>
        )}

        {responseData.messageExterne && (
          <>
            <div className="response-label">MESSAGE EXTERNE</div>
            <div className={externalClassName}>
              {parseMessageExterne(responseData.messageExterne)}
            </div>
          </>
        )}

        {responseData.statusCode && (
          <>
            <div className="response-label">CODE STATUS</div>
            <div className={codeClassName}>
              {responseData.statusCode}
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
              <div className="form-row">
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
              </div>

              <div className="card-details">
                <div className="card-row">
                  <div className="pan-container">
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

                  <div className="cvv-container">
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

        <Paper className="simulateur-form-paper" elevation={0}>
          <div className="form-header">
            <div className="header-title">
              <CreditCardIcon sx={{ fontSize: '1.2rem', color: '#6366f1' }} />
              <Typography variant="h6">GET CARD DESCRIPTION</Typography>
            </div>
          </div>
          
          <form onSubmit={handleCardDescriptionSubmit}>
            <div className="form-content">
              <div className="form-row">
                <FormControl className="simulateur-form-field">
                  <InputLabel id="card-desc-tsp-label">TSP</InputLabel>
                  <Select
                    labelId="card-desc-tsp-label"
                    id="card-desc-tsp"
                    name="tsp"
                    value={cardDescriptionData.tsp}
                    label="TSP"
                    onChange={handleCardDescriptionChange}
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
                  <InputLabel id="card-desc-token-requestor-label">Token Requestor</InputLabel>
                  <Select
                    labelId="card-desc-token-requestor-label"
                    id="card-desc-tokenRequestor"
                    name="tokenRequestor"
                    value={cardDescriptionData.tokenRequestor}
                    label="Token Requestor"
                    onChange={handleCardDescriptionChange}
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
                  <InputLabel id="card-desc-pan-source-label">Source</InputLabel>
                  <Select
                    labelId="card-desc-pan-source-label"
                    id="card-desc-panSource"
                    name="panSource"
                    value={cardDescriptionData.panSource}
                    label="Source"
                    onChange={handleCardDescriptionChange}
                    required
                  >
                    {panSourceOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="card-details">
                <div className="card-row">
                  <div className="pan-container">
                    <Typography className="input-label">Card Number (PAN)</Typography>
                    <TextField
                      className={`simulateur-form-field pan-input ${focusedInput === 'card-desc-pan' ? 'focused' : ''}`}
                      name="pan"
                      value={cardDescriptionData.pan}
                      onChange={handleCardDescriptionChange}
                      variant="outlined"
                      required
                      inputProps={{
                        maxLength: 16,
                        pattern: '[0-9]{16}',
                        className: 'pan-input'
                      }}
                      onFocus={() => handleFocus('card-desc-pan')}
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

                  <div className="cvv-container">
                    <Typography className="input-label">CVV2</Typography>
                    <TextField
                      className={`simulateur-form-field cvv-input ${focusedInput === 'card-desc-cvv2' ? 'focused' : ''}`}
                      name="cvv2"
                      value={cardDescriptionData.cvv2}
                      onChange={handleCardDescriptionChange}
                      variant="outlined"
                      type="password"
                      required
                      inputProps={{
                        maxLength: 3,
                        pattern: '[0-9]{3}',
                        className: 'cvv-input'
                      }}
                      onFocus={() => handleFocus('card-desc-cvv2')}
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
                </div>

                <div className="expiry-section">
                  <Typography className="expiry-title">Expiration Date</Typography>
                  <div className="expiry-group">
                    <FormControl className="simulateur-form-field">
                      <InputLabel id="card-desc-month-label">Month</InputLabel>
                      <Select
                        labelId="card-desc-month-label"
                        id="card-desc-month"
                        name="expiryDate.month"
                        value={cardDescriptionData.expiryDate.month}
                        label="Month"
                        onChange={handleCardDescriptionChange}
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
                      <InputLabel id="card-desc-year-label">Year</InputLabel>
                      <Select
                        labelId="card-desc-year-label"
                        id="card-desc-year"
                        name="expiryDate.year"
                        value={cardDescriptionData.expiryDate.year}
                        label="Year"
                        onChange={handleCardDescriptionChange}
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
              </div>

              <Button 
                variant="contained" 
                color="primary" 
                type="submit"
                className="simulateur-submit-button"
                disabled={loading}
                startIcon={loading ? null : <VerifiedIcon />}
              >
                {loading ? 'PROCESSING...' : 'GET DESCRIPTION'}
              </Button>
            </div>
          </form>
        </Paper>
      </div>

      <div className="response-container">
        {ResponseContent()}
      </div>
    </div>
  );
};

export default SimulateurContent;