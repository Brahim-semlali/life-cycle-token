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
  InputBase,
  useMediaQuery,
  useTheme as useMuiTheme
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
    const muiTheme = useMuiTheme();
    
    // Responsive breakpoints
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));
    const isDesktop = useMediaQuery(muiTheme.breakpoints.up('md'));
    
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
            
            // Vérifier que tous les champs obligatoires sont remplis
            if (!newUser.firstName || !newUser.firstName.trim()) {
                setFormErrors(prev => ({...prev, firstName: t('users.firstNameRequired', 'First name is required')}));
                return;
            }
            
            if (!newUser.lastName || !newUser.lastName.trim()) {
                setFormErrors(prev => ({...prev, lastName: t('users.lastNameRequired', 'Last name is required')}));
                return;
            }
            
            if (!newUser.email || !newUser.email.trim()) {
                setFormErrors(prev => ({...prev, email: t('users.emailRequired', 'Email is required')}));
                return;
            }
            
            const userToSave = {
                email: newUser.email,
                password: newUser.password,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                profileId: profileId,
                status: userStatus,
                phone: newUser.phone || '' // Assurer que phone n'est jamais undefined
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
                let fieldErrors = {};
                
                // Récupérer les détails de l'erreur du backend
                if (apiError.response && apiError.response.data) {
                    const errorData = apiError.response.data;
                    console.error('API Error details:', errorData);
                    
                    // Gérer les erreurs spécifiques aux champs
                    if (errorData.email) {
                        fieldErrors.email = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
                    }
                    
                    if (errorData.first_name) {
                        fieldErrors.firstName = Array.isArray(errorData.first_name) ? errorData.first_name[0] : errorData.first_name;
                    }
                    
                    if (errorData.last_name) {
                        fieldErrors.lastName = Array.isArray(errorData.last_name) ? errorData.last_name[0] : errorData.last_name;
                    }
                    
                    if (errorData.phone) {
                        fieldErrors.phone = Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone;
                    }
                    
                    if (errorData.profile) {
                        fieldErrors.profileId = Array.isArray(errorData.profile) ? errorData.profile[0] : errorData.profile;
                        errorMessage = t('users.profileError', 'The selected profile is not valid or not available');
                    }
                    
                    if (errorData.password) {
                        fieldErrors.password = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
                    }
                    
                    // Mettre à jour les erreurs de formulaire
                    if (Object.keys(fieldErrors).length > 0) {
                        setFormErrors(prev => ({...prev, ...fieldErrors}));
                    }
                } 
                // Vérifier si l'erreur est liée au profil dans le message
                else if (apiError.message && apiError.message.includes('profile')) {
                    errorMessage = t('users.profileError', 'The selected profile is not valid or not available');
                    setFormErrors(prev => ({...prev, profileId: errorMessage}));
                } 
                // Vérifier si l'erreur est liée à l'email existant
                else if (apiError.message && apiError.message.includes('email')) {
                    errorMessage = t('users.emailExistsError', 'This email is already registered');
                    setFormErrors(prev => ({...prev, email: errorMessage}));
                }
                
                // Afficher l'alerte uniquement si nous n'avons pas déjà affiché des erreurs dans le formulaire
                if (Object.keys(fieldErrors).length === 0) {
                    alert(errorMessage);
                }
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
                // Utiliser request directement au lieu de requestWithFallbacks
                await api.request('/user/delete/', 'POST', { id: userToDelete.id });
                
                // Mettre à jour l'UI immédiatement
                setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
                
                // Recharger les utilisateurs en arrière-plan
                loadUsers();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                // Mettre à jour l'UI même en cas d'erreur pour améliorer l'UX
                setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
            } finally {
                // Fermer la boîte de dialogue et réinitialiser l'utilisateur à supprimer
                setSingleDeleteDialog(false);
                setUserToDelete(null);
            }
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
                try {
                    // Utiliser request directement au lieu de requestWithFallbacks
                    await api.request('/user/delete/', 'POST', { id: userId });
                } catch (userError) {
                    console.warn(`Erreur lors de la suppression de l'utilisateur ${userId}:`, userError);
                    // Continuer malgré l'erreur pour les autres utilisateurs
                }
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
        <div className={`table-container ${isMobile ? 'mobile-table-container' : ''}`}>
            <table className={`contact-table ${isMobile ? 'mobile-contact-table' : ''}`}>
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
                        {!isMobile && <th>PHONE</th>}
                        {!isMobile && <th>PROFILE</th>}
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
                                    <div className="user-avatar" style={{ 
                                        backgroundColor: getAvatarColor(user.id),
                                        width: isMobile ? '35px' : '45px',
                                        height: isMobile ? '35px' : '45px',
                                        fontSize: isMobile ? '0.8rem' : '1rem'
                                    }}>
                                        {getInitials(user.firstName, user.lastName)}
                                    </div>
                                    <div>
                                        <div className="profile-name" style={{ fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                                            {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                                        </div>
                                        {user.title && <div className="profile-title" style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                                            {user.title}
                                        </div>}
                                        {isMobile && user.profile && (
                                            <div className="profile-title" style={{ fontSize: '0.7rem', color: '#6366f1' }}>
                                                {user.profile.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td style={{ fontSize: isMobile ? '0.75rem' : 'inherit' }}>{user.email}</td>
                            {!isMobile && (
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
                            )}
                            {!isMobile && (
                                <td>
                                    {user.profile ? user.profile.name : ''}
                                </td>
                            )}
                            <td>
                                <div className={`status-badge ${user.status?.toLowerCase() || 'inactive'}`} style={{
                                    padding: isMobile ? '4px 8px' : '8px 16px',
                                    fontSize: isMobile ? '0.6rem' : '0.8rem'
                                }}>
                                    <span className="status-dot"></span>
                                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Inactive'}
                                </div>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="action-button edit"
                                        style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEdit(user.id);
                                        }}
                                    >
                                        <EditIcon fontSize={isMobile ? 'small' : 'medium'} />
                                    </button>
                                    {user.status?.toLowerCase() === 'active' && (
                                        <button 
                                            className="action-button block"
                                            style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleUserStatus(user.id, user.status);
                                            }}
                                        >
                                            <LockPersonIcon fontSize={isMobile ? 'small' : 'medium'} />
                                        </button>
                                    )}
                                    {user.status?.toLowerCase() === 'blocked' && (
                                        <button 
                                            className="action-button unblock"
                                            style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleUserStatus(user.id, user.status);
                                            }}
                                        >
                                            <LockOpenIcon fontSize={isMobile ? 'small' : 'medium'} />
                                        </button>
                                    )}
                                    <button 
                                        className="action-button delete"
                                        style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(user.id);
                                        }}
                                    >
                                        <DeleteIcon fontSize={isMobile ? 'small' : 'medium'} />
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
                    <Box className="users-actions" sx={{ flexDirection: isMobile ? 'column' : 'row' }}>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDeleteSelected}
                            className="delete-selected-button"
                            fullWidth={isMobile}
                        >
                            {t('users.deleteSelected')} ({selectedUsers.length})
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={cancelSelection}
                            className="cancel-selection-button"
                            fullWidth={isMobile}
                            sx={{ mt: isMobile ? 1 : 0 }}
                        >
                            {t('users.cancelSelection')}
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Box className="users-header">
                    <Typography variant="h4" component="h1" sx={{ fontSize: isMobile ? '1.75rem' : '2.25rem' }}>
                        <span className="users-count">{filteredUsers.length}</span> {t('users.title')}
                    </Typography>
                    <Box className="users-actions" sx={{ 
                        flexDirection: isMobile ? 'column' : 'row',
                        width: isMobile ? '100%' : 'auto',
                        gap: isMobile ? 1 : 2,
                        mt: isMobile ? 2 : 0
                    }}>
                        <div className="search-container" style={{ width: isMobile ? '100%' : 'auto' }}>
                            <SearchIcon className="search-icon" />
                            <InputBase
                                placeholder={t('users.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-field"
                                fullWidth
                            />
                        </div>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: isMobile ? 'space-between' : 'flex-start',
                            mt: isMobile ? 1 : 0
                        }}>
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
                            
                            {!isMobile && (
                                <Button
                                    variant="contained"
                                    startIcon={<FileDownloadIcon />}
                                    onClick={() => handleExport('csv')}
                                    className="export-button"
                                >
                                    {t('users.export')}
                                </Button>
                            )}
                        </Box>
                        
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setEditingUser(null);
                                setNewUser(emptyUser);
                                setOpenDialog(true);
                            }}
                            className="create-button"
                            fullWidth={isMobile}
                            sx={{ mt: isMobile ? 1 : 0 }}
                        >
                            {t('users.create')}
                        </Button>
                        
                        {isMobile && (
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={() => handleExport('csv')}
                                className="export-button-mobile"
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                {t('users.export')}
                            </Button>
                        )}
                    </Box>
                </Box>
            )}
        </>
    );

    // Modifier le rendu de la grille pour un design plus moderne
    const renderUserGrid = () => (
        <Grid container spacing={isMobile ? 2 : 3}>
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
                        sx={{ height: '100%' }}
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
                                p: isMobile ? 2 : 3,
                                height: '100%'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Avatar
                                sx={{
                                    width: isMobile ? 70 : 90,
                                    height: isMobile ? 70 : 90,
                                    mb: 2,
                                    bgcolor: getAvatarColor(user.id),
                                    fontSize: isMobile ? '1.4rem' : '1.8rem',
                                    fontWeight: 'bold'
                                }}
                                className="user-card-avatar"
                            >
                                {getInitials(user.firstName, user.lastName)}
                            </Avatar>
                            <Typography 
                                variant="h6" 
                                className="card-user-name"
                                sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                            >
                                {user.fullName}
                            </Typography>
                            <Typography 
                                variant="body2" 
                                className="card-user-profile"
                                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                            >
                                {user.profile ? user.profile.name : 'No Profile'}
                            </Typography>
                            
                            <Chip
                                label={t(`users.status${(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}`)}
                                className={`status-badge ${user.status}`}
                                sx={{ 
                                    mb: 2, 
                                    mt: 2,
                                    height: isMobile ? '24px' : '32px',
                                    fontSize: isMobile ? '0.65rem' : '0.8rem',
                                    '& .MuiChip-label': {
                                        px: isMobile ? 1 : 2
                                    }
                                }}
                            />
                            
                            <Box sx={{ 
                                width: '100%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: 1, 
                                mt: 1,
                                flex: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }} className="card-user-email">
                                    <EmailIcon sx={{ fontSize: isMobile ? 16 : 18, mr: 1 }} />
                                    <Typography variant="body2" sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                                        {user.email}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }} className="card-user-phone">
                                    <PhoneIcon sx={{ fontSize: isMobile ? 16 : 18, mr: 1 }} />
                                    <Typography variant="body2" sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                                        {user.phone || '(Not provided)'}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box className="card-actions" sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                gap: isMobile ? 1 : 2, 
                                mt: 3, 
                                width: '100%',
                                position: 'relative',
                                p: isMobile ? 1 : 2
                            }}>
                                <IconButton
                                    onClick={() => handleEdit(user.id)}
                                    className="action-button edit"
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <EditIcon fontSize={isMobile ? "small" : "medium"} />
                                </IconButton>
                                {user.status?.toLowerCase() === 'active' && (
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleUserStatus(user.id, user.status);
                                        }}
                                        className="action-button block"
                                        size={isMobile ? "small" : "medium"}
                                    >
                                        <LockPersonIcon fontSize={isMobile ? "small" : "medium"} />
                                    </IconButton>
                                )}
                                {user.status?.toLowerCase() === 'blocked' && (
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleUserStatus(user.id, user.status);
                                        }}
                                        className="action-button unblock"
                                        size={isMobile ? "small" : "medium"}
                                    >
                                        <LockOpenIcon fontSize={isMobile ? "small" : "medium"} />
                                    </IconButton>
                                )}
                                <IconButton
                                    onClick={() => handleDelete(user.id)}
                                    className="action-button delete"
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Box className={`users-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'} ${isMobile ? 'mobile-view' : ''}`}>
            {renderHeader()}

            <Collapse in={showFilters}>
                <Paper sx={{ p: isMobile ? 2 : 3, mb: 3, borderRadius: '16px' }} className="filters-panel">
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200, flexGrow: 1 }}>
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
                        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200, flexGrow: 1 }}>
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
                fullScreen={isMobile}
                className="user-dialog"
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '24px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle className="dialog-title" sx={{ 
                    background: isMobile ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : undefined,
                    color: isMobile ? 'white' : undefined,
                    padding: isMobile ? '20px 24px' : undefined,
                    position: 'relative'
                }}>
                    {editingUser !== null ? t('users.edit', 'Edit User') : t('users.create', 'Create User')}
                    {isMobile && (
                        <IconButton
                            aria-label="close"
                            onClick={handleCancel}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 12,
                                color: 'white'
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent className="dialog-content" sx={{ padding: isMobile ? '20px 24px' : undefined }}>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Box sx={{ mb: isMobile ? 3 : 0 }}>
                            <FormControl 
                                fullWidth
                                margin={isMobile ? "dense" : "normal"}
                                sx={{ mb: isMobile ? 2 : 0 }}
                            >
                                <InputLabel id="profile-label">{t('users.profile', 'Profile')}</InputLabel>
                                <Select
                                    labelId="profile-label"
                                    name="profileId"
                                    value={newUser.profileId || ''}
                                    onChange={handleInputChange}
                                    label={t('users.profile', 'Profile')}
                                    sx={{
                                        borderRadius: isMobile ? '10px' : undefined,
                                        backgroundColor: isMobile ? 'white' : undefined,
                                        '& .MuiSelect-icon': { color: isMobile ? '#6366f1' : undefined }
                                    }}
                                >
                                    <MenuItem value="">{t('users.selectProfile', 'Select Profile')}</MenuItem>
                                    {profiles.map((profile) => (
                                        <MenuItem key={profile.id} value={profile.id.toString()}>
                                            {profile.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl 
                                fullWidth 
                                margin={isMobile ? "dense" : "normal"}
                            >
                                <InputLabel id="status-label">{t('users.status', 'Status')}</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={newUser.status}
                                    onChange={handleInputChange}
                                    label={t('users.status', 'Status')}
                                    sx={{
                                        borderRadius: isMobile ? '10px' : undefined,
                                        backgroundColor: isMobile ? 'white' : undefined,
                                        '& .MuiSelect-icon': { color: isMobile ? '#6366f1' : undefined }
                                    }}
                                >
                                    <MenuItem value="active">{t('users.statusActive', 'Active')}</MenuItem>
                                    <MenuItem value="inactive">{t('users.statusInactive', 'Inactive')}</MenuItem>
                                    <MenuItem value="blocked">{t('users.statusBlocked', 'Blocked')}</MenuItem>
                                    <MenuItem value="suspended">{t('users.statusSuspended', 'Suspended')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Divider sx={{ my: isMobile ? 3 : 2, display: isMobile ? 'block' : 'none' }} />

                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: isMobile ? 0 : 2 }}>
                            <TextField
                                fullWidth
                                label={t('users.firstName', 'First Name')}
                                name="firstName"
                                value={newUser.firstName}
                                onChange={handleInputChange}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                                required
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined,
                                    mb: 2
                                }}
                            />
                        </Box>

                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: 0 }}>
                            <TextField
                                fullWidth
                                label={t('users.lastName', 'Last Name')}
                                name="lastName"
                                value={newUser.lastName}
                                onChange={handleInputChange}
                                error={!!formErrors.lastName}
                                helperText={formErrors.lastName}
                                required
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined,
                                    mb: 2
                                }}
                            />
                        </Box>

                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: 0 }}>
                            <TextField
                                fullWidth
                                label={t('users.email', 'Email')}
                                type="email"
                                name="email"
                                value={newUser.email}
                                onChange={handleInputChange}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                required
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined,
                                    mb: 2
                                }}
                            />
                        </Box>

                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: 0 }}>
                            <TextField
                                fullWidth
                                label={t('users.phone', 'Phone')}
                                name="phone"
                                value={newUser.phone}
                                onChange={handleInputChange}
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined,
                                    mb: 2
                                }}
                            />
                        </Box>

                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: 0 }}>
                            <TextField
                                fullWidth
                                label={t('users.password', 'Password')}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={newUser.password}
                                onChange={handleInputChange}
                                error={!!formErrors.password}
                                helperText={formErrors.password}
                                required={!editingUser}
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size={isMobile ? "small" : "medium"}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined,
                                    mb: 2
                                }}
                            />
                        </Box>
                        
                        <Box className="form-row" sx={{ flexDirection: isMobile ? 'column' : 'row', mt: 0 }}>
                            <TextField
                                fullWidth
                                label={t('users.confirmPassword', 'Confirm Password')}
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={newUser.confirmPassword}
                                onChange={handleInputChange}
                                error={!!formErrors.confirmPassword}
                                helperText={formErrors.confirmPassword}
                                required={!editingUser}
                                className="form-field"
                                margin={isMobile ? "dense" : "normal"}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle confirm password visibility"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                                size={isMobile ? "small" : "medium"}
                                            >
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    borderRadius: isMobile ? '10px' : undefined,
                                    backgroundColor: isMobile ? 'white' : undefined
                                }}
                            />
                        </Box>

                        <Box className="password-rules-container" sx={{ 
                            mt: 3,
                            border: isMobile ? 'none' : undefined,
                            boxShadow: isMobile ? 'none' : undefined,
                            padding: isMobile ? '16px' : undefined,
                            backgroundColor: isMobile ? '#F9FAFB' : undefined,
                            borderRadius: isMobile ? '10px' : undefined
                        }}>
                            <Box className="password-rules-header" sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <LockOutlined sx={{ fontSize: 18 }} />
                                <Typography sx={{ fontWeight: 600 }}>
                                    {t('security.passwordRules.help', 'Please ensure your password meets the following requirements:')}
                                </Typography>
                            </Box>
                            <Box component="ul" className="password-rules-list" sx={{
                                listStyle: isMobile ? 'none' : undefined,
                                pl: isMobile ? 0 : undefined,
                                mt: isMobile ? 2 : undefined
                            }}>
                                {passwordRules.minLength > 0 && (
                                    <li style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        color: '#4B5563'
                                    }}>
                                        <Box 
                                            component="span" 
                                            sx={{ 
                                                mr: 1, 
                                                color: '#6366F1',
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6366F1'
                                            }}
                                        ></Box>
                                        {t('security.passwordRules.minLengthInfo', { length: passwordRules.minLength }, `Password must be at least ${passwordRules.minLength} characters long`)}
                                    </li>
                                )}
                                {passwordRules.requireLowercase && (
                                    <li style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        color: '#4B5563'
                                    }}>
                                        <Box 
                                            component="span" 
                                            sx={{ 
                                                mr: 1, 
                                                color: '#6366F1',
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6366F1'
                                            }}
                                        ></Box>
                                        {t('security.passwordRules.lowercaseInfo', 'Password must contain at least one lowercase letter')}
                                    </li>
                                )}
                                {passwordRules.requireNumbers && (
                                    <li style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        color: '#4B5563'
                                    }}>
                                        <Box 
                                            component="span" 
                                            sx={{ 
                                                mr: 1, 
                                                color: '#6366F1',
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6366F1'
                                            }}
                                        ></Box>
                                        {t('security.passwordRules.numberInfo', 'Password must contain at least one number')}
                                    </li>
                                )}
                                {passwordRules.requireUppercase && (
                                    <li style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        color: '#4B5563'
                                    }}>
                                        <Box 
                                            component="span" 
                                            sx={{ 
                                                mr: 1, 
                                                color: '#6366F1',
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6366F1'
                                            }}
                                        ></Box>
                                        {t('security.passwordRules.uppercaseInfo', 'Password must contain at least one uppercase letter')}
                                    </li>
                                )}
                                {passwordRules.requireSpecialChars && (
                                    <li style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        color: '#4B5563'
                                    }}>
                                        <Box 
                                            component="span" 
                                            sx={{ 
                                                mr: 1, 
                                                color: '#6366F1',
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6366F1'
                                            }}
                                        ></Box>
                                        {t('security.passwordRules.specialInfo', 'Password must contain at least one special character')}
                                    </li>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="dialog-actions" sx={{ 
                    flexDirection: isMobile ? 'column-reverse' : 'row',
                    padding: isMobile ? '16px 24px 32px' : undefined,
                    backgroundColor: isMobile ? 'white' : undefined
                }}>
                    <Button 
                        onClick={handleCancel} 
                        startIcon={<CloseIcon />} 
                        className="cancel-button"
                        fullWidth={isMobile}
                        sx={{ 
                            mt: isMobile ? 1 : 0,
                            borderRadius: isMobile ? '8px' : undefined,
                            border: isMobile ? '1px solid #D1D5DB' : undefined,
                            color: isMobile ? '#6B7280' : undefined
                        }}
                        variant="outlined"
                    >
                        {t('users.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        startIcon={<SaveIcon />}
                        className="create-button"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: isMobile ? '8px' : undefined,
                            background: isMobile ? 'linear-gradient(45deg, #4338ca 0%, #6d28d9 100%)' : undefined
                        }}
                    >
                        {editingUser !== null ? t('users.save', 'Save') : t('users.create', 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={singleDeleteDialog} 
                onClose={cancelSingleDelete}
                aria-labelledby="single-delete-dialog-title"
                aria-describedby="single-delete-dialog-description"
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    className: "delete-confirm-dialog",
                    style: {
                        borderRadius: isMobile ? 0 : '20px',
                        overflow: 'hidden'
                    }
                }}
                BackdropProps={{
                    style: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }
                }}
            >
                <Box className="delete-dialog-header" sx={{ 
                    background: isMobile ? '#FEE2E2' : undefined,
                    padding: isMobile ? '20px 24px' : undefined,
                    position: 'relative'
                }}>
                    {isMobile ? (
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ 
                                width: 50, 
                                height: 50, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                marginRight: '12px'
                            }}>
                                <DeleteIcon sx={{ color: '#EF4444' }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#B91C1C' }}>
                                {t('users.deleteTitle', 'Delete User')}
                            </Typography>
                            <IconButton
                                aria-label="close"
                                onClick={cancelSingleDelete}
                                sx={{
                                    position: 'absolute',
                                    right: -5,
                                    top: -5,
                                    color: '#B91C1C'
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    ) : (
                        <>
                            <div className="delete-dialog-icon">
                                <DeleteIcon />
                            </div>
                            <Typography variant="h6" className="delete-dialog-title">
                                {t('users.deleteTitle', 'Delete User')}
                            </Typography>
                        </>
                    )}
                </Box>
                
                <DialogContent className="delete-dialog-content" sx={{ padding: isMobile ? '24px' : undefined }}>
                    <Typography className="delete-dialog-description" sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                        {t('users.deleteConfirmMessage', 'Are you sure you want to delete the user')} {userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}?
                    </Typography>
                    <Typography variant="body2" className="delete-dialog-warning" sx={{ 
                        fontSize: isMobile ? '0.85rem' : undefined,
                        marginTop: isMobile ? '16px' : undefined,
                        backgroundColor: isMobile ? '#FEF2F2' : undefined,
                        padding: isMobile ? '12px' : undefined,
                        borderLeft: isMobile ? '3px solid #EF4444' : undefined
                    }}>
                        {t('users.deleteWarning', 'This action cannot be undone. All data associated with this user will be permanently removed.')}
                    </Typography>
                </DialogContent>
                
                <DialogActions className="delete-dialog-actions" sx={{ 
                    flexDirection: isMobile ? 'column-reverse' : 'row',
                    padding: isMobile ? '16px 24px 24px' : undefined
                }}>
                    <Button 
                        onClick={cancelSingleDelete} 
                        variant="outlined"
                        className="delete-dialog-cancel-button"
                        fullWidth={isMobile}
                        sx={{ 
                            mt: isMobile ? 1 : 0,
                            color: isMobile ? '#6B7280' : undefined,
                            borderColor: isMobile ? '#E5E7EB' : undefined
                        }}
                    >
                        {t('users.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={confirmSingleDelete} 
                        variant="contained"
                        color="error"
                        className="delete-dialog-confirm-button"
                        fullWidth={isMobile}
                        sx={{
                            backgroundColor: isMobile ? '#EF4444' : undefined,
                            borderRadius: isMobile ? '8px' : undefined
                        }}
                    >
                        {t('users.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={openDeleteDialog} 
                onClose={() => setOpenDeleteDialog(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                fullWidth
                maxWidth="xs"
                fullScreen={isMobile}
                PaperProps={{
                    className: "delete-confirm-dialog",
                    style: {
                        borderRadius: isMobile ? 0 : '20px',
                        overflow: 'hidden'
                    }
                }}
                BackdropProps={{
                    style: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }
                }}
            >
                <Box className="delete-dialog-header" sx={{ 
                    background: isMobile ? '#FEE2E2' : undefined,
                    padding: isMobile ? '20px 24px' : undefined,
                    position: 'relative'
                }}>
                    {isMobile ? (
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ 
                                width: 50, 
                                height: 50, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                marginRight: '12px'
                            }}>
                                <DeleteIcon sx={{ color: '#EF4444' }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#B91C1C' }}>
                                {t('users.confirmDeleteMultiple', 'Delete Selected Users')}
                            </Typography>
                            <IconButton
                                aria-label="close"
                                onClick={() => setOpenDeleteDialog(false)}
                                sx={{
                                    position: 'absolute',
                                    right: -5,
                                    top: -5,
                                    color: '#B91C1C'
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    ) : (
                        <>
                            <div className="delete-dialog-icon">
                                <DeleteIcon />
                            </div>
                            <Typography variant="h6" className="delete-dialog-title">
                                {t('users.confirmDeleteMultiple', 'Delete Selected Users')}
                            </Typography>
                        </>
                    )}
                </Box>
                
                <DialogContent className="delete-dialog-content" sx={{ padding: isMobile ? '24px' : undefined }}>
                    <Typography className="delete-dialog-description" sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                        {t('users.confirmDeleteMultipleDesc', { count: selectedUsers.length }, `Are you sure you want to delete ${selectedUsers.length} selected users?`)}
                    </Typography>
                    <Typography variant="body2" className="delete-dialog-warning" sx={{ 
                        fontSize: isMobile ? '0.85rem' : undefined,
                        marginTop: isMobile ? '16px' : undefined,
                        backgroundColor: isMobile ? '#FEF2F2' : undefined,
                        padding: isMobile ? '12px' : undefined,
                        borderLeft: isMobile ? '3px solid #EF4444' : undefined
                    }}>
                        {t('users.confirmDeleteWarning', 'This action cannot be undone. All data associated with these users will be permanently removed.')}
                    </Typography>
                </DialogContent>
                
                <DialogActions className="delete-dialog-actions" sx={{ 
                    flexDirection: isMobile ? 'column-reverse' : 'row',
                    padding: isMobile ? '16px 24px 24px' : undefined
                }}>
                    <Button 
                        onClick={() => setOpenDeleteDialog(false)} 
                        variant="outlined"
                        className="delete-dialog-cancel-button"
                        fullWidth={isMobile}
                        sx={{ 
                            mt: isMobile ? 1 : 0,
                            color: isMobile ? '#6B7280' : undefined,
                            borderColor: isMobile ? '#E5E7EB' : undefined
                        }}
                    >
                        {t('users.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={confirmDeleteSelected} 
                        variant="contained"
                        color="error"
                        className="delete-dialog-confirm-button"
                        fullWidth={isMobile}
                        sx={{
                            backgroundColor: isMobile ? '#EF4444' : undefined,
                            borderRadius: isMobile ? '8px' : undefined
                        }}
                    >
                        {t('users.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Users);