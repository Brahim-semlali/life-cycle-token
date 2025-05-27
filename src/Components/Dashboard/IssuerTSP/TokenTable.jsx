import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TablePagination, 
    Chip, 
    Typography, 
    CircularProgress,
    Tooltip,
    IconButton,
    Fade,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    Button,
    ButtonBase
} from '@mui/material';
import { 
    Visibility as ViewIcon,
    Edit as EditIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Block as BlockIcon,
    PowerSettingsNew as DeactivateIcon,
    PlayArrow as ActivateIcon,
    Replay as ResumeIcon,
    PendingOutlined as PendingIcon,
    HourglassTop as WaitingIcon
} from '@mui/icons-material';

const TokenTable = ({ tokens, loading, page, rowsPerPage, onPageChange, onRowsPerPageChange, onViewDetails, onEditToken, onDeleteToken, onUpdateStatus, tableMetadata, pendingStatusChanges }) => {
    // MUI theme for consistent styling
    const theme = useTheme();
    
    // Determine which rows to display based on pagination
    const displayedTokens = tokens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
    // Menu state for action buttons
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);
    const [columns, setColumns] = useState([]);
    
    useEffect(() => {
        // Generate columns whenever tokens or tableMetadata changes
        setColumns(getTableColumns());
    }, [tokens, tableMetadata]);
    
    const handleMenuOpen = (event, token) => {
        setAnchorEl(event.currentTarget);
        setSelectedToken(token);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedToken(null);
    };

    // Get table columns dynamically from the token data and database metadata
    const getTableColumns = () => {
        // Si aucune donnée n'est disponible, renvoyer un tableau vide
        if ((!tokens || tokens.length === 0) && !tableMetadata) return [];
        
        // Colonnes à exclure de l'affichage
        const excludedColumns = ['_id', '__v']; 
        
        // Définir les colonnes que nous voulons spécifiquement afficher
        const columnsToDisplay = [
            'token',
            'tokenType',
            'tokenStatus',
            'token_status',
            'tokenReferenceID',
            'tokenReferenceId',
            'tokenRequestorID',
            'tokenRequestorId',
            'tokenAssuranceMethod',
            'assurance_method_display',
            'panReferenceID',
            'pan_reference_id',
            'entityOfLastAction',
            'entity_of_last_action',
            'walletAccountEmailAddressHash',
            'wallet_account_email_address_hash',
            'clientWalletAccountID',
            'client_wallet_account_id',
            'panSource',
            'pan_source',
            'autoFillIndicator',
            'auto_fill_indicator',
            'tokenActivationDate',
            'activation_date',
            'tokenExpirationDate',
            'expiration_date',
            'lastTokenStatusUpdatedTime',
            'last_status_update'
        ];
        
        // Groupes de champs équivalents (différentes conventions de nommage)
        const fieldGroups = {
            'token': ['token', 'token_value'],
            'tokenStatus': ['tokenStatus', 'token_status'],
            'tokenReferenceID': ['tokenReferenceID', 'tokenReferenceId', 'pan_reference_id'],
            'tokenRequestorID': ['tokenRequestorID', 'tokenRequestorId', 'token_requestor_id'],
            'panReferenceID': ['panReferenceID', 'pan_reference_id'],
            'entityOfLastAction': ['entityOfLastAction', 'entity_of_last_action'],
            'walletAccountEmailAddressHash': ['walletAccountEmailAddressHash', 'wallet_account_email_address_hash'],
            'clientWalletAccountID': ['clientWalletAccountID', 'client_wallet_account_id'],
            'panSource': ['panSource', 'pan_source'],
            'autoFillIndicator': ['autoFillIndicator', 'auto_fill_indicator'],
            'tokenActivationDate': ['tokenActivationDate', 'activation_date'],
            'tokenExpirationDate': ['tokenExpirationDate', 'expiration_date'],
            'lastTokenStatusUpdatedTime': ['lastTokenStatusUpdatedTime', 'last_status_update', 'last_token_status_updated_time']
        };
        
        // Déterminer quelles colonnes sont disponibles dans les données
        let availableKeys = [];
        
        // Priorité 1: Obtenir les colonnes à partir des métadonnées de la table
        if (tableMetadata && tableMetadata.columns) {
            availableKeys = tableMetadata.columns
                .map(col => col.name || col.column_name)
                .filter(key => !excludedColumns.includes(key) && columnsToDisplay.includes(key));
        }
        
        // Priorité 2: Obtenir les colonnes à partir des données réelles
        if (tokens && tokens.length > 0) {
            // Collecter toutes les clés uniques de tous les tokens
            const allKeys = new Set();
            tokens.forEach(token => {
                Object.keys(token).forEach(key => {
                    if (!excludedColumns.includes(key) && columnsToDisplay.includes(key)) {
                        allKeys.add(key);
                    }
                });
            });
            
            // Convertir le Set en array et ajouter les clés qui ne sont pas déjà présentes
            Array.from(allKeys).forEach(key => {
                if (!availableKeys.includes(key)) {
                    availableKeys.push(key);
                }
            });
        }
        
        // Définir un ordre préférentiel pour les colonnes les plus importantes
        const preferredOrder = [
            'token',
            'tokenType',
            'tokenStatus',
            'tokenAssuranceMethod',
            'tokenReferenceID',
            'tokenRequestorID', 
            'panReferenceID',
            'entityOfLastAction',
            'walletAccountEmailAddressHash',
            'clientWalletAccountID',
            'panSource',
            'autoFillIndicator',
            'tokenActivationDate',
            'tokenExpirationDate',
            'lastTokenStatusUpdatedTime'
        ];
        
        // Dédupliquer les champs qui peuvent exister en plusieurs formats
        const uniqueColumns = [];
        const addedColumnGroups = new Set();
        
        // Ajouter chaque colonne préférée en premier (si disponible)
        preferredOrder.forEach(preferredKey => {
            // Si c'est un champ qui a des alternatives
            if (fieldGroups[preferredKey]) {
                // Si on n'a pas déjà ajouté une colonne de ce groupe
                if (!addedColumnGroups.has(preferredKey)) {
                    // Trouver la première alternative disponible
                    const availableAlternative = fieldGroups[preferredKey].find(alt => 
                        availableKeys.includes(alt)
                    );
                    
                    if (availableAlternative) {
                        uniqueColumns.push(availableAlternative);
                        addedColumnGroups.add(preferredKey);
                    } else if (availableKeys.includes(preferredKey)) {
                        uniqueColumns.push(preferredKey);
                        addedColumnGroups.add(preferredKey);
                    }
                }
            } 
            // Si c'est un champ normal sans alternatives
            else if (availableKeys.includes(preferredKey) && !uniqueColumns.includes(preferredKey)) {
                uniqueColumns.push(preferredKey);
            }
        });
        
        // Ajouter les colonnes restantes qui n'ont pas été traitées
        availableKeys.forEach(key => {
            // Vérifier si cette clé fait partie d'un groupe
            let isPartOfGroup = false;
            let groupName = null;
            
            for (const [group, alternatives] of Object.entries(fieldGroups)) {
                if (alternatives.includes(key)) {
                    isPartOfGroup = true;
                    groupName = group;
                    break;
                }
            }
            
            // Si c'est une clé de groupe et qu'on a déjà ajouté une colonne de ce groupe, on l'ignore
            if (isPartOfGroup && addedColumnGroups.has(groupName)) {
                return;
            }
            
            // Sinon, on l'ajoute si elle n'est pas déjà présente
            if (!uniqueColumns.includes(key)) {
                uniqueColumns.push(key);
            
                // Si c'est une clé de groupe, marquer ce groupe comme traité
                if (isPartOfGroup) {
                    addedColumnGroups.add(groupName);
                }
            }
        });
        
        // Convertir les clés en objets de colonne
        const finalColumns = uniqueColumns.map(key => ({
            id: key,
            label: formatColumnLabel(key),
            isDate: key.includes('Date') || key.includes('Time'),
            isStatus: key === 'tokenStatus' || key === 'token_status',
            isDisplay: key.toLowerCase().includes('display'),
            isAssurance: key.includes('Assurance'),
            isBoolean: key === 'autoFillIndicator' || key === 'auto_fill_indicator' || 
                     (tokens.length > 0 && typeof tokens.find(t => t[key] !== undefined)?.[key] === 'boolean')
        }));
        
        return finalColumns;
    };
    
    // Format column label for display (camelCase to Title Case)
    const formatColumnLabel = (key) => {
        // Custom labels for specific columns
        const customLabels = {
            'token': 'Token',
            'tokenReferenceId': 'Reference ID',
            'tokenReferenceID': 'Reference ID',
            'tokenRequestorId': 'Requestor ID',
            'tokenRequestorID': 'Requestor ID',
            'tokenStatus': 'Status',
            'tokenType': 'Type',
            'tokenAssuranceMethod': 'Assurance Method',
            'assurance_method_display': 'Assurance Method Display',
            'tokenActivationDate': 'Activation Date',
            'tokenExpirationDate': 'Expiration Date',
            'lastTokenStatusUpdatedTime': 'Last Status Update',
            'pan_reference_id': 'PAN Reference ID',
            'entity_of_last_action': 'Last Action Entity',
            'wallet_account_email_address_hash': 'Wallet Email Hash',
            'client_wallet_account_id': 'Wallet Account ID',
            'pan_source': 'PAN Source',
            'auto_fill_indicator': 'Auto Fill'
        };
        
        // If we have a custom label for this key, use it
        if (customLabels[key]) {
            return customLabels[key];
        }
        
        // Otherwise split camelCase and capitalize first letters
        return key
            // Insert a space before all uppercase letters
            .replace(/([A-Z])/g, ' $1')
            // Capitalize the first letter
            .replace(/^./, str => str.toUpperCase());
    };

    // Get descriptive text for token assurance method codes
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

    // Check if a token has a pending status change
    const hasPendingStatusChange = (token) => {
        return pendingStatusChanges && pendingStatusChanges[token.id];
    };
    
    // Get human-readable pending action name
    const getPendingActionName = (token) => {
        if (!pendingStatusChanges || !pendingStatusChanges[token.id]) return '';
        
        const action = pendingStatusChanges[token.id].action;
        if (action === 'activate') return 'Activation';
        if (action === 'suspend') return 'Suspension'; 
        if (action === 'resume') return 'Reprise';
        if (action === 'deactivate') return 'Désactivation';
        return action.charAt(0).toUpperCase() + action.slice(1);
    };

    // Status style handler with pending status indicator
    const getStatusStyle = (status, token) => {
        // Check if token has pending status change
        const isPending = hasPendingStatusChange(token);
        
        if (!status) return getDefaultStyle();
        
        const statusStr = String(status).toLowerCase();
        
        // Base style
        let style = {
            backgroundColor: 'rgba(107, 114, 128, 0.12)',
            color: '#6b7280',
            borderColor: 'rgba(107, 114, 128, 0.25)',
            fontWeight: 500
        };
        
        // Set style based on current status
        switch (statusStr) {
            case 'active':
            case 'ac':
                style = {
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    fontWeight: 600
                };
                break;
            case 'suspended':
            case 'su':
                style = {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    fontWeight: 600
                };
                break;
            case 'inactive':
            case 'in':
                style = {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    fontWeight: 600
                };
                break;
            case 'deactivated':
                style = {
                    backgroundColor: 'rgba(107, 114, 128, 0.15)',
                    color: '#6b7280',
                    borderColor: 'rgba(107, 114, 128, 0.3)',
                    fontWeight: 600
                };
                break;
            default:
                // Use default style
                break;
        }
        
        // Modify style if pending
        if (isPending) {
            style = {
                ...style,
                opacity: 0.7,
                border: '1px dashed',
                fontStyle: 'italic'
            };
        }
        
        return style;
    };

    // Score style handler
    const getScoreStyle = (score) => {
        if (score === undefined || score === null) return getDefaultStyle();
        
        let numScore;
        try {
            numScore = typeof score === 'string' ? parseInt(score, 10) : score;
        } catch (e) {
            return getDefaultStyle();
        }
        
        if (isNaN(numScore)) return getDefaultStyle();
        
        if (numScore >= 80) {
                return {
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    fontWeight: 600
                };
        } else if (numScore >= 50) {
            return {
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                borderColor: 'rgba(245, 158, 11, 0.25)',
                fontWeight: 600
            };
        } else {
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    fontWeight: 600
                };
        }
    };
    
    const getDefaultStyle = () => {
        return {
            backgroundColor: 'rgba(107, 114, 128, 0.12)',
            color: '#6b7280',
            borderColor: 'rgba(107, 114, 128, 0.25)',
            fontWeight: 500
        };
    };

    // Format date without using date-fns
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            // Format as dd/MM/yyyy HH:MM:SS
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };
    
    // Handle token actions
    const handleViewDetails = (token) => {
        if (onViewDetails) onViewDetails(token);
    };
    
    const handleEditToken = (token) => {
        if (onEditToken) onEditToken(token);
    };
    
    const handleDeleteToken = (token) => {
        if (onDeleteToken) onDeleteToken(token);
        handleMenuClose();
    };
    
    const handleUpdateStatus = (token, action) => {
        // Vérifier si l'action est définie
        if (!action) {
            console.error('Action non spécifiée pour la mise à jour du statut');
            return;
        }
        
        // Actions include: activate, suspend, resume, deactivate, refresh
        if (onUpdateStatus) onUpdateStatus(token, action);
        handleMenuClose();
    };
    
    // Function to render cell content based on column type
    const renderCellContent = (token, column) => {
        // Check if the property exists in the token object
        if (!(column.id in token)) {
            // Essayer de faire correspondre les cas camelCase et snake_case
            let value = null;
            
            // Correspondance des noms de champs entre backend et frontend
            const fieldMappings = {
                'panReferenceID': ['pan_reference_id', 'panReferencesID'],
                'panSource': ['pan_source', 'tokenPanSource'],
                'entityOfLastAction': ['entity_of_last_action', 'lastActionEntity'],
                'clientWalletAccountID': ['client_wallet_account_id', 'walletAccountID'],
                'walletAccountEmailAddressHash': ['wallet_account_email_address_hash', 'emailHash'],
                'autoFillIndicator': ['auto_fill_indicator', 'autoFill'],
                'tokenActivationDate': ['activation_date', 'tokenActivation'],
                'tokenStatus': ['token_status'],
                'token_status': ['tokenStatus']
                // Ajoutez d'autres mappages au besoin
            };
            
            // Vérifier les mappages possibles
            if (fieldMappings[column.id]) {
                for (const altName of fieldMappings[column.id]) {
                    if (altName in token) {
                        value = token[altName];
                        break;
                    }
                }
            }
            
            // Si on a trouvé une valeur via le mappage, on l'utilise
            if (value !== null) {
                // Utiliser une version récursive pour traiter la valeur trouvée
                return renderCellContent({...token, [column.id]: value}, column);
            }
            
            // For tokenStatus, try token_status as a fallback
            if (column.id === 'tokenStatus' && 'token_status' in token) {
                return renderCellContent({...token, tokenStatus: token.token_status}, column);
            }
            // For token_status, try tokenStatus as a fallback
            if (column.id === 'token_status' && 'tokenStatus' in token) {
                return renderCellContent({...token, token_status: token.tokenStatus}, column);
            }
            // For tokenReferenceId, try tokenReferenceID as a fallback
            if (column.id === 'tokenReferenceId' && 'tokenReferenceID' in token) {
                return renderCellContent({...token, tokenReferenceId: token.tokenReferenceID}, column);
            }
            // For tokenRequestorId, try tokenRequestorID as a fallback
            if (column.id === 'tokenRequestorId' && 'tokenRequestorID' in token) {
                return renderCellContent({...token, tokenRequestorId: token.tokenRequestorID}, column);
            }
            
            // Log détaillé pour aider au débogage
            console.log(`Champ manquant: ${column.id}, clés disponibles:`, Object.keys(token));
            return 'N/A';
        }
        
        const value = token[column.id];
        
        // Handle null or undefined values
        if (value === null || value === undefined) {
            return 'N/A';
        }
        
        // Format based on column type
        if (column.isDate) {
            return formatDate(value);
        } else if (column.isBoolean) {
            return value === true ? 'Yes' : 'No';
        } else if (column.isStatus) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                    label={value || 'Unknown'} 
                    size="small"
                    sx={{
                            ...getStatusStyle(value, token),
                        fontSize: '0.75rem',
                        height: '24px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                />
                    {hasPendingStatusChange(token) && (
                        <Tooltip title={`Demande de ${getPendingActionName(token)} en attente de confirmation`}>
                            <WaitingIcon 
                                fontSize="small" 
                                sx={{ 
                                    color: '#6366f1',
                                    animation: 'pulse 1.5s infinite ease-in-out',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 0.6 },
                                        '50%': { opacity: 1 },
                                        '100%': { opacity: 0.6 }
                                    }
                                }} 
                            />
                        </Tooltip>
                    )}
                </Box>
            );
        } else if (column.isScore) {
            return (
                <Chip 
                    label={value} 
                    size="small"
                    sx={{
                        ...getScoreStyle(value),
                        fontSize: '0.75rem',
                        height: '24px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                />
            );
        } else if (column.id === 'token' || column.id === 'id') {
            return (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.main
                    }}
                >
                    {value}
                </Typography>
            );
        } else if (column.id === 'tokenReferenceId' || column.id === 'tokenRequestorId' || 
                  column.id === 'tokenReferenceID' || column.id === 'tokenRequestorID') {
            return (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontWeight: 500,
                        color: theme.palette.info.main,
                        fontSize: '0.875rem'
                    }}
                >
                    {value}
                </Typography>
            );
        } else if (column.id === 'tokenAssuranceMethod') {
            // Special handling for assurance method to display only the description
            return (
                <Tooltip title={`Code: ${value}`}>
                    <Typography 
                        variant="body2"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            cursor: 'help'
                        }}
                    >
                        {value ? getAssuranceMethodDescription(value) : 'N/A'}
                    </Typography>
                </Tooltip>
            );
        } else if (column.id === 'device_name' || column.id === 'device_id' || column.id === 'device_type') {
            // Special handling for device fields to ensure they display correctly
            return (
                <Typography 
                    variant="body2"
                    sx={{
                        color: value ? theme.palette.text.primary : theme.palette.text.secondary,
                        fontWeight: value ? 500 : 400
                    }}
                >
                    {value || 'N/A'}
                </Typography>
            );
        } else {
            // For string values, handle empty strings
            if (typeof value === 'string' && value.trim() === '') {
                return 'N/A';
            }
            return String(value);
        }
    };

    // Check if we have any data to display
    const hasNoDataToDisplay = (!tokens || tokens.length === 0);

    // Helper function to get the normalized status
    const getNormalizedStatus = (token) => {
        const status = token.tokenStatus || token.token_status || '';
        return status.toLowerCase();
    };

    return (
        <Fade in={!loading} timeout={300}>
            <Box sx={{ mt: 2, overflowX: 'auto' }}>
                {loading && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            zIndex: 10
                        }}
                    >
                        <CircularProgress sx={{ color: theme.palette.primary.main }} />
                    </Box>
                )}
                
                <Paper 
                    elevation={0}
                    sx={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.12)' 
                            : 'rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <Table stickyHeader aria-label="tokens table">
                        <TableHead>
                            <TableRow>
                                    {columns.map((column) => (
                                        <TableCell 
                                            key={column.id}
                                            sx={{ 
                                    fontWeight: 600, 
                                                color: theme.palette.primary.main, 
                                                borderBottom: '2px solid',
                                                borderBottomColor: theme.palette.primary.light,
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(0, 0, 0, 0.2)' 
                                                    : 'rgba(249, 250, 252, 0.9)',
                                                whiteSpace: 'nowrap',
                                                padding: '16px'
                                            }}
                                        >
                                            {column.label}
                                </TableCell>
                                    ))}
                                    {!hasNoDataToDisplay && (
                                        <TableCell 
                                            align="center"
                                            sx={{ 
                                    fontWeight: 600, 
                                                color: theme.palette.primary.main, 
                                                borderBottom: '2px solid',
                                                borderBottomColor: theme.palette.primary.light,
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(0, 0, 0, 0.2)' 
                                                    : 'rgba(249, 250, 252, 0.9)',
                                                padding: '16px'
                                            }}
                                        >
                                    Actions
                                </TableCell>
                                    )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedTokens.length > 0 ? (
                                displayedTokens.map((token) => (
                                    <TableRow
                                        key={token.id || token._id}
                                        hover
                                        onClick={() => handleViewDetails(token)}
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                            '&:hover': {
                                                bgcolor: theme => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.05)' 
                                                    : 'rgba(99, 102, 241, 0.04)',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                            },
                                            '&:active': {
                                                transform: 'translateY(0)',
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '3px',
                                                bgcolor: 'primary.main',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease'
                                            },
                                            '&:hover::after': {
                                                opacity: 1
                                            }
                                        }}
                                    >
                                        {columns.map((column) => (
                                            <TableCell 
                                                key={`${token.id || token._id}-${column.id}`}
                                            sx={{ 
                                                    padding: '12px 16px',
                                                    fontSize: '0.875rem'
                                            }}
                                        >
                                                {renderCellContent(token, column)}
                                        </TableCell>
                                            ))}
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Tooltip title="View details">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleViewDetails(token)}
                                                        sx={{
                                                                color: theme.palette.primary.main,
                                                            '&:hover': {
                                                                    backgroundColor: `${theme.palette.primary.main}15`
                                                                }
                                                        }}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                
                                                {/* Vérifier s'il y a une action en attente */}
                                                {hasPendingStatusChange(token) ? (
                                                    <Tooltip title={`Demande de ${getPendingActionName(token)} en attente de confirmation`}>
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 1,
                                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                            borderRadius: '4px',
                                                            py: 0.5,
                                                            px: 1
                                                        }}>
                                                            <WaitingIcon fontSize="small" sx={{ color: '#6366f1' }} />
                                                            <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 500 }}>
                                                                En attente
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ) : (
                                                    /* Display appropriate action buttons based on token status */
                                                    <>
                                                {getNormalizedStatus(token) === 'inactive' && (
                                                    <>
                                                        <Tooltip title="Activate token">
                                                            <Button 
                                                                startIcon={<ActivateIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'activate');
                                                                }}
                                                                sx={{
                                                                    color: '#10b981',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(16, 185, 129, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Activate
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Deactivate token">
                                                            <Button 
                                                                startIcon={<DeactivateIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'deactivate');
                                                                }}
                                                                sx={{
                                                                    color: '#6b7280',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                
                                                {getNormalizedStatus(token) === 'active' && (
                                                    <>
                                                        <Tooltip title="Suspend token">
                                                            <Button 
                                                                startIcon={<BlockIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'suspend');
                                                                }}
                                                                sx={{
                                                                    color: '#f59e0b',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(245, 158, 11, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Suspend
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Deactivate token">
                                                            <Button 
                                                                startIcon={<DeactivateIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'deactivate');
                                                                }}
                                                                sx={{
                                                                    color: '#6b7280',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                
                                                {getNormalizedStatus(token) === 'suspended' && (
                                                    <>
                                                        <Tooltip title="Resume token">
                                                            <Button 
                                                                startIcon={<ResumeIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'resume');
                                                                }}
                                                                sx={{
                                                                    color: '#3b82f6',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Resume
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Deactivate token">
                                                            <Button 
                                                                startIcon={<DeactivateIcon fontSize="small" />}
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateStatus(token, 'deactivate');
                                                                }}
                                                                sx={{
                                                                    color: '#6b7280',
                                                                    minWidth: 'auto',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(107, 114, 128, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                    </>
                                                )}
                                                </Box>
                                            </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                        <TableCell colSpan={columns.length + 1} align="center">
                                        <Box sx={{ py: 5 }}>
                                        <Typography 
                                            variant="body1" 
                                                    sx={{ color: theme.palette.text.secondary, mb: 1 }}
                                        >
                                                    {loading ? 'Loading tokens...' : 'No tokens found in database'}
                                        </Typography>
                                            {!loading && (
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                                                        Please check database connection or try adjusting your search criteria
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            alignItems: 'center',
                            backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(0, 0, 0, 0.2)' 
                                : 'rgba(249, 250, 252, 0.9)',
                            borderTop: '1px solid',
                            borderTopColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.08)' 
                                : 'rgba(0, 0, 0, 0.06)',
                            padding: '8px 16px'
                        }}
                    >
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={tokens.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    sx={{
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: '0.875rem',
                                    color: theme.palette.text.secondary
                        },
                        '.MuiTablePagination-select': {
                            fontSize: '0.875rem'
                        }
                    }}
                />
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
};

export default TokenTable; 