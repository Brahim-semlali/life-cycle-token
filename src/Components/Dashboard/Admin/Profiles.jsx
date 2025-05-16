import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../../context/AuthContext";
import { 
  getAllProfiles, 
  createProfile, 
  updateProfile, 
  deleteProfile,
  initializeProfiles,
  loadModulesAndMenus,
  convertModulesToApiFormat,
  getUsersByProfileId
} from "../../../services/ProfileService";
import userService from '../../../services/UserService';
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Card,
  CardHeader,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  ListItemAvatar,
  ListItemSecondaryAction,
  InputBase,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Fade,
  Tab,
  Tabs,
  CircularProgress,
  Slide,
  Badge,
  Switch,
  Radio,
  RadioGroup,
  Backdrop,
  Autocomplete
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ViewModule as GridViewIcon,
  List as ListIcon,
  MoreVert as MoreVertIcon,
  // Ajout des nouvelles icônes pour les modules
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  VerifiedUser as CertificateIcon,
  Token as TokenIcon,
  People as ClientsIcon,
  Settings as SettingsIcon,
  PersonAdd as UsersIcon,
  Inventory as DistributionIcon,
  Dns as ServersIcon,
  MonitorHeart as MonitoringIcon,
  Business as ManagementIcon,
  Assignment as ContractsIcon,
  CreditCard as BillingIcon,
  FilterList as FilterListIcon,
  Check as CheckIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  ArrowDownward as ArrowDownwardIcon,
  Details as DetailsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  MoreHoriz as MoreHorizIcon,
  Close as CloseIcon,
  Storage as DatabaseIcon,
  Dashboard as DashboardIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  PersonOutline as PersonOutlineIcon,
  Timeline as TimelineIcon,
  // Add these new imports for the dashboard view
  CalendarToday as CalendarTodayIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  ViewModule as ViewModuleIcon,
  Description as DescriptionIcon,
  Extension as ExtensionIcon,
  SearchOff as SearchOffIcon
} from '@mui/icons-material';
import "./Profiles.css";

// Composant moderne pour les status badges
const StatusBadge = ({ status }) => {
  const colors = {
    active: { bg: '#10b981', text: '#ffffff', shadow: 'rgba(16, 185, 129, 0.35)' },
    inactive: { bg: '#ef4444', text: '#ffffff', shadow: 'rgba(239, 68, 68, 0.35)' },
    pending: { bg: '#f59e0b', text: '#ffffff', shadow: 'rgba(245, 158, 11, 0.35)' },
    default: { bg: '#6b7280', text: '#ffffff', shadow: 'rgba(107, 114, 128, 0.35)' }
  };
  
  const statusKey = (status || 'default').toLowerCase();
  const color = colors[statusKey] || colors.default;
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.025em',
        backgroundColor: color.bg,
        color: color.text,
        boxShadow: `0 3px 8px ${color.shadow}`,
        textTransform: 'capitalize',
      }}
    >
      <Box
        component="span"
        sx={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          marginRight: '8px',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.4)'
        }}
      />
      {status || 'Unknown'}
    </Box>
  );
};

// Composant moderne pour les modules
const ModuleChip = ({ moduleTitle, moduleCode, selected }) => {
  let color = '#4f46e5';
  let bgColor = 'rgba(79, 70, 229, 0.08)';
  let borderColor = 'rgba(79, 70, 229, 0.3)';
  
  // Différentes couleurs selon le module
  if (moduleCode?.includes('admin')) {
    color = '#7c3aed';
    bgColor = 'rgba(124, 58, 237, 0.08)';
    borderColor = 'rgba(124, 58, 237, 0.3)';
  } else if (moduleCode?.includes('token')) {
    color = '#06b6d4';
    bgColor = 'rgba(6, 182, 212, 0.08)';
    borderColor = 'rgba(6, 182, 212, 0.3)';
  } else if (moduleCode?.includes('client')) {
    color = '#10b981';
    bgColor = 'rgba(16, 185, 129, 0.08)';
    borderColor = 'rgba(16, 185, 129, 0.3)';
  }
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: selected ? `${bgColor}` : 'transparent',
        color: color,
        border: `1px solid ${selected ? borderColor : 'transparent'}`,
        marginRight: '6px',
        marginBottom: '6px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: bgColor,
          transform: 'translateY(-2px)',
          boxShadow: `0 3px 8px rgba(0, 0, 0, 0.08)`
        }
      }}
    >
      {moduleTitle}
    </Box>
  );
};

