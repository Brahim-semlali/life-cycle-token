import React, { useState, useEffect } from 'react';
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import TokenService from '../../../services/TokenService';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    TextField, 
    Button, 
    FormControlLabel, 
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
    Divider,
    Fade,
    Chip,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Tab,
    Tabs
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    Search as SearchIcon, 
    Clear as ClearIcon,
    FilterList as FilterListIcon,
    CalendarToday as CalendarIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Token as TokenIcon,
    Smartphone as SmartphoneIcon,
    Assessment as AssessmentIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import TokenTable from './TokenTable';
import './TokenList.css';

const TokenList = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    // Fonction utilitaire pour convertir les formats de date
    const formatDateString = (dateStr, inputFormat = 'yyyy-MM-dd', outputFormat = 'dd/MM/yyyy') => {
        if (!dateStr) return '';
        try {
            // Gérer les formats ISO
            if (dateStr.includes('T')) {
                const date = new Date(dateStr);
                return format(date, outputFormat);
            }
            
            // Gérer les formats dd/MM/yyyy vers yyyy-MM-dd pour l'API
            if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                return `${year}-${month}-${day}`;
            }
            
            // Format par défaut
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date format: ${dateStr}`);
                return dateStr;
            }
            return format(date, outputFormat);
        } catch (error) {
            console.error(`Error formatting date ${dateStr}:`, error);
            return dateStr;
        }
    };

    // Style pour les champs en lecture seule
    const readOnlyInputProps = {
        readOnly: true,
        sx: {
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            '& .MuiInputBase-input': { 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                cursor: 'default'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
            }
        }
    };

    // Form state
    const [searchParams, setSearchParams] = useState({
        token_value: '',
        token_type: '',
        token_status: '',
        token_assurance_method: '',
        expiration_month: '',
        expiration_year: '',
        startDate: '',
        endDate: '',
        includeDeleted: false
    });

    // Date picker state
    const [startDateObj, setStartDateObj] = useState(null);
    const [endDateObj, setEndDateObj] = useState(null);

    // API data state
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resultsCount, setResultsCount] = useState(0);
    const [tableMetadata, setTableMetadata] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [filtersApplied, setFiltersApplied] = useState(false);

    // Dialog state for token details
    const [detailDialog, setDetailDialog] = useState({
        open: false,
        token: null,
        loading: false
    });

    // Dialog state for token edit
    const [editDialog, setEditDialog] = useState({
        open: false,
        token: null,
        loading: false,
        formData: {}
    });

    useEffect(() => {
        // Fetch tokens when component mounts
        fetchTokens();
        // Fetch database schema metadata
        fetchTableMetadata();
    }, []);

    // Update string dates when date objects change
    useEffect(() => {
        if (startDateObj) {
            setSearchParams(prev => ({
                ...prev,
                startDate: format(startDateObj, 'dd/MM/yyyy')
            }));
        }
        
        if (endDateObj) {
            setSearchParams(prev => ({
                ...prev,
                endDate: format(endDateObj, 'dd/MM/yyyy')
            }));
        }
    }, [startDateObj, endDateObj]);

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        
        // If we're setting a specific status, clear any token_status in searchParams
        if (value !== 'all') {
            setSearchParams(prev => ({
                ...prev,
                token_status: '' // Clear this as we'll use statusFilter instead
            }));
        }
    };

    const handleClear = () => {
        setSearchParams({
            token_value: '',
            token_type: '',
            token_status: '',
            token_assurance_method: '',
            expiration_month: '',
            expiration_year: '',
            startDate: '',
            endDate: '',
            includeDeleted: false
        });
        setStartDateObj(null);
        setEndDateObj(null);
        setStatusFilter('all');
        setFiltersApplied(false);
    };

    // Fetch database table metadata to understand schema
    const fetchTableMetadata = async () => {
        try {
            console.log('Fetching table metadata');
            const result = await TokenService.getTableMetadata();
            
            if (result) {
                console.log('Table metadata from API:', result);
                setTableMetadata(result);
                
                // Check if device fields are included in the metadata
                const columns = result.columns || [];
                const deviceFields = columns.filter(col => 
                    (col.name || col.column_name || '').includes('device_')
                );
                
                if (deviceFields.length > 0) {
                    console.log('Device fields in metadata:', deviceFields);
                }
            } else {
                console.error('Failed to fetch table metadata: No data returned');
                setError('Impossible de récupérer les métadonnées de la table. Utilisation du mode dégradé.');
            }
        } catch (error) {
            console.error('Error fetching table metadata:', error);
            setError('Erreur lors de la récupération des métadonnées. Les colonnes seront déterminées à partir des données.');
        }
    };

    const fetchTokens = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Build query parameters based on search filters
            const queryParams = {};
            
            // Only add non-empty values to query params
            Object.entries(searchParams).forEach(([key, value]) => {
                // Vérifier si la valeur existe et n'est pas une chaîne vide
                if (value !== undefined && value !== null) {
                    if (typeof value === 'string') {
                        if (value.trim() !== '') {
                            queryParams[key] = value.trim();
                        }
                    } else {
                        queryParams[key] = value;
                    }
                }
            });
            
            // Add status filter if specific status is selected
            if (statusFilter !== 'all') {
                queryParams.token_status = statusFilter;
            }
            
            console.log('Fetching tokens with filters:', queryParams);
            
            // Use the TokenService to fetch tokens directly from the database
            const result = await TokenService.listTokens(queryParams);
            
            if (result.success) {
                console.log('Fetched tokens:', result.data);
                
                // Apply client-side filtering for token_value if specified
                let filteredTokens = result.data;
                if (queryParams.token_value) {
                    const searchValue = queryParams.token_value.toLowerCase();
                    filteredTokens = filteredTokens.filter(token => 
                        token.token_value && token.token_value.toLowerCase().includes(searchValue)
                    );
                    console.log(`Filtered to ${filteredTokens.length} tokens matching value: ${searchValue}`);
                }
                
                // Apply client-side filtering for dates if specified
                if (queryParams.startDate) {
                    const startDate = new Date(queryParams.startDate.split('/').reverse().join('-'));
                    filteredTokens = filteredTokens.filter(token => {
                        if (!token.creation_date) return false;
                        const tokenDate = new Date(token.creation_date);
                        return tokenDate >= startDate;
                    });
                    console.log(`Filtered to ${filteredTokens.length} tokens after start date: ${queryParams.startDate}`);
                }
                
                if (queryParams.endDate) {
                    const endDate = new Date(queryParams.endDate.split('/').reverse().join('-'));
                    endDate.setHours(23, 59, 59); // Set to end of day
                    filteredTokens = filteredTokens.filter(token => {
                        if (!token.creation_date) return false;
                        const tokenDate = new Date(token.creation_date);
                        return tokenDate <= endDate;
                    });
                    console.log(`Filtered to ${filteredTokens.length} tokens before end date: ${queryParams.endDate}`);
                }
                
                // Apply client-side filtering for expiration month/year if specified
                if (queryParams.expiration_month) {
                    filteredTokens = filteredTokens.filter(token => 
                        token.expiration_month === queryParams.expiration_month
                    );
                }
                
                if (queryParams.expiration_year) {
                    filteredTokens = filteredTokens.filter(token => 
                        token.expiration_year === queryParams.expiration_year
                    );
                }
                
                // Apply client-side filtering for token_assurance_method if specified
                if (queryParams.token_assurance_method) {
                    filteredTokens = filteredTokens.filter(token => 
                        token.token_assurance_method && 
                        token.token_assurance_method.toLowerCase().includes(queryParams.token_assurance_method.toLowerCase())
                    );
                }
                
                // Filter deleted tokens if not included
                if (!queryParams.includeDeleted) {
                    filteredTokens = filteredTokens.filter(token => !token.is_deleted);
                }
                
                setTokens(filteredTokens);
                setResultsCount(filteredTokens.length);
                
                // Check if any filters are applied
                const hasFilters = Object.keys(queryParams).length > 0;
                setFiltersApplied(hasFilters);
            } else {
                setError(result.error);
                setTokens([]);
                setResultsCount(0);
            }
        } catch (err) {
            console.error('Error in fetchTokens:', err);
            setError('Failed to fetch tokens from database');
            setTokens([]);
            setResultsCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTokens();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            
            // Build query parameters for export
            const queryParams = {};
            
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value) {
                    queryParams[key] = value;
                }
            });
            
            if (statusFilter !== 'all') {
                queryParams.token_status = statusFilter;
            }
            
            // Use the TokenService to export tokens
            const result = await TokenService.exportTokens(queryParams);
            
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error in handleExport:', err);
            setError('Failed to export tokens');
        } finally {
            setLoading(false);
        }
    };

    // Handle token detail view
    const handleViewDetails = async (token) => {
        setDetailDialog({
            open: true,
            token,
            loading: true
        });

        try {
            // Fetch detailed token information from the database
            const result = await TokenService.getTokenDetails(token.id);
            
            if (result.success) {
                console.log('Fetched token details for viewing:', result.data);
                
                setDetailDialog(prev => ({
                    ...prev,
                    token: result.data,
                    loading: false
                }));
            } else {
                setError(result.error || 'Failed to fetch token details');
                setDetailDialog(prev => ({
                    ...prev,
                    loading: false
                }));
            }
        } catch (err) {
            console.error('Error in handleViewDetails:', err);
            setError('Failed to fetch token details');
            setDetailDialog(prev => ({
                ...prev,
                loading: false
            }));
        }
    };

    // Handle edit form input changes
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditDialog(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [name]: value
            }
        }));
    };

    // Handle token edit
    const handleEditToken = async (token) => {
        console.log('Edit token:', token);
        
        // Show loading state
        setEditDialog({
            open: true,
            token,
            loading: true,
            formData: {}
        });
        
        try {
            // Fetch detailed token information from the database
            const result = await TokenService.getTokenDetails(token.id);
            
            if (result.success) {
                console.log('Fetched token details for editing:', result.data);
                
                // Open the dialog with complete data from the database
                setEditDialog({
                    open: true,
                    token: result.data,
                    loading: false,
                    formData: { ...result.data }
                });
            } else {
                setError(result.error || 'Failed to fetch token details');
                // Still open the dialog with available data
                setEditDialog({
                    open: true,
                    token,
                    loading: false,
                    formData: { ...token }
                });
            }
        } catch (err) {
            console.error('Error in handleEditToken:', err);
            setError('Failed to fetch token details');
            // Still open the dialog with available data
            setEditDialog({
                open: true,
                token,
                loading: false,
                formData: { ...token }
            });
        }
    };

    // Submit edit form changes
    const handleSubmitEdit = async () => {
        try {
            setEditDialog(prev => ({ ...prev, loading: true }));
            
            // Appel à l'API pour mettre à jour le token
            const result = await TokenService.updateToken(
                editDialog.token.id, 
                editDialog.formData
            );
            
            if (result.success) {
                // Rafraîchir la liste des tokens après la mise à jour
                fetchTokens();
                // Fermer le dialogue d'édition
                handleCloseEditDialog();
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error in handleSubmitEdit:', err);
            setError('Failed to update token');
        } finally {
            setEditDialog(prev => ({ ...prev, loading: false }));
        }
    };

    // Close edit dialog
    const handleCloseEditDialog = () => {
        setEditDialog({
            open: false,
            token: null,
            loading: false,
            formData: {}
        });
    };

    // Handle token deletion
    const handleDeleteToken = async (token) => {
        try {
            setLoading(true);
            
            // Call the TokenService to delete the token
            const result = await TokenService.deleteToken(token.id);
            
            if (result.success) {
                // Refresh token list after deletion
                fetchTokens();
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error in handleDeleteToken:', err);
            setError('Failed to delete token');
        } finally {
            setLoading(false);
        }
    };

    // Handle token status update
    const handleUpdateStatus = async (token, action) => {
        try {
            setLoading(true);
            
            // Determine the new status based on action
            let newStatus;
            if (action === 'suspend') {
                newStatus = 'SUSPENDED';
            } else if (action === 'refresh') {
                // For refresh, we'll just update the last_status_update timestamp
                newStatus = token.token_status; 
            }
            
            // Call the TokenService to update the token status
            const result = await TokenService.updateTokenStatus(token.id, newStatus);
            
            if (result.success) {
                // Refresh token list
                fetchTokens();
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error in handleUpdateStatus:', err);
            setError('Failed to update token status');
        } finally {
            setLoading(false);
        }
    };

    // Close token detail dialog
    const handleCloseDetailDialog = () => {
        setDetailDialog({
            open: false,
            token: null,
            loading: false
        });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Box sx={{ padding: '1rem' }}>
                    {/* Error message */}
                    <Snackbar 
                        open={!!error} 
                        autoHideDuration={6000} 
                        onClose={() => setError(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    </Snackbar>

                    {/* Search Form */}
                <Box
                    component="section"
                        sx={{ 
                        mb: 4,
                        borderRadius: '12px',
                        bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : '#fff',
                        p: 3,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
                    }}
                    >
                        <Typography variant="h6" sx={{ 
                            mb: 3, 
                            fontWeight: 600, 
                            color: isDarkMode ? '#e2e8f0' : '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                        <SearchIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }} />
                        Search Tokens
                        </Typography>
                        
                        <form onSubmit={handleSearch}>
                            <Grid container spacing={2.5}>
                            <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                    label="Token value"
                                    name="token_value"
                                    value={searchParams.token_value}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                    label="Token type"
                                    name="token_type"
                                    value={searchParams.token_type}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                    label="Assurance method"
                                    name="token_assurance_method"
                                    value={searchParams.token_assurance_method}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                    label="Expiration month"
                                    name="expiration_month"
                                    value={searchParams.expiration_month}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                    label="Expiration year"
                                    name="expiration_year"
                                    value={searchParams.expiration_year}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <FormControl 
                                        variant="outlined" 
                                        size="small"
                                        fullWidth
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    borderWidth: '2px'
                                                }
                                            }
                                        }}
                                    >
                                    <InputLabel>Status Filter</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            onChange={handleStatusFilterChange}
                                        label="Status Filter"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <FilterListIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }} />
                                                </InputAdornment>
                                            }
                                        >
                                        <MenuItem value="all">All Statuses</MenuItem>
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                                        <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <DatePicker
                                    label="Created from"
                                        value={startDateObj}
                                        onChange={setStartDateObj}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: "small",
                                                InputProps: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }} />
                                                        </InputAdornment>
                                                    )
                                                },
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                            borderWidth: '2px'
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <DatePicker
                                    label="Created to"
                                        value={endDateObj}
                                        onChange={setEndDateObj}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: "small",
                                                InputProps: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CalendarIcon fontSize="small" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8' }} />
                                                        </InputAdornment>
                                                    )
                                                },
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                            borderWidth: '2px'
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="includeDeleted"
                                                checked={searchParams.includeDeleted}
                                                onChange={handleInputChange}
                                                color="primary"
                                                sx={{
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
                                                    '&.Mui-checked': {
                                                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8'
                                                    }
                                                }}
                                            />
                                        }
                                    label="Include deleted tokens"
                                        sx={{
                                            color: isDarkMode ? '#e2e8f0' : '#475569'
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<ClearIcon />}
                                        onClick={handleClear}
                                            sx={{
                                                color: isDarkMode ? '#e2e8f0' : '#64748b',
                                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                '&:hover': {
                                                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
                                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.2)'
                                                }
                                            }}
                                        >
                                        Clear
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            startIcon={<SearchIcon />}
                                            sx={{
                                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1',
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.95rem',
                                                padding: '8px 24px',
                                                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.15)',
                                                '&:hover': {
                                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#4f46e5',
                                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                                                }
                                            }}
                                        >
                                        Rechercher
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                </Box>

                    {/* Results Summary */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2,
                        px: 1
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                                Results: 
                                <Box component="span" sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1', ml: 1 }}>
                                    {resultsCount}
                                </Box>
                            </Typography>
                            
                            {filtersApplied && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 2 }}>
                                    {searchParams.token_value && (
                                <Chip 
                                            label={`Value: ${searchParams.token_value}`} 
                                    size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, token_value: '' }));
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {searchParams.token_type && (
                                        <Chip 
                                            label={`Type: ${searchParams.token_type}`} 
                                            size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, token_type: '' }));
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {statusFilter !== 'all' && (
                                        <Chip 
                                            label={`Status: ${statusFilter}`} 
                                            size="small"
                                            onDelete={() => {
                                                setStatusFilter('all');
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {searchParams.startDate && (
                                        <Chip 
                                            label={`From: ${searchParams.startDate}`} 
                                            size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, startDate: '' }));
                                                setStartDateObj(null);
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {searchParams.endDate && (
                                        <Chip 
                                            label={`To: ${searchParams.endDate}`} 
                                            size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, endDate: '' }));
                                                setEndDateObj(null);
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {searchParams.expiration_month && (
                                        <Chip 
                                            label={`Exp Month: ${searchParams.expiration_month}`} 
                                            size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, expiration_month: '' }));
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    {searchParams.expiration_year && (
                                        <Chip 
                                            label={`Exp Year: ${searchParams.expiration_year}`} 
                                            size="small"
                                            onDelete={() => {
                                                setSearchParams(prev => ({ ...prev, expiration_year: '' }));
                                                fetchTokens();
                                            }}
                                            sx={{ 
                                                fontSize: '0.75rem',
                                                height: '24px',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#6366f1'}15`,
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#6366f1'}25`
                                            }}
                                        />
                                    )}
                                    <Chip 
                                        label="Clear All" 
                                        size="small"
                                        onClick={handleClear}
                                        sx={{ 
                                            fontSize: '0.75rem',
                                            height: '24px',
                                            fontWeight: 500,
                                            borderRadius: '6px',
                                            backgroundColor: `${isDarkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                                            color: isDarkMode ? 'rgba(255, 80, 80, 0.8)' : '#ef4444',
                                            border: `1px solid ${isDarkMode ? 'rgba(255, 80, 80, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
                                            '&:hover': {
                                                backgroundColor: `${isDarkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`
                                            }
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={fetchTokens}
                                sx={{ 
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#6366f1'}10`
                                    }
                                }}
                            >
                                Refresh
                            </Button>
                            
                            <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={handleExport}
                                sx={{ 
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#6366f1',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: `${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#6366f1'}10`
                                    }
                                }}
                            >
                                Export
                            </Button>
                        </Box>
                    </Box>

                    {/* Results Table */}
                    <TokenTable 
                        tokens={tokens} 
                        loading={loading}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    onViewDetails={handleViewDetails}
                    onEditToken={handleEditToken}
                    onDeleteToken={handleDeleteToken}
                    onUpdateStatus={handleUpdateStatus}
                    tableMetadata={tableMetadata}
                />

                {/* Token Detail Dialog */}
                <Dialog 
                    open={detailDialog.open} 
                    onClose={handleCloseDetailDialog}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle 
                        component="div"
                        sx={{ 
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#6366f1',
                            color: '#fff',
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TokenIcon sx={{ fontSize: 28 }} />
                            Token Details
                        </Typography>
                        {detailDialog.token && (
                            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                ID: {detailDialog.token.id} {detailDialog.token.token_value && `• ${detailDialog.token.token_value}`}
                            </Typography>
                        )}
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        {detailDialog.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                </Box>
                        ) : detailDialog.token ? (
                            <Box sx={{ p: 0 }}>
                                {/* Status banner */}
                                {detailDialog.token.token_status && (
                                    <Box 
                                        sx={{ 
                                            p: 2, 
                                            borderBottom: '1px solid',
                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            bgcolor: theme => {
                                                const status = detailDialog.token.token_status.toLowerCase();
                                                if (status === 'active') return theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(52, 211, 153, 0.1)';
                                                if (status === 'inactive') return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                                                if (status === 'suspended') return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                                return 'transparent';
                                            }
                                        }}
                                    >
                                        <Chip 
                                            label={detailDialog.token.status_display || detailDialog.token.token_status} 
                                            size="medium"
                                            sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                height: '28px',
                                                borderRadius: '6px',
                                                mr: 2,
                                                backgroundColor: theme => {
                                                    const status = detailDialog.token.token_status.toLowerCase();
                                                    if (status === 'active') return theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.2)';
                                                    if (status === 'inactive') return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                                                    if (status === 'suspended') return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                                                    return theme.palette.mode === 'dark' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.2)';
                                                },
                                                color: theme => {
                                                    const status = detailDialog.token.token_status.toLowerCase();
                                                    if (status === 'active') return '#10b981';
                                                    if (status === 'inactive') return '#ef4444';
                                                    if (status === 'suspended') return '#f59e0b';
                                                    return '#6b7280';
                                                },
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {detailDialog.token.type_display || detailDialog.token.token_type} • 
                                            {detailDialog.token.token_assurance_method && ` Method: ${detailDialog.token.token_assurance_method} •`}
                                            {detailDialog.token.expiration_month && detailDialog.token.expiration_year && 
                                             ` Expires: ${detailDialog.token.expiration_month}/${detailDialog.token.expiration_year}`}
                                        </Typography>
                                    </Box>
                                )}
                                
                                <Box sx={{ height: '450px', overflowY: 'auto', p: 3 }}>
                                    {/* Group the data into logical sections */}
                                    <Grid container spacing={3}>
                                        {/* Token Basic Info */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ 
                                                fontSize: '1rem', 
                                                mb: 2, 
                                                fontWeight: 600,
                                                color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
                                                borderBottom: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                pb: 1
                                            }}>
                                                Token Information
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['id', 'token_value', 'token_type', 'type_display', 'token_status', 'status_display', 'token_assurance_method'].map(key => (
                                                    detailDialog.token[key] !== undefined && (
                                                        <Grid item xs={12} small={6} md={4} key={key}>
                                                            <Typography variant="caption" sx={{ 
                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b', 
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                letterSpacing: 0.5,
                                                                display: 'block',
                                                                mb: 0.5
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ 
                                                                fontWeight: 500,
                                                                color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                            }}>
                                                                {detailDialog.token[key] !== null ? String(detailDialog.token[key]) : 'N/A'}
                                                            </Typography>
                                                        </Grid>
                                                    )
                                                ))}
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Dates Section */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ 
                                                fontSize: '1rem', 
                                                mb: 2, 
                                                fontWeight: 600,
                                                color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
                                                borderBottom: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                pb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <CalendarIcon fontSize="small" />
                                                Timeline & Expiration
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['creation_date', 'activation_date', 'last_status_update', 'expiration_month', 'expiration_year', 'deleted_at'].map(key => (
                                                    detailDialog.token[key] !== undefined && (
                                                        <Grid item xs={12} small={6} md={4} key={key}>
                                                            <Typography variant="caption" sx={{ 
                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b', 
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                letterSpacing: 0.5,
                                                                display: 'block',
                                                                mb: 0.5
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </Typography>
                                                            {key.includes('date') || key.includes('_at') ? (
                                                                <Box sx={{
                                                                    p: 1,
                                                                    borderRadius: '4px',
                                                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.7)',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                                    border: '1px solid',
                                                                    borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                                    display: 'inline-block'
                                                                }}>
                                                                    {detailDialog.token[key] !== null 
                                                                        ? new Date(detailDialog.token[key]).toLocaleString() 
                                                                        : 'N/A'}
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" sx={{ 
                                                                    fontWeight: 500,
                                                                    color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                                }}>
                                                                    {detailDialog.token[key] !== null ? String(detailDialog.token[key]) : 'N/A'}
                                                                </Typography>
                                                            )}
                                                        </Grid>
                                                    )
                                                ))}
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Device Information */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ 
                                                fontSize: '1rem', 
                                                mb: 2, 
                                                fontWeight: 600,
                                                color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
                                                borderBottom: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                pb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <SmartphoneIcon fontSize="small" />
                                                Device Information
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['device_id', 'device_name', 'device_type', 'device_number'].map(key => (
                                                    detailDialog.token[key] !== undefined && (
                                                        <Grid item xs={12} small={6} md={4} key={key}>
                                                            <Typography variant="caption" sx={{ 
                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b', 
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                letterSpacing: 0.5,
                                                                display: 'block',
                                                                mb: 0.5
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </Typography>
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                {detailDialog.token[key] !== null ? (
                                                                    <Chip 
                                                                        label={String(detailDialog.token[key])}
                                                                        size="small"
                                                                        sx={{
                                                                            fontSize: '0.75rem',
                                                                            height: 'auto',
                                                                            py: 0.5,
                                                                            borderRadius: '4px',
                                                                            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 64, 175, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                                                                            color: theme => theme.palette.mode === 'dark' ? '#93c5fd' : '#1e40af',
                                                                            fontWeight: 500,
                                                                            border: '1px solid',
                                                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(147, 197, 253, 0.2)' : 'rgba(30, 64, 175, 0.2)'
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            fontWeight: 400,
                                                                            fontStyle: 'italic',
                                                                            color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'
                                                                        }}
                                                                    >
                                                                        N/A
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Grid>
                                                    )
                                                ))}
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Risk and Scoring Information */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ 
                                                fontSize: '1rem', 
                                                mb: 2, 
                                                fontWeight: 600,
                                                color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
                                                borderBottom: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                pb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <AssessmentIcon fontSize="small" />
                                                Risk Assessment & Scoring
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['wallet_account_score', 'wallet_device_score', 'wallet_reason_codes', 'visa_token_score', 'visa_decisioning', 'risk_assessment_score'].map(key => (
                                                    detailDialog.token[key] !== undefined && (
                                                        <Grid item xs={12} small={6} md={4} key={key}>
                                                            <Typography variant="caption" sx={{ 
                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b', 
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                letterSpacing: 0.5,
                                                                display: 'block',
                                                                mb: 0.5
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </Typography>
                                                            {key.includes('score') ? (
                                                                <Box sx={{ position: 'relative' }}>
                                                                    {detailDialog.token[key] !== null ? (
                                                                        <Box sx={{ 
                                                                            display: 'flex', 
                                                                            alignItems: 'center', 
                                                                            gap: 1 
                                                                        }}>
                                                                            <Box sx={{
                                                                                width: '100%',
                                                                                height: '8px',
                                                                                borderRadius: '4px',
                                                                                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                                                overflow: 'hidden',
                                                                                position: 'relative'
                                                                            }}>
                                                                                <Box sx={{
                                                                                    position: 'absolute',
                                                                                    left: 0,
                                                                                    top: 0,
                                                                                    bottom: 0,
                                                                                    width: `${Math.min(parseInt(detailDialog.token[key], 10), 100)}%`,
                                                                                    bgcolor: theme => {
                                                                                        const score = parseInt(detailDialog.token[key], 10);
                                                                                        if (score >= 80) return theme.palette.mode === 'dark' ? '#10b981' : '#10b981';
                                                                                        if (score >= 50) return theme.palette.mode === 'dark' ? '#f59e0b' : '#f59e0b';
                                                                                        return theme.palette.mode === 'dark' ? '#ef4444' : '#ef4444';
                                                                                    },
                                                                                    transition: 'width 0.5s ease'
                                                                                }}/>
                                                                            </Box>
                                                                            <Chip 
                                                                                label={detailDialog.token[key]}
                                                                                size="small"
                                                                                sx={{
                                                                                    fontSize: '0.75rem',
                                                                                    height: '24px',
                                                                                    borderRadius: '12px',
                                                                                    backgroundColor: theme => {
                                                                                        const score = parseInt(detailDialog.token[key], 10);
                                                                                        if (score >= 80) return theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                                                                                        if (score >= 50) return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                                                                                        return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                                                                                    },
                                                                                    color: theme => {
                                                                                        const score = parseInt(detailDialog.token[key], 10);
                                                                                        if (score >= 80) return '#10b981';
                                                                                        if (score >= 50) return '#f59e0b';
                                                                                        return '#ef4444';
                                                                                    },
                                                                                    fontWeight: 600
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    ) : (
                                                                        <Typography 
                                                                            variant="body2" 
                                                                            sx={{ 
                                                                                fontWeight: 400,
                                                                                fontStyle: 'italic',
                                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'
                                                                            }}
                                                                        >
                                                                            N/A
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" sx={{ 
                                                                    fontWeight: 500,
                                                                    color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                                    p: 1,
                                                                    borderRadius: '4px', 
                                                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.7)',
                                                                    border: '1px solid',
                                                                    borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                                }}>
                                                                    {detailDialog.token[key] !== null ? String(detailDialog.token[key]) : 'N/A'}
                                                                </Typography>
                                                            )}
                                                        </Grid>
                                                    )
                                                ))}
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Deletion Status */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ 
                                                fontSize: '1rem', 
                                                mb: 2, 
                                                fontWeight: 600,
                                                color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#334155',
                                                borderBottom: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                pb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <DeleteIcon fontSize="small" />
                                                Deletion Status
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['is_deleted'].map(key => (
                                                    detailDialog.token[key] !== undefined && (
                                                        <Grid item xs={12} small={6} key={key}>
                                                            <Typography variant="caption" sx={{ 
                                                                color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#64748b', 
                                                                textTransform: 'uppercase',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                letterSpacing: 0.5,
                                                                display: 'block',
                                                                mb: 0.5
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </Typography>
                                                            <Chip 
                                                                label={detailDialog.token[key] === true ? 'Yes' : 'No'} 
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.75rem',
                                                                    height: '24px',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: theme => detailDialog.token[key] === true 
                                                                        ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                                                        : (theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.2)'),
                                                                    color: detailDialog.token[key] === true ? '#ef4444' : '#10b981',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </Grid>
                                                    )
                                                ))}
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        ) : (
                            <Typography sx={{ p: 4, textAlign: 'center' }}>No token details available</Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ 
                        borderTop: '1px solid',
                        borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <Button 
                            onClick={() => handleEditToken(detailDialog.token)}
                            variant="outlined" 
                            startIcon={<EditIcon />}
                            sx={{
                                borderRadius: '8px',
                                color: theme => theme.palette.mode === 'dark' ? '#94a3b8' : '#6366f1',
                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.5)',
                                '&:hover': {
                                    borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.8)',
                                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)'
                                }
                            }}
                        >
                            Edit Token
                        </Button>
                        <Button 
                            onClick={handleCloseDetailDialog}
                            variant="contained"
                            sx={{
                                borderRadius: '8px',
                                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#6366f1',
                                color: theme => theme.palette.mode === 'dark' ? '#fff' : '#fff',
                                '&:hover': {
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#4f46e5'
                                }
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Token Edit Dialog */}
                <Dialog 
                    open={editDialog.open} 
                    onClose={handleCloseEditDialog}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle 
                        component="div"
                        sx={{ 
                            fontWeight: 600, 
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc',
                            borderBottom: '1px solid',
                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                            p: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <EditIcon sx={{ color: theme => theme.palette.mode === 'dark' ? '#94a3b8' : '#6366f1' }} />
                        Edit Token
                        {editDialog.token && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ID: {editDialog.token.id}
                            </Typography>
                        )}
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, mt: 2 }}>
                        {editDialog.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : editDialog.token ? (
                            <Grid container spacing={3}>
                                {/* Message d'information */}
                                <Grid item xs={12}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Seuls le statut du token et certains champs peuvent être modifiés. Les autres champs sont en lecture seule.
                                    </Alert>
                                </Grid>
                                
                                {/* Basic Token Information */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600, 
                                        mb: 1, 
                                        color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#4b5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <TokenIcon fontSize="small" />
                                        Basic Token Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} small={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Value"
                                        name="token_value"
                                        value={editDialog.formData.token_value || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} small={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Type"
                                        name="token_type"
                                        value={editDialog.formData.token_type || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Type Display"
                                        name="type_display"
                                        value={editDialog.formData.type_display || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel id="token-status-label">Token Status</InputLabel>
                                        <Select
                                            labelId="token-status-label"
                                            name="token_status"
                                            value={editDialog.formData.token_status || ''}
                                            onChange={handleEditFormChange}
                                            label="Token Status"
                                        >
                                            <MenuItem value="ACTIVE">Active</MenuItem>
                                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                                            <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Status Display"
                                        name="status_display"
                                        value={editDialog.formData.status_display || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Assurance Method"
                                        name="token_assurance_method"
                                        value={editDialog.formData.token_assurance_method || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>

                                {/* Dates */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600, 
                                        mb: 1, 
                                        mt: 2, 
                                        color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#4b5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <CalendarIcon fontSize="small" />
                                        Dates
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Creation Date"
                                        name="creation_date"
                                        value={editDialog.formData.creation_date ? new Date(editDialog.formData.creation_date).toLocaleDateString('fr-FR') : ''}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Activation Date"
                                        value={editDialog.formData.activation_date ? new Date(editDialog.formData.activation_date) : null}
                                        onChange={(date) => {
                                            setEditDialog(prev => ({
                                                ...prev,
                                                formData: {
                                                    ...prev.formData,
                                                    activation_date: date ? date.toISOString() : null
                                                }
                                            }));
                                        }}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: "normal",
                                                variant: "outlined"
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Status Update"
                                        name="last_status_update"
                                        value={editDialog.formData.last_status_update ? new Date(editDialog.formData.last_status_update).toLocaleDateString('fr-FR') : ''}
                                        InputProps={readOnlyInputProps}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Expiration Month"
                                        name="expiration_month"
                                        value={editDialog.formData.expiration_month || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Expiration Year"
                                        name="expiration_year"
                                        value={editDialog.formData.expiration_year || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>

                                {/* Device Information */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600, 
                                        mb: 1, 
                                        mt: 2, 
                                        color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#4b5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <SmartphoneIcon fontSize="small" />
                                        Device Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Device ID"
                                        name="device_id"
                                        value={editDialog.formData.device_id || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Device Name"
                                        name="device_name"
                                        value={editDialog.formData.device_name || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Device Type"
                                        name="device_type"
                                        value={editDialog.formData.device_type || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Device Number"
                                        name="device_number"
                                        value={editDialog.formData.device_number || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>

                                {/* Deletion Information */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600, 
                                        mb: 1, 
                                        mt: 2, 
                                        color: theme => theme.palette.mode === 'dark' ? '#e2e8f0' : '#4b5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <DeleteIcon fontSize="small" />
                                        Deletion Status
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!editDialog.formData.is_deleted}
                                                onChange={(e) => {
                                                    const isDeleted = e.target.checked;
                                                    setEditDialog(prev => ({
                                                        ...prev,
                                                        formData: {
                                                            ...prev.formData,
                                                            is_deleted: isDeleted,
                                                            deleted_at: isDeleted ? new Date().toISOString() : null
                                                        }
                                                    }));
                                                }}
                                                name="is_deleted"
                                            />
                                        }
                                        label="Is Deleted"
                                        sx={{ mt: 2 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Deleted At"
                                        name="deleted_at"
                                        value={editDialog.formData.deleted_at ? new Date(editDialog.formData.deleted_at).toLocaleDateString('fr-FR') : ''}
                                        InputProps={readOnlyInputProps}
                                        variant="outlined"
                                        margin="normal"
                                        disabled={!editDialog.formData.is_deleted}
                                    />
                                </Grid>
                            </Grid>
                        ) : (
                            <Typography>No token data available</Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc', borderTop: '1px solid', borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' }}>
                        <Button 
                            onClick={handleCloseEditDialog}
                            variant="outlined"
                            sx={{ 
                                color: theme => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b', 
                                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
                                borderRadius: '8px',
                                '&:hover': {
                                    borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
                                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(226, 232, 240, 0.2)'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmitEdit}
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={editDialog.loading}
                            sx={{
                                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#6366f1',
                                color: '#fff',
                                borderRadius: '8px',
                                '&:hover': {
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#4f46e5'
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
                </Box>
        </LocalizationProvider>
    );
};

export default TokenList; 