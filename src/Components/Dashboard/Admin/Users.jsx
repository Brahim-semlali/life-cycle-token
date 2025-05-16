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
  Divider,
  InputBase
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
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  LockOutlined,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  Close as CloseIcon,
  LockPerson as LockPersonIcon,
  LockOpen as LockOpenIcon
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
        requireSpecialChars: true,
        maxLoginAttempts: 3,
        lockoutDuration: 30,
        passwordExpiration: 90,
        preventPasswordReuse: 5,
        minPasswordAge: 1,
        sessionTimeout: 30
    });
    const [viewMode, setViewMode] = useState('list');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProfile, setFilterProfile] = useState('all');
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuUser, setMenuUser] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [singleDeleteDialog, setSingleDeleteDialog] = useState(false);

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
            console.log('Raw users from API:', allUsers);
            const sortedUsers = allUsers.map(user => {
                // Identifier et normaliser profileId
                let profileId = null;
                if (user.profile_id) {
                    profileId = typeof user.profile_id === 'string' 
                        ? parseInt(user.profile_id, 10) 
                        : user.profile_id;
                } else if (user.profile && typeof user.profile === 'number') {
                    profileId = user.profile;
                } else if (user.profile && typeof user.profile === 'object' && user.profile.id) {
                    profileId = user.profile.id;
                }
                
                console.log(`User ${user.id || user.email} processed profile_id:`, profileId);
                
                // Déterminer le profil correspondant
                const userProfile = profileId 
                    ? profiles.find(p => p.id === profileId) 
                    : null;
                    
                // Normaliser le statut (toujours en minuscules pour l'UI)
                let normalizedStatus = 'active'; // Valeur par défaut
                if (user.status) {
                    normalizedStatus = user.status.toLowerCase();
                }
                
                console.log(`User ${user.id || user.email} status normalized from "${user.status}" to "${normalizedStatus}"`);
                
                return {
                    ...user,
                    id: user.id || user.email,
                    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profileId: profileId,
                    profile: userProfile || null,
                    status: normalizedStatus
                };
            }).sort((a, b) => {
                return (a.firstName || '').localeCompare(b.firstName || '');
            });

            console.log("Sorted Users with processed profiles:", sortedUsers);

            setUsers(sortedUsers);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error.message);
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
                // Utiliser la nouvelle méthode getPasswordPolicy
                const rules = await api.getPasswordPolicy();
                
                if (rules) {
                    // S'assurer que les valeurs booléennes sont correctement interprétées
                    setPasswordRules({
                        minLength: parseInt(rules.min_length) || 8,
                        requireUppercase: Boolean(rules.require_uppercase),
                        requireLowercase: Boolean(rules.require_lowercase),
                        requireNumbers: Boolean(rules.require_number),
                        requireSpecialChars: Boolean(rules.require_special_char),
                        maxLoginAttempts: parseInt(rules.max_login_attempts) || 3,
                        lockoutDuration: parseInt(rules.lockout_duration) || 30,
                        passwordExpiration: parseInt(rules.password_expiration) || 90,
                        preventPasswordReuse: parseInt(rules.prevent_password_reuse) || 5,
                        minPasswordAge: parseInt(rules.min_password_age) || 1,
                        sessionTimeout: parseInt(rules.session_timeout) || 30
                    });

                    console.log('Loaded password rules:', rules);
                }
            } catch (error) {
                console.error('Error loading password rules:', error);
                // En cas d'erreur, utiliser les valeurs par défaut qui correspondent à la BD
                setPasswordRules({
                    minLength: 6,
                    requireUppercase: false,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: false,
                    maxLoginAttempts: 3,
                    lockoutDuration: 30,
                    passwordExpiration: 90,
                    preventPasswordReuse: 5,
                    minPasswordAge: 1,
                    sessionTimeout: 30
                });
            }
        };

        loadPasswordRules();
    }, []);

    const validatePassword = (password) => {
        const errors = [];

        // Ne vérifier chaque règle que si elle est activée dans la configuration
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

        // Ne vérifier les caractères spéciaux que si la règle est activée
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
        
        // Validation du mot de passe avec les règles de sécurité
        if (!editingUser || user.password) {
            const passwordErrors = validatePassword(user.password || '');
            if (passwordErrors.length > 0) {
                errors.password = passwordErrors.join('\n');
            }
        }

        if (user.password !== user.confirmPassword) {
            errors.confirmPassword = t('users.passwordsDoNotMatch');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (user.email && !emailRegex.test(user.email)) {
            errors.email = t('users.invalidEmail');
        }

        return errors;
    };

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        
        // Spécial handling for profileId
        if (name === 'profileId') {
            console.log('Profile ID changed to:', value);
            const selectedProfile = profiles.find(p => p.id.toString() === value);
            console.log('Selected profile:', selectedProfile);
            
            setNewUser(prev => ({
                ...prev,
                [name]: value,
                profile: selectedProfile || null
            }));
        } else {
            setNewUser(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
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
            // Préparer les données utilisateur à envoyer
            const profileId = newUser.profileId ? parseInt(newUser.profileId, 10) : null;
            
            console.log('Profile ID for submission:', profileId);
            if (profileId) {
                console.log('Selected profile from list:', 
                    profileId ? profiles.find(p => p.id === profileId) : null);
            } else {
                console.log('No profile selected for this user');
            }
            
            // S'assurer que le statut est en majuscules pour l'API
            const userStatus = newUser.status ? newUser.status.toUpperCase() : 'ACTIVE';
            
            const userToSave = {
                email: newUser.email,
                password: newUser.password,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                profileId: profileId,
                status: userStatus,
                phone: newUser.phone
            };

            console.log('Submitting user data:', userToSave);

            let savedUser;
            try {
                if (editingUser !== null) {
                    savedUser = await userService.updateUser(users[editingUser].id, userToSave);
                } else {
                    savedUser = await userService.createUser(userToSave);
                }
                
                if (savedUser) {
                    // Pour être sûr que nous avons le profile correctement chargé
                    const userProfile = profileId 
                        ? profiles.find(p => p.id === profileId) 
                        : null;
                        
                    console.log('User saved with profile:', userProfile);
                    console.log('Saved user data from API:', savedUser);
                    
                    // Recharger les utilisateurs pour avoir les données à jour
                    await loadUsers();
                    
                    setNewUser(emptyUser);
                    setEditingUser(null);
                    setFormErrors({});
                    setOpenDialog(false);
                }
            } catch (apiError) {
                console.error('API Error:', apiError);
                
                // Analyser l'erreur et afficher un message spécifique si possible
                let errorMessage = t('users.errorSaving');
                
                // Vérifier si l'erreur est liée au profil
                if (apiError.message && apiError.message.includes('profile')) {
                    errorMessage = t('users.profileError', 'The selected profile is not valid or not available');
                } 
                // Vérifier si l'erreur est liée à l'email existant
                else if (apiError.message && apiError.message.includes('email')) {
                    errorMessage = t('users.emailExistsError', 'This email is already registered');
                    setFormErrors(prev => ({...prev, email: errorMessage}));
                }
                
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
            alert(t('users.errorSaving'));
        }
    };

    const handleEdit = (id) => {
        const user = users.find(u => u.id === id);
        if (user) {
            console.log('Editing user:', user);
            console.log('User profile:', user.profile);
            console.log('User profile_id:', user.profileId);
            console.log('User status:', user.status);
            
            // Extraire et normaliser l'ID du profil à partir de toutes les sources possibles
            let profileId = null;
            if (user.profileId) {
                profileId = user.profileId;
            } else if (user.profile_id) {
                profileId = user.profile_id;
            } else if (user.profile && typeof user.profile === 'number') {
                profileId = user.profile;
            } else if (user.profile && typeof user.profile === 'object' && user.profile.id) {
                profileId = user.profile.id;
            }
            
            console.log('Extracted profile ID for editing:', profileId);
            
            // Vérifier si le profil existe
            const userProfile = profileId ? profiles.find(p => p.id === profileId) : null;
            console.log('Corresponding profile object:', userProfile);
            
            // Normaliser le statut (convertir en minuscules pour l'UI)
            const normalizedStatus = user.status ? user.status.toLowerCase() : 'active';
            console.log('Normalized status for UI:', normalizedStatus);
            
            setEditingUser(users.findIndex(u => u.id === id));
            setNewUser({
                ...user,
                firstName: user.firstName || user.first_name || '',
                lastName: user.lastName || user.last_name || '',
                profileId: profileId ? profileId.toString() : '', // Convertir en chaîne pour le composant Select
                status: normalizedStatus,
                password: '',
                confirmPassword: ''
            });
            setOpenDialog(true);
        }
    };

    const handleDelete = (id) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setUserToDelete(user);
            setSingleDeleteDialog(true);
        }
    };

    const confirmSingleDelete = async () => {
        if (userToDelete && userToDelete.id) {
            try {
                // Utiliser requestWithFallbacks pour une meilleure gestion des erreurs
                await api.requestWithFallbacks('/user/delete/', 'POST', { id: userToDelete.id });
                
                // Mettre à jour l'UI immédiatement
                setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
                
                // Recharger les utilisateurs en arrière-plan
                loadUsers();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                // Mettre à jour l'UI même en cas d'erreur
                setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
            }
            
            // Fermer la boîte de dialogue et réinitialiser l'utilisateur à supprimer
            setSingleDeleteDialog(false);
            setUserToDelete(null);
        }
    };

    const cancelSingleDelete = () => {
        setSingleDeleteDialog(false);
        setUserToDelete(null);
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

    // Améliorer la fonction handleToggleUserStatus pour mieux gérer les statuts
    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            // Convertir le statut en majuscules pour l'API
            const newStatus = currentStatus.toLowerCase() === 'active' ? 'BLOCKED' : 'ACTIVE';
            
            console.log(`Changing user ${userId} status from ${currentStatus} to ${newStatus}`);
            
            // Mise à jour de l'interface utilisateur immédiatement pour une meilleure réactivité
            setUsers(prev => prev.map(user => 
                user.id === userId 
                    ? { ...user, status: newStatus.toLowerCase() } 
                    : user
            ));
            
            // Utiliser la méthode spécifique pour mettre à jour le statut
            await api.updateUserStatus(userId, newStatus);
            
            // Recharger les utilisateurs pour s'assurer que les données sont à jour
            loadUsers();
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            // Revenir à l'état précédent en cas d'erreur
            setUsers(prev => prev.map(user => 
                user.id === userId 
                    ? { ...user, status: currentStatus.toLowerCase() } 
                    : user
            ));
            
            // Afficher un message d'erreur à l'utilisateur
            alert(t('users.errorUpdatingStatus', 'Erreur lors de la mise à jour du statut de l\'utilisateur'));
        }
    };

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
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(params);
                        }}
                        sx={{ 
                            backgroundColor: selectedUsers.includes(params.row.id) 
                                ? '#4f46e5' 
                                : 'white',
                            border: selectedUsers.includes(params.row.id) 
                                ? '2px solid #4f46e5' 
                                : '2px solid #e5e7eb',
                            color: selectedUsers.includes(params.row.id) 
                                ? 'white' 
                                : '#64748b',
                            padding: '4px',
                            width: '24px',
                            height: '24px'
                        }}
                    >
                        {selectedUsers.includes(params.row.id) ? (
                            <CheckIcon fontSize="small" />
                        ) : (
                            <AddIcon fontSize="small" />
                        )}
                    </IconButton>
                </Box>
            ),
            renderHeader: () => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleHeaderCheckboxClick();
                        }}
                        sx={{ 
                            backgroundColor: users.length > 0 && selectedUsers.length === users.length 
                                ? 'rgba(79, 70, 229, 0.1)' 
                                : 'rgba(255, 255, 255, 0.8)',
                            border: selectedUsers.length > 0 
                                ? '1px solid #4f46e5' 
                                : '1px solid #e5e7eb',
                            color: selectedUsers.length > 0 
                                ? '#4f46e5' 
                                : '#64748b',
                            padding: '4px',
                            width: '24px',
                            height: '24px'
                        }}
                    >
                        {users.length > 0 && selectedUsers.length === users.length ? (
                            <CheckIcon fontSize="small" />
                        ) : selectedUsers.length > 0 ? (
                            <IndeterminateCheckBoxIcon fontSize="small" />
                        ) : (
                            <AddIcon fontSize="small" />
                        )}
                    </IconButton>
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
                const initials = getInitials(firstName, lastName);
                const avatarColor = getAvatarColor(params.row.id);
                
                return (
                    <Box className="name-cell">
                        <div className="user-avatar" style={{ backgroundColor: avatarColor }}>
                            {initials}
                        </div>
                        <div>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                {fullName}
                            </Typography>
                            {params.row.title && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    {params.row.title}
                                </Typography>
                            )}
                        </div>
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
                params.row.status?.toLowerCase() === 'active' ? (
                    <Tooltip title={t('users.block')} arrow placement="top">
                        <GridActionsCellItem
                            icon={<LockPersonIcon className="action-icon block-icon" />}
                            label={t('users.block')}
                            onClick={() => handleToggleUserStatus(params.id, params.row.status)}
                            className="grid-action-item"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                },
                                color: '#f59e0b'
                            }}
                        />
                    </Tooltip>
                ) : params.row.status?.toLowerCase() === 'blocked' ? (
                    <Tooltip title={t('users.unblock')} arrow placement="top">
                        <GridActionsCellItem
                            icon={<LockOpenIcon className="action-icon unblock-icon" />}
                            label={t('users.unblock')}
                            onClick={() => handleToggleUserStatus(params.id, params.row.status)}
                            className="grid-action-item"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                },
                                color: '#10b981'
                            }}
                        />
                    </Tooltip>
                ) : null,
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

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) return;
        setOpenDeleteDialog(true);
    };

    const confirmDeleteSelected = async () => {
        try {
            // Delete each selected user
            for (const userId of selectedUsers) {
                await api.requestWithFallbacks('/user/delete/', 'POST', { id: userId });
            }
            
            // Update UI
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            setSelectedUsers([]);
            setOpenDeleteDialog(false);
            
            // Reload users in background
            loadUsers();
        } catch (error) {
            console.error('Error deleting selected users:', error);
            // Still update UI for better UX
            setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
            setSelectedUsers([]);
            setOpenDeleteDialog(false);
        }
    };

    const cancelSelection = () => {
        setSelectedUsers([]);
    };

    // Modifier le rendu du tableau pour ajouter des classes modernes et des animations
    const renderUserTable = () => (
        <div className="table-container">
            <table className="contact-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>
                            <IconButton
                                size="small"
                                onClick={handleHeaderCheckboxClick}
                                className={`selection-button ${users.length > 0 && selectedUsers.length === users.length ? 'selected' : ''}`}
                            >
                                {users.length > 0 && selectedUsers.length === users.length ? (
                                    <CheckIcon fontSize="small" />
                                ) : selectedUsers.length > 0 ? (
                                    <IndeterminateCheckBoxIcon fontSize="small" />
                                ) : (
                                    <AddIcon fontSize="small" />
                                )}
                            </IconButton>
                        </th>
                        <th>FULL NAME</th>
                        <th>EMAIL</th>
                        <th>PHONE</th>
                        <th>PROFILE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user, index) => (
                        <tr 
                            key={user.id} 
                            onClick={() => handleRowClick({ id: user.id })}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <td>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (selectedUsers.includes(user.id)) {
                                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                        } else {
                                            setSelectedUsers(prev => [...prev, user.id]);
                                        }
                                    }}
                                    className={`selection-button ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                                >
                                    {selectedUsers.includes(user.id) ? (
                                        <CheckIcon fontSize="small" />
                                    ) : (
                                        <AddIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </td>
                            <td>
                                <div className="name-cell">
                                    <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.id) }}>
                                        {getInitials(user.firstName, user.lastName)}
                                    </div>
                                    <div>
                                        <div className="profile-name">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                                        {user.title && <div className="profile-title">{user.title}</div>}
                                    </div>
                                </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                                <Box className="phone-cell">
                                    {user.phone ? (
                                        <>
                                            <PhoneIcon className="phone-icon" />
                                            <span>{user.phone}</span>
                                        </>
                                    ) : (
                                        <IconButton disabled size="small">
                                            <PhoneIcon className="phone-icon" sx={{ opacity: 0.3 }} />
                                        </IconButton>
                                    )}
                                </Box>
                            </td>
                            <td>
                                {user.profile ? user.profile.name : ''}
                            </td>
                            <td>
                                <div className={`status-badge ${user.status?.toLowerCase() || 'inactive'}`}>
                                    <span className="status-dot"></span>
                                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Inactive'}
                                </div>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="action-button edit"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEdit(user.id);
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </button>
                                    {user.status?.toLowerCase() === 'active' && (
                                        <button 
                                            className="action-button block"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleUserStatus(user.id, user.status);
                                            }}
                                        >
                                            <LockPersonIcon fontSize="small" />
                                        </button>
                                    )}
                                    {user.status?.toLowerCase() === 'blocked' && (
                                        <button 
                                            className="action-button unblock"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleUserStatus(user.id, user.status);
                                            }}
                                        >
                                            <LockOpenIcon fontSize="small" />
                                        </button>
                                    )}
                                    <button 
                                        className="action-button delete"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(user.id);
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Modifier le rendu de l'en-tête pour un design plus moderne
    const renderHeader = () => (
        <>
            {selectedUsers.length > 0 ? (
                <Box className="selection-header">
                    <Typography variant="h4" component="h1">
                        <span className="selected-count">{selectedUsers.length}</span> {t('users.selected')}
                    </Typography>
                    <Box className="users-actions">
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDeleteSelected}
                            className="delete-selected-button"
                        >
                            {t('users.deleteSelected')} ({selectedUsers.length})
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={cancelSelection}
                            className="cancel-selection-button"
                        >
                            {t('users.cancelSelection')}
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Box className="users-header">
                    <Typography variant="h4" component="h1">
                        <span className="users-count">{filteredUsers.length}</span> {t('users.title')}
                    </Typography>
                    <Box className="users-actions">
                        <div className="search-container">
                            <SearchIcon className="search-icon" />
                            <InputBase
                                placeholder={t('users.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-field"
                                fullWidth
                            />
                        </div>
                        
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            aria-label="view mode"
                            size="small"
                            className="view-selector"
                        >
                            <ToggleButton value="grid" aria-label="grid view" className="view-button">
                                <GridViewIcon />
                            </ToggleButton>
                            <ToggleButton value="list" aria-label="list view" className="view-button">
                                <ListViewIcon />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        
                        <IconButton onClick={() => setShowFilters(!showFilters)} className="filter-button">
                            <FilterListIcon />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<FileDownloadIcon />}
                            onClick={() => handleExport('csv')}
                            className="export-button"
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
                            className="create-button"
                        >
                            {t('users.create')}
                        </Button>
                    </Box>
                </Box>
            )}
        </>
    );

    // Modifier le rendu de la grille pour un design plus moderne
    const renderUserGrid = () => (
                <Grid container spacing={3}>
            {filteredUsers.map((user, index) => (
                <Grid item xs={12} sm={6} md={4} lg={4} key={user.id} style={{ animationDelay: `${index * 0.05}s` }}>
                            <Card 
                                className={selectedUsers.includes(user.id) ? 'selected' : ''}
                                onClick={() => {
                                    setSelectedUsers(prev => 
                                        prev.includes(user.id)
                                            ? prev.filter(id => id !== user.id)
                                            : [...prev, user.id]
                                    );
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUsers(prev => 
                                            prev.includes(user.id)
                                                ? prev.filter(id => id !== user.id)
                                                : [...prev, user.id]
                                        );
                                    }}
                                    className={`selection-button ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                zIndex: 10
                                    }}
                                >
                                    {selectedUsers.includes(user.id) ? (
                                        <CheckIcon />
                                    ) : (
                                        <AddIcon />
                                    )}
                                </IconButton>
                                
                                <CardContent 
                                    sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                        p: 3
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Avatar
                                        sx={{
                                    width: 90,
                                    height: 90,
                                            mb: 2,
                                            bgcolor: getAvatarColor(user.id),
                                    fontSize: '1.8rem',
                                            fontWeight: 'bold'
                                        }}
                                className="user-card-avatar"
                                    >
                                        {getInitials(user.firstName, user.lastName)}
                                    </Avatar>
                            <Typography variant="h6" className="card-user-name">
                                        {user.fullName}
                                    </Typography>
                            <Typography variant="body2" className="card-user-profile">
                                        {user.profile ? user.profile.name : 'No Profile'}
                                    </Typography>
                                    
                                    <Chip
                                        label={t(`users.status${(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}`)}
                                        className={`status-badge ${user.status}`}
                                sx={{ mb: 2, mt: 2 }}
                                    />
                                    
                                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }} className="card-user-email">
                                    <EmailIcon sx={{ fontSize: 18, mr: 1 }} />
                                            <Typography variant="body2">{user.email}</Typography>
                                        </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }} className="card-user-phone">
                                    <PhoneIcon sx={{ fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2">{user.phone || '(Not provided)'}</Typography>
                                        </Box>
                                    </Box>
                                    
                            <Box className="card-actions" sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        gap: 2, 
                                        mt: 3, 
                                        width: '100%',
                                position: 'relative',
                                p: 2
                                    }}>
                                        <IconButton
                                            onClick={() => handleEdit(user.id)}
                                            className="action-button edit"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        {user.status?.toLowerCase() === 'active' && (
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleUserStatus(user.id, user.status);
                                                }}
                                                className="action-button block"
                                            >
                                                <LockPersonIcon />
                                            </IconButton>
                                        )}
                                        {user.status?.toLowerCase() === 'blocked' && (
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleUserStatus(user.id, user.status);
                                                }}
                                                className="action-button unblock"
                                            >
                                                <LockOpenIcon />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            onClick={() => handleDelete(user.id)}
                                            className="action-button delete"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
    );

    return (
        <Box className={`users-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            {renderHeader()}

            <Collapse in={showFilters}>
                <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }} className="filters-panel">
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                            <InputLabel>{t('users.filterByStatus')}</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label={t('users.filterByStatus')}
                                className="filter-select"
                            >
                                <MenuItem value="all">{t('users.allStatuses')}</MenuItem>
                                <MenuItem value="active">{t('users.statusActive')}</MenuItem>
                                <MenuItem value="inactive">{t('users.statusInactive')}</MenuItem>
                                <MenuItem value="blocked">{t('users.statusBlocked')}</MenuItem>
                                <MenuItem value="suspended">{t('users.statusSuspended')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                            <InputLabel>{t('users.filterByProfile')}</InputLabel>
                            <Select
                                value={filterProfile}
                                onChange={(e) => setFilterProfile(e.target.value)}
                                label={t('users.filterByProfile')}
                                className="filter-select"
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

            {filteredUsers.length === 0 ? (
                <Box className="empty-state" sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 5,
                    textAlign: 'center',
                    height: '50vh'
                }}>
                    <PersonIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                        {t('users.noUsersFound')}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                        {t('users.tryDifferentFilters')}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingUser(null);
                            setNewUser(emptyUser);
                            setOpenDialog(true);
                        }}
                        className="create-button"
                    >
                        {t('users.createFirst')}
                    </Button>
                </Box>
            ) : viewMode === 'grid' ? renderUserGrid() : renderUserTable()}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { borderRadius: 3, minWidth: 180 }
                }}
                className="user-menu"
            >
                <MenuItem onClick={() => {
                    handleEdit(menuUser?.id);
                    handleMenuClose();
                }} className="menu-item">
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('users.edit')}
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDelete(menuUser?.id);
                    handleMenuClose();
                }} className="menu-item">
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('users.delete')}
                </MenuItem>
            </Menu>

            <Dialog 
                open={openDialog} 
                onClose={handleCancel} 
                maxWidth="md" 
                fullWidth
                className="user-dialog"
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle className="dialog-title">
                    {editingUser !== null ? t('users.edit') : t('users.create')}
                </DialogTitle>
                <DialogContent className="dialog-content">
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Box className="form-row">
                            <TextField
                                fullWidth
                                label={t('users.firstName')}
                                name="firstName"
                                value={newUser.firstName}
                                onChange={handleInputChange}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                                className="form-field"
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
                                className="form-field"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Box className="form-row">
                            <TextField
                                fullWidth
                                label={t('users.email')}
                                name="email"
                                value={newUser.email}
                                onChange={handleInputChange}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                className="form-field"
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
                                className="form-field"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Box className="form-row">
                            <FormControl fullWidth error={!!formErrors.profileId} className="form-field">
                                <InputLabel>{t('users.profile')}</InputLabel>
                                <Select
                                    name="profileId"
                                    value={newUser.profileId || ''}
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
                                        <MenuItem key={profile.id} value={profile.id.toString()}>
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
                            
                            <FormControl fullWidth className="form-field">
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

                        <Box className="form-row">
                            <TextField
                                fullWidth
                                label={t('users.password')}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={newUser.password}
                                onChange={handleInputChange}
                                error={!!formErrors.password}
                                helperText={formErrors.password}
                                required={!editingUser}
                                className="form-field"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
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
                                required={!editingUser}
                                className="form-field"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                    <IconButton
                                                aria-label="toggle confirm password visibility"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Box className="password-rules-container">
                            <Box className="password-rules-header">
                                <LockOutlined sx={{ fontSize: 18 }} />
                                {t('security.passwordRules.help')}
                            </Box>
                            <Box component="ul" className="password-rules-list">
                                {passwordRules.minLength > 0 && (
                                    <li>{t('security.passwordRules.minLengthInfo', { length: passwordRules.minLength })}</li>
                                )}
                                {passwordRules.requireUppercase && (
                                    <li>{t('security.passwordRules.uppercaseInfo')}</li>
                                )}
                                {passwordRules.requireLowercase && (
                                    <li>{t('security.passwordRules.lowercaseInfo')}</li>
                                )}
                                {passwordRules.requireNumbers && (
                                    <li>{t('security.passwordRules.numberInfo')}</li>
                                )}
                                {passwordRules.requireSpecialChars && (
                                    <li>{t('security.passwordRules.specialInfo')}</li>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleCancel} startIcon={<CancelIcon />} className="cancel-button">
                        {t('users.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        startIcon={<SaveIcon />}
                        className="create-button"
                    >
                        {editingUser !== null ? t('users.save') : t('users.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={openDeleteDialog} 
                onClose={() => setOpenDeleteDialog(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                PaperProps={{
                    className: "delete-confirm-dialog",
                    style: {
                        borderRadius: '20px',
                        overflow: 'hidden'
                    }
                }}
                BackdropProps={{
                    style: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }
                }}
                maxWidth="xs"
                fullWidth
            >
                <Box className="delete-dialog-header">
                    <div className="delete-dialog-icon">
                        <DeleteIcon />
                    </div>
                    <Typography variant="h6" className="delete-dialog-title">
                        {t('users.confirmDeleteMultiple')}
                    </Typography>
                </Box>
                
                <DialogContent className="delete-dialog-content">
                    <Typography className="delete-dialog-description">
                        {t('users.confirmDeleteMultipleDesc', { count: selectedUsers.length })}
                    </Typography>
                    <Typography variant="body2" className="delete-dialog-warning">
                        {t('users.confirmDeleteWarning')}
                    </Typography>
                </DialogContent>
                
                <DialogActions className="delete-dialog-actions">
                    <Button 
                        onClick={() => setOpenDeleteDialog(false)} 
                        variant="outlined"
                        className="delete-dialog-cancel-button"
                    >
                        {t('users.cancel', 'Annuler')}
                    </Button>
                    <Button 
                        onClick={confirmDeleteSelected} 
                        variant="contained"
                        color="error"
                        className="delete-dialog-confirm-button"
                    >
                        {t('users.delete', 'Supprimer')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={singleDeleteDialog} 
                onClose={cancelSingleDelete}
                aria-labelledby="single-delete-dialog-title"
                aria-describedby="single-delete-dialog-description"
                PaperProps={{
                    className: "delete-confirm-dialog",
                    style: {
                        borderRadius: '20px',
                        overflow: 'hidden'
                    }
                }}
                BackdropProps={{
                    style: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }
                }}
                maxWidth="xs"
                fullWidth
            >
                <Box className="delete-dialog-header">
                    <div className="delete-dialog-icon">
                        <DeleteIcon />
                    </div>
                    <Typography variant="h6" className="delete-dialog-title">
                        {t('users.deleteTitle', 'Delete User')}
                    </Typography>
                </Box>
                
                <DialogContent className="delete-dialog-content">
                    <Typography className="delete-dialog-description">
                        {t('users.deleteConfirmMessage', 'Are you sure you want to delete the user')} {userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}?
                    </Typography>
                    <Typography variant="body2" className="delete-dialog-warning">
                        {t('users.deleteWarning', 'This action cannot be undone. All data associated with this user will be permanently removed.')}
                    </Typography>
                </DialogContent>
                
                <DialogActions className="delete-dialog-actions">
                    <Button 
                        onClick={cancelSingleDelete} 
                        variant="outlined"
                        className="delete-dialog-cancel-button"
                    >
                        {t('users.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={confirmSingleDelete} 
                        variant="contained"
                        color="error"
                        className="delete-dialog-confirm-button"
                    >
                        {t('users.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Users);