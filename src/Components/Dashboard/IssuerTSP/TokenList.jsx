import React, { useState, useEffect } from 'react';
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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
    Snackbar
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
    Download as DownloadIcon
} from '@mui/icons-material';
import TokenTable from './TokenTable';
import './TokenList.css';

const TokenList = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();

    // Form state
    const [searchParams, setSearchParams] = useState({
        internalTokenRef: '',
        issuerCardRef: '',
        tspTokenRef: '',
        issuerCustomerRef: '',
        issuerTokenRef: '',
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

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [filtersApplied, setFiltersApplied] = useState(false);

    useEffect(() => {
        // Fetch tokens when component mounts
        fetchTokens();
    }, []);

    // Update string dates when date objects change
    useEffect(() => {
        if (startDateObj) {
            setSearchParams(prev => ({
                ...prev,
                startDate: format(startDateObj, 'yyyy-MM-dd')
            }));
        }
        
        if (endDateObj) {
            setSearchParams(prev => ({
                ...prev,
                endDate: format(endDateObj, 'yyyy-MM-dd')
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

    const handleClear = () => {
        setSearchParams({
            internalTokenRef: '',
            issuerCardRef: '',
            tspTokenRef: '',
            issuerCustomerRef: '',
            issuerTokenRef: '',
            startDate: '',
            endDate: '',
            includeDeleted: false
        });
        setStartDateObj(null);
        setEndDateObj(null);
        setStatusFilter('all');
        setFiltersApplied(false);
    };

    const fetchTokens = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Build query parameters based on search filters
            const queryParams = new URLSearchParams();
            
            if (searchParams.internalTokenRef) {
                queryParams.append('internalTokenRef', searchParams.internalTokenRef);
            }
            
            if (searchParams.issuerCardRef) {
                queryParams.append('issuerCardRef', searchParams.issuerCardRef);
            }
            
            if (searchParams.tspTokenRef) {
                queryParams.append('tspTokenRef', searchParams.tspTokenRef);
            }
            
            if (searchParams.issuerCustomerRef) {
                queryParams.append('issuerCustomerRef', searchParams.issuerCustomerRef);
            }
            
            if (searchParams.issuerTokenRef) {
                queryParams.append('issuerTokenRef', searchParams.issuerTokenRef);
            }
            
            if (searchParams.startDate) {
                queryParams.append('startDate', searchParams.startDate);
            }
            
            if (searchParams.endDate) {
                queryParams.append('endDate', searchParams.endDate);
            }
            
            if (searchParams.includeDeleted) {
                queryParams.append('includeDeleted', searchParams.includeDeleted);
            }
            
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }
            
            // Make API call to fetch tokens
            const response = await axios.get(`/api/tokens?${queryParams.toString()}`);
            
            if (response.data && Array.isArray(response.data)) {
                setTokens(response.data);
                setResultsCount(response.data.length);
                
                // Check if any filters are applied
                const hasFilters = 
                    searchParams.internalTokenRef !== '' ||
                    searchParams.issuerCardRef !== '' ||
                    searchParams.tspTokenRef !== '' ||
                    searchParams.issuerCustomerRef !== '' ||
                    searchParams.issuerTokenRef !== '' ||
                    searchParams.startDate !== '' ||
                    searchParams.endDate !== '' ||
                    searchParams.includeDeleted ||
                    statusFilter !== 'all';
                    
                setFiltersApplied(hasFilters);
            } else {
                setTokens([]);
                setResultsCount(0);
                setError('Invalid response format from API');
            }
        } catch (err) {
            console.error('Error fetching tokens:', err);
            setError(err.response?.data?.message || 'Failed to fetch tokens');
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
            const queryParams = new URLSearchParams();
            
            // Add the same filters as for search
            if (searchParams.internalTokenRef) {
                queryParams.append('internalTokenRef', searchParams.internalTokenRef);
            }
            
            if (searchParams.issuerCardRef) {
                queryParams.append('issuerCardRef', searchParams.issuerCardRef);
            }
            
            if (searchParams.tspTokenRef) {
                queryParams.append('tspTokenRef', searchParams.tspTokenRef);
            }
            
            if (searchParams.issuerCustomerRef) {
                queryParams.append('issuerCustomerRef', searchParams.issuerCustomerRef);
            }
            
            if (searchParams.issuerTokenRef) {
                queryParams.append('issuerTokenRef', searchParams.issuerTokenRef);
            }
            
            if (searchParams.startDate) {
                queryParams.append('startDate', searchParams.startDate);
            }
            
            if (searchParams.endDate) {
                queryParams.append('endDate', searchParams.endDate);
            }
            
            if (searchParams.includeDeleted) {
                queryParams.append('includeDeleted', searchParams.includeDeleted);
            }
            
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }
            
            // Make API call to export tokens (usually returns a file)
            const response = await axios.get(`/api/tokens/export?${queryParams.toString()}`, {
                responseType: 'blob' // Important for file download
            });
            
            // Create a download link and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tokens-export-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error exporting tokens:', err);
            setError(err.response?.data?.message || 'Failed to export tokens');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <Fade in={true} timeout={500}>
                <Box>
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
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, 
                            mb: 3, 
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        className="search-form-paper"
                    >
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontWeight: 600, 
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <SearchIcon fontSize="small" sx={{ color: '#4f46e5' }} />
                            {t('token.searchTitle', 'Search Tokens')}
                        </Typography>
                        
                        <form onSubmit={handleSearch}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6} lg={4}>
                                    <TextField
                                        fullWidth
                                        label="Internal token reference"
                                        name="internalTokenRef"
                                        value={searchParams.internalTokenRef}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <TextField
                                        fullWidth
                                        label="Issuer card reference"
                                        name="issuerCardRef"
                                        value={searchParams.issuerCardRef}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <TextField
                                        fullWidth
                                        label="TSP token reference"
                                        name="tspTokenRef"
                                        value={searchParams.tspTokenRef}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <TextField
                                        fullWidth
                                        label="Issuer customer reference"
                                        name="issuerCustomerRef"
                                        value={searchParams.issuerCustomerRef}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <TextField
                                        fullWidth
                                        label="Issuer token reference"
                                        name="issuerTokenRef"
                                        value={searchParams.issuerTokenRef}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <FormControl 
                                        variant="outlined" 
                                        size="small"
                                        fullWidth
                                    >
                                        <InputLabel>{t('token.statusFilter', 'Status Filter')}</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            label={t('token.statusFilter', 'Status Filter')}
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <FilterListIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="all">{t('token.allStatuses', 'All Statuses')}</MenuItem>
                                            <MenuItem value="active">{t('token.active', 'Active')}</MenuItem>
                                            <MenuItem value="inactive">{t('token.inactive', 'Inactive')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <DatePicker
                                        label={t('token.createdFrom', 'Created from')}
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
                                                            <CalendarIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                        </InputAdornment>
                                                    )
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '8px'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <DatePicker
                                        label={t('token.createdTo', 'Created to')}
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
                                                            <CalendarIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                        </InputAdornment>
                                                    )
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '8px'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} lg={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="includeDeleted"
                                                checked={searchParams.includeDeleted}
                                                onChange={handleInputChange}
                                                color="primary"
                                            />
                                        }
                                        label={t('token.includeDeleted', 'Include deleted tokens')}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button 
                                            onClick={handleClear}
                                            variant="outlined" 
                                            startIcon={<ClearIcon />}
                                            sx={{
                                                borderColor: 'rgba(226, 232, 240, 0.8)',
                                                color: '#64748b',
                                                '&:hover': {
                                                    borderColor: '#64748b',
                                                    backgroundColor: 'rgba(100, 116, 139, 0.04)'
                                                }
                                            }}
                                        >
                                            {t('token.clear', 'Clear')}
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            startIcon={<SearchIcon />}
                                            sx={{
                                                background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                                                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                                                '&:hover': {
                                                    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                                                    background: 'linear-gradient(90deg, #4338ca 0%, #6d28d9 100%)'
                                                }
                                            }}
                                        >
                                            {t('token.search', 'Search')}
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
                        mb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                {t('token.resultsCount', 'Results')}: 
                                <Box component="span" sx={{ fontWeight: 600, color: '#4f46e5', ml: 1 }}>
                                    {resultsCount}
                                </Box>
                            </Typography>
                            
                            {filtersApplied && (
                                <Chip 
                                    label={t('token.filtersApplied', 'Filters applied')} 
                                    size="small"
                                    color="primary"
                                    onDelete={handleClear}
                                    sx={{ ml: 2 }}
                                />
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={fetchTokens}
                                sx={{ 
                                    color: '#4f46e5',
                                    '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.04)' }
                                }}
                            >
                                {t('token.refresh', 'Refresh')}
                            </Button>
                            
                            <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={handleExport}
                                sx={{ 
                                    color: '#4f46e5',
                                    '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.04)' }
                                }}
                            >
                                {t('token.export', 'Export')}
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
                    />
                </Box>
            </Fade>
        </LocalizationProvider>
    );
};

export default TokenList; 