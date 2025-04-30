import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { PREDEFINED_PROFILES } from '../../../config/predefinedProfiles';
import { getAllUsers, saveCustomUser, deleteUser } from '../../../config/predefinedUsers';
import { 
  DataGrid, 
  GridToolbar,
  GridActionsCellItem 
} from '@mui/x-data-grid';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Collapse
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import "./Users.css";
import { ensureProfileExists } from '../../../services/ProfileService';
import userService from '../../../services/UserService';
import api from '../../../services/api';

const Users = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [profiles] = useState(Object.values(PREDEFINED_PROFILES));
    const [openDialog, setOpenDialog] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordRules, setPasswordRules] = useState({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    });
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProfile, setFilterProfile] = useState('all');

    const emptyUser = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        profileId: '',
        profile: null,
        status: 'active'
    };

    const [newUser, setNewUser] = useState(emptyUser);

    const loadUsers = async () => {
        try {
            const allUsers = await userService.getAllUsers();
            console.log(allUsers);
            const sortedUsers = allUsers.map(user => ({
                ...user,
                id: user.id|| user.email,
                fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                firstName: user.first_name,
                lastName: user.last_name,
                profileId: user.profile_id,
                profile: user.profile,
                status: user.status || 'active'
            })).sort((a, b) => {
                return (a.firstName || '').localeCompare(b.firstName || '');
            });

            console.log("Sorted Users:", sortedUsers);

            setUsers(sortedUsers);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [profiles]);

    // Charger les règles de mot de passe au démarrage
    useEffect(() => {
        const loadPasswordRules = async () => {
            try {
                const response = await api.request('/security/password-rules/', 'GET');
                if (response) {
                    setPasswordRules({
                        minLength: response.minLength,
                        requireUppercase: response.requireUppercase,
                        requireLowercase: response.requireLowercase,
                        requireNumbers: response.requireNumbers,
                        requireSpecialChars: response.requireSpecialChars
                    });
                }
            } catch (error) {
                console.error('Error loading password rules:', error);
            }
        };

        loadPasswordRules();
    }, []);

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < passwordRules.minLength) {
            errors.push(t('security.passwordRules.minLengthError', { length: passwordRules.minLength }));
        }
        if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push(t('security.passwordRules.uppercaseError'));
        }
        if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
            errors.push(t('security.passwordRules.lowercaseError'));
        }
        if (passwordRules.requireNumbers && !/\d/.test(password)) {
            errors.push(t('security.passwordRules.numberError'));
        }
        if (passwordRules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push(t('security.passwordRules.specialError'));
        }
        return errors;
    };

    const validateForm = (user) => {
        const errors = {};
        if (!user.firstName?.trim()) errors.firstName = t('users.firstNameRequired');
        if (!user.lastName?.trim()) errors.lastName = t('users.lastNameRequired');
        if (!user.email?.trim()) errors.email = t('users.emailRequired');
        
        // Vérifier le mot de passe uniquement lors de la création ou s'il est fourni lors de la mise à jour
        if (!editingUser) {
            if (!user.password?.trim()) errors.password = t('users.passwordRequired');
            if (!user.confirmPassword?.trim()) errors.confirmPassword = t('users.confirmPasswordRequired');
        } else if (user.password || user.confirmPassword) {
            // Si un mot de passe est fourni lors de la mise à jour, valider la confirmation
            if (user.password !== user.confirmPassword) {
                errors.confirmPassword = t('users.passwordsDoNotMatch');
            }
        }
        
        if (!user.profileId) errors.profileId = t('users.profileRequired');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (user.email && !emailRegex.test(user.email)) {
            errors.email = t('users.invalidEmail');
        }

        const existingUser = users.find(u => 
            u.email === user.email && 
            (!editingUser || u.email !== users[editingUser].email)
        );
        if (existingUser) {
            errors.email = t('users.emailExists');
        }

        return errors;
    };

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'profileId' && {
                profile: profiles.find(p => p.id === value) || null
            })
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [profiles, formErrors]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const errors = validateForm(newUser);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const userToSave = {
                email: newUser.email,
                password: newUser.password,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                profileId: newUser.profileId,
                status: newUser.status || 'ACTIVE'
            };

            console.log('Submitting user data:', userToSave);

            let savedUser;
            if (editingUser !== null) {
                savedUser = await userService.updateUser(users[editingUser].id, userToSave);
            } else {
                savedUser = await userService.createUser(userToSave);
            }
            
            if (savedUser) {
                setUsers(prevUsers => {
                    if (editingUser !== null) {
                        return prevUsers.map((user, index) => 
                            index === editingUser ? {
                                ...savedUser,
                                fullName: `${savedUser.first_name || ''} ${savedUser.last_name || ''}`.trim()
                            } : user
                        );
                    }
                    return [...prevUsers, {
                        ...savedUser,
                        fullName: `${savedUser.first_name || ''} ${savedUser.last_name || ''}`.trim()
                    }];
                });
                setNewUser(emptyUser);
                setEditingUser(null);
                setFormErrors({});
                setOpenDialog(false);
                loadUsers();
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
            alert(t('users.errorSaving'));
        }
    };

    const handleEdit = (id) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setEditingUser(users.findIndex(u => u.id === id));
            setNewUser({
                ...user,
                profileId: user.profile?.id || ''
            });
            setOpenDialog(true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('users.confirmDelete'))) {
            try {
                await userService.deleteUser(id);
                loadUsers();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(t('users.errorDeleting'));
            }
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
        setNewUser(emptyUser);
        setFormErrors({});
        setOpenDialog(false);
    };

    const getProfileName = (profileId) => {
        const profile = profiles.find(p => p.id === profileId);
        return profile ? profile.name : '';
    };

    const handleUpdate = (id) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setEditingUser(users.findIndex(u => u.id === id));
            setNewUser({...user});
            setOpenDialog(true);
        }
    };

    const handleRowClick = useCallback((params) => {
        const id = params.id;
        setSelectedUsers(prev => 
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    const handleHeaderCheckboxClick = useCallback(() => {
        setSelectedUsers(prev => 
            prev.length === users.length ? [] : users.map(user => user.id)
        );
    }, [users]);

    // Mémorisation des colonnes
    const columns = useMemo(() => [
        {
            field: 'selection',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            hideable: false,
            disableColumnMenu: true,
            flex: 0.5,
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <Checkbox
                        checked={selectedUsers.includes(params.row.id)}
                        onChange={() => handleRowClick(params)}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(params);
                        }}
                        size="small"
                        sx={{
                            padding: '4px',
                            '&:hover': {
                                backgroundColor: 'transparent'
                            }
                        }}
                    />
                </Box>
            ),
            renderHeader: () => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <Checkbox
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                        onChange={handleHeaderCheckboxClick}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleHeaderCheckboxClick();
                        }}
                        size="small"
                        sx={{
                            padding: '4px',
                            '&:hover': {
                                backgroundColor: 'transparent'
                            }
                        }}
                    />
                </Box>
            ),
        },
        { 
            field: 'fullName', 
            headerName: t('users.fullName'), 
            flex: 2,
            minWidth: 200,
            renderCell: (params) => {
                const firstName = params.row.firstName || '';
                const lastName = params.row.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return (
                    <Box className="name-cell">
                        <Typography variant="body1">{fullName}</Typography>
                    </Box>
                );
            }
        },
        { 
            field: 'email', 
            headerName: t('users.email'), 
            flex: 2,
            minWidth: 200
        },
        { 
            field: 'profile', 
            headerName: t('users.profile'), 
            flex: 1.5,
            minWidth: 150,
            renderCell: (params) => {
                const profile = params.row.profile;
                return (
                    <Box className="profile-cell">
                        <Typography variant="body1">
                            {profile ? profile.name : ''}
                        </Typography>
                    </Box>
                );
            }
        },
        { 
            field: 'status', 
            headerName: t('users.status'), 
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                if (!params?.row?.status) return null;
                return (
                    <span className={`status-badge ${params.row.status || 'inactive'}`}>
                        {t(`users.status${(params.row.status || 'inactive').charAt(0).toUpperCase() + (params.row.status || 'inactive').slice(1)}`)}
                    </span>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('users.actions'),
            flex: 1,
            minWidth: 100,
            getActions: (params) => [
                <Tooltip title={t('users.edit')} arrow placement="top">
                    <GridActionsCellItem
                        icon={<EditIcon className="action-icon edit-icon" />}
                        label={t('users.edit')}
                        onClick={() => handleEdit(params.id)}
                        className="grid-action-item"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(66, 153, 225, 0.08)',
                            }
                        }}
                    />
                </Tooltip>,
                <Tooltip title={t('users.delete')} arrow placement="top">
                    <GridActionsCellItem
                        icon={<DeleteIcon className="action-icon delete-icon" />}
                        label={t('users.delete')}
                        onClick={() => handleDelete(params.id)}
                        className="grid-action-item"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            }
                        }}
                    />
                </Tooltip>
            ]
        }
    ], [selectedUsers, users.length, handleHeaderCheckboxClick]);

    // Fonction de filtrage
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || (user.status || '').toLowerCase() === filterStatus.toLowerCase();
            const matchesProfile = filterProfile === 'all' || user.profileId === filterProfile;

            return matchesSearch && matchesStatus && matchesProfile;
        });
    }, [users, searchQuery, filterStatus, filterProfile]);

    // Fonction d'export
    const handleExport = (format) => {
        const data = filteredUsers.map(user => ({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            profile: user.profile?.name || '',
            status: user.status || ''
        }));

        if (format === 'csv') {
            const csvContent = "data:text/csv;charset=utf-8," 
                + "First Name,Last Name,Email,Profile,Status\n"
                + data.map(row => Object.values(row).join(",")).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "users.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Box className={`users-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                border: '1px solid white',
                backgroundColor: isDarkMode ? '#2d3748' : 'white',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                padding: '10px 20px',
                borderRadius: '10px',
                mb: 3,
                gap: 2
            }}>
                <Typography variant="h4" component="h1">
                    {t('users.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder={t('users.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 200 }}
                    />
                    <IconButton onClick={() => setShowFilters(!showFilters)}>
                        <FilterListIcon />
                    </IconButton>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => handleExport('csv')}
                    >
                        {t('users.export')}
                    </Button>
                    {selectedUsers.length > 0 && (
                        <>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                    if (window.confirm(t('users.confirmDeleteMultiple'))) {
                                        selectedUsers.forEach(id => deleteUser(id));
                                        loadUsers();
                                        setSelectedUsers([]);
                                    }
                                }}
                                sx={{
                                    backgroundColor: '#dc3545',
                                    '&:hover': {
                                        backgroundColor: '#c82333',
                                    },
                                    minWidth: '200px',
                                    height: '40px'
                                }}
                            >
                                {t('users.deleteSelected')} ({selectedUsers.length})
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => setSelectedUsers([])}
                                sx={{
                                    borderColor: '#6c757d',
                                    color: '#6c757d',
                                    '&:hover': {
                                        backgroundColor: 'rgba(108, 117, 125, 0.08)',
                                        borderColor: '#5a6268',
                                    },
                                    height: '40px'
                                }}
                            >
                                {t('users.cancelSelection')}
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingUser(null);
                            setNewUser(emptyUser);
                            setOpenDialog(true);
                        }}
                        sx={{
                            backgroundColor: '#4299e1',
                            '&:hover': {
                                backgroundColor: '#3182ce',
                            },
                            height: '40px'
                        }}
                    >
                        {t('users.create')}
                    </Button>
                </Box>
            </Box>

            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>{t('users.filterByStatus')}</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label={t('users.filterByStatus')}
                            >
                                <MenuItem value="all">{t('users.allStatuses')}</MenuItem>
                                <MenuItem value="active">{t('users.statusActive')}</MenuItem>
                                <MenuItem value="inactive">{t('users.statusInactive')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>{t('users.filterByProfile')}</InputLabel>
                            <Select
                                value={filterProfile}
                                onChange={(e) => setFilterProfile(e.target.value)}
                                label={t('users.filterByProfile')}
                            >
                                <MenuItem value="all">{t('users.allProfiles')}</MenuItem>
                                {profiles.map((profile) => (
                                    <MenuItem key={profile.id} value={profile.id}>
                                        {profile.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>
            </Collapse>

            <Paper sx={{ 
                height: 600, 
                width: '100%',
                overflow: 'hidden',
                '& .MuiDataGrid-root': {
                    border: 'none',
                    width: '100% !important',
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e2e8f0',
                },
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc',
                    borderBottom: '2px solid #e2e8f0',
                    width: '100% !important',
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: '2px solid #e2e8f0',
                    width: '100% !important',
                },
                '& .MuiCheckbox-root': {
                    color: isDarkMode ? '#4299e1' : '#3182ce',
                },
                '& .MuiCheckbox-root.Mui-checked': {
                    color: '#4299e1',
                },
                '& .MuiDataGrid-row:hover': {
                    backgroundColor: isDarkMode ? 'rgba(74, 85, 104, 0.08)' : 'rgba(66, 153, 225, 0.08)',
                },
                '& .MuiDataGrid-main': {
                    width: '100% !important',
                    overflow: 'hidden !important',
                },
                '& .MuiDataGrid-virtualScroller': {
                    width: '100% !important',
                    overflow: 'hidden !important',
                },
                '& .MuiDataGrid-virtualScrollerContent': {
                    width: '100% !important',
                },
                '& .MuiDataGrid-virtualScrollerRenderZone': {
                    width: '100% !important',
                },
                '& .MuiDataGrid-columnHeadersInner': {
                    width: '100% !important',
                }
            }}>
                <DataGrid
                    rows={filteredUsers}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    getRowId={(row) => row.id || row.email || `${row.first_name}-${row.last_name}-${Math.random().toString(36).substr(2, 9)}`}
                    checkboxSelection={false}
                    disableSelectionOnClick
                    disableColumnMenu
                    disableColumnResize
                    autoWidth
                    components={{
                        Toolbar: GridToolbar,
                    }}
                    componentsProps={{
                        toolbar: {
                            sx: {
                                '& .MuiButton-root': {
                                    color: isDarkMode ? '#e2e8f0' : '#2d3748',
                                },
                            },
                        },
                    }}
                    sx={{
                        '& .MuiDataGrid-cell': {
                            cursor: 'pointer',
                        },
                        '& .MuiCheckbox-root': {
                            padding: '8px',
                        }
                    }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCancel} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingUser !== null ? t('users.edit') : t('users.create')}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label={t('users.firstName')}
                            name="firstName"
                                value={newUser.firstName}
                            onChange={handleInputChange}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                            />
                            <TextField
                                fullWidth
                                label={t('users.lastName')}
                            name="lastName"
                                value={newUser.lastName}
                            onChange={handleInputChange}
                                error={!!formErrors.lastName}
                                helperText={formErrors.lastName}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label={t('users.email')}
                            name="email"
                                value={newUser.email}
                            onChange={handleInputChange}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                            />
                            <FormControl fullWidth error={!!formErrors.profileId}>
                                <InputLabel>{t('users.profile')}</InputLabel>
                                <Select
                                    name="profileId"
                                    value={newUser.profileId}
                            onChange={handleInputChange}
                                    label={t('users.profile')}
                                >
                                    <MenuItem value="">{t('users.selectProfile')}</MenuItem>
                                    {profiles.map((profile) => (
                                        <MenuItem key={profile.id} value={profile.id}>
                                            {profile.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formErrors.profileId && (
                                    <Typography color="error" variant="caption">
                                        {formErrors.profileId}
                                    </Typography>
                                )}
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label={t('users.password')}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={newUser.password}
                                onChange={handleInputChange}
                                error={!!formErrors.password}
                                helperText={formErrors.password}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('users.confirmPassword')}
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={newUser.confirmPassword}
                                onChange={handleInputChange}
                                error={!!formErrors.confirmPassword}
                                helperText={formErrors.confirmPassword}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            {t('security.passwordRules.help')}
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>{t('users.status')}</InputLabel>
                            <Select
                            name="status"
                                value={newUser.status}
                            onChange={handleInputChange}
                                label={t('users.status')}
                            >
                                <MenuItem value="active">{t('users.statusActive')}</MenuItem>
                                <MenuItem value="inactive">{t('users.statusInactive')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} startIcon={<CancelIcon />}>
                        {t('users.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        startIcon={<SaveIcon />}
                    >
                        {editingUser !== null ? t('users.save') : t('users.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Users);