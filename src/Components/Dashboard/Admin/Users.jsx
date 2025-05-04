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
  Collapse,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Menu,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider
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
  ViewList as ListViewIcon,
  FileDownload as FileDownloadIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccountCircle as AccountCircleIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import "./Users.css";
import { getAllProfiles } from '../../../services/ProfileService';
import userService from '../../../services/UserService';
import api from '../../../services/api';

const Users = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
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
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuUser, setMenuUser] = useState(null);

    const emptyUser = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        profileId: '',
        profile: null,
        status: 'active',
        phone: ''
    };

    const [newUser, setNewUser] = useState(emptyUser);

    const loadProfiles = async () => {
        try {
            const allProfiles = await getAllProfiles();
            setProfiles(allProfiles);
        } catch (error) {
            console.error('Erreur lors du chargement des profils:', error);
        }
    };

    const loadUsers = async () => {
        try {
            const allUsers = await userService.getAllUsers();
            console.log(allUsers);
            const sortedUsers = allUsers.map(user => ({
                ...user,
                id: user.id || user.email,
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
        loadProfiles();
    }, []);

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
                profileId: newUser.profileId || null,
                status: newUser.status || 'ACTIVE',
                phone: newUser.phone
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
            field: 'phone',
            headerName: t('users.phone'),
            flex: 1.5,
            minWidth: 150,
            renderCell: (params) => (
                <Box className="phone-cell" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: '#4299e1', fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 500 }}>
                        {params.row.phone || ''}
                    </Typography>
                </Box>
            )
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
            minWidth: 160,
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
            minWidth: 140,
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

    // Fonction pour formater la date d'embauche
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(2, 2)}`;
    };

    // Fonction pour générer des initiales à partir du nom
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    // Fonction pour générer une couleur aléatoire mais cohérente pour un utilisateur
    const getAvatarColor = (userId) => {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#d35400', '#34495e'
        ];
        const index = userId?.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index] || colors[0];
    };

    // Toggle view mode
    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Ouvrir le menu contextuel pour un utilisateur
    const handleMenuOpen = (event, user) => {
        setAnchorEl(event.currentTarget);
        setMenuUser(user);
    };

    // Fermer le menu contextuel
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuUser(null);
    };

    return (
        <Box className={`users-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: isDarkMode ? '#2d3748' : 'white',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                padding: '10px 20px',
                borderRadius: '10px',
                mb: 3,
                gap: 2
            }}>
                <Typography variant="h4" component="h1" sx={{ color: isDarkMode ? '#e2e8f0' : '#f97316' }}>
                    {filteredUsers.length} {t('users.title')}
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
                    
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="view mode"
                        size="small"
                    >
                        <ToggleButton value="grid" aria-label="grid view">
                            <GridViewIcon />
                        </ToggleButton>
                        <ToggleButton value="list" aria-label="list view">
                            <ListViewIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                    
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingUser(null);
                            setNewUser(emptyUser);
                            setOpenDialog(true);
                        }}
                        sx={{
                            backgroundColor: '#f97316',
                            '&:hover': {
                                backgroundColor: '#ea580c',
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
                                <MenuItem value="blocked">{t('users.statusBlocked')}</MenuItem>
                                <MenuItem value="suspended">{t('users.statusSuspended')}</MenuItem>
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

            {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                    {filteredUsers.map(user => (
                        <Grid item xs={12} sm={6} md={4} lg={4} key={user.id}>
                            <Card sx={{ 
                                position: 'relative',
                                borderRadius: '16px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                }
                            }}>
                                <IconButton
                                    aria-label="more"
                                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                                    onClick={(e) => handleMenuOpen(e, user)}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                <CardContent sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    p: 3
                                }}>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            mb: 2,
                                            bgcolor: getAvatarColor(user.id),
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {getInitials(user.firstName, user.lastName)}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {user.fullName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {user.profile ? user.profile.name : 'No Profile'}
                                    </Typography>
                                    
                                    <Chip
                                        label={t(`users.status${(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}`)}
                                        sx={{
                                            mb: 2,
                                            bgcolor: user.status === 'active' ? 'success.light' : 'error.light',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            px: 1,
                                            '&::before': {
                                                content: '""',
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                marginRight: 1,
                                                backgroundColor: user.status === 'active' ? 'success.main' : 'error.main',
                                                boxShadow: user.status === 'active' 
                                                    ? '0 0 0 2px rgba(46, 204, 113, 0.3)' 
                                                    : '0 0 0 2px rgba(231, 76, 60, 0.3)'
                                            }
                                        }}
                                    />
                                    
                                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                            <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                                            <Typography variant="body2">{user.email}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                            <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                                            <Typography variant="body2">{user.phone || '(555) 555-0109'}</Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, width: '100%' }}>
                                        <Button 
                                            className="custom-edit-button"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEdit(user.id)}
                                            size="small"
                                        >
                                            {t('users.edit')}
                                        </Button>
                                        <Button 
                                            className="custom-delete-button"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDelete(user.id)}
                                            size="small"
                                        >
                                            {t('users.delete')}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {filteredUsers.map((user, index) => (
                            <React.Fragment key={user.id}>
                                <ListItem 
                                    alignItems="center" 
                    sx={{
                                        py: 2, 
                                        px: 3,
                                        transition: 'background-color 0.3s',
                                        '&:hover': {
                                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar 
                                            sx={{ 
                                                bgcolor: getAvatarColor(user.id),
                                                width: 50,
                                                height: 50
                                            }}
                                        >
                                            {getInitials(user.firstName, user.lastName)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                                                    {user.fullName}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={t(`users.status${(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}`)}
                                                    sx={{
                                                        height: 24,
                                                        bgcolor: user.status === 'active' ? 'success.light' : 'error.light',
                                                        color: '#fff',
                                                        fontWeight: 'bold',
                                                        px: 1,
                                                        '&::before': {
                                                            content: '""',
                                                            display: 'inline-block',
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            marginRight: 0.5,
                                                            backgroundColor: user.status === 'active' ? 'success.main' : 'error.main',
                                                            boxShadow: user.status === 'active' 
                                                                ? '0 0 0 2px rgba(46, 204, 113, 0.3)' 
                                                                : '0 0 0 2px rgba(231, 76, 60, 0.3)'
                        }
                    }}
                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                                    {user.profile ? user.profile.name : 'No Profile'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <EmailIcon fontSize="small" sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PhoneIcon fontSize="small" sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.phone || '(555) 555-0109'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button 
                                                className="custom-edit-button"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleEdit(user.id)}
                                                size="small"
                                            >
                                                {t('users.edit')}
                                            </Button>
                                            <Button 
                                                className="custom-delete-button"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(user.id)}
                                                size="small"
                                            >
                                                {t('users.delete')}
                                            </Button>
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < filteredUsers.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
            </Paper>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 2, minWidth: 150 }
                }}
            >
                <MenuItem onClick={() => {
                    handleEdit(menuUser?.id);
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('users.edit')}
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDelete(menuUser?.id);
                    handleMenuClose();
                }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('users.delete')}
                </MenuItem>
            </Menu>

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
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('users.lastName')}
                                name="lastName"
                                value={newUser.lastName}
                                onChange={handleInputChange}
                                error={!!formErrors.lastName}
                                helperText={formErrors.lastName}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    ),
                                }}
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
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                label={t('users.phone')}
                                name="phone"
                                value={newUser.phone}
                                onChange={handleInputChange}
                                error={!!formErrors.phone}
                                helperText={formErrors.phone}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <FormControl fullWidth error={!!formErrors.profileId}>
                                <InputLabel>{t('users.profile')}</InputLabel>
                                <Select
                                    name="profileId"
                                    value={newUser.profileId}
                                    onChange={handleInputChange}
                                    label={t('users.profile')}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <AccountCircleIcon />
                                        </InputAdornment>
                                    }
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
                                <MenuItem value="blocked">{t('users.statusBlocked')}</MenuItem>
                                <MenuItem value="suspended">{t('users.statusSuspended')}</MenuItem>
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
                        sx={{ backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
                    >
                        {editingUser !== null ? t('users.save') : t('users.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Users);