const Profiles = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const { checkModuleAccess } = useAuth();
    
    const [profiles, setProfiles] = useState([]);
    const [editingProfile, setEditingProfile] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modules, setModules] = useState([]);
    const [menus, setMenus] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // Changé de 'dashboard' à 'list'
    const [searchQuery, setSearchQuery] = useState('');
    // Ajout des états pour le filtrage
    const [statusFilter, setStatusFilter] = useState('all');
    const [moduleFilter, setModuleFilter] = useState('all');
    // Add state for users associated with profiles
    const [users, setUsers] = useState([]);
    
    // État pour afficher les détails d'un profil
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // État pour la structure des modules (remplaçant useMemo)
    const [moduleStructureState, setModuleStructureState] = useState({
        administration: {
            title: t('modules.administration.title'),
            subModules: {
                profiles: t('modules.administration.profiles'),
                users: t('modules.administration.users'),
                security: t('modules.administration.security')
            }
        },
        issuerTSP: {
            title: t('modules.issuerTSP.title'),
            subModules: {
                certificates: t('modules.issuerTSP.certificates'),
                validation: t('modules.issuerTSP.validation'),
                settings: t('modules.issuerTSP.settings')
            }
        },
        tokenManager: {
            title: t('modules.tokenManager.title'),
            subModules: {
                tokens: t('modules.tokenManager.tokens'),
                distribution: t('modules.tokenManager.distribution'),
                monitoring: t('modules.tokenManager.monitoring')
            }
        },
        clients: {
            title: t('modules.clients.title'),
            subModules: {
                management: t('modules.clients.management'),
                contracts: t('modules.clients.contracts'),
                billing: t('modules.clients.billing')
            }
        }
    });
    
    // Structure initiale des modules (sera utilisée pour réinitialiser le formulaire)
    const initialModuleState = useMemo(() => {
        const initial = {};
        Object.keys(moduleStructureState).forEach(moduleKey => {
            initial[moduleKey] = {
                access: false,
                subModules: {}
            };
            
            Object.keys(moduleStructureState[moduleKey].subModules || {}).forEach(subModuleKey => {
                initial[moduleKey].subModules[subModuleKey] = false;
            });
        });
        return initial;
    }, [moduleStructureState]);
    
    const [newProfile, setNewProfile] = useState({
        name: "",
        description: "",
        status: "active",
        modules: initialModuleState
    });

    // État pour afficher les détails d'un profil dans un modal simple
    const [profileModal, setProfileModal] = useState(false);
    const [selectedProfileDetails, setSelectedProfileDetails] = useState(null);

    // Ajouter un nouvel état pour la boîte de dialogue de confirmation de suppression
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState(null);

    // État pour stocker les utilisateurs associés au profil sélectionné
    const [profileUsers, setProfileUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Déclaration des gestionnaires d'événements avant leur utilisation
    const handleRowClick = useCallback((params) => {
        const id = params.id;
        setSelectedProfiles(prev => 
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    // Fonction pour gérer le clic sur le bouton d'en-tête
    const handleHeaderCheckboxClick = () => {
        if (selectedProfiles.length === profiles.length) {
            // Si tous les profils sont sélectionnés, désélectionner tous
            setSelectedProfiles([]);
        } else {
            // Sinon, sélectionner tous les profils
            setSelectedProfiles(profiles.map(profile => profile.id));
        }
    };

    // Mémorisation des colonnes
    const columns = useMemo(() => [
        {
            field: 'selection',
            headerName: '',
            width: 65,
            sortable: false,
            filterable: false,
            hideable: false,
            disableColumnMenu: true,
            renderCell: (profile) => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <IconButton
                        className={`selection-button ${selectedProfiles.includes(profile.id) ? 'selected' : ''}`}
                        size="small"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedProfiles.includes(profile.id)) {
                                setSelectedProfiles(prev => prev.filter(id => id !== profile.id));
                            } else {
                                setSelectedProfiles(prev => [...prev, profile.id]);
                            }
                        }}
                        sx={{
                            backgroundColor: selectedProfiles.includes(profile.id) 
                                ? '#4f46e5' 
                                : 'white',
                            border: selectedProfiles.includes(profile.id) 
                                ? '2px solid #4f46e5' 
                                : '2px solid #e5e7eb',
                            color: selectedProfiles.includes(profile.id) 
                                ? 'white' 
                                : '#64748b',
                            '&:hover': {
                                backgroundColor: selectedProfiles.includes(profile.id) 
                                    ? '#4338ca' 
                                    : '#f9fafb',
                                transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            width: '28px',
                            height: '28px'
                        }}
                    >
                        {selectedProfiles.includes(profile.id) ? (
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
                    width: '0%'
                }}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleHeaderCheckboxClick();
                        }}
                        sx={{
                            backgroundColor: profiles.length > 0 && selectedProfiles.length === profiles.length 
                                ? 'rgba(79, 70, 229, 0.1)' 
                                : 'rgba(255, 255, 255, 0.8)',
                            border: selectedProfiles.length > 0 
                                ? '1px solid #4f46e5' 
                                : '1px solid #e5e7eb',
                            color: selectedProfiles.length > 0 
                                ? '#4f46e5' 
                                : '#64748b',
                            padding: '4px',
                            '&:hover': {
                                backgroundColor: selectedProfiles.length === profiles.length 
                                    ? 'rgba(79, 70, 229, 0.2)' 
                                    : 'rgba(255, 255, 255, 0.9)',
                                transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {profiles.length > 0 && selectedProfiles.length === profiles.length ? (
                            <CheckIcon fontSize="small" />
                        ) : selectedProfiles.length > 0 ? (
                            <IndeterminateCheckBoxIcon fontSize="small" />
                        ) : (
                            <AddIcon fontSize="small" />
                        )}
                    </IconButton>
                </Box>
            ),
        },
        { 
            field: 'name', 
            headerName: t('profiles.name'), 
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Box className="name-cell">
                    <Typography variant="subtitle1">{params.value}</Typography>
                </Box>
            )
        },
        { 
            field: 'description', 
            headerName: t('profiles.description'), 
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => (
                <Box className="description-cell">
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        { 
            field: 'modules', 
            headerName: t('profiles.modulesList'), 
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => {
                const profileModules = params.value || [];
                
                // Fusionner avec modules pour obtenir les titres
                let moduleNames = [];
                if (Array.isArray(profileModules) && profileModules.length > 0) {
                    moduleNames = profileModules.map(moduleId => {
                        const module = modules.find(m => m.id === moduleId);
                        return module ? module.title : `Module ${moduleId}`;
                    });
                }
                
                if (moduleNames.length === 0) {
                    return <Typography variant="body2" color="text.secondary">{t('profiles.noModules')}</Typography>;
                }
                
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {moduleNames.slice(0, 3).map((name, index) => (
                            <Chip
                                key={index}
                                label={name}
                                size="small"
                                sx={{ 
                                    backgroundColor: '#ebf5ff', 
                                    color: '#3968d0',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    borderRadius: '6px',
                                    border: '1px solid rgba(57, 104, 208, 0.2)'
                                }}
                            />
                        ))}
                        {moduleNames.length > 3 && (
                            <Chip
                                label={`+${moduleNames.length - 3}`}
                                size="small"
                                sx={{ 
                                    backgroundColor: '#f0f0f0', 
                                    color: '#555555',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    borderRadius: '6px'
                                }}
                            />
                        )}
                    </Box>
                );
            }
        },
        { 
            field: 'menus', 
            headerName: t('profiles.menusList'), 
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => {
                const profileMenus = params.value || [];
                
                // Fusionner avec menus pour obtenir les titres
                let menuNames = [];
                if (Array.isArray(profileMenus) && profileMenus.length > 0) {
                    menuNames = profileMenus.map(menuId => {
                        const menu = menus.find(m => m.id === menuId);
                        return menu ? menu.title : `Menu ${menuId}`;
                    });
                }
                
                if (menuNames.length === 0) {
                    return <Typography variant="body2" color="text.secondary">{t('profiles.noMenus')}</Typography>;
                }
                
                return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {menuNames.slice(0, 3).map((name, index) => (
                            <Chip
                                key={index}
                                label={name}
                                size="small"
                                sx={{ 
                                    backgroundColor: '#f8f0ff', 
                                    color: '#7e3af2',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    borderRadius: '6px',
                                    border: '1px solid rgba(126, 58, 242, 0.2)'
                                }}
                            />
                        ))}
                        {menuNames.length > 3 && (
                            <Chip
                                label={`+${menuNames.length - 3}`}
                                size="small"
                                sx={{ 
                                    backgroundColor: '#f0f0f0', 
                                    color: '#555555',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    borderRadius: '6px'
                                }}
                            />
                        )}
                    </Box>
                );
            }
        },
        { 
            field: 'status', 
            headerName: t('profiles.status'), 
            flex: 0.7,
            minWidth: 120,
            renderCell: (params) => {
                if (!params || !params.value) return null;
                const statusClass = params.value.toLowerCase();

                // Définir des couleurs plus dynamiques selon le statut
                const colors = {
                    active: { bg: '#e6f7ee', color: '#0e9f6e', dot: '#10b981', border: '#8eedc7' },
                    inactive: { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', border: '#fecaca' },
                    suspended: { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b', border: '#fde68a' },
                    pending: { bg: '#e0f2fe', color: '#0284c7', dot: '#38bdf8', border: '#bae6fd' }
                };

                const statusColor = colors[statusClass] || colors.inactive;

                return (
                    <Box className="status-cell" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: statusColor.bg,
                            borderRadius: '20px',
                            padding: '4px 12px',
                            border: `1px solid ${statusColor.border}`,
                            boxShadow: `0 2px 4px rgba(0, 0, 0, 0.05)`
                        }}>
                            <Box component="span" sx={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: statusColor.dot,
                                display: 'inline-block',
                                marginRight: '8px',
                                boxShadow: `0 0 0 2px ${statusColor.border}`
                            }}/>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: statusColor.color,
                                    fontWeight: 600,
                                    fontSize: '0.8rem'
                                }}
                            >
                            {t(`profiles.status.${statusClass}`)}
                            </Typography>
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('profiles.actions'),
            flex: 0.5,
            minWidth: 100,
            getActions: (params) => {
                if (!params || !params.row) return [];
                return [
                    <Tooltip title={t('profiles.edit')} arrow placement="top">
                        <IconButton
                            size="small"
                            className="modern-action-button edit"
                            onClick={() => handleEdit(params.id)}
                            sx={{
                                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                color: '#4f46e5',
                                borderRadius: '8px',
                                padding: '6px',
                                '&:hover': {
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>,
                    <Tooltip title={t('profiles.delete')} arrow placement="top">
                        <IconButton
                            size="small"
                            className="modern-action-button delete"
                            onClick={() => handleDelete(params.id)}
                            sx={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                borderRadius: '8px',
                                padding: '6px',
                                '&:hover': {
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ];
            }
        }
    ], [selectedProfiles, profiles.length, handleRowClick, handleHeaderCheckboxClick, modules, menus, t]);

    // Chargement des profils
    const loadProfiles = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Charger les modules et menus d'abord
            try {
                const moduleMenuData = await loadModulesAndMenus();
                const loadedModules = moduleMenuData.modules || [];
                const loadedMenus = moduleMenuData.menus || [];
                
                // Stocker les modules et menus pour utilisation dans les colonnes
                setModules(loadedModules);
                setMenus(loadedMenus);
                
                // Mettre à jour le moduleStructure avec les données réelles
                if (loadedModules.length > 0) {
                    const updatedModuleStructure = {};
                    loadedModules.forEach(module => {
                        // Normalize the module code to lowercase for consistency
                        const moduleCode = module.code?.toLowerCase() || '';
                        if (moduleCode) {
                            updatedModuleStructure[moduleCode] = {
                                title: module.title,
                                id: module.id,
                                subModules: {}
                            };
                            
                            // Ajouter les menus associés à ce module
                            if (loadedMenus.length > 0) {
                                const moduleMenus = loadedMenus.filter(menu => menu.module === module.id);
                                moduleMenus.forEach(menu => {
                                    // Normalize menu code to lowercase
                                    const menuCode = menu.code?.toLowerCase() || '';
                                    if (menuCode) {
                                        updatedModuleStructure[moduleCode].subModules[menuCode] = menu.title;
                                    }
                                });
                            }
                        }
                    });
                    
                    // Seulement mettre à jour si nous avons trouvé des modules valides
                    if (Object.keys(updatedModuleStructure).length > 0) {
                        setModuleStructureState(updatedModuleStructure);
                        
                        // Initialiser le newProfile avec la structure des modules mise à jour
                        const initialModules = {};
                        Object.keys(updatedModuleStructure).forEach(moduleKey => {
                            initialModules[moduleKey] = {
                                access: false,
                                subModules: {}
                            };
                            
                            Object.keys(updatedModuleStructure[moduleKey].subModules || {}).forEach(subModuleKey => {
                                initialModules[moduleKey].subModules[subModuleKey] = false;
                            });
                        });
                        
                        setNewProfile(prev => ({
                            ...prev,
                            modules: initialModules
                        }));
                    }
                }
            } catch (moduleError) {
                console.error('Erreur lors du chargement des modules et menus:', moduleError);
                setError(prev => prev || 'Erreur lors du chargement des modules');
            }
            
            // Charger les profils
            const loadedProfiles = await initializeProfiles();
            if (Array.isArray(loadedProfiles)) {
                setProfiles(loadedProfiles.map(profile => ({
                    ...profile,
                    id: profile.id || `profile-${Date.now()}-${Math.random()}`
                })));
            } else {
                console.error('Les profils chargés ne sont pas un tableau:', loadedProfiles);
                setProfiles([]);
                setError('Erreur de format des données de profil');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des profils:', error);
            setProfiles([]);
            setError('Impossible de charger les profils depuis la base de données');
        } finally {
            setLoading(false);
        }
    };

    // Add function to load users
    const loadUsers = async () => {
        try {
            const allUsers = await userService.getAllUsers();
            const processedUsers = allUsers.map(user => {
                // Extract profileId from different possible sources
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
                
                return {
                    ...user,
                    id: user.id || user.email,
                    profileId: profileId
                };
            });
            
            setUsers(processedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await loadProfiles();
                await loadUsers();  // Load users after profiles
            } catch (err) {
                console.error("Error loading data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const validateForm = (profile) => {
        const errors = {};
        
        // Vérifier si le nom est rempli et bien traité
        console.log("Validating profile:", profile);
        console.log("Profile name:", profile.name, "Length:", profile.name ? profile.name.length : 0);
        
        if (!profile || !profile.name || profile.name.trim() === '') {
            errors.name = t('profiles.nameRequired');
        }
        
        // Vérifier les modules seulement si le nom est valide 
        // (pour éviter plusieurs erreurs à la fois)
        if (!errors.name) {
            const modulesValid = profile.modules && typeof profile.modules === 'object';
            const hasAnyAccess = modulesValid && Object.values(profile.modules).some(module => 
                module && (module.access || Object.values(module.subModules || {}).some(access => access))
        );
        
        if (!hasAnyAccess) {
            errors.modules = t('profiles.moduleRequired');
            }
        }

        return errors;
    };

    // Optimisation des gestionnaires d'événements avec useCallback
    const handleModuleChange = useCallback((moduleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
        // Check if the module exists before accessing it
        if (!profileToUpdate.modules[moduleName]) {
            profileToUpdate.modules[moduleName] = {
                access: false,
                subModules: {}
            };
        }
        
        profileToUpdate.modules[moduleName] = {
            ...profileToUpdate.modules[moduleName],
            access: isChecked,
            subModules: Object.keys(profileToUpdate.modules[moduleName]?.subModules || {}).reduce((acc, key) => ({
                ...acc,
                [key]: isChecked
            }), {})
        };

        if (editingProfile !== null) {
            const updatedProfiles = [...profiles];
            updatedProfiles[editingProfile] = profileToUpdate;
            setProfiles(updatedProfiles);
        } else {
            setNewProfile(profileToUpdate);
        }

        if (formErrors.modules) {
            setFormErrors({...formErrors, modules: ''});
        }
    }, [editingProfile, profiles, formErrors]);

    const handleSubModuleChange = useCallback((moduleName, subModuleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
        // Check if the module exists before accessing it
        if (!profileToUpdate.modules[moduleName]) {
            profileToUpdate.modules[moduleName] = {
                access: false,
                subModules: {}
            };
        }
        
        // Ensure subModules exists
        if (!profileToUpdate.modules[moduleName].subModules) {
            profileToUpdate.modules[moduleName].subModules = {};
        }
        
        const updatedSubModules = {
            ...profileToUpdate.modules[moduleName].subModules,
            [subModuleName]: isChecked
        };

        const anySubModuleEnabled = Object.values(updatedSubModules).some(value => value);

        profileToUpdate.modules[moduleName] = {
            ...profileToUpdate.modules[moduleName],
            access: anySubModuleEnabled,
            subModules: updatedSubModules
        };

        if (editingProfile !== null) {
            const updatedProfiles = [...profiles];
            updatedProfiles[editingProfile] = profileToUpdate;
            setProfiles(updatedProfiles);
        } else {
            setNewProfile(profileToUpdate);
        }

        if (formErrors.modules) {
            setFormErrors({...formErrors, modules: ''});
        }
    }, [editingProfile, profiles, formErrors]);

    // Ajouter un ref pour stocker la valeur du nom directement
    const nameInputRef = React.useRef('');
    // Ajouter un ref pour la description
    const descriptionInputRef = React.useRef('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Créer une copie du profil à sauvegarder avec la valeur actuelle du input
        const profileToSave = {
            ...(editingProfile !== null ? profiles[editingProfile] : newProfile),
            // Utiliser la valeur du ref pour le nom et la description
            name: nameInputRef.current || newProfile.name || '',
            description: descriptionInputRef.current || newProfile.description || ''
        };
        
        // S'assurer que les données du formulaire sont à jour
        console.log("Submitting profile with forced values:", profileToSave);
        
        // Validation du formulaire
        const errors = validateForm(profileToSave);
        if (Object.keys(errors).length > 0) {
            console.log("Form validation errors:", errors);
            setFormErrors(errors);
            return;
        }

        try {
            // Convertir les modules et sous-modules en format API
            const { modules: moduleIds, menus: menuIds } = convertModulesToApiFormat(profileToSave.modules);
            
            const apiProfile = {
                name: profileToSave.name,
                title: profileToSave.name,
                description: profileToSave.description || '',
                code: profileToSave.code || `PROF_${Date.now()}`,
                modules: moduleIds,
                menus: menuIds
            };

            console.log("Sending to API:", apiProfile);

            let success = false;

        if (editingProfile !== null) {
                apiProfile.id = profileToSave.id;
                const updated = await updateProfile(apiProfile.id, apiProfile);
            if (updated) {
                    // Assurer que les modules retournés sont bien un tableau
                    if (updated.modules && !Array.isArray(updated.modules)) {
                        updated.modules = [];
                    }
                    
                    setProfiles(prev => {
                        const newProfiles = [...prev];
                        newProfiles[editingProfile] = updated;
                        return newProfiles;
                    });
                setEditingProfile(null);
                    success = true;
            }
        } else {
                const created = await createProfile(apiProfile);
                if (created) {
                    // Assurer que les modules retournés sont bien un tableau
                    if (created.modules && !Array.isArray(created.modules)) {
                        created.modules = [];
                    }
                    
                    setProfiles(prev => [...prev, created]);
                    success = true;
                }
            }
            
            if (success) {
                // Réinitialiser le formulaire
        setNewProfile({
            name: "",
            description: "",
            status: "active",
                    modules: initialModuleState
                });
                nameInputRef.current = '';
                descriptionInputRef.current = '';
        setFormErrors({});
        setOpenDialog(false);
                
                // Recharger les profils pour avoir les données à jour
                loadProfiles();
            } else {
                // Si l'opération a échoué, afficher une erreur
                console.error("Échec de l'opération sur le profil");
            }
        } catch (error) {
            console.error("Erreur lors de la soumission du profil:", error);
        }
    };

    const handleEdit = (id) => {
        const index = profiles.findIndex(p => p.id === id);
        if (index !== -1) {
            const profileToEdit = profiles[index];
            
            // Créer une copie du profil avec les modules et sous-modules correctement initialisés
            const initializedModules = {};
            
            // Parcourir la structure des modules disponibles
            Object.keys(moduleStructureState).forEach(moduleKey => {
                initializedModules[moduleKey] = {
                    access: false,
                    subModules: {}
                };
                
                // Initialiser les sous-modules
                if (moduleStructureState[moduleKey].subModules) {
                    Object.keys(moduleStructureState[moduleKey].subModules).forEach(subModuleKey => {
                        initializedModules[moduleKey].subModules[subModuleKey] = false;
                    });
                }
            });

            // Mettre à jour les valeurs en fonction des modules du profil
            try {
                if (profileToEdit.modules && Array.isArray(profileToEdit.modules)) {
                    profileToEdit.modules.forEach(moduleId => {
                        try {
                            // Si moduleId est un objet
                            if (typeof moduleId === 'object' && moduleId !== null) {
                                const moduleName = moduleId.id || moduleId.name || moduleId.code;
                                if (moduleName && initializedModules[moduleName]) {
                                    initializedModules[moduleName].access = true;
                                }
                                return;
                            }
                            
                            // Si moduleId est une chaîne
                            if (typeof moduleId === 'string') {
                                if (moduleId.includes('.')) {
                                    const [moduleName, subModuleName] = moduleId.split('.');
                                    if (initializedModules[moduleName] && initializedModules[moduleName].subModules) {
                                        initializedModules[moduleName].subModules[subModuleName] = true;
                                        initializedModules[moduleName].access = true;
                                    }
                                } else {
                                    if (initializedModules[moduleId]) {
                                        initializedModules[moduleId].access = true;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Error processing module:', moduleId, err);
                        }
                    });
                }
            } catch (err) {
                console.error('Error processing modules:', err);
            }

            // Mettre à jour le profil avec les modules initialisés
            const updatedProfile = {
                ...profileToEdit,
                modules: initializedModules
            };

            setEditingProfile(index);
            setNewProfile(updatedProfile);
            setOpenDialog(true);
        }
    };

    // Modifier la fonction handleDelete pour ouvrir la boîte de dialogue de confirmation
    const handleDelete = (id) => {
            const index = profiles.findIndex(p => p.id === id);
        if (index !== -1) {
            setProfileToDelete(profiles[index]);
            setDeleteConfirmDialog(true);
        }
    };

    // Ajouter une nouvelle fonction pour confirmer la suppression
    const confirmDelete = () => {
        if (profileToDelete && profileToDelete.id) {
            // Suppression d'un seul profil
            if (deleteProfile(profileToDelete.id)) {
                const updatedProfiles = profiles.filter(p => p.id !== profileToDelete.id);
                setProfiles(updatedProfiles);
                
                // Vérifier si le profil en cours d'édition est celui qui est supprimé
                if (editingProfile !== null && profiles[editingProfile]?.id === profileToDelete.id) {
                    setEditingProfile(null);
                    setNewProfile({
                        name: "",
                        description: "",
                        status: "active",
                        modules: initialModuleState
                    });
                }
            }
        } else if (selectedProfiles.length > 0) {
            // Suppression multiple de profils
            let deleteSuccessCount = 0;
            
            selectedProfiles.forEach(id => {
                const success = deleteProfile(id);
                if (success) {
                    deleteSuccessCount++;
                }
            });
            
            // Mettre à jour la liste des profils
            if (deleteSuccessCount > 0) {
                const updatedProfiles = profiles.filter(p => !selectedProfiles.includes(p.id));
                setProfiles(updatedProfiles);
                setSelectedProfiles([]);
            }
        }
        
        // Fermer la boîte de dialogue de confirmation
        setDeleteConfirmDialog(false);
        setProfileToDelete(null);
    };

    // Ajouter un gestionnaire pour annuler la suppression
    const cancelDelete = () => {
        setDeleteConfirmDialog(false);
        setProfileToDelete(null);
    };

    const handleCancel = () => {
        // Reset everything without committing the changes made to the profiles array
        if (editingProfile !== null) {
            // Reload profiles to restore original data
            loadProfiles();
        }
        
        setEditingProfile(null);
        setNewProfile({
            name: "",
            description: "",
            status: "active",
            modules: initialModuleState
        });
        nameInputRef.current = '';
        descriptionInputRef.current = '';
        setFormErrors({});
        setOpenDialog(false);
    };

    // Fonction pour ouvrir le dialogue de détails du profil
    const handleViewDetails = (profile) => {
        setSelectedProfile(profile);
        setDetailsDialog(true);
    };

    // Fonction pour formatter la date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Add handler for view mode toggle
    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Add function to get initials from profile name
    const getInitials = (name) => {
        if (!name) return '';
        const words = name.split(' ');
        if (words.length > 1) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Function to generate avatar color
    const getAvatarColor = (profileId) => {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#d35400', '#34495e'
        ];
        const index = profileId?.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index] || colors[0];
    };

    // Handler for search input
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // Fonction de gestion du changement de filtre de statut
    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    // Fonction de gestion du changement de filtre de module
    const handleModuleFilterChange = (event) => {
        setModuleFilter(event.target.value);
    };

    // Modification du filtrage des profils pour inclure les nouveaux filtres
    const filteredProfiles = useMemo(() => {
        if (!searchQuery.trim() && statusFilter === 'all' && moduleFilter === 'all') return profiles;
        
        return profiles.filter(profile => {
            // Filtrage par recherche
            const matchesSearch = searchQuery.trim() === '' || 
                profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                profile.description?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Filtrage par statut
            const matchesStatus = statusFilter === 'all' || 
                profile.status?.toLowerCase() === statusFilter.toLowerCase();
            
            // Filtrage par module
            let matchesModule = moduleFilter === 'all';
            if (moduleFilter !== 'all' && profile.modules && Array.isArray(profile.modules)) {
                const moduleId = parseInt(moduleFilter, 10);
                matchesModule = profile.modules.includes(moduleId);
            }
            
            return matchesSearch && matchesStatus && matchesModule;
        });
    }, [profiles, searchQuery, statusFilter, moduleFilter]);

    // Fonction pour ouvrir le modal avec les détails du profil
    const handleProfileClick = async (profile, event) => {
        // Don't open the modal if the click is on a button or inside a button element
        if (event) {
            const targetElement = event.target;
            
            // Check if targetElement is an HTML Element that supports closest method
            const hasClosestMethod = targetElement && typeof targetElement.closest === 'function';
            
            // Check if the click is on an edit or delete button
            const isClickOnActionButton = hasClosestMethod && (
                (targetElement.closest('button') || targetElement.closest('.MuiButton-root')) && 
                // Ne pas bloquer le bouton de détails/info
                !targetElement.closest('[data-action="view-details"]') &&
                !targetElement.closest('.MuiButton-startIcon[data-action="view-details"]')
            );
                
            if (
                (targetElement.tagName === 'BUTTON' && !targetElement.hasAttribute('data-action-view-details')) || 
                isClickOnActionButton ||
                // Also check for any element with roles that imply interaction
                (hasClosestMethod && targetElement.getAttribute('role') === 'button' && !targetElement.hasAttribute('data-action-view-details')) ||
                (hasClosestMethod && targetElement.closest('[role="button"]:not([data-action-view-details])')) ||
                // Check for elements inside buttons (sauf pour le bouton de détails)
                (hasClosestMethod && targetElement.closest('.MuiButton-startIcon') && !targetElement.closest('[data-action="view-details"]')) ||
                (hasClosestMethod && targetElement.closest('.MuiButton-endIcon') && !targetElement.closest('[data-action="view-details"]'))
            ) {
                return;
            }
        }
        
        setSelectedProfileDetails(profile);
        setProfileModal(true);
        
        // Récupérer les utilisateurs associés à ce profil
        setLoadingUsers(true);
        try {
            const users = await getUsersByProfileId(profile.id);
            setProfileUsers(users);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs du profil:', error);
            setProfileUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Fonction pour fermer le modal
    const handleCloseProfileModal = () => {
        setProfileModal(false);
        setSelectedProfileDetails(null);
        setProfileUsers([]);
        setLoadingUsers(false);
    };

    // Modification du code où les icônes sont utilisées directement sans leurs alias
    const moduleIcons = {
        // Mapping des modules aux icônes
        administration: <AdminIcon sx={{ color: '#5786c1', fontSize: '1.5rem' }} />,
        issuerTSP: <CertificateIcon sx={{ color: '#10b981', fontSize: '1.5rem' }} />,
        tokenManager: <TokenIcon sx={{ color: '#f97316', fontSize: '1.5rem' }} />,
        clients: <ClientsIcon sx={{ color: '#6366f1', fontSize: '1.5rem' }} />,
        // Sous-modules
        profiles: <AdminIcon sx={{ color: '#5786c1', fontSize: '1.2rem' }} />,
        users: <UsersIcon sx={{ color: '#5786c1', fontSize: '1.2rem' }} />,
        security: <SecurityIcon sx={{ color: '#5786c1', fontSize: '1.2rem' }} />,
        certificates: <CertificateIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />,
        validation: <CertificateIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />,
        settings: <SettingsIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />,
        tokens: <TokenIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />,
        distribution: <DistributionIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />,
        monitoring: <MonitoringIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />,
        management: <ManagementIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />,
        contracts: <ContractsIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />,
        billing: <BillingIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />,
    };

    // Fonction pour obtenir l'icône d'un module
    const getModuleIcon = (moduleKey) => {
        return moduleIcons[moduleKey.toLowerCase()] || <AdminIcon sx={{ color: '#5786c1', fontSize: '1.5rem' }} />;
    };

    // Refs pour la navigation
    const detailsSectionRef = useRef(null);
    const modulesSectionRef = useRef(null);
    const [activeNavItem, setActiveNavItem] = useState('details');
    const formScrollRef = useRef(null);
    
    // Fonction pour gérer le défilement vers une section
    const scrollToSection = (sectionRef, navId) => {
        if (sectionRef && sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
            setActiveNavItem(navId);
        }
    };
    
    // Fonction pour détecter quelle section est visible
    const handleFormScroll = () => {
        if (!formScrollRef.current) return;
        
        const detailsPosition = detailsSectionRef.current?.getBoundingClientRect().top;
        const modulesPosition = modulesSectionRef.current?.getBoundingClientRect().top;
        
        const scrollPosition = formScrollRef.current.scrollTop;
        
        if (modulesPosition && modulesPosition <= 100) {
            setActiveNavItem('modules');
        } else {
            setActiveNavItem('details');
        }
    };
    
    // Fonction pour descendre au bas du formulaire
    const scrollToBottom = () => {
        if (formScrollRef.current) {
            formScrollRef.current.scrollTo({
                top: formScrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Add a function to count users by profile
    const getUserCountByProfile = (profileId) => {
        const profileUsers = users.filter(user => user.profileId === profileId);
        return profileUsers.length;
    };
    
    // Add a function to get module display names
    const getModuleDisplayName = (moduleId) => {
        const module = modules.find(m => m.id === moduleId);
        return module ? module.title : moduleId;
    };
    
    // Add new function to render dashboard view
    const renderDashboardView = () => (
        <div className="dashboard-view">
            {filteredProfiles.length === 0 ? (
                <Box className="no-results-container" sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 5
                }}>
                    <Box className="no-results-icon">
                        <SearchOffIcon sx={{ fontSize: 60 }} />
                    </Box>
                    <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>No profiles found</Typography>
                    <Typography sx={{ mt: 1, color: 'text.secondary' }}>Try adjusting your search or filters</Typography>
                </Box>
            ) : (
                filteredProfiles.map((profile, index) => (
                    <div 
                        className="dashboard-profile-item" 
                        key={profile.id} 
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="dashboard-profile-header">
                            <div className="dashboard-profile-avatar">
                                {getInitials(profile.name)}
                            </div>
                            <div className="dashboard-profile-info">
                                <h3 className="dashboard-profile-name">{profile.name}</h3>
                                <div 
                                    className={`dashboard-profile-status ${profile.status ? profile.status.toLowerCase() : 'inactive'}`}
                                >
                                    {profile.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1).toLowerCase() : 'Inactive'}
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedProfiles.includes(profile.id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    const newSelected = selectedProfiles.includes(profile.id)
                                        ? selectedProfiles.filter(id => id !== profile.id)
                                        : [...selectedProfiles, profile.id];
                                    setSelectedProfiles(newSelected);
                                }}
                                size="small"
                                edge="end"
                            />
                        </div>
                        
                        <div className="dashboard-profile-content">
                            <div className="dashboard-profile-section">
                                <div className="dashboard-profile-section-title">
                                    <DescriptionIcon fontSize="small" /> Description
                                </div>
                                <div className="dashboard-profile-description">
                                    {profile.description || 'No description provided.'}
                                </div>
                            </div>
                            
                            <div className="dashboard-profile-section">
                                <div className="dashboard-profile-section-title">
                                    <ExtensionIcon fontSize="small" /> Modules
                                </div>
                                <div className="dashboard-profile-modules">
                                    {profile.modules && profile.modules.length > 0 ? (
                                        profile.modules.slice(0, 4).map(moduleId => (
                                            <span className="dashboard-profile-module" key={moduleId}>
                                                {getModuleDisplayName(moduleId)}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            No modules assigned
                                        </span>
                                    )}
                                    {profile.modules && profile.modules.length > 4 && (
                                        <span className="dashboard-profile-module">
                                            +{profile.modules.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="dashboard-profile-stats">
                                <div className="dashboard-profile-stat">
                                    <span className="dashboard-profile-stat-value">{getUserCountByProfile(profile.id)}</span>
                                    <span className="dashboard-profile-stat-label">Users</span>
                                </div>
                                <div className="dashboard-profile-stat">
                                    <span className="dashboard-profile-stat-value">{profile.permissions?.length || 0}</span>
                                    <span className="dashboard-profile-stat-label">Permissions</span>
                                </div>
                                <div className="dashboard-profile-stat">
                                    <span className="dashboard-profile-stat-value">{profile.modules?.length || 0}</span>
                                    <span className="dashboard-profile-stat-label">Modules</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="dashboard-profile-actions">
                            <button 
                                className="dashboard-profile-btn primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleProfileClick(profile, { target: { dataset: { action: 'view-details' }}});
                                }}
                                data-action="view-details"
                            >
                                <InfoIcon fontSize="small" /> View
                            </button>
                            <button 
                                className="dashboard-profile-btn primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(profile.id);
                                }}
                            >
                                <EditIcon fontSize="small" /> Edit
                            </button>
                            <button 
                                className="dashboard-profile-btn secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(profile.id);
                                }}
                            >
                                <DeleteIcon fontSize="small" /> Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <Box className={`profiles-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
            sx={{
                padding: '2rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginLeft: isMinimized ? '5rem' : '250px',
                width: isMinimized ? 'calc(100% - 5rem)' : 'calc(100% - 250px)',
                minHeight: '100vh',
                position: 'absolute',
                top: 0,
                right: 0,
                overflowY: 'auto',
                backgroundColor: '#f5f7ff',
                color: '#6b7a99',
                '@media (max-width: 768px)': {
                    marginLeft: '0',
                    width: '100%',
                    padding: '1.5rem'
                }
            }}
        >
            <Box className="profiles-header" sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(229, 231, 235, 0.7)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.09)',
                    transform: 'translateY(-2px)'
                }
            }}>
                <Typography variant="h4" component="h1" sx={{
                    background: selectedProfiles.length > 0 
                        ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' 
                        : 'linear-gradient(90deg, #3968d0 0%, #4f46e5 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 700,
                    fontSize: '24px'
                }}>
                    {selectedProfiles.length > 0 
                        ? `${selectedProfiles.length} ${t('profiles.selected')}` 
                        : t('profiles.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Zone de recherche et filtres */}
                    {selectedProfiles.length === 0 && (
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            {/* Barre de recherche existante */}
                    <Box sx={{ 
                        display: 'flex', 
                                alignItems: 'center',
                                position: 'relative',
                                width: '220px'
                            }}>
                                <Box sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(229, 231, 235, 0.8)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '0',
                                    height: '42px',
                                    width: '100%',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                        transform: 'translateY(-2px)',
                                        borderColor: 'rgba(99, 102, 241, 0.3)'
                                    }
                                }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 12px',
                                        color: '#9ca3af'
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </Box>
                                    <InputBase
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        sx={{
                                            flex: 1,
                                            fontSize: '0.875rem',
                                            color: '#4b5563',
                                            '& input': {
                                                padding: '8px 8px 8px 0'
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Filtre par statut */}
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id="status-filter-label" sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    label="Status"
                                    sx={{ 
                                        fontSize: '0.875rem',
                                        height: '42px',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 231, 235, 0.8)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(99, 102, 241, 0.3)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#6366f1'
                                        },
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                    startAdornment={
                                        <FilterListIcon sx={{ color: '#9ca3af', mr: 0.5, fontSize: '1.1rem' }} />
                                    }
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="active">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box 
                                                component="span" 
                                                sx={{ 
                                                    width: 8, 
                                                    height: 8, 
                                                    borderRadius: '50%', 
                                                    bgcolor: '#10b981',
                                                    display: 'inline-block'
                                                }}
                                            />
                                            Active
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="inactive">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box 
                                                component="span" 
                                                sx={{ 
                                                    width: 8, 
                                                    height: 8, 
                                                    borderRadius: '50%', 
                                                    bgcolor: '#ef4444',
                                                    display: 'inline-block'
                                                }}
                                            />
                                            Inactive
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            
                            {/* Filtre par module */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id="module-filter-label" sx={{ fontSize: '0.875rem' }}>Module</InputLabel>
                                <Select
                                    labelId="module-filter-label"
                                    id="module-filter"
                                    value={moduleFilter}
                                    onChange={handleModuleFilterChange}
                                    label="Module"
                                    sx={{ 
                                        fontSize: '0.875rem',
                                        height: '42px',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 231, 235, 0.8)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(99, 102, 241, 0.3)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#6366f1'
                                        },
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                    startAdornment={
                                        <FilterListIcon sx={{ color: '#9ca3af', mr: 0.5, fontSize: '1.1rem' }} />
                                    }
                                >
                                    <MenuItem value="all">All Modules</MenuItem>
                                    <Divider sx={{ my: 0.5 }} />
                                    {modules.map(module => (
                                        <MenuItem key={module.id} value={module.id.toString()}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getModuleIcon(module.code?.toLowerCase() || '')}
                                                <Typography variant="body2">
                                                    {module.title}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    )}

                    {/* Custom view selector buttons */}
                    {selectedProfiles.length === 0 && (
                        <Box 
                            className="view-selector"
                            sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(244, 244, 248, 0.7)',
                                backdropFilter: 'blur(5px)',
                                borderRadius: '12px',
                                padding: '4px',
                                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                                position: 'relative',
                                border: '1px solid rgba(229, 231, 235, 0.7)'
                            }}
                        >
                        <Button
                                className={`view-button ${viewMode === 'dashboard' ? 'active' : ''}`}
                                onClick={() => setViewMode('dashboard')}
                                sx={{
                                    minWidth: 'unset',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: '8px',
                                    color: viewMode === 'dashboard' ? 'white' : '#64748b',
                                    bgcolor: viewMode === 'dashboard' ? 'primary.main' : 'transparent',
                                    '&:hover': {
                                        bgcolor: viewMode === 'dashboard' ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ViewModuleIcon fontSize="small" />
                            </Button>
                        <Button
                                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                sx={{
                                    minWidth: 'unset',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: '8px',
                                    color: viewMode === 'list' ? 'white' : '#64748b',
                                    bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                                    '&:hover': {
                                        bgcolor: viewMode === 'list' ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ListIcon fontSize="small" />
                            </Button>
                    </Box>
                    )}
                    
                    {selectedProfiles.length > 0 ? (
                        <>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                    setProfileToDelete({
                                        name: `${selectedProfiles.length} ${t('profiles.profilesText')}`
                                    });
                                    setDeleteConfirmDialog(true);
                                }}
                                sx={{
                                    background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 1,
                                    px: 2.5,
                                    fontSize: '0.875rem',
                                    minHeight: '42px',
                                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                                        boxShadow: '0 6px 15px rgba(239, 68, 68, 0.35)',
                                        transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                        >
                            {t('profiles.deleteSelected')} ({selectedProfiles.length})
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setSelectedProfiles([])}
                                startIcon={<CancelIcon sx={{ fontSize: '1rem' }} />}
                                sx={{
                                    borderColor: 'rgba(226, 232, 240, 0.8)',
                                    color: '#4a5568',
                                    borderRadius: '12px',
                                    height: '42px',
                                    px: 2,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    textTransform: 'none',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    '&:hover': {
                                        borderColor: '#cbd5e0',
                                        backgroundColor: 'rgba(74, 85, 104, 0.04)',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                        transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('profiles.cancelSelection')}
                            </Button>
                        </>
                    ) : (
                    <Button
                        variant="contained"
                        onClick={() => {
                            setEditingProfile(null);
                            setNewProfile({
                                name: "",
                                description: "",
                                status: "active",
                                modules: initialModuleState
                            });
                            setOpenDialog(true);
                        }}
                        className="create-button"
                        sx={{
                            background: 'linear-gradient(45deg, #7c3aed 0%, #8b5cf6 100%)',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            minHeight: '42px',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                            textTransform: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                                opacity: 0,
                                transition: 'opacity 0.3s ease'
                            },
                            '&:hover': {
                                background: 'linear-gradient(45deg, #6d28d9 0%, #7c3aed 100%)',
                                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
                                transform: 'translateY(-2px)'
                            },
                            '&:hover::after': {
                                opacity: 1
                            }
                        }}
                    >
                        <Box component="span" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.75
                        }}>
                            <AddIcon />
                            Create Profile
                        </Box>
                    </Button>
                    )}
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px',
                    flexDirection: 'column',
                    gap: 2 
                }}>
                    <CircularProgress size={40} sx={{ color: '#4f46e5' }} />
                    <Typography variant="body1" sx={{ color: '#6b7280' }}>Loading profiles...</Typography>
                </Box>
            ) : error ? (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px',
                    padding: '24px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '16px',
                    margin: '20px 0'
                }}>
                    <Typography variant="h6" color="error" gutterBottom fontWeight={600}>
                        {error}
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '20px', textAlign: 'center', color: '#64748b' }}>
                        Please check your database connection and API endpoints.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={loadProfiles}
                        startIcon={<RefreshIcon />}
                        sx={{
                            background: 'linear-gradient(45deg, #4f46e5 0%, #7c3aed 100%)',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 500,
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #4338ca 0%, #6d28d9 100%)',
                                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        Retry
                    </Button>
                </Box>
            ) : filteredProfiles.length === 0 ? (
                <Box className="modern-empty-state">
                    <Box className="modern-empty-state-icon">
                        <SearchIcon sx={{ fontSize: 48, color: '#94a3b8' }} />
                    </Box>
                    <Typography variant="h5" className="modern-empty-state-title" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                        No profiles found
                    </Typography>
                    <Typography variant="body1" className="modern-empty-state-text" sx={{ color: '#64748b', mb: 3, textAlign: 'center', maxWidth: '500px' }}>
                        {searchQuery 
                            ? 'No profiles match your search criteria. Try adjusting your filters or search term.' 
                            : 'There are no profiles available. Create a new profile to get started.'}
                    </Typography>
                    {!searchQuery && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setEditingProfile(null);
                                setNewProfile({
                                    name: "",
                                    description: "",
                                    status: "active",
                                    modules: initialModuleState
                                });
                                setOpenDialog(true);
                            }}
                            sx={{
                                background: 'linear-gradient(45deg, #4f46e5 0%, #7c3aed 100%)',
                                borderRadius: '12px',
                                padding: '10px 24px',
                                height: '48px',
                                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #4338ca 0%, #6d28d9 100%)',
                                    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                            startIcon={<AddIcon />}
                        >
                            Create your first profile
                        </Button>
                    )}
                </Box>
            ) : viewMode === 'dashboard' ? (
                renderDashboardView()
            ) : (
                <Box className="modern-table-container" sx={{ 
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    backgroundColor: 'white'
                }}>
                    <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ 
                                    padding: '16px 20px', 
                                    textAlign: 'left', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.875rem',
                                    position: 'relative'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={filteredProfiles.length > 0 && selectedProfiles.length === filteredProfiles.length}
                                            indeterminate={selectedProfiles.length > 0 && selectedProfiles.length < filteredProfiles.length}
                                            onChange={handleHeaderCheckboxClick}
                                            size="small"
                                            sx={{
                                                color: '#94a3b8',
                                                '&.Mui-checked': {
                                                    color: '#4f46e5',
                                                },
                                                '&.MuiCheckbox-indeterminate': {
                                                    color: '#4f46e5',
                                                },
                                            }}
                                        />
                                        Profile
                                    </Box>
                                </th>
                                <th style={{ 
                                    padding: '16px 20px', 
                                    textAlign: 'left', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.875rem'
                                }}>Description</th>
                                <th style={{ 
                                    padding: '16px 20px', 
                                    textAlign: 'left', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.875rem'
                                }}>Modules</th>
                                <th style={{ 
                                    padding: '16px 20px', 
                                    textAlign: 'left', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.875rem'
                                }}>Status</th>
                                <th style={{ 
                                    padding: '16px 20px', 
                                    textAlign: 'center', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.875rem',
                                    width: '140px'
                                }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.map((profile) => (
                                <tr 
                                    key={profile.id}
                                    onClick={(e) => handleProfileClick(profile, e)}
                                    style={{ 
                                        cursor: 'pointer',
                                        backgroundColor: selectedProfiles.includes(profile.id) ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                    className="profile-row"
                                >
                                    <td style={{ 
                                        padding: '16px 20px', 
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                                        fontSize: '0.875rem',
                                        color: '#334155'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Checkbox
                                                checked={selectedProfiles.includes(profile.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (selectedProfiles.includes(profile.id)) {
                                                        setSelectedProfiles(prev => prev.filter(id => id !== profile.id));
                                                    } else {
                                                        setSelectedProfiles(prev => [...prev, profile.id]);
                                                    }
                                                }}
                                                size="small"
                                                sx={{
                                                    color: '#94a3b8',
                                                    '&.Mui-checked': {
                                                        color: '#4f46e5',
                                                    },
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Avatar
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: getAvatarColor(profile.id),
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {getInitials(profile.name)}
                                            </Avatar>
                                            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                                {profile.name}
                                            </Typography>
                                        </Box>
                                    </td>
                                    <td style={{ 
                                        padding: '16px 20px', 
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                                        fontSize: '0.875rem',
                                        color: '#64748b'
                                    }}>
                                        <Typography 
                                            variant="body2" 
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                maxWidth: '250px'
                                            }}
                                        >
                                            {profile.description || 'No description'}
                                        </Typography>
                                    </td>
                                    <td style={{ 
                                        padding: '16px 20px', 
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {profile.modules?.slice(0, 2).map(moduleId => {
                                                const module = modules.find(m => m.id === moduleId);
                                                return module ? (
                                                    <Chip
                                                        key={module.id}
                                                        label={module.title}
                                                        size="small"
                                                        sx={{ 
                                                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                            color: '#4f46e5',
                                                            fontWeight: 500,
                                                            borderRadius: '6px',
                                                            height: '24px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                ) : null;
                                            })}
                                            {profile.modules?.length > 2 && (
                                                <Chip
                                                    label={`+${profile.modules.length - 2}`}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: 'rgba(148, 163, 184, 0.1)',
                                                        color: '#64748b',
                                                        fontWeight: 500,
                                                        borderRadius: '6px',
                                                        height: '24px',
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            )}
                                            {(!profile.modules || profile.modules.length === 0) && (
                                                <Typography variant="body2" color="text.secondary">
                                                    No modules
                                                </Typography>
                                            )}
                                        </Box>
                                    </td>
                                    <td style={{ 
                                        padding: '16px 20px', 
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <StatusBadge status={profile.status} />
                                    </td>
                                    <td style={{ 
                                        padding: '16px 20px', 
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                                        textAlign: 'center'
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                            <Tooltip title={t('profiles.viewDetails')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProfileClick(profile, e);
                                                    }}
                                                    data-action="view-details"
                                                    sx={{ 
                                                        color: '#4f46e5',
                                                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                                        width: '32px',
                                                        height: '32px',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(79, 70, 229, 0.2)',
                                                            transform: 'scale(1.05)'
                                                        }
                                                    }}
                                                >
                                                    <InfoIcon fontSize="small" data-action="view-details" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('profiles.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(profile.id);
                                                    }}
                                                    sx={{ 
                                                        color: '#3b82f6',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                        width: '32px',
                                                        height: '32px',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                            transform: 'scale(1.05)'
                                                        }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('profiles.delete')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(profile.id);
                                                    }}
                                                    sx={{ 
                                                        color: '#ef4444',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        width: '32px',
                                                        height: '32px',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                            transform: 'scale(1.05)'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            )}

            {/* Dialogue pour éditer un profil */}
            <Dialog 
                open={openDialog} 
                onClose={handleCancel} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                    }
                }}
                TransitionComponent={Slide}
                TransitionProps={{ direction: 'up' }}
            >
                <Box className="modern-profile-form-header">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                background: 'linear-gradient(45deg, #7c3aed 0%, #4f46e5 100%)',
                                width: 40,
                                height: 40,
                                mr: 2
                            }}
                        >
                            {editingProfile !== null ? <EditIcon /> : <AddIcon />}
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                            {editingProfile !== null ? t('profiles.editProfile', 'Edit Profile') : t('profiles.createProfile', 'Create Profile')}
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={handleCancel} 
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.3)',
                                transform: 'rotate(90deg)',
                                transition: 'transform 0.3s ease'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <Tabs
                    value={activeNavItem}
                    onChange={(e, newValue) => {
                        setActiveNavItem(newValue);
                        scrollToSection(newValue === 'details' ? detailsSectionRef : modulesSectionRef, newValue);
                    }}
                    variant="fullWidth"
                    className="modern-form-tabs"
                    sx={{
                        background: '#f8fafc',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        mb: 2
                    }}
                >
                    <Tab 
                        value="details" 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DetailsIcon fontSize="small" />
                                <span>Details</span>
                            </Box>
                        }
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                    <Tab 
                        value="modules" 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SecurityIcon fontSize="small" />
                                <span>Modules & Permissions</span>
                            </Box>
                        }
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                </Tabs>
                
                <Box 
                    className="modern-form-content" 
                    ref={formScrollRef}
                    onScroll={handleFormScroll}
                    sx={{
                        maxHeight: 'calc(100vh - 240px)',
                        overflowY: 'auto',
                        px: 3,
                        py: 2
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <Box className="modern-form-section" ref={detailsSectionRef}>
                            <Typography variant="h6" className="modern-section-title" 
                                sx={{ 
                                    mb: 3, 
                                    color: '#1e293b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    '&::before': {
                                        content: '""',
                                        display: 'block',
                                        width: '4px',
                                        height: '20px',
                                        backgroundColor: '#4f46e5',
                                        borderRadius: '2px',
                                        marginRight: '12px'
                                    }
                                }}
                            >
                                Profile Information
                            </Typography>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box className="modern-form-field">
                                        <Typography 
                                            component="label" 
                                            htmlFor="profile-name"
                                            sx={{ 
                                                mb: 1, 
                                                display: 'block',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                color: '#4b5563'
                                            }}
                                        >
                                    Profile Name
                                            <Box component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Box>
                                        </Typography>
                                        <TextField
                                            id="profile-name"
                                            variant="outlined"
                                            fullWidth
                                    value={editingProfile !== null ? profiles[editingProfile]?.name || '' : newProfile.name || ''}
                            onChange={(e) => {
                                        nameInputRef.current = e.target.value;
                                        if (editingProfile !== null) {
                                            // Use a temporary copy to avoid modifying the real data until save is clicked
                                            const tempProfile = { ...profiles[editingProfile], name: e.target.value };
                                            const updatedProfiles = [...profiles];
                                            updatedProfiles[editingProfile] = tempProfile;
                                            setProfiles(updatedProfiles);
                                        } else {
                                            setNewProfile({ ...newProfile, name: e.target.value });
                                        }
                                        // Effacer l'erreur si le champ n'est plus vide
                                        if (e.target.value.trim() !== '' && formErrors.name) {
                                            setFormErrors({ ...formErrors, name: '' });
                                        }
                                    }}
                                    placeholder="Enter profile name"
                                            error={!!formErrors.name}
                                            helperText={formErrors.name}
                                            InputProps={{
                                                sx: {
                                                    borderRadius: '10px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(226, 232, 240, 0.8)'
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#cbd5e1'
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#4f46e5'
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Box className="modern-form-field">
                                        <Typography 
                                            component="label" 
                                            htmlFor="profile-description"
                                            sx={{ 
                                                mb: 1, 
                                                display: 'block',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                color: '#4b5563'
                                            }}
                                        >
                                            Description
                                        </Typography>
                                        <TextField
                                            id="profile-description"
                                            variant="outlined"
                                            fullWidth
                                            multiline
                                            rows={3}
                                    value={editingProfile !== null ? profiles[editingProfile]?.description || '' : newProfile.description || ''}
                                onChange={(e) => {
                                        descriptionInputRef.current = e.target.value;
                                        if (editingProfile !== null) {
                                            // Use a temporary copy to avoid modifying the real data until save is clicked
                                            const tempProfile = { ...profiles[editingProfile], description: e.target.value };
                                            const updatedProfiles = [...profiles];
                                            updatedProfiles[editingProfile] = tempProfile;
                                            setProfiles(updatedProfiles);
                                        } else {
                                            setNewProfile({ ...newProfile, description: e.target.value });
                                        }
                                    }}
                                            placeholder="Describe the profile's purpose and permissions"
                                            InputProps={{
                                                sx: {
                                                    borderRadius: '10px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(226, 232, 240, 0.8)'
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#cbd5e1'
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#4f46e5'
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Box className="modern-form-field">
                                        <Typography 
                                            component="label"
                                            sx={{ 
                                                mb: 1, 
                                                display: 'block',
                                                fontWeight: 500,
                                                fontSize: '0.875rem',
                                                color: '#4b5563'
                                            }}
                                        >
                                            Status
                                        </Typography>
                                        <RadioGroup 
                                            row
                                            value={editingProfile !== null ? profiles[editingProfile]?.status || 'active' : newProfile.status || 'active'}
                                            onChange={(e) => {
                                                const status = e.target.value;
                                                if (editingProfile !== null) {
                                                    // Instead of modifying the profiles array directly, create a temporary copy
                                                    // This does not affect the real data unless saved
                                                    const tempProfile = { ...profiles[editingProfile], status };
                                                    const updatedProfiles = [...profiles];
                                                    updatedProfiles[editingProfile] = tempProfile;
                                                    setProfiles(updatedProfiles);
                                                } else {
                                                    setNewProfile({ ...newProfile, status });
                                                }
                                            }}
                                        >
                                            <FormControlLabel 
                                                value="active" 
                                                control={<Radio color="primary" />} 
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                backgroundColor: '#10b981',
                                                                mr: 1
                                                            }}
                                                        />
                                                        Active
                                                    </Box>
                                                }
                                                sx={{ mr: 3 }}
                                            />
                                            <FormControlLabel 
                                                value="inactive" 
                                                control={<Radio color="error" />} 
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                backgroundColor: '#ef4444',
                                                                mr: 1
                                                            }}
                                                        />
                                                        Inactive
                                                    </Box>
                                                }
                                            />
                                        </RadioGroup>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                        
                        <Box className="modern-form-section" ref={modulesSectionRef} sx={{ mt: 4 }}>
                            <Typography variant="h6" className="modern-section-title" 
                                sx={{ 
                                    mb: 3, 
                                    color: '#1e293b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    '&::before': {
                                        content: '""',
                                        display: 'block',
                                        width: '4px',
                                        height: '20px',
                                        backgroundColor: '#4f46e5',
                                        borderRadius: '2px',
                                        marginRight: '12px'
                                    }
                                }}
                            >
                                Modules and Permissions
                            </Typography>
                            
                        {formErrors.modules && (
                                <Box sx={{ 
                                    p: 2, 
                                    mb: 3, 
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    color: '#dc2626',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <CloseIcon fontSize="small" />
                                    {formErrors.modules}
                                </Box>
                            )}
                            
                            <Grid container spacing={3}>
                                {Object.keys(moduleStructureState).map(moduleName => {
                                    const module = moduleStructureState[moduleName];
                                    const profileData = editingProfile !== null ? profiles[editingProfile] : newProfile;
                                    const moduleAccess = profileData?.modules?.[moduleName]?.access || false;
                                    
                                    return (
                                        <Grid item xs={12} md={6} key={moduleName}>
                                            <Card 
                                                elevation={0} 
                                                sx={{ 
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                                    height: '100%',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                                                        transform: 'translateY(-4px)'
                                                    }
                                                }}
                                                className={moduleAccess ? 'module-card-active' : ''}
                                            >
                                                <CardHeader
                                                    avatar={
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: moduleAccess ? '#4f46e5' : 'rgba(79, 70, 229, 0.1)',
                                                                color: moduleAccess ? '#fff' : '#4f46e5',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            {getModuleIcon(moduleName)}
                                                        </Avatar>
                                                    }
                                                    title={
                                                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                                            {module.title}
                                                        </Typography>
                                                    }
                                                    action={
                                                        <Switch
                                                        checked={moduleAccess}
                                                onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                                                            color="primary"
                                                            inputProps={{ 'aria-label': 'module toggle' }}
                                                        />
                                                    }
                                                    sx={{
                                                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                                        backgroundColor: moduleAccess ? 'rgba(79, 70, 229, 0.05)' : 'transparent'
                                                    }}
                                                />
                                                <CardContent sx={{ p: 0 }}>
                                                    <List disablePadding>
                                                    {Object.keys(module.subModules || {}).map(subModuleName => {
                                                        const subModuleChecked = profileData?.modules?.[moduleName]?.subModules?.[subModuleName] || false;
                                                        
                                                        return (
                                                                <ListItem
                                                                    key={subModuleName}
                                                                    sx={{
                                                                        py: 1,
                                                                        px: 2,
                                                                        borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
                                                                        '&:last-child': {
                                                                            borderBottom: 'none'
                                                                        },
                                                                        backgroundColor: subModuleChecked ? 'rgba(79, 70, 229, 0.05)' : 'transparent'
                                                                    }}
                                                                    secondaryAction={
                                                                        <Checkbox
                                                                            edge="end"
                                                                        checked={subModuleChecked}
                                                                        onChange={(e) => handleSubModuleChange(moduleName, subModuleName, e.target.checked)}
                                                                            disabled={!moduleAccess}
                                                                            color="primary"
                                                                        />
                                                                    }
                                                                >
                                                                    <ListItemText
                                                                        primary={module.subModules[subModuleName]}
                                                                        primaryTypographyProps={{
                                                                            sx: {
                                                                                fontSize: '0.875rem',
                                                                                fontWeight: subModuleChecked ? 600 : 400,
                                                                                color: !moduleAccess ? 'rgba(75, 85, 99, 0.6)' : '#4b5563'
                                                                            }
                                                                        }}
                                                                    />
                                                                </ListItem>
                                                        );
                                                    })}
                                                    </List>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </form>
                </Box>
                
                <Box className="modern-form-actions" sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 2, 
                    p: 3, 
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid rgba(226, 232, 240, 0.8)'
                }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleCancel} 
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: '10px',
                            px: 3,
                            '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderColor: '#ef4444',
                                color: '#ef4444'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit} 
                        sx={{
                            background: 'linear-gradient(45deg, #4f46e5 0%, #7c3aed 100%)',
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: '10px',
                            px: 3,
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #4338ca 0%, #6d28d9 100%)',
                                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                        startIcon={editingProfile !== null ? <SaveIcon /> : <AddIcon />}
                    >
                        {editingProfile !== null ? 'Update Profile' : 'Create Profile'}
                    </Button>
                </Box>
            </Dialog>

            {/* Profile modal */}
            <Dialog
                open={profileModal}
                onClose={handleCloseProfileModal}
                aria-labelledby="profile-dialog-title"
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box className="profile-modal-header">
                        <IconButton 
                            onClick={handleCloseProfileModal}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.3)'
                                }
                }}
            >
                            <CancelIcon />
                        </IconButton>
                        
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                            sx={{
                                width: 80, 
                                height: 80, 
                                bgcolor: getAvatarColor(selectedProfileDetails?.id),
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                mr: 3,
                                boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {getInitials(selectedProfileDetails?.name || '')}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: '600', mb: 1 }}>
                                {selectedProfileDetails?.name || ''}
                            </Typography>
                            <Typography variant="body1">
                                {selectedProfileDetails?.description || ''}
                            </Typography>
                        </Box>
                </Box>
                        
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <Chip
                            label={selectedProfileDetails?.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                            sx={{ 
                                bgcolor: selectedProfileDetails?.status?.toLowerCase() === 'active' 
                                    ? 'rgba(16, 185, 129, 0.2)' 
                                    : 'rgba(239, 68, 68, 0.2)',
                                color: 'white',
                                    fontWeight: '600',
                                mr: 2
                            }}
                        />
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Modules: {selectedProfileDetails?.modules?.length || 0}
                                                    </Typography>
                    </Box>
                </Box>
                
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {selectedProfileDetails?.modules && Array.isArray(selectedProfileDetails.modules) && 
                        modules.filter(m => selectedProfileDetails.modules.includes(m.id)).map(module => {
                            // Filtrer les menus associés à ce module qui sont également dans les menus du profil
                            const moduleMenus = menus.filter(menu => 
                                menu.module === module.id && 
                                selectedProfileDetails.menus && 
                                Array.isArray(selectedProfileDetails.menus) && 
                                selectedProfileDetails.menus.includes(menu.id)
                            );
                                                
                                            return (
                                <Grid item xs={12} sm={6} md={4} key={module.id}>
                                    <Box className="profile-module-card">
                                        <Box className="profile-module-header">
                                            <Box className="module-icon">
                                                {getModuleIcon(module.code?.toLowerCase() || '')}
                                            </Box>
                                            <Typography className="module-title">
                                                {module.title}
                                                        </Typography>
                                                    </Box>
                                        <Box className="profile-module-content">
                                            {moduleMenus.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    {moduleMenus.map(menu => (
                                                        <Box 
                                                                        key={menu.id}
                                                            className="profile-module-menu"
                                                        >
                                                            {menu.title}
                                                        </Box>
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                <Box className="profile-module-empty">
                                                    No menus for this module
                                                            </Box>
                                                                    )}
                                                                </Box>
                                                </Box>
                                </Grid>
                            );
                        })}
                        {(!selectedProfileDetails?.modules || selectedProfileDetails.modules.length === 0) && (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                                    <Typography>No modules assigned to this profile</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                    
                    {/* Profile Users Section */}
                    <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600 }}>
                        Users with this profile
                            </Typography>
                            
                            {loadingUsers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <Typography>Loading users...</Typography>
                                </Box>
                            ) : profileUsers.length > 0 ? (
                        <table className="profile-users-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>EMAIL</th>
                                    <th>PHONE</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profileUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="name-cell">
                                                <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.id) }}>
                                                    {getInitials(user.name || user.email)}
                                                </div>
                                                <div>
                                                    <div className="profile-name">{user.name}</div>
                                                    <div className="profile-title">{user.title || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.phone || 'N/A'}</td>
                                        <td>
                                            <div className={`status-badge ${user.status?.toLowerCase() || 'inactive'}`}>
                                                <span className="status-dot"></span>
                                                {user.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f9fafb', borderRadius: '8px' }}>
                            <Typography color="text.secondary">No users have been assigned to this profile</Typography>
                                </Box>
                            )}
                </DialogContent>
                
                <Box className="profile-modal-actions">
                <Button 
                        onClick={() => handleEdit(selectedProfileDetails?.id)}
                        className="profile-edit-button"
                            startIcon={<EditIcon />}
                        variant="contained"
                        disableElevation
                    >
                        {t('profiles.editProfile', 'Edit Profile')}
                </Button>
                <Button 
                        onClick={handleCloseProfileModal}
                        className="profile-close-button"
                        variant="outlined"
                    >
                        {t('common.close', 'Close')}
                </Button>
                                                            </Box>
            </Dialog>

            {/* Boîte de dialogue de confirmation de suppression */}
            <Dialog
                open={deleteConfirmDialog}
                onClose={cancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                PaperProps={{
                    className: "delete-confirm-dialog",
                    sx: {
                        maxWidth: '400px',
                        width: '100%'
                    }
                }}
            >
                <Box className="delete-dialog-header">
                    <IconButton
                        size="small"
                        className="delete-dialog-icon"
                    >
                        <DeleteIcon />
                    </IconButton>
                    <DialogTitle id="delete-dialog-title" className="delete-dialog-title">
                        {selectedProfiles.length > 0 
                            ? t('profiles.deleteMultipleTitle', 'Delete Profiles') 
                            : t('profiles.deleteConfirmTitle', 'Delete Profile')}
                    </DialogTitle>
                        </Box>
                
                <DialogContent className="delete-dialog-content">
                    <Typography id="delete-dialog-description" className="delete-dialog-description">
                        {selectedProfiles.length > 0 
                            ? `${t('profiles.deleteMultipleMessage', 'Are you sure you want to delete')} ${selectedProfiles.length} ${t('profiles.selectedProfiles', 'selected profiles')}?` 
                            : `${t('profiles.deleteConfirmMessage', 'Are you sure you want to delete the profile')} ${profileToDelete?.name}?`}
                    </Typography>
                    <Typography variant="body2" className="delete-dialog-warning">
                        {t('profiles.deleteWarning', 'This action cannot be undone. All permissions and settings associated with this profile will be permanently removed.')}
                    </Typography>
                </DialogContent>
                
                <DialogActions className="delete-dialog-actions">
                    <Button 
                        onClick={cancelDelete} 
                        variant="outlined"
                        className="delete-dialog-cancel-button"
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={confirmDelete} 
                        variant="contained"
                        className="delete-dialog-confirm-button"
                    >
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Profiles);
