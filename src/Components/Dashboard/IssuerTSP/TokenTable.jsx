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
    useTheme
} from '@mui/material';
import { 
    Visibility as ViewIcon,
    Edit as EditIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Block as BlockIcon
} from '@mui/icons-material';

const TokenTable = ({ tokens, loading, page, rowsPerPage, onPageChange, onRowsPerPageChange, onViewDetails, onEditToken, onDeleteToken, onUpdateStatus, tableMetadata }) => {
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
        const excludedColumns = ['_id', '__v', 'id', 'id']; 
        
        // Définir les colonnes que nous voulons spécifiquement afficher
        // en se basant sur le schéma PostgreSQL
        const columnsToDisplay = [
            'token',
            'tokenReferenceId',
            'tokenReferenceID',
            'tokenRequestorId',
            'tokenRequestorID',
            'tokenType',
            'tokenStatus',
            'token_status',
            'tokenAssuranceMethod',
            'assurance_method_display',
            'tokenActivationDate',
            'tokenExpirationDate',
            'lastTokenStatusUpdatedTime',
            'pan_reference_id',
            'entity_of_last_action',
            'wallet_account_email_address_hash',
            'client_wallet_account_id',
            'pan_source',
            'auto_fill_indicator'
        ];
        
        let availableKeys = [];
        
        // Priorité 1: Obtenir les colonnes à partir des métadonnées de la table PostgreSQL
        if (tableMetadata && tableMetadata.columns) {
            availableKeys = tableMetadata.columns
                .map(col => col.name || col.column_name)
                .filter(key => !excludedColumns.includes(key))
                // Filtrer pour n'inclure que les colonnes que nous voulons afficher
                .filter(key => columnsToDisplay.includes(key));
                
            console.log('Available columns from metadata (filtered):', availableKeys);
        }
        
        // Priorité 2: Si pas de métadonnées ou pour compléter, utiliser les clés des données réelles
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
            
            // Log the keys we found in the tokens
            console.log('Keys from token data (filtered):', Array.from(allKeys));
            
            // Convertir le Set en array et ajouter les clés qui ne sont pas déjà présentes
            Array.from(allKeys).forEach(key => {
                if (!availableKeys.includes(key)) {
                    availableKeys.push(key);
                }
            });
        }
        
        // Définir un ordre préférentiel pour les colonnes les plus importantes
        // Celles-ci seront affichées dans l'ordre du schéma PostgreSQL
        const preferredOrder = [
            'token',
            'tokenReferenceId',
            'tokenReferenceID',
            'pan_reference_id',
            'tokenRequestorId',
            'tokenRequestorID',
            'tokenType',
            'tokenStatus',
            'tokenAssuranceMethod',
            'assurance_method_display',
            'entity_of_last_action',
            'wallet_account_email_address_hash',
            'client_wallet_account_id',
            'pan_source',
            'auto_fill_indicator',
            'tokenActivationDate',
            'tokenExpirationDate',
            'lastTokenStatusUpdatedTime'
        ];
        
        // Filtrer pour éviter les doublons entre tokenStatus et token_status
        if (availableKeys.includes('tokenStatus') && availableKeys.includes('token_status')) {
            // Garder seulement tokenStatus pour l'affichage
            availableKeys = availableKeys.filter(key => key !== 'token_status');
        }
        
        // Filtrer pour éviter les doublons entre tokenReferenceId et tokenReferenceID
        if (availableKeys.includes('tokenReferenceId') && availableKeys.includes('tokenReferenceID')) {
            // Garder seulement tokenReferenceID pour l'affichage
            availableKeys = availableKeys.filter(key => key !== 'tokenReferenceId');
        }
        
        // Filtrer pour éviter les doublons entre tokenRequestorId et tokenRequestorID
        if (availableKeys.includes('tokenRequestorId') && availableKeys.includes('tokenRequestorID')) {
            // Garder seulement tokenRequestorID pour l'affichage
            availableKeys = availableKeys.filter(key => key !== 'tokenRequestorId');
        }
        
        // Trier les colonnes disponibles selon l'ordre préférentiel
        const sortedKeys = [...availableKeys].sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);
            
            // Si les deux clés sont dans l'ordre préférentiel, respecter cet ordre
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            
            // Si seulement une clé est dans l'ordre préférentiel, la mettre en premier
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            // Sinon, trier par ordre alphabétique
            return a.localeCompare(b);
        });
        
        // Convertir les clés en objets de colonne
        const finalColumns = sortedKeys.map(key => ({
            id: key,
            label: formatColumnLabel(key),
            isDate: key.includes('Date') || key.includes('Time'),
            isStatus: key === 'tokenStatus' || key === 'token_status',
            isDisplay: key.toLowerCase().includes('display'),
            isAssurance: key.includes('Assurance'),
            isScore: key.toLowerCase().includes('score'),
            isBoolean: key === 'is_deleted' || (tokens.length > 0 && typeof tokens.find(t => t[key] !== undefined)?.[key] === 'boolean')
        }));
        
        console.log('Final columns for table:', finalColumns.map(c => c.id));
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

    // Status style handler
    const getStatusStyle = (status) => {
        if (!status) return getDefaultStyle();
        
        const statusStr = String(status).toLowerCase();
        
        switch (statusStr) {
            case 'active':
            case 'ac':
                return {
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    fontWeight: 600
                };
            case 'suspended':
            case 'su':
                return {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    fontWeight: 600
                };
            case 'inactive':
            case 'in':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    fontWeight: 600
                };
            case 'deactivated':
                return {
                    backgroundColor: 'rgba(107, 114, 128, 0.15)',
                    color: '#6b7280',
                    borderColor: 'rgba(107, 114, 128, 0.3)',
                    fontWeight: 600
                };
            default:
                return getDefaultStyle();
        }
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
        if (onUpdateStatus) onUpdateStatus(token, action);
        handleMenuClose();
    };
    
    // Function to render cell content based on column type
    const renderCellContent = (token, column) => {
        // Check if the property exists in the token object
        if (!(column.id in token)) {
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
            
            console.log(`Property ${column.id} not found in token:`, token);
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
                <Chip 
                    label={value || 'Unknown'} 
                    size="small"
                    sx={{
                        ...getStatusStyle(value),
                        fontSize: '0.75rem',
                        height: '24px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                />
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
        } else if (column.id === 'tokenReferenceId' || column.id === 'tokenRequestorId') {
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
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            '&:hover': {
                                                    backgroundColor: theme.palette.mode === 'dark' 
                                                        ? 'rgba(255, 255, 255, 0.05)' 
                                                        : 'rgba(243, 244, 246, 0.7)',
                                            },
                                                borderBottom: '1px solid',
                                                borderBottomColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.08)' 
                                                    : 'rgba(0, 0, 0, 0.06)',
                                            transition: 'all 0.2s ease'
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
                                                <Tooltip title="More options">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, token)}
                                                        sx={{
                                                                color: theme.palette.text.secondary,
                                                            '&:hover': {
                                                                    backgroundColor: theme.palette.mode === 'dark' 
                                                                        ? 'rgba(255, 255, 255, 0.08)' 
                                                                        : 'rgba(0, 0, 0, 0.04)'
                                                                }
                                                        }}
                                                    >
                                                        <MoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
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
                
                {/* Action menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                            mt: 1.5,
                            borderRadius: '8px',
                            '& .MuiMenuItem-root': {
                                px: 2,
                                py: 1,
                                fontSize: '0.875rem'
                            }
                        }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => handleDeleteToken(selectedToken)}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                        </ListItemIcon>
                        <ListItemText primary="Delete token" />
                    </MenuItem>
                    <MenuItem onClick={() => handleUpdateStatus(selectedToken, 'suspend')}>
                        <ListItemIcon>
                            <BlockIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                        </ListItemIcon>
                        <ListItemText primary="Suspend token" />
                    </MenuItem>
                    <MenuItem onClick={() => handleUpdateStatus(selectedToken, 'refresh')}>
                        <ListItemIcon>
                            <RefreshIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                        </ListItemIcon>
                        <ListItemText primary="Refresh status" />
                    </MenuItem>
                </Menu>
            </Box>
        </Fade>
    );
};

export default TokenTable; 