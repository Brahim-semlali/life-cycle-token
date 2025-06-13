import React, { useState, useEffect, useRef } from 'react';
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
    Delete as DeleteIcon,
    Block as BlockIcon,
    PowerSettingsNew as DeactivateIcon,
    PlayArrow as ActivateIcon,
    Replay as ResumeIcon,
    HourglassEmpty as WaitingIcon,
    Close as CloseIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    Event as EventIcon,
    VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import TokenTable from './TokenTable';
import './TokenList.css';
import { useSnackbar } from 'notistack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
        includeDeleted: false,
        token_requestor_id: '',
        token_reference_id: ''
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

    // Add new state for TSP notification
    const [tspNotification, setTspNotification] = useState({
        open: false,
        message: '',
        externalMessage: '',
        type: 'success'
    });

    // Ajouter un state pour suivre la dernière requête
    const [lastRequest, setLastRequest] = useState(null);
    const searchTimer = React.useRef(null);
    const debounceTimer = React.useRef(null);

    // Ajout de la fonction formatDate
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Fonction pour comparer deux objets de filtres
    const areFiltersEqual = (filters1, filters2) => {
        if (!filters1 || !filters2) return false;
        return JSON.stringify(filters1) === JSON.stringify(filters2);
    };

    // Add handleCloseTspNotification function
    const handleCloseTspNotification = () => {
        setTspNotification(prev => ({ ...prev, open: false }));
    };

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
        
        // Annuler les timers existants
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        // Mettre à jour les paramètres de recherche
        setSearchParams(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Débouncer la recherche avec des délais différents selon le type de champ
        const debounceTime = type === 'checkbox' ? 0 : 
            (name === 'token_value' || name === 'token_type') ? 300 : 500;

        debounceTimer.current = setTimeout(() => {
            fetchTokens(true);
        }, debounceTime);
    };

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const value = e.target.value;
        setStatusFilter(value);
        
        // Mettre à jour les paramètres de recherche et déclencher la recherche
        setSearchParams(prev => ({
            ...prev,
            token_status: value === 'all' ? '' : value
        }));
        
        // Déclencher la recherche avec un petit délai
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchTokens(true);
        }, 100);
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
            includeDeleted: false,
            token_requestor_id: '',
            token_reference_id: ''
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
        try {
            // Construire l'objet des filtres
            const filters = {
                ...searchParams,
                token_status: statusFilter !== 'all' ? statusFilter : ''
            };

            // Nettoyer et formater les filtres
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                if (value === '' || value === null || value === undefined) {
                    delete filters[key];
                } else {
                    // Formater les valeurs selon le type de champ
                    switch(key) {
                        case 'token_requestor_id':
                        case 'token_reference_id':
                            filters[key] = value.toString().trim();
                            break;
                        case 'token_value':
                            // Garder la valeur exacte pour token_value
                            filters[key] = value.trim();
                            break;
                        case 'token_type':
                            // Convertir en majuscules pour la cohérence
                            filters[key] = value.toUpperCase().trim();
                            break;
                        case 'token_status':
                            filters[key] = value.toUpperCase().trim();
                            break;
                    }
                }
            });

            // Vérifier si la requête est identique à la précédente
            if (!forceRefresh && areFiltersEqual(filters, lastRequest)) {
                console.log('Skipping duplicate request with same filters');
                return;
            }

            setLoading(true);
            setError(null);
            
            console.log('Fetching tokens with filters:', filters);
            
            // Configuration de la requête API
            const requestConfig = {
                method: 'post',
                url: '/token/infos/',
                data: filters,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            // Sauvegarder la requête actuelle
            setLastRequest(filters);
            
            const result = await TokenService.listTokens(filters, requestConfig);
            
            if (result.success) {
                let filteredTokens = result.data || [];
                
                // Appliquer les filtres côté client pour une recherche plus précise
                filteredTokens = filteredTokens.filter(token => {
                    let matches = true;

                    // Filtre par Token Value (recherche partielle, insensible à la casse)
                    if (filters.token_value) {
                        const searchValue = filters.token_value.toLowerCase();
                        const tokenValue = (token.token || token.token_value || '').toLowerCase();
                        
                        // Vérifier si la valeur recherchée est contenue dans le token
                        matches = matches && tokenValue.includes(searchValue);
                    }

                    // Filtre par Token Type (recherche exacte, insensible à la casse)
                    if (filters.token_type) {
                        const searchType = filters.token_type.toUpperCase();
                        const tokenType = (token.tokenType || token.token_type || '').toUpperCase();
                        
                        // Vérifier si le type correspond exactement
                        matches = matches && tokenType === searchType;
                    }

                    // Filtre par Requestor ID (recherche exacte)
                    if (filters.token_requestor_id) {
                        const requestorId = filters.token_requestor_id.toString();
                        const tokenRequestorId = (token.tokenRequestorID || token.token_requestor_id || '').toString();
                        matches = matches && tokenRequestorId === requestorId;
                    }

                    // Filtre par Reference ID (recherche exacte)
                    if (filters.token_reference_id) {
                        const referenceId = filters.token_reference_id.toString();
                        const tokenReferenceId = (token.tokenReferenceID || token.token_reference_id || '').toString();
                        matches = matches && tokenReferenceId === referenceId;
                    }

                    // Filtre par Status (recherche exacte)
                    if (filters.token_status) {
                        const status = filters.token_status.toUpperCase();
                        const tokenStatus = (token.tokenStatus || token.token_status || '').toUpperCase();
                        matches = matches && tokenStatus === status;
                    }

                    return matches;
                });
                
                setTokens(filteredTokens);
                setResultsCount(filteredTokens.length);
                setFiltersApplied(Object.keys(filters).length > 0);

                // Afficher un message de debug avec le nombre de résultats
                console.log(`Found ${filteredTokens.length} tokens matching filters:`, filters);
            } else {
                handleApiError(result);
            }
        } catch (error) {
            console.error('Error fetching tokens:', error);
            setError('An unexpected error occurred while fetching tokens');
            setTokens([]);
            setResultsCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour gérer les erreurs API
    const handleApiError = (result) => {
        if (result.errorCode === 'PERMISSION_DENIED') {
            setError('Access Denied: You do not have permission to view tokens. Please contact your administrator.');
        } else {
            setError(result.error || 'Failed to fetch tokens');
        }
        setTokens([]);
        setResultsCount(0);
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
        try {
            // Get the token details using the /token/detail/ API
            const result = await TokenService.getTokenDetails(token.tokenReferenceID);
            
            if (result.success) {
                setDetailDialog({
                    open: true,
                    token: result.data
                });
            } else {
                console.error('Failed to get token details:', result.error);
                // Show error notification
                enqueueSnackbar('Failed to get token details: ' + result.error, { 
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
        } catch (error) {
            console.error('Error viewing token details:', error);
            enqueueSnackbar('Error viewing token details: ' + error.message, { 
                variant: 'error',
                autoHideDuration: 3000
            });
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
    const handleUpdateStatus = async (token, action, e) => {
        try {
            if (!action) {
                throw new Error('Action non spécifiée');
            }
            
            // Stop event propagation to prevent opening the details dialog
            if (e && e.stopPropagation) {
                e.stopPropagation();
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

            const tokenReferenceID = selectedToken.tokenReferenceID;
            const tokenRequestorID = selectedToken.tokenRequestorID;
            
            if (!tokenReferenceID) {
                throw new Error('Token Reference ID is required');
            }
            if (!tokenRequestorID) {
                throw new Error('Token Requestor ID is required');
            }

            console.log('Attempting status update with:', {
                action: selectedAction,
                tokenReferenceID,
                tokenRequestorID,
                reason: selectedReason,
                message: messageText
            });

            switch (selectedAction) {
                case 'ACTIVATE':
                    result = await TokenService.activateToken(tokenReferenceID, tokenRequestorID, messageText, selectedReason);
                    break;
                case 'SUSPEND':
                    result = await TokenService.suspendToken(tokenReferenceID, tokenRequestorID, selectedReason, messageText);
                    break;
                case 'RESUME':
                    result = await TokenService.resumeToken(tokenReferenceID, tokenRequestorID, selectedReason, messageText);
                    break;
                case 'DELETE':
                case 'DEACTIVATE':
                    result = await TokenService.deactivateToken(tokenReferenceID, tokenRequestorID, selectedReason, messageText);
                    break;
                default:
                    setIsUpdating(false);
                    setTspNotification({
                        open: true,
                        message: 'Action non valide',
                        type: 'error'
                    });
                    return;
            }

            console.log('Status update result:', result);

            if (result.success) {
                // Log détaillé de la réponse réussie
                console.log('Success response:', {
                    message: result.message,
                    message_externe: result.data?.message_externe,
                    status: result.data?.status
                });

                setTspNotification({
                    open: true,
                    message: result.message || result.data?.message || 'Opération effectuée avec succès',
                    externalMessage: result.data?.message_externe || '',
                    type: 'success'
                });

                setOpenReasonDialog(false);
                setSelectedToken(null);
                setSelectedAction(null);
                setSelectedReason('');
                setMessageText('');

                await fetchTokens(true);
            } else {
                // Log détaillé de l'erreur
                console.log('Error response:', {
                    error: result.error,
                    message_erreur: result.details?.message_erreur,
                    message_externe_erreur: result.details?.message_externe_erreur,
                    status: result.details?.status
                });

                let errorMessage = result.error || 'Erreur lors de l\'opération';
                let externalMessage = '';

                if (result.details?.message_externe_erreur) {
                    externalMessage = result.details.message_externe_erreur;
                } else if (result.details?.message_externe) {
                    externalMessage = result.details.message_externe;
                }

                setTspNotification({
                    open: true,
                    message: errorMessage,
                    externalMessage: externalMessage,
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error updating token status:', error);
            
            // Log détaillé de l'erreur
            console.log('Error details:', {
                response: error.response?.data,
                message_erreur: error.response?.data?.message_erreur,
                message_externe_erreur: error.response?.data?.message_externe_erreur,
                status: error.response?.status
            });
            
            let errorMessage = 'Requête traitée avec refus';
            let externalMessage = '';

            if (error.response?.data) {
                const errorData = error.response.data;
                errorMessage = errorData.message_erreur || errorData.error || 'Requête traitée avec refus';
                
                if (errorData.message_externe_erreur) {
                    externalMessage = errorData.message_externe_erreur;
                } else if (errorData.message_externe) {
                    externalMessage = errorData.message_externe;
                }
            }

            setTspNotification({
                open: true,
                message: errorMessage,
                externalMessage: externalMessage,
                type: 'error'
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

    const hasPendingStatusChange = (token) => {
        return pendingStatusChanges[token.id] !== undefined;
    };

    const getPendingActionName = (token) => {
        const pendingChange = pendingStatusChanges[token.id];
        if (!pendingChange) return '';
        switch (pendingChange.action) {
            case 'activate':
                return 'activation';
            case 'suspend':
                return 'suspension';
            case 'resume':
                return 'resume';
            case 'deactivate':
                return 'deactivation';
            default:
                return '';
        }
    };

    const getNormalizedStatus = (token) => {
        if (!token.tokenStatus) return '';
        const status = token.tokenStatus.toLowerCase();
        if (status === 'active') return 'active';
        if (status === 'inactive') return 'inactive';
        if (status === 'suspended') return 'suspended';
        return '';
    };

    // Fonction pour parser les messages externes
    const parseExternalMessage = (message) => {
        try {
            if (typeof message === 'string') {
                const parsed = JSON.parse(message);
                
                // Vérifier d'abord les messages d'erreur
                if (parsed.erreur) {
                    return {
                        text: parsed.erreur,
                        type: 'error'
                    };
                }
                
                // Puis les messages normaux
                if (parsed.message) {
                    return {
                        text: parsed.message,
                        type: 'info'
                    };
                }
                
                // Fallback pour les autres cas
                return {
                    text: message,
                    type: 'info'
                };
            }
            
            // Si le message est déjà un objet
            if (message && typeof message === 'object') {
                return {
                    text: message.erreur || message.message || JSON.stringify(message),
                    type: message.erreur ? 'error' : 'info'
                };
            }
            
            return {
                text: message || '',
                type: 'info'
            };
        } catch (e) {
            console.warn('Error parsing external message:', e);
            return {
                text: message || '',
                type: 'info'
            };
        }
    };

    // Nettoyer les timers lors du démontage
    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Effectuer la recherche initiale au montage
    useEffect(() => {
        fetchTokens(true);
    }, []);

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

                    {/* Add TSP Response Notification */}
                    <Snackbar
                        open={tspNotification.open}
                        autoHideDuration={6000}
                        onClose={handleCloseTspNotification}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        sx={{
                            maxWidth: '600px',
                            width: '100%'
                        }}
                    >
                        <Alert
                            onClose={handleCloseTspNotification}
                            severity={tspNotification.type}
                            sx={{
                                width: '100%',
                                backgroundColor: tspNotification.type === 'success' ? '#ecfdf5' : '#fef2f2',
                                color: tspNotification.type === 'success' ? '#065f46' : '#991b1b',
                                border: 1,
                                borderColor: tspNotification.type === 'success' ? '#6ee7b7' : '#fecaca',
                                '& .MuiAlert-icon': {
                                    color: tspNotification.type === 'success' ? '#059669' : '#dc2626'
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 1,
                                padding: '16px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            icon={tspNotification.type === 'success' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                        >
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                width: '100%'
                            }}>
                                <Typography variant="subtitle1" sx={{ 
                                    fontWeight: 600,
                                    mb: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    {tspNotification.message}
                                </Typography>
                                
                                {tspNotification.externalMessage && (
                                    <Box sx={{
                                        mt: 1,
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: tspNotification.type === 'success' ? 'rgba(6, 95, 70, 0.1)' : 'rgba(153, 27, 27, 0.1)',
                                        border: '1px solid',
                                        borderColor: tspNotification.type === 'success' ? 'rgba(6, 95, 70, 0.2)' : 'rgba(153, 27, 27, 0.2)',
                                        width: '100%'
                                    }}>
                                        {(() => {
                                            const parsedMessage = parseExternalMessage(tspNotification.externalMessage);
                                            return (
                                                <Typography variant="body2" sx={{ 
                                                    color: tspNotification.type === 'success' ? '#065f46' : '#991b1b',
                                                    fontFamily: 'monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {parsedMessage.text}
                                                </Typography>
                                            );
                                        })()}
                                    </Box>
                                )}
                            </Box>
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
                <Paper 
                    component="section"
                    className="search-form-paper"
                    elevation={0}
                    sx={{ 
                        mb: 4,
                        p: 3,
                        position: 'relative',
                        overflow: 'hidden'
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
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    placeholder="TOKEN VALUE"
                                    value={searchParams.token_value}
                                    onChange={handleInputChange}
                                    name="token_value"
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: null
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Token type"
                                    name="token_type"
                                    value={searchParams.token_type}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="medium"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Requestor ID"
                                    name="token_requestor_id"
                                    value={searchParams.token_requestor_id}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="medium"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Reference ID"
                                    name="token_reference_id"
                                    value={searchParams.token_reference_id}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    size="medium"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={statusFilter}
                                        onChange={handleStatusFilterChange}
                                        displayEmpty
                                        variant="outlined"
                                        placeholder="All Statuses"
                                    >
                                        <MenuItem value="all">All Statuses</MenuItem>
                                        <MenuItem value="ACTIVE">Active</MenuItem>
                                        <MenuItem value="INACTIVE">Inactive</MenuItem>
                                        <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label="Created from"
                                    value={startDateObj}
                                    onChange={(newValue) => {
                                        setStartDateObj(newValue);
                                        setSearchParams(prev => ({
                                            ...prev,
                                            startDate: newValue ? format(newValue, 'yyyy-MM-dd') : ''
                                        }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            fullWidth
                                            size="medium"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarIcon sx={{ color: 'action.active' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label="Created to"
                                    value={endDateObj}
                                    onChange={(newValue) => {
                                        setEndDateObj(newValue);
                                        setSearchParams(prev => ({
                                            ...prev,
                                            endDate: newValue ? format(newValue, 'yyyy-MM-dd') : ''
                                        }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            fullWidth
                                            size="medium"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarIcon sx={{ color: 'action.active' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={searchParams.includeDeleted}
                                            onChange={(e) => setSearchParams(prev => ({
                                                ...prev,
                                                includeDeleted: e.target.checked
                                            }))}
                                            color="primary"
                                        />
                                    }
                                    label="Include deleted tokens"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleClear}
                                        startIcon={<ClearIcon />}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        variant="contained"
                                        type="submit"
                                        startIcon={<SearchIcon />}
                                    >
                                        Rechercher
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>

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
                            borderRadius: '24px',
                            background: theme => theme.palette.mode === 'dark' 
                                ? 'linear-gradient(145deg, rgba(66, 66, 255, 0.2), rgba(120, 86, 255, 0.2))'
                                : 'linear-gradient(145deg, #c5cae9, #e8eaf6)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            border: '1px solid',
                            borderColor: theme => theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(255, 255, 255, 0.5)',
                            padding: '24px',
                            overflow: 'hidden'
                        }
                    }}
                >
                    {detailDialog.token && (
                        <>
                            {/* Header */}
                            <Box sx={{ 
                                mb: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between'
                                }}>
                                    <Box>
                                        <Typography variant="h5" sx={{ 
                                            fontWeight: 700,
                                            mb: 1,
                                            background: theme => theme.palette.mode === 'dark'
                                                ? 'linear-gradient(90deg, #93c5fd, #818cf8)'
                                                : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        }}>
                                            Token Details
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ 
                                            color: 'text.secondary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            fontFamily: 'Roboto Mono, monospace'
                                        }}>
                                            ID: {detailDialog.token.id}
                                        </Typography>
                                    </Box>
                                    <IconButton 
                                        onClick={handleCloseDetailDialog}
                                        sx={{ 
                                            bgcolor: theme => theme.palette.mode === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.05)' 
                                                : 'rgba(0, 0, 0, 0.05)',
                                            '&:hover': {
                                                bgcolor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.1)'
                                            }
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                {/* Status Bar */}
                                <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    p: 3,
                                    borderRadius: '16px',
                                    background: theme => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(0, 0, 0, 0.02)',
                                    border: '1px solid',
                                    borderColor: theme => theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'rgba(0, 0, 0, 0.05)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Chip
                                            label={detailDialog.token.tokenStatus}
                                            className={`status-${detailDialog.token.tokenStatus.toLowerCase()}`}
                                            sx={{ height: '28px' }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {detailDialog.token.tokenType}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        color: 'text.secondary'
                                    }}>
                                        <VerifiedUserIcon fontSize="small" />
                                        <Typography variant="body2">
                                            {getAssuranceMethodDescription(detailDialog.token.tokenAssuranceMethod)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        color: 'text.secondary',
                                        ml: 'auto'
                                    }}>
                                        <EventIcon fontSize="small" />
                                        <Typography variant="body2">
                                            Expires: {formatDate(detailDialog.token.tokenExpirationDate)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Content */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {/* Actions Section */}
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        <EditIcon fontSize="small" />
                                        Token Actions
                                    </Typography>
                                    <Paper elevation={0} sx={{ 
                                        p: 3,
                                        borderRadius: '16px',
                                        background: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.03)'
                                            : 'rgba(0, 0, 0, 0.02)',
                                        border: '1px solid',
                                        borderColor: theme => theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(0, 0, 0, 0.05)'
                                    }}>
                                        {hasPendingStatusChange(detailDialog.token) ? (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 2,
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(99, 102, 241, 0.1)'
                                                    : 'rgba(99, 102, 241, 0.05)',
                                            }}>
                                                <WaitingIcon sx={{ color: '#6366f1' }} />
                                                <Typography sx={{ 
                                                    color: '#6366f1',
                                                    fontWeight: 500
                                                }}>
                                                    Demande de {getPendingActionName(detailDialog.token)} en attente de confirmation
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}>
                                                {getNormalizedStatus(detailDialog.token) === 'inactive' && (
                                                    <>
                                                        <Button 
                                                            variant="contained"
                                                            startIcon={<ActivateIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'activate')}
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                color: 'white',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                                                }
                                                            }}
                                                        >
                                                            Activate
                                                        </Button>
                                                        <Button 
                                                            variant="outlined"
                                                            startIcon={<DeactivateIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'deactivate')}
                                                            sx={{
                                                                borderColor: '#6b7280',
                                                                color: '#6b7280',
                                                                '&:hover': {
                                                                    borderColor: '#4b5563',
                                                                    background: 'rgba(107, 114, 128, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {getNormalizedStatus(detailDialog.token) === 'active' && (
                                                    <>
                                                        <Button 
                                                            variant="contained"
                                                            startIcon={<BlockIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'suspend')}
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                color: 'white',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                                                                }
                                                            }}
                                                        >
                                                            Suspend
                                                        </Button>
                                                        <Button 
                                                            variant="outlined"
                                                            startIcon={<DeactivateIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'deactivate')}
                                                            sx={{
                                                                borderColor: '#6b7280',
                                                                color: '#6b7280',
                                                                '&:hover': {
                                                                    borderColor: '#4b5563',
                                                                    background: 'rgba(107, 114, 128, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {getNormalizedStatus(detailDialog.token) === 'suspended' && (
                                                    <>
                                                        <Button 
                                                            variant="contained"
                                                            startIcon={<ResumeIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'resume')}
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                                color: 'white',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                                                                }
                                                            }}
                                                        >
                                                            Resume
                                                        </Button>
                                                        <Button 
                                                            variant="outlined"
                                                            startIcon={<DeactivateIcon />}
                                                            onClick={() => handleUpdateStatus(detailDialog.token, 'deactivate')}
                                                            sx={{
                                                                borderColor: '#6b7280',
                                                                color: '#6b7280',
                                                                '&:hover': {
                                                                    borderColor: '#4b5563',
                                                                    background: 'rgba(107, 114, 128, 0.08)'
                                                                }
                                                            }}
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        )}
                                    </Paper>
                                </Box>

                                {/* Token Information */}
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        <TokenIcon fontSize="small" />
                                        Token Information
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Token Reference ID
                                                </Typography>
                                                <Typography variant="body1" sx={{ 
                                                    fontWeight: 500,
                                                    fontFamily: 'Roboto Mono, monospace'
                                                }}>
                                                    {detailDialog.token.tokenReferenceID}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    PAN Reference ID
                                                </Typography>
                                                <Typography variant="body1" sx={{ 
                                                    fontWeight: 500,
                                                    fontFamily: 'Roboto Mono, monospace'
                                                }}>
                                                    {detailDialog.token.panReferenceID}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Token Requestor ID
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {detailDialog.token.tokenRequestorID}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    PAN Source
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {detailDialog.token.panSource}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Additional Information */}
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        <InfoIcon fontSize="small" />
                                        Additional Information
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Entity of Last Action
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {detailDialog.token.entityOfLastAction || 'N/A'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Wallet Account Email Hash
                                                </Typography>
                                                <Typography variant="body1" sx={{ 
                                                    fontWeight: 500,
                                                    fontFamily: 'Roboto Mono, monospace'
                                                }}>
                                                    {detailDialog.token.walletAccountEmailAddressHash || 'N/A'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Client Wallet Account ID
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {detailDialog.token.clientWalletAccountID || 'N/A'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Auto Fill Indicator
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {detailDialog.token.autoFillIndicator ? 'Yes' : 'No'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Timeline & Expiration */}
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        <ScheduleIcon fontSize="small" />
                                        Timeline & Expiration
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={4}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Token Activation Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(detailDialog.token.tokenActivationDate)}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Token Expiration Date
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(detailDialog.token.tokenExpirationDate)}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper elevation={0} sx={{ 
                                                p: 2,
                                                borderRadius: '12px',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.03)'
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                border: '1px solid',
                                                borderColor: theme => theme.palette.mode === 'dark'
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Last Status Update
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {formatDate(detailDialog.token.lastTokenStatusUpdatedTime)}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ 
                                mt: 4,
                                pt: 3,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                borderTop: '1px solid',
                                borderColor: theme => theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.1)'
                            }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleCloseDetailDialog}
                                    startIcon={<CloseIcon />}
                                    sx={{
                                        borderColor: theme => theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : 'rgba(0, 0, 0, 0.2)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: theme => theme.palette.mode === 'dark'
                                                ? 'rgba(255, 255, 255, 0.3)'
                                                : 'rgba(0, 0, 0, 0.3)',
                                            backgroundColor: theme => theme.palette.mode === 'dark'
                                                ? 'rgba(255, 255, 255, 0.05)'
                                                : 'rgba(0, 0, 0, 0.05)'
                                        }
                                    }}
                                >
                                    Close
                                </Button>
                            </Box>
                        </>
                    )}
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
                                        name="tokenReferenceID"
                                        value={editDialog.formData.tokenReferenceID || ''}
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
                                        name="tokenRequestorID"
                                        value={editDialog.formData.tokenRequestorID || ''}
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