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
    Tabs,
    Tooltip,
    Fab,
    Badge
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
import { useSnackbar } from 'notistack';

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
    
    // Style pour les champs modifiables
    const editableInputProps = {
        readOnly: false,
        sx: {
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
            '& .MuiInputBase-input': { 
                color: isDarkMode ? '#fff' : '#000',
                cursor: 'text'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? 'rgba(79, 70, 229, 0.5)' : 'rgba(99, 102, 241, 0.3)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? 'rgba(79, 70, 229, 0.8)' : 'rgba(99, 102, 241, 0.5)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#6366f1' : '#4f46e5'
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

    // New state for reason dialogs
    const [reasonDialog, setReasonDialog] = useState({
        open: false,
        action: null, // 'activate', 'suspend', 'resume', 'deactivate'
        token: null,
        reason: '',
        reasonOptions: [],
        selectedReason: '',
        reasonValues: []
    });

    // État pour stocker les statuts modifiés localement
    const [modifiedStatuses, setModifiedStatuses] = useState({});

    // État pour stocker les options d'actions de token
    const [actionOptions] = useState({
        activate_reasons: [
            { value: 'Account reopened', label: 'Account reopened' },
            { value: 'Fraud resolved', label: 'Fraud resolved' },
            { value: 'Other', label: 'Other (Active)' }
        ],
        suspend_reasons: [
            { value: 'lost', label: 'Lost' },
            { value: 'stolen', label: 'Stolen' },
            { value: 'Fraudulent use', label: 'Fraudulent use' },
            { value: 'Account Closed', label: 'Account Closed' },
            { value: 'Other', label: 'Other (Suspend)' }
        ],
        resume_reasons: [
            { value: 'Found', label: 'Found' },
            { value: 'Fraudulent use denied', label: 'Fraudulent use denied' },
            { value: 'Other', label: 'Other (Resume)' }
        ],
        delete_reasons: [
            { value: 'lost', label: 'Lost' },
            { value: 'stolen', label: 'Stolen' },
            { value: 'Fraudulent use', label: 'Fraudulent use' },
            { value: 'Account Closed', label: 'Account Closed' },
            { value: 'Other', label: 'Other (Delete)' }
        ]
    });

    // État pour les messages de confirmation en attente
    const [pendingStatusChanges, setPendingStatusChanges] = useState({});
    const [pendingMessage, setPendingMessage] = useState(null);

    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedReason, setSelectedReason] = useState('');
    const [messageText, setMessageText] = useState('');
    const [openReasonDialog, setOpenReasonDialog] = useState(false);

    const { enqueueSnackbar } = useSnackbar();

    // Fonction mise à jour pour ajouter un statut à la liste des statuts modifiés
    const updateLocalStatus = (tokenId, newStatus) => {
        console.log(`Caching local status for token ${tokenId}: ${newStatus}`);
        
        // Gestion spéciale pour SUSPENDED et DEACTIVATED pour assurer l'affichage immédiat
        if (newStatus === 'SUSPENDED' || newStatus === 'DEACTIVATED') {
            console.log(`Mise à jour spéciale pour statut: ${newStatus}`);
            
            // Mettre à jour l'état local des tokens immédiatement
            setTokens(currentTokens => {
                return currentTokens.map(token => {
                    if (token.id === tokenId) {
                        return {
                            ...token,
                            tokenStatus: newStatus,
                            token_status: newStatus
                        };
                    }
                    return token;
                });
            });
        }
        
        // Mettre à jour la cache des statuts modifiés
        setModifiedStatuses(prev => ({
            ...prev,
            [tokenId]: newStatus
        }));
    };

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

    const fetchTokens = async (forceRefresh = false) => {
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
            
            // Force refresh from server by adding a timestamp
            queryParams._ts = Date.now();
            
            // Forcer un rafraîchissement complet si demandé
            if (forceRefresh) {
                queryParams._cache = 'no-cache';
                console.log('Forçage du rafraîchissement complet des données');
            }
            
            // Use the TokenService to fetch tokens directly from the database
            const result = await TokenService.listTokens(queryParams);
            
            if (result.success) {
                console.log('Fetched tokens:', result.data);
                
                // Debug: Log the token statuses to check what's coming from the API
                if (result.data && result.data.length > 0) {
                    console.log('Token statuses from API:', result.data.map(t => ({
                        id: t.id,
                        token_status: t.token_status,
                        tokenStatus: t.tokenStatus
                    })));
                    
                    // Ajouter un log plus détaillé du premier token
                    console.log('Detailed first token from API:', JSON.stringify(result.data[0], null, 2));
                }
                
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
                
                // Ensure both tokenStatus and token_status are present for consistent UI display
                // And apply any locally cached status overrides
                const normalizedTokens = filteredTokens.map(token => {
                    // Base normalization for consistent field format
                    const normalizedToken = {
                        ...token,
                        // Ensure both formats are available regardless which one comes from API
                        tokenStatus: token.tokenStatus || token.token_status,
                        token_status: token.token_status || token.tokenStatus
                    };
                    
                    // Apply any local status overrides if available
                    if (modifiedStatuses && token.id && modifiedStatuses[token.id]) {
                        const cachedStatus = modifiedStatuses[token.id];
                        console.log(`Applying locally cached status override for token ${token.id}: ${cachedStatus}`);
                        normalizedToken.tokenStatus = cachedStatus;
                        normalizedToken.token_status = cachedStatus;
                    }
                    
                    return normalizedToken;
                });
                
                // Refresh table data
                setTokens(normalizedTokens);
                setResultsCount(normalizedTokens.length);
                
                // Check if any filters are applied
                const hasFilters = Object.keys(queryParams).length > 1; // Accounting for _ts
                setFiltersApplied(hasFilters);
                
                return true; // Indicate success
            } else {
                setError(result.error);
                setTokens([]);
                setResultsCount(0);
                return false; // Indicate failure
            }
        } catch (err) {
            console.error('Error in fetchTokens:', err);
            setError('Failed to fetch tokens from database');
            setTokens([]);
            setResultsCount(0);
            return false; // Indicate failure
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
        console.log(`Editing field ${name} with value ${value}`);
        setEditDialog(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [name]: value
            }
        }));
    };

    // Alternative method for handling status change directly
    const handleStatusChange = (newStatus) => {
        console.log(`Changing status directly to ${newStatus}`);
        setEditDialog(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                tokenStatus: newStatus
            }
        }));
    };

    // Alternative method for handling assurance method change directly
    const handleAssuranceMethodChange = (newMethod) => {
        console.log(`Changing assurance method directly to ${newMethod}`);
        setEditDialog(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                tokenAssuranceMethod: newMethod
            }
        }));
    };

    // Handle token edit
    const handleEditToken = async (token) => {
        console.log('Edit token action disabled');
        // Edit functionality is disabled
    };

    // Submit edit form changes with local status caching
    const handleSubmitEdit = async () => {
        try {
            setEditDialog(prev => ({ ...prev, loading: true }));
            
            // Map the field names from our form to what the API expects
            const mappedData = {
                ...editDialog.formData,
                // Add change reason
                change_reason: 'User edit from form'
            };
            
            // Récupérer le statut modifié pour mise en cache local
            const newStatus = mappedData.tokenStatus || mappedData.token_status;
            if (newStatus) {
                // Mettre à jour la cache locale avant même d'envoyer à l'API
                updateLocalStatus(editDialog.token.id, newStatus);
                console.log(`Locally cached status for token ${editDialog.token.id}: ${newStatus}`);
            }
            
            // Map camelCase fields to the API's expected format based on the logs
            if (mappedData.tokenReferenceId !== undefined) {
                mappedData.tokenReferenceID = mappedData.tokenReferenceId;
                delete mappedData.tokenReferenceId;
            }
            
            if (mappedData.tokenRequestorId !== undefined) {
                mappedData.tokenRequestorID = mappedData.tokenRequestorId;
                delete mappedData.tokenRequestorId;
            }
            
            // Ensure both camelCase and snake_case status fields are present and in sync
            if (mappedData.tokenStatus !== undefined) {
                mappedData.token_status = mappedData.tokenStatus;
                console.log(`Status being updated to: ${mappedData.tokenStatus} (${mappedData.token_status})`);
            } else if (mappedData.token_status !== undefined) {
                mappedData.tokenStatus = mappedData.token_status;
                console.log(`Status being updated to: ${mappedData.token_status} (${mappedData.tokenStatus})`);
            }
            
            if (mappedData.token !== undefined) {
                mappedData.token_value = mappedData.token;
            }
            
            if (mappedData.tokenType !== undefined) {
                mappedData.token_type = mappedData.tokenType;
                delete mappedData.tokenType;
            }
            
            if (mappedData.tokenAssuranceMethod !== undefined) {
                mappedData.token_assurance_method = mappedData.tokenAssuranceMethod;
                delete mappedData.tokenAssuranceMethod;
            }
            
            // Ensure all required fields are present
            if (!mappedData.token_value) {
                setError('Token value is required');
                setEditDialog(prev => ({ ...prev, loading: false }));
                return;
            }
            
            if (!mappedData.token_type) {
                setError('Token type is required');
                setEditDialog(prev => ({ ...prev, loading: false }));
                return;
            }
            
            if (!mappedData.token_status) {
                setError('Token status is required');
                setEditDialog(prev => ({ ...prev, loading: false }));
                return;
            }
            
            if (!mappedData.token_assurance_method) {
                setError('Token assurance method is required');
                setEditDialog(prev => ({ ...prev, loading: false }));
                return;
            }
            
            console.log('Sending mapped data to API:', mappedData);
            
            // Add original ID to ensure proper identification
            mappedData.id = editDialog.token.id;
            
            // Appel à l'API pour mettre à jour le token
            const result = await TokenService.updateToken(
                editDialog.token.id, 
                mappedData
            );
            
            if (result.success) {
                console.log('Update success, refreshing tokens with new data');
                // Rafraîchir la liste des tokens après la mise à jour
                await fetchTokens();
                // Fermer le dialogue d'édition
                handleCloseEditDialog();
            } else {
                setError(result.error || 'Failed to update token');
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

    // Handle token status update with local cache
    const handleUpdateStatus = async (token, action) => {
        try {
            if (!action) {
                throw new Error('Action non spécifiée');
            }
            
            setSelectedToken(token);
            setSelectedAction(action.toUpperCase());
            setSelectedReason('');
            setMessageText('');
            setOpenReasonDialog(true);
        } catch (error) {
            console.error('Error preparing status update:', error);
            enqueueSnackbar('Erreur lors de la préparation de la mise à jour: ' + error.message, { 
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    };

    // Process the status update after reason is provided
    const handleConfirmStatusUpdate = async () => {
        try {
            setIsUpdating(true);
            let result;

            switch (selectedAction) {
                case 'ACTIVATE':
                    result = await TokenService.activateToken(selectedToken.id, messageText, selectedReason);
                    break;
                case 'SUSPEND':
                    result = await TokenService.suspendToken(selectedToken.id, selectedReason, messageText);
                    break;
                case 'RESUME':
                    result = await TokenService.resumeToken(selectedToken.id, selectedReason, messageText);
                    break;
                case 'DELETE':
                case 'DEACTIVATE':
                    result = await TokenService.deactivateToken(selectedToken.id, selectedReason, messageText);
                    break;
                default:
                    setIsUpdating(false);
                    enqueueSnackbar('Action non valide', { 
                        variant: 'error',
                        autoHideDuration: 5000,
                        anchorOrigin: {
                            vertical: 'top',
                            horizontal: 'center'
                        }
                    });
                    return;
            }

            if (result.success) {
                // Afficher le message du backend s'il existe, sinon utiliser un message par défaut
                const backendMessage = result.data?.message || result.data?.status || result.message;
                if (backendMessage) {
                    enqueueSnackbar(backendMessage, { 
                        variant: 'success',
                        autoHideDuration: 5000,
                        anchorOrigin: {
                            vertical: 'top',
                            horizontal: 'center'
                    }
                    });
                } else {
                    enqueueSnackbar('Requête envoyée avec succès', { 
                        variant: 'success',
                        autoHideDuration: 3000
                    });
                }
                
                // Fermer le dialogue
                setOpenReasonDialog(false);
                setSelectedToken(null);
                setSelectedAction(null);
                setSelectedReason('');
                setMessageText('');
            } else {
                // Afficher le message d'erreur du backend
                const errorMessage = result.error || result.details?.message || result.details?.error || 'Erreur lors de l\'envoi de la requête';
                enqueueSnackbar(errorMessage, { 
                    variant: 'error',
                    autoHideDuration: 5000,
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center'
                    }
                });
            }
        } catch (error) {
            console.error('Error updating token status:', error);
            const errorMessage = error.message || 'Une erreur est survenue';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                autoHideDuration: 5000,
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center'
                }
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Handle reason dialog close
    const handleReasonDialogClose = () => {
        setOpenReasonDialog(false);
        setSelectedToken(null);
        setSelectedAction(null);
        setSelectedReason('');
        setMessageText('');
    };
    
    // Handle reason input
    const handleReasonChange = (e) => {
        const { name, value } = e.target;
        setReasonDialog(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Close token detail dialog
    const handleCloseDetailDialog = () => {
        setDetailDialog({
            open: false,
            token: null,
            loading: false
        });
    };

    // Conversion des codes de méthode d'assurance en libellés
    const getAssuranceMethodDescription = (code) => {
        if (!code) return 'Unknown';
        
        const descriptions = {
            '00': 'D&V Not Performed',
            '10': 'Card Issuer Account Verification',
            '11': 'Card Issuer Interactive Cardholder Verification - 1 Factor',
            '12': 'Card Issuer Interactive Cardholder Verification - 2 Factor',
            '13': 'Card Issuer Risk Oriented Non-Interactive Cardholder Authentication',
            '14': 'Card Issuer Asserted Authentication'
        };
        
        return descriptions[code] || `Code ${code}`;
    };

    // Define reason options for different actions
    const getReasonOptions = (action) => {
        // Si action est null ou undefined, retourner un tableau vide
        if (!action) {
            return [];
        }
        
        // Normaliser l'action en majuscules
        const normalizedAction = action.toUpperCase();
        
        // Si nous avons des options de l'API, les utiliser en priorité
        if (actionOptions) {
            switch(normalizedAction) {
                case 'ACTIVATE':
                    if (actionOptions.activate_reasons && actionOptions.activate_reasons.length > 0) {
                        return actionOptions.activate_reasons;
                    }
                    return ['Account reopened', 'Fraud resolved', 'Other'].map(value => ({ value, label: value }));
                    
                case 'SUSPEND':
                    if (actionOptions.suspend_reasons && actionOptions.suspend_reasons.length > 0) {
                        return actionOptions.suspend_reasons;
                    }
                    return ['lost', 'stolen', 'Fraudulent use', 'Account Closed', 'Other'].map(value => ({ value, label: value }));
                    
                case 'RESUME':
                    if (actionOptions.resume_reasons && actionOptions.resume_reasons.length > 0) {
                        return actionOptions.resume_reasons;
                    }
                    return ['Found', 'Fraudulent use denied', 'Other'].map(value => ({ value, label: value }));
                    
                case 'DELETE':
                case 'DEACTIVATE':
                    if (actionOptions.delete_reasons && actionOptions.delete_reasons.length > 0) {
                        return actionOptions.delete_reasons;
                    }
                    return ['lost', 'stolen', 'Fraudulent use', 'Account Closed', 'Other'].map(value => ({ value, label: value }));
                    
                default:
                    return [];
            }
        }
        
        // Valeurs par défaut si pas d'options de l'API
        switch(normalizedAction) {
            case 'ACTIVATE':
                return ['Account reopened', 'Fraud resolved', 'Other'].map(value => ({ value, label: value }));
            case 'SUSPEND':
                return ['lost', 'stolen', 'Fraudulent use', 'Account Closed', 'Other'].map(value => ({ value, label: value }));
            case 'RESUME':
                return ['Found', 'Fraudulent use denied', 'Other'].map(value => ({ value, label: value }));
            case 'DELETE':
            case 'DEACTIVATE':
                return ['lost', 'stolen', 'Fraudulent use', 'Account Closed', 'Other'].map(value => ({ value, label: value }));
            default:
        return [];
        }
    };

    // Ajouter une fonction pour simuler la confirmation de l'équipe
    const handleSimulateConfirmation = async (tokenId) => {
        try {
            setLoading(true);
            
            // Récupérer les détails de la demande en attente
            const pendingChange = pendingStatusChanges[tokenId];
            if (!pendingChange) {
                setError("Aucune demande en attente trouvée pour ce token");
                return;
            }
            
            console.log(`Simulation de confirmation pour le token ${tokenId}, action: ${pendingChange.action}`);
            
            // Déterminer le nouveau statut en fonction de l'action
            let newStatus;
            switch(pendingChange.action) {
                case 'activate':
                    newStatus = 'ACTIVE';
                    break;
                case 'suspend':
                    newStatus = 'SUSPENDED';
                    break;
                case 'resume':
                    newStatus = 'INACTIVE'; // Resume sets status to INACTIVE instead of ACTIVE
                    break;
                case 'deactivate':
                    newStatus = 'DEACTIVATED';
                    break;
                default:
                    newStatus = null;
            }
            
            if (newStatus) {
                // Mettre à jour le statut local
                updateLocalStatus(tokenId, newStatus);
                
                // Afficher un message de confirmation
                setPendingMessage({
                    type: 'success',
                    text: `Demande confirmée par l'équipe: Le token a été mis à jour avec le statut ${newStatus}`,
                    tokenId: tokenId,
                    action: pendingChange.action
                });
                
                // Supprimer de la liste des demandes en attente
                setPendingStatusChanges(prev => {
                    const newState = { ...prev };
                    delete newState[tokenId];
                    return newState;
                });
                
                // Rafraîchir la liste des tokens
                await fetchTokens();
            }
        } catch (err) {
            console.error('Error in handleSimulateConfirmation:', err);
            setError('Failed to simulate confirmation');
        } finally {
            setLoading(false);
        }
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

                    {/* Pending status change message */}
                    <Snackbar
                        open={!!pendingMessage}
                        autoHideDuration={10000}
                        onClose={() => setPendingMessage(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert 
                            onClose={() => setPendingMessage(null)} 
                            severity={pendingMessage?.type || "info"}
                            sx={{ 
                                width: '100%',
                                '& .MuiAlert-message': {
                                    fontWeight: 500
                                }
                            }}
                        >
                            {pendingMessage?.text}
                        </Alert>
                    </Snackbar>

                    {/* FOR DEMO ONLY: Button to simulate team confirmation */}
                    {Object.keys(pendingStatusChanges).length > 0 && (
                        <Box sx={{ 
                            position: 'fixed', 
                            bottom: 20, 
                            right: 20, 
                            zIndex: 1000 
                        }}>
                            <Tooltip title="DÉMO: Simuler la confirmation par l'équipe">
                                <Badge 
                                    badgeContent={Object.keys(pendingStatusChanges).length} 
                                    color="secondary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.9rem',
                                            height: '22px',
                                            minWidth: '22px'
                                        }
                                    }}
                                >
                                    <Fab 
                                        color="primary" 
                                        variant="extended"
                                        onClick={() => handleSimulateConfirmation(Object.keys(pendingStatusChanges)[0])}
                                        sx={{
                                            textTransform: 'none'
                                        }}
                                    >
                                        Simuler confirmation
                                    </Fab>
                                </Badge>
                            </Tooltip>
                        </Box>
                    )}

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
                                        <MenuItem value="DEACTIVATED">Deactivated</MenuItem>
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
                        pendingStatusChanges={pendingStatusChanges}
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
                                ID: {detailDialog.token.id} {detailDialog.token.token && `• ${detailDialog.token.token}`}
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
                                {detailDialog.token.tokenStatus && (
                                    <Box 
                                        sx={{ 
                                            p: 2, 
                                            borderBottom: '1px solid',
                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            bgcolor: theme => {
                                                const status = detailDialog.token.tokenStatus?.toLowerCase();
                                                if (status === 'active') return theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(52, 211, 153, 0.1)';
                                                if (status === 'inactive') return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                                                if (status === 'suspended') return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                                                return 'transparent';
                                            }
                                        }}
                                    >
                                        <Chip 
                                            label={detailDialog.token.tokenStatus} 
                                            size="medium"
                                            sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                height: '28px',
                                                borderRadius: '6px',
                                                mr: 2,
                                                backgroundColor: theme => {
                                                    const status = detailDialog.token.tokenStatus?.toLowerCase();
                                                    if (status === 'active') return theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.2)';
                                                    if (status === 'inactive') return theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                                                    if (status === 'suspended') return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                                                    return theme.palette.mode === 'dark' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.2)';
                                                },
                                                color: theme => {
                                                    const status = detailDialog.token.tokenStatus?.toLowerCase();
                                                    if (status === 'active') return '#10b981';
                                                    if (status === 'inactive') return '#ef4444';
                                                    if (status === 'suspended') return '#f59e0b';
                                                    return '#6b7280';
                                                },
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {detailDialog.token.tokenType} 
                                            {detailDialog.token.tokenAssuranceMethod && ` • Method: ${getAssuranceMethodDescription(detailDialog.token.tokenAssuranceMethod)}`}
                                            {detailDialog.token.tokenExpirationDate && 
                                             ` • Expires: ${new Date(detailDialog.token.tokenExpirationDate).toLocaleDateString()}`}
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
                                                {['id', 'token', 'tokenReferenceId', 'pan_reference_id', 'tokenRequestorId', 'tokenType', 'tokenStatus', 'tokenAssuranceMethod', 'assurance_method_display'].filter(key => 
                                                    detailDialog.token[key] !== undefined
                                                ).map(key => (
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
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ 
                                                            fontWeight: 500,
                                                            color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                        }}>
                                                            {key === 'tokenAssuranceMethod' 
                                                                ? detailDialog.token[key] !== null 
                                                                    ? getAssuranceMethodDescription(detailDialog.token[key]) 
                                                                    : 'N/A'
                                                                : detailDialog.token[key] !== null ? String(detailDialog.token[key]) : 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>

                                        {/* Additional Token Info */}
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
                                                Additional Information
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {['entity_of_last_action', 'wallet_account_email_address_hash', 'client_wallet_account_id', 'pan_source', 'auto_fill_indicator'].filter(key => 
                                                    detailDialog.token[key] !== undefined && detailDialog.token[key] !== null && detailDialog.token[key] !== ''
                                                ).map(key => (
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
                                                            {key.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ 
                                                            fontWeight: 500,
                                                            color: theme => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                                                        }}>
                                                            {String(detailDialog.token[key])}
                                                        </Typography>
                                                    </Grid>
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
                                                {['tokenActivationDate', 'tokenExpirationDate', 'lastTokenStatusUpdatedTime'].filter(key => 
                                                    detailDialog.token[key] !== undefined
                                                ).map(key => (
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
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Typography>
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
                                                    </Grid>
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
                        borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                        p: 2,
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}>
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
                                ID: {editDialog.token.id} {editDialog.token.token && `• ${editDialog.token.token}`}
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
                                        Seuls le statut du token (Token Status), la méthode d'assurance (Token Assurance Method), la date d'activation et la date d'expiration peuvent être modifiés. Les autres champs sont en lecture seule.
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
                                        label="Token"
                                        name="token"
                                        value={editDialog.formData.token || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} small={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Reference ID"
                                        name="tokenReferenceId"
                                        value={editDialog.formData.tokenReferenceId || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Requestor ID"
                                        name="tokenRequestorId"
                                        value={editDialog.formData.tokenRequestorId || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Token Type"
                                        name="tokenType"
                                        value={editDialog.formData.tokenType || ''}
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
                                            name="tokenStatus"
                                            value={editDialog.formData.tokenStatus || ''}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            label="Token Status"
                                            inputProps={{
                                                readOnly: false
                                            }}
                                            sx={{
                                                bgcolor: 'white',
                                                '& .MuiSelect-select': {
                                                    cursor: 'pointer'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'primary.main',
                                                    borderWidth: '1px'
                                                }
                                            }}
                                        >
                                            <MenuItem value="ACTIVE">Active</MenuItem>
                                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                                            <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                            <MenuItem value="DEACTIVATED">Deactivated</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {/* Alternative buttons for status change */}
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenStatus === 'ACTIVE' ? 'contained' : 'outlined'} 
                                            color={editDialog.formData.tokenStatus === 'ACTIVE' ? 'success' : 'inherit'}
                                            onClick={() => handleStatusChange('ACTIVE')}
                                            sx={{ minWidth: '100px' }}
                                        >
                                            Active
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenStatus === 'INACTIVE' ? 'contained' : 'outlined'} 
                                            color={editDialog.formData.tokenStatus === 'INACTIVE' ? 'error' : 'inherit'}
                                            onClick={() => handleStatusChange('INACTIVE')}
                                            sx={{ minWidth: '100px' }}
                                        >
                                            Inactive
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenStatus === 'SUSPENDED' ? 'contained' : 'outlined'} 
                                            color={editDialog.formData.tokenStatus === 'SUSPENDED' ? 'warning' : 'inherit'}
                                            onClick={() => handleStatusChange('SUSPENDED')}
                                            sx={{ minWidth: '100px' }}
                                        >
                                            Suspended
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenStatus === 'DEACTIVATED' ? 'contained' : 'outlined'} 
                                            color={editDialog.formData.tokenStatus === 'DEACTIVATED' ? 'secondary' : 'inherit'}
                                            onClick={() => handleStatusChange('DEACTIVATED')}
                                            sx={{ minWidth: '100px' }}
                                        >
                                            Deactivated
                                        </Button>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel id="token-assurance-method-label">Token Assurance Method</InputLabel>
                                        <Select
                                            labelId="token-assurance-method-label"
                                            name="tokenAssuranceMethod"
                                            value={editDialog.formData.tokenAssuranceMethod || ''}
                                            onChange={(e) => handleAssuranceMethodChange(e.target.value)}
                                            label="Token Assurance Method"
                                            inputProps={{
                                                readOnly: false
                                            }}
                                            sx={{
                                                bgcolor: 'white',
                                                '& .MuiSelect-select': {
                                                    cursor: 'pointer'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'primary.main',
                                                    borderWidth: '1px'
                                                }
                                            }}
                                        >
                                            <MenuItem value="00">D&V Not Performed</MenuItem>
                                            <MenuItem value="10">Card Issuer Account Verification</MenuItem>
                                            <MenuItem value="11">Card Issuer Interactive Cardholder Verification - 1 Factor</MenuItem>
                                            <MenuItem value="12">Card Issuer Interactive Cardholder Verification - 2 Factor</MenuItem>
                                            <MenuItem value="13">Card Issuer Risk Oriented Non-Interactive Cardholder Authentication</MenuItem>
                                            <MenuItem value="14">Card Issuer Asserted Authentication</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {/* Alternative buttons for assurance method change */}
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenAssuranceMethod === '00' ? 'contained' : 'outlined'} 
                                            color="inherit"
                                            onClick={() => handleAssuranceMethodChange('00')}
                                        >
                                            00
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenAssuranceMethod === '10' ? 'contained' : 'outlined'} 
                                            color="inherit"
                                            onClick={() => handleAssuranceMethodChange('10')}
                                        >
                                            10
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenAssuranceMethod === '11' ? 'contained' : 'outlined'} 
                                            color="inherit"
                                            onClick={() => handleAssuranceMethodChange('11')}
                                        >
                                            11
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant={editDialog.formData.tokenAssuranceMethod === '12' ? 'contained' : 'outlined'} 
                                            color="inherit"
                                            onClick={() => handleAssuranceMethodChange('12')}
                                        >
                                            12
                                        </Button>
                                    </Box>
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
                                    <DatePicker
                                        label="Activation Date"
                                        value={editDialog.formData.tokenActivationDate ? new Date(editDialog.formData.tokenActivationDate) : null}
                                        onChange={(date) => {
                                            setEditDialog(prev => ({
                                                ...prev,
                                                formData: {
                                                    ...prev.formData,
                                                    tokenActivationDate: date ? date.toISOString() : null
                                                }
                                            }));
                                        }}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: "normal",
                                                variant: "outlined",
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.5)' : 'rgba(99, 102, 241, 0.5)',
                                                            borderWidth: '2px'
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.8)' : 'rgba(99, 102, 241, 0.8)'
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? '#6366f1' : '#4f46e5'
                                                        }
                                                    }
                                                }
                                            },
                                            actionBar: {
                                                actions: ['clear', 'today', 'accept']
                                            }
                                        }}
                                        readOnly={false}
                                        disabled={false}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Expiration Date"
                                        value={editDialog.formData.tokenExpirationDate ? new Date(editDialog.formData.tokenExpirationDate) : null}
                                        onChange={(date) => {
                                            setEditDialog(prev => ({
                                                ...prev,
                                                formData: {
                                                    ...prev.formData,
                                                    tokenExpirationDate: date ? date.toISOString() : null
                                                }
                                            }));
                                        }}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: "normal",
                                                variant: "outlined",
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.5)' : 'rgba(99, 102, 241, 0.5)',
                                                            borderWidth: '2px'
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(79, 70, 229, 0.8)' : 'rgba(99, 102, 241, 0.8)'
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: theme => theme.palette.mode === 'dark' ? '#6366f1' : '#4f46e5'
                                                        }
                                                    }
                                                }
                                            },
                                            actionBar: {
                                                actions: ['clear', 'today', 'accept']
                                            }
                                        }}
                                        readOnly={false}
                                        disabled={false}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Status Update"
                                        name="lastTokenStatusUpdatedTime"
                                        value={editDialog.formData.lastTokenStatusUpdatedTime ? new Date(editDialog.formData.lastTokenStatusUpdatedTime).toLocaleDateString('fr-FR') : ''}
                                        InputProps={readOnlyInputProps}
                                        variant="outlined"
                                        margin="normal"
                                    />
                                </Grid>

                                {/* Additional Token Fields */}
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
                                        Additional Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="PAN Reference ID"
                                        name="pan_reference_id"
                                        value={editDialog.formData.pan_reference_id || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Entity of Last Action"
                                        name="entity_of_last_action"
                                        value={editDialog.formData.entity_of_last_action || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Wallet Account Email Hash"
                                        name="wallet_account_email_address_hash"
                                        value={editDialog.formData.wallet_account_email_address_hash || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Client Wallet Account ID"
                                        name="client_wallet_account_id"
                                        value={editDialog.formData.client_wallet_account_id || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="PAN Source"
                                        name="pan_source"
                                        value={editDialog.formData.pan_source || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Auto Fill Indicator"
                                        name="auto_fill_indicator"
                                        value={editDialog.formData.auto_fill_indicator || ''}
                                        onChange={handleEditFormChange}
                                        variant="outlined"
                                        margin="normal"
                                        InputProps={readOnlyInputProps}
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

                {/* Reason Dialog */}
                <Dialog
                    open={openReasonDialog} 
                    onClose={handleReasonDialogClose}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedAction === 'ACTIVATE' && "Activer le token"}
                        {selectedAction === 'SUSPEND' && "Suspendre le token"}
                        {selectedAction === 'RESUME' && "Reprendre le token"}
                        {(selectedAction === 'DELETE' || selectedAction === 'DEACTIVATE') && "Désactiver le token"}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            select
                            label="Raison"
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        >
                            {getReasonOptions(selectedAction).map((reason) => (
                                <MenuItem key={reason.value} value={reason.value}>
                                    {reason.label}
                                            </MenuItem>
                            ))}
                        </TextField>
                            <TextField
                            label="Message"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                                fullWidth
                            margin="normal"
                                multiline
                                rows={4}
                            />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleReasonDialogClose} disabled={isUpdating}>
                            Annuler
                        </Button>
                        <Button 
                            onClick={handleConfirmStatusUpdate}
                            color="primary"
                            disabled={isUpdating || !selectedReason}
                        >
                            {isUpdating ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Confirmer'
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>
                </Box>
        </LocalizationProvider>
    );
};

export default TokenList; 