import React from 'react';
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
    ListItemText
} from '@mui/material';
import { 
    PhoneAndroid as DeviceIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Block as BlockIcon
} from '@mui/icons-material';

const TokenTable = ({ tokens, loading, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
    // Determine which rows to display based on pagination
    const displayedTokens = tokens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
    // Menu state for action buttons
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedToken, setSelectedToken] = React.useState(null);
    
    const handleMenuOpen = (event, token) => {
        setAnchorEl(event.currentTarget);
        setSelectedToken(token);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedToken(null);
    };

    // Status style handler
    const getStatusStyle = (status) => {
        if (!status) return getDefaultStyle();
        
        switch (status.toLowerCase()) {
            case 'active':
                return {
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.2)'
                };
            case 'inactive':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                };
            default:
                return getDefaultStyle();
        }
    };

    // Decision style handler
    const getDecisionStyle = (decision) => {
        if (!decision) return getDefaultStyle();
        
        switch (decision.toLowerCase()) {
            case 'approved':
                return {
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.2)'
                };
            case 'rejected':
                return {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                };
            default: // Unknown
                return {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.2)'
                };
        }
    };
    
    const getDefaultStyle = () => {
        return {
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            borderColor: 'rgba(107, 114, 128, 0.2)'
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
            
            // Format as dd/mm/yyyy HH:MM
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };
    
    // Handle token actions
    const handleViewDetails = (token) => {
        console.log('View details for token:', token);
        // Implement view details functionality
    };
    
    const handleEditToken = (token) => {
        console.log('Edit token:', token);
        // Implement edit token functionality
    };
    
    const handleDeleteToken = (token) => {
        console.log('Delete token:', token);
        // Implement delete token functionality
        handleMenuClose();
    };
    
    const handleSuspendToken = (token) => {
        console.log('Suspend token:', token);
        // Implement suspend token functionality
        handleMenuClose();
    };
    
    const handleRefreshToken = (token) => {
        console.log('Refresh token status:', token);
        // Implement refresh token functionality
        handleMenuClose();
    };

    return (
        <Fade in={!loading} timeout={300}>
            <Paper 
                elevation={0} 
                sx={{ 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    overflow: 'hidden',
                    position: 'relative'
                }}
                className="token-table-paper"
            >
                {loading && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            zIndex: 10,
                            borderRadius: '16px'
                        }}
                    >
                        <CircularProgress sx={{ color: '#4f46e5' }} />
                    </Box>
                )}
                
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader aria-label="tokens table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Internal token ref
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    TSP
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    TSP token ref
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Token requestor
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Decision
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Device
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Creation date
                                </TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 600, 
                                    color: '#4f46e5', 
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '2px solid rgba(226, 232, 240, 0.8)'
                                }}>
                                    Actions
                                </TableCell>
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
                                                backgroundColor: 'rgba(243, 244, 246, 0.7)',
                                                transition: 'background-color 0.2s ease'
                                            },
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        className="token-table-row"
                                    >
                                        <TableCell>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: '#4f46e5'
                                                }}
                                            >
                                                {token.internalTokenRef || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {token.tsp || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {token.tspTokenRef || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {token.tokenRequestor || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={token.status || 'Unknown'} 
                                                size="small"
                                                sx={{
                                                    ...getStatusStyle(token.status),
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                    height: '24px',
                                                    borderRadius: '12px'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={token.decision || 'Unknown'} 
                                                size="small"
                                                sx={{
                                                    ...getDecisionStyle(token.decision),
                                                    fontWeight: 500,
                                                    fontSize: '0.75rem',
                                                    height: '24px',
                                                    borderRadius: '12px'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <DeviceIcon fontSize="small" sx={{ color: '#6b7280' }} />
                                                <Typography variant="body2">{token.device || 'N/A'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                                {formatDate(token.creationDate)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="View details">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleViewDetails(token)}
                                                        sx={{
                                                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                                            color: '#4f46e5',
                                                            '&:hover': {
                                                                backgroundColor: '#4f46e5',
                                                                color: 'white'
                                                            },
                                                            transition: 'all 0.2s ease',
                                                            width: '28px',
                                                            height: '28px'
                                                        }}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit token">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleEditToken(token)}
                                                        sx={{
                                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                            color: '#3b82f6',
                                                            '&:hover': {
                                                                backgroundColor: '#3b82f6',
                                                                color: 'white'
                                                            },
                                                            transition: 'all 0.2s ease',
                                                            width: '28px',
                                                            height: '28px'
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="More options">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, token)}
                                                        sx={{
                                                            backgroundColor: 'rgba(107, 114, 128, 0.1)',
                                                            color: '#6b7280',
                                                            '&:hover': {
                                                                backgroundColor: '#6b7280',
                                                                color: 'white'
                                                            },
                                                            transition: 'all 0.2s ease',
                                                            width: '28px',
                                                            height: '28px'
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
                                    <TableCell colSpan={9} align="center">
                                        <Box sx={{ py: 5 }}>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ color: '#6b7280', mb: 1 }}
                                            >
                                                {loading ? 'Loading tokens...' : 'No tokens found'}
                                            </Typography>
                                            {!loading && (
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                    Try adjusting your search criteria
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
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
                    sx={{
                        borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: '0.875rem',
                            color: '#64748b'
                        },
                        '.MuiTablePagination-select': {
                            fontSize: '0.875rem'
                        }
                    }}
                />
                
                {/* Action menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
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
                    <MenuItem onClick={() => handleSuspendToken(selectedToken)}>
                        <ListItemIcon>
                            <BlockIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                        </ListItemIcon>
                        <ListItemText primary="Suspend token" />
                    </MenuItem>
                    <MenuItem onClick={() => handleRefreshToken(selectedToken)}>
                        <ListItemIcon>
                            <RefreshIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                        </ListItemIcon>
                        <ListItemText primary="Refresh status" />
                    </MenuItem>
                </Menu>
            </Paper>
        </Fade>
    );
};

export default TokenTable; 