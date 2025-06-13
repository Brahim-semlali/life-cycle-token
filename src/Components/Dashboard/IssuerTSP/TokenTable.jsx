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

const TokenTable = ({ tokens, loading, page, rowsPerPage, onPageChange, onRowsPerPageChange, onViewDetails, onEditToken, onDeleteToken, onUpdateStatus, tableMetadata, pendingStatusChanges, error }) => {
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

    // Get table columns dynamically from the token data
    const getTableColumns = () => {
        // Si aucune donnée n'est disponible, renvoyer un tableau vide
        if (!tokens || tokens.length === 0) return [];
        
        // Prendre le premier token comme référence pour les colonnes
        const sampleToken = tokens[0];
        
        // Créer les colonnes basées sur tous les champs du token
        const columns = Object.keys(sampleToken).map(key => ({
            id: key,
            // Labels personnalisés pour les colonnes connues
            label: {
                'tokenReferenceID': 'Reference ID',
                'tokenStatus': 'Status',
                'panSource': 'PAN Source',
                'tokenActivationDate': 'Activation Date',
                'tokenRequestorID': 'Requestor ID',
                // Ajouter ici d'autres labels personnalisés si nécessaire
            }[key] || formatColumnLabel(key),
            isDate: key.toLowerCase().includes('date') || key.toLowerCase().includes('time'),
            isStatus: key === 'tokenStatus' || key.toLowerCase().includes('status'),
            isDisplay: key.toLowerCase().includes('display')
        }));
        
        return columns;
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
        const value = token[column.id];
        
        // Handle null or undefined values
        if (value === null || value === undefined) {
            return '-';
        }
        
        // Handle dates
        if (column.isDate) {
            return (
                <Typography 
                    variant="body2" 
                    className="activation-date"
                >
                    {formatDate(value)}
                </Typography>
            );
        }
        
        // Handle status
        if (column.isStatus) {
            const normalizedStatus = getNormalizedStatus(token);
            const isPending = hasPendingStatusChange(token);
            const pendingAction = getPendingActionName(token);
            
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={normalizedStatus}
                        size="small"
                        className={`status-${normalizedStatus.toLowerCase()}`}
                    />
                    {isPending && (
                        <Tooltip title={`Pending ${pendingAction}`}>
                            <Chip
                                icon={<PendingIcon fontSize="small" />}
                                label={pendingAction}
                                size="small"
                                className="status-pending"
                            />
                        </Tooltip>
                    )}
                </Box>
            );
        }
        
        // Handle PAN source
        if (column.id === 'panSource') {
            return (
                <Typography 
                    variant="body2" 
                    className="pan-source"
                >
                    {value}
                </Typography>
            );
        }
        
        // Handle Reference ID
        if (column.id === 'tokenReferenceID') {
            return (
                <Typography 
                    variant="body2" 
                    className="reference-id"
                    sx={{ 
                        fontFamily: 'Roboto Mono, monospace',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: '#4f46e5'
                    }}
                >
                    {value}
                </Typography>
            );
        }
        
        // Handle Requestor ID
        if (column.id === 'tokenRequestorID') {
            return (
                <Typography 
                    variant="body2" 
                    className="requestor-id"
                >
                    {value}
                </Typography>
            );
        }
        
        // Default rendering
        return (
            <Typography variant="body2">
                {String(value)}
            </Typography>
        );
    };

    // Check if we have any data to display
    const hasNoDataToDisplay = (!tokens || tokens.length === 0);

    // Helper function to get the normalized status
    const getNormalizedStatus = (token) => {
        const status = token.tokenStatus || token.token_status || '';
        return status.toLowerCase();
    };

    return (
        <Paper 
            className="token-table-paper"
            elevation={0}
            sx={{ 
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={column.isDate ? 'center' : 'left'}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length} 
                                    align="center"
                                    sx={{ py: 6 }}
                                >
                                    <CircularProgress size={40} />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length} 
                                    align="center"
                                    sx={{ py: 6 }}
                                >
                                    <Typography color="error">
                                        {error}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : displayedTokens.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length} 
                                    align="center"
                                    sx={{ py: 6 }}
                                >
                                    <Typography color="textSecondary">
                                        No tokens found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedTokens.map((token, index) => (
                                <TableRow 
                                    key={token.id || index}
                                    className="token-table-row"
                                    onClick={() => onViewDetails(token)}
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: theme => theme.palette.mode === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.05)' 
                                                : 'rgba(99, 102, 241, 0.04)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                                        },
                                        '&:active': {
                                            transform: 'translateY(0)'
                                        }
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell 
                                            key={column.id}
                                            align={column.isDate ? 'center' : 'left'}
                                            className={column.id === 'tokenReferenceID' ? 'reference-id' : ''}
                                        >
                                            {renderCellContent(token, column)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={tokens.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        </Paper>
    );
};

export default TokenTable; 