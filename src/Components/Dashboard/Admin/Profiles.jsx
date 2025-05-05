import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  convertModulesToApiFormat
} from "../../../services/ProfileService";
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
  Fade
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
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
  IndeterminateCheckBox as IndeterminateCheckBoxIcon
} from '@mui/icons-material';
import "./Profiles.css";

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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    // Ajout des états pour le filtrage
    const [statusFilter, setStatusFilter] = useState('all');
    const [moduleFilter, setModuleFilter] = useState('all');
    
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
                        <GridActionsCellItem
                            icon={<EditIcon className="action-icon edit-icon" />}
                            label={t('profiles.edit')}
                            onClick={() => handleEdit(params.id)}
                            className="grid-action-item"
                        />
                    </Tooltip>,
                    <Tooltip title={t('profiles.delete')} arrow placement="top">
                        <GridActionsCellItem
                            icon={<DeleteIcon className="action-icon delete-icon" />}
                            label={t('profiles.delete')}
                            onClick={() => handleDelete(params.id)}
                            className="grid-action-item"
                        />
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

    useEffect(() => {
        loadProfiles();
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
        setEditingProfile(index);
        setNewProfile(profiles[index]);
        setOpenDialog(true);
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
    const handleProfileClick = (profile, event) => {
        // Don't open the modal if the click is on a button or inside a button element
        if (event) {
            const targetElement = event.target;
            // Check if the click is on a button or inside a button
            if (
                targetElement.tagName === 'BUTTON' || 
                targetElement.closest('button') || 
                targetElement.closest('.MuiButton-root') ||
                // Also check for any element with roles that imply interaction
                targetElement.getAttribute('role') === 'button' ||
                targetElement.closest('[role="button"]') ||
                // Check for elements inside buttons
                targetElement.closest('.MuiButton-startIcon') ||
                targetElement.closest('.MuiButton-endIcon')
            ) {
                return;
            }
        }
        
        setSelectedProfileDetails(profile);
        setProfileModal(true);
    };

    // Fonction pour fermer le modal
    const handleCloseProfileModal = () => {
        setProfileModal(false);
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
                backgroundColor: 'white', 
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h4" component="h1" sx={{
                    color: '#3968d0',
                    fontSize: '22px',
                    fontWeight: 600
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
                                    borderRadius: '50px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#f9fafb',
                                    padding: '0',
                                    height: '40px',
                                    width: '100%'
                                }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 12px' 
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                        height: '40px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f9fafb',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#e5e7eb'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#d1d5db'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#6366f1'
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
                                        height: '40px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f9fafb',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#e5e7eb'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#d1d5db'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#6366f1'
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
                                backgroundColor: '#f4f4f8',
                                borderRadius: '30px',
                                padding: '4px',
                                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                                position: 'relative'
                            }}
                        >
                        <Button
                                className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            sx={{
                                    minWidth: '36px',
                                    height: '32px',
                                    padding: '0 12px',
                                    borderRadius: '20px',
                                    backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                                    color: viewMode === 'grid' ? '#7c3aed' : '#64748b',
                                    fontSize: '13px',
                                    fontWeight: viewMode === 'grid' ? 600 : 500,
                                    transition: 'all 0.2s ease',
                                    zIndex: 2,
                                    boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none',
                                '&:hover': {
                                        backgroundColor: viewMode === 'grid' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                            }}
                        >
                                <GridViewIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                <span>Grid</span>
                        </Button>
                        <Button
                                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            sx={{
                                    minWidth: '36px',
                                    height: '32px',
                                    padding: '0 12px',
                                    borderRadius: '20px',
                                    backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                                    color: viewMode === 'list' ? '#7c3aed' : '#64748b',
                                    fontSize: '13px',
                                    fontWeight: viewMode === 'list' ? 600 : 500,
                                    transition: 'all 0.2s ease',
                                    zIndex: 2,
                                    boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none',
                                '&:hover': {
                                        backgroundColor: viewMode === 'list' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                            }}
                        >
                                <ListViewIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                <span>List</span>
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
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    py: 1,
                                    px: 2.5,
                                    fontSize: '0.875rem',
                                    minHeight: '38px',
                                    boxShadow: '0 3px 6px rgba(239, 68, 68, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)',
                                        transform: 'translateY(-1px)'
                                    }
                                }}
                        >
                            {t('profiles.deleteSelected')} ({selectedProfiles.length})
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setSelectedProfiles([])}
                                startIcon={<CancelIcon sx={{ fontSize: '1rem' }} />}
                                sx={{
                                    borderColor: '#e2e8f0',
                                    color: '#4a5568',
                                    '&:hover': {
                                        borderColor: '#cbd5e0',
                                        backgroundColor: 'rgba(74, 85, 104, 0.04)',
                                    },
                                    height: '38px',
                                    px: 2,
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    borderRadius: '6px',
                                    textTransform: 'none'
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
                            background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
                            borderRadius: '24px',
                            padding: '8px 20px',
                            minHeight: '38px',
                            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                            textTransform: 'none',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #6d28d9 0%, #5b21b6 100%)',
                                boxShadow: '0 3px 8px rgba(124, 58, 237, 0.3)',
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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Typography variant="h6">Chargement des profils...</Typography>
                </Box>
            ) : error ? (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px',
                    padding: '20px',
                    backgroundColor: 'rgba(255, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 0, 0, 0.2)',
                    borderRadius: '8px',
                    margin: '20px 0'
                }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '20px', textAlign: 'center' }}>
                        Veuillez vérifier la connexion à la base de données et les endpoints de l'API.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={loadProfiles}
                        sx={{ marginTop: '10px' }}
                    >
                        Réessayer
                    </Button>
                </Box>
            ) : filteredProfiles.length === 0 ? (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    margin: '20px 0'
                }}
                className="no-results-container"
                >
                    <Box className="no-results-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ color: '#6b7280' }}>
                        Aucun profil trouvé
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', color: '#9ca3af' }}>
                        {searchQuery ? 'Aucun profil ne correspond à votre recherche.' : 'Aucun profil disponible.'}
                    </Typography>
                </Box>
            ) : (
                viewMode === 'grid' ? (
                    <Grid container spacing={2.5} sx={{ width: '100%', margin: 0 }}>
                        {filteredProfiles.map(profile => (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={profile.id}>
                                <Box sx={{ position: 'relative' }} className="card-container">
                                    <Box 
                                        sx={{
                                            position: 'absolute', 
                                            top: '-12px', 
                                            right: '-12px', 
                                            zIndex: 5,
                                            opacity: selectedProfiles.includes(profile.id) ? 1 : 0,
                                            transition: 'all 0.3s ease',
                                            transform: selectedProfiles.includes(profile.id) 
                                                ? 'scale(1)' 
                                                : 'scale(0.8)',
                                            '.card-container:hover &': {
                                                opacity: 1,
                                                transform: 'scale(1)'
                                            }
                                        }}
                                    >
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
                                    <Card 
                                        sx={{ 
                                            position: 'relative',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                            border: selectedProfiles.includes(profile.id) 
                                                ? '2px solid #4f46e5' 
                                                : '1px solid rgba(226, 232, 240, 0.7)',
                                            backgroundColor: selectedProfiles.includes(profile.id) 
                                                ? 'rgba(79, 70, 229, 0.03)' 
                                                : 'white',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                            }
                                        }}
                                        className="profile-card"
                                        onClick={(e) => handleProfileClick(profile, e)}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                            p: 3,
                                            flex: 1
                                    }}>
                                        <Avatar
                                            sx={{
                                                    width: 80,
                                                    height: 80,
                                                    mb: 2,
                                                bgcolor: getAvatarColor(profile.id),
                                                    fontSize: '1.8rem',
                                                    fontWeight: 'bold'
                                            }}
                                        >
                                            {getInitials(profile.name)}
                                        </Avatar>
                                            
                                        <Typography variant="h6" sx={{ 
                                                fontWeight: '600', 
                                                mb: 0.5, 
                                            textAlign: 'center',
                                                fontSize: '1.1rem',
                                                color: '#333'
                                        }}>
                                            {profile.name}
                                        </Typography>
                                            
                                        <Typography variant="body2" color="text.secondary" sx={{ 
                                                mb: 1.5,
                                            textAlign: 'center',
                                                fontSize: '0.875rem',
                                                color: '#666',
                                                maxHeight: '42px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                        }}>
                                            {profile.description || t('profiles.noDescription')}
                                        </Typography>
                                    
                                    <Box sx={{ 
                                            width: '100%',
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                            mb: 2
            }}>
                                        <Chip
                                            label={profile.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                                data-status={profile.status?.toLowerCase()}
                                            sx={{
                                                    bgcolor: profile.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fef2f2',
                                                    color: profile.status?.toLowerCase() === 'active' ? '#10b981' : '#ef4444',
                                                    fontWeight: '600',
                                                    py: 0.5,
                                                    px: 1.5,
                                                    height: '24px',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '4px',
                                                    border: profile.status?.toLowerCase() === 'active' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                                            }}
                                        />
                                    </Box>
                                    
                                            <Box sx={{ width: '100%', mb: 3 }}>
                                                <Typography variant="subtitle2" sx={{ 
                                                    fontWeight: '600', 
                                                    mb: 1, 
                                                    fontSize: '0.8rem',
                                                    color: '#666',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                        }}>
                                                    Modules
                                        </Typography>
                                                
                                        <Box sx={{ 
                                            display: 'flex', 
                                            flexWrap: 'wrap', 
                                                gap: 0.75
                                        }}>
                                            {profile.modules && Array.isArray(profile.modules) && profile.modules.length > 0 ? (
                                                profile.modules.map((moduleId, index) => {
                                                        if (index > 2 && profile.modules.length > 3) return null;
                                                    const module = modules.find(m => m.id === moduleId);
                                                    return (
                                                        <Chip
                                                            key={index}
                                                            label={module ? module.title : `Module ${moduleId}`}
                                                            size="small"
                    sx={{
                                                                    bgcolor: '#f5f7fa',
                                                                    color: '#4b5563',
                                                                    fontSize: '0.7rem',
                                                                    height: '22px',
                                                                borderRadius: '4px',
                                                                    my: 0.5,
                                                                    fontWeight: 500,
                                                                    transition: 'all 0.2s ease'
                                                            }}
                                                        />
                                                    );
                                                })
                                            ) : (
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    {t('profiles.noModules')}
                                                </Typography>
                                            )}
                                                {profile.modules && profile.modules.length > 3 && (
                                                <Chip
                                                        label={`+${profile.modules.length - 3}`}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: '#f1f5f9', 
                                                        color: '#64748b',
                                                            fontSize: '0.7rem',
                                                            height: '22px',
                                                        borderRadius: '4px',
                                                            my: 0.5,
                                                            fontWeight: 500
                                                    }}
                                                />
                                            )}
                                                </Box>
                                        </Box>
                                        
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                gap: 2, 
                                                width: '100%', 
                                                mt: 'auto',
                                                position: 'relative',
                                                padding: '12px 16px',
                                                marginTop: '8px',
                                                borderTop: '1px solid rgba(229, 231, 235, 0.5)'
                                            }}>
                                                <Box sx={{ 
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    gap: 2,
                                                    padding: '10px',
                                                    opacity: 0,
                                                    transform: 'translateY(10px)',
                                                    transition: 'all 0.3s ease',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                                                    zIndex: 2,
                                                    '.card-container:hover &': {
                                                        opacity: 1,
                                                        transform: 'translateY(0)'
                                                    }
                                                }} className="action-buttons-container">
                                                    <IconButton
                                                        aria-label="Edit Profile"
                                                onClick={(e) => {
                                                            e.preventDefault();
                                                    e.stopPropagation();
                                                    handleEdit(profile.id);
                                                }}
                                                sx={{
                                                            backgroundColor: '#9333ea',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                            padding: '8px',
                                                    '&:hover': {
                                                                backgroundColor: '#7e22ce',
                                                                boxShadow: '0 4px 8px rgba(147, 51, 234, 0.3)',
                                                                transform: 'translateY(-3px)'
                                                            },
                                                            transition: 'all 0.2s ease'
                                                }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        aria-label="Delete Profile"
                                                onClick={(e) => {
                                                            e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(profile.id);
                                                }}
                                                sx={{
                                                            backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                            padding: '8px',
                                                    '&:hover': {
                                                                backgroundColor: '#dc2626',
                                                                boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)',
                                                                transform: 'translateY(-3px)'
                                                            },
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ 
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    zIndex: 1
                                                }}>
                                                    {t('profiles.clickToView')}
                                                </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)', 
                        border: '1px solid #f0f5ff',
                        background: 'white',
                        width: '100%'
                    }}>
                        <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                            {filteredProfiles.map((profile, index) => (
                                <React.Fragment key={profile.id}>
                                    <ListItem 
                                        alignItems="center" 
                                        sx={{ 
                                            py: 2, 
                                            px: 3,
                                            transition: 'background-color 0.3s',
                                            '&:hover': {
                                                backgroundColor: '#f8fafc'
                                            },
                                            width: '100%',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => handleProfileClick(profile, e)}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            gap: 2 
                                        }}>
                                            {/* Left section with avatar and content */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                <Avatar 
                                                    sx={{ 
                                                        bgcolor: getAvatarColor(profile.id),
                                                        width: 42,
                                                        height: 42,
                                                        fontSize: '0.95rem',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                        mr: 2,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {getInitials(profile.name)}
                                                </Avatar>
                                                
                                                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography variant="body1" sx={{ 
                                                            fontWeight: 600, 
                                                            color: '#333', 
                                                            mr: 1.5,
                                                            fontSize: '0.95rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {profile.name}
                                                        </Typography>
                                                        <Chip
                                                            label={profile.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                                            size="small"
                                                            data-status={profile.status?.toLowerCase()}
                                                            sx={{
                                                                bgcolor: profile.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fef2f2',
                                                                color: profile.status?.toLowerCase() === 'active' ? '#10b981' : '#ef4444',
                                                                fontWeight: '600',
                                                                py: 0.5,
                                                                px: 1.5,
                                                                height: '24px',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '4px',
                                                                border: profile.status?.toLowerCase() === 'active' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                    }}
                />
                                                    </Box>
                                                    
                                                    <Typography variant="body2" color="text.secondary" sx={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#6b7280',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {profile.description || t('profiles.noDescription')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            {/* Right section with modules and action buttons */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                                {/* Modules section */}
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1, 
                                                    minWidth: '180px',
                                                    '@media (max-width: 1200px)': {
                                                        display: 'none'
                                                    }
                                                }}>
                                                    {profile.modules && Array.isArray(profile.modules) && profile.modules.length > 0 ? (
                                                        profile.modules.slice(0, 2).map((moduleId, index) => {
                                                            const module = modules.find(m => m.id === moduleId);
                                                            return (
                                                                <Chip
                                                                    key={index}
                                                                    label={module ? module.title : `Module ${moduleId}`}
                                                                    size="small"
                                                                    sx={{ 
                                                                        backgroundColor: '#eef2ff', 
                                                                        color: '#4f46e5',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 500,
                                                                        height: '22px',
                                                                        borderRadius: '4px',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                                            No modules
                                                        </Typography>
                                                    )}
                                                    {profile.modules && profile.modules.length > 2 && (
                                                        <Chip
                                                            label={`+${profile.modules.length - 2}`}
                                                            size="small"
                                                            sx={{ 
                                                                backgroundColor: '#f1f5f9', 
                                                                color: '#64748b',
                                                                fontSize: '0.7rem',
                                                                height: '22px',
                                                                borderRadius: '4px',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                
                                                {/* Action buttons */}
                                                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                                    <Button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleEdit(profile.id);
                                                        }}
                                                        sx={{
                                                            background: 'linear-gradient(90deg, #9333ea 0%, #7e22ce 100%)',
                                                            color: 'white',
                                                            borderRadius: '6px',
                                                            textTransform: 'none',
                                                            fontWeight: 500,
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.8rem',
                                                            minHeight: '32px',
                                                            minWidth: '90px',
                                                            boxShadow: '0 3px 6px rgba(147, 51, 234, 0.3)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(90deg, #7e22ce 0%, #6b21a8 100%)',
                                                                boxShadow: '0 4px 8px rgba(147, 51, 234, 0.4)',
                                                                transform: 'translateY(-2px)'
                                                            },
                                                            transition: 'all 0.3s ease',
                                                            '@media (max-width: 600px)': {
                                                                minWidth: 'unset',
                                                                width: '36px',
                                                                height: '36px',
                                                                padding: 0,
                                                                justifyContent: 'center'
                                                            }
                                                        }}
                                                        startIcon={<EditIcon sx={{ 
                                                            fontSize: '0.85rem',
                                                            '@media (max-width: 600px)': {
                                                                marginRight: 0
                                                            }
                                                        }} />}
                                                    >
                                                        <Box component="span" sx={{ 
                                                            '@media (max-width: 600px)': { 
                                                                display: 'none' 
                                                            } 
                                                        }}>
                                                            Edit
                                                        </Box>
                                                    </Button>
                                                    <Button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDelete(profile.id);
                                                        }}
                                                        sx={{
                                                            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                                                            color: 'white',
                                                            borderRadius: '6px',
                                                            textTransform: 'none',
                                                            fontWeight: 500,
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.8rem',
                                                            minHeight: '32px',
                                                            minWidth: '90px',
                                                            boxShadow: '0 3px 6px rgba(239, 68, 68, 0.3)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                                                                boxShadow: '0 4px 8px rgba(239, 68, 68, 0.4)',
                                                                transform: 'translateY(-2px)'
                                                            },
                                                            transition: 'all 0.3s ease',
                                                            '@media (max-width: 600px)': {
                                                                minWidth: 'unset',
                                                                width: '36px',
                                                                height: '36px',
                                                                padding: 0,
                                                                justifyContent: 'center'
                                                            }
                                                        }}
                                                        startIcon={<DeleteIcon sx={{ 
                                                            fontSize: '0.85rem',
                                                            '@media (max-width: 600px)': {
                                                                marginRight: 0
                                                            }
                                                        }} />}
                                                    >
                                                        <Box component="span" sx={{ 
                                                            '@media (max-width: 600px)': { 
                                                                display: 'none' 
                                                            } 
                                                        }}>
                                                        Delete
                                                        </Box>
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </ListItem>
                                    {index < filteredProfiles.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
            </Paper>
                )
            )}

            {/* Dialogue pour éditer un profil */}
            <Dialog 
                open={openDialog} 
                onClose={handleCancel} 
                maxWidth="md" 
                fullWidth
                className="profile-dialog"
                TransitionProps={{
                    onEnter: () => {
                        // Initialiser les refs avec les valeurs actuelles
                        if (editingProfile !== null && profiles[editingProfile]) {
                            nameInputRef.current = profiles[editingProfile].name || '';
                            descriptionInputRef.current = profiles[editingProfile].description || '';
                        } else {
                            nameInputRef.current = '';
                            descriptionInputRef.current = '';
                        }
                    }
                }}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        maxHeight: '90vh',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                    className: "profile-form-modal-paper"
                }}
            >
                {/* En-tête du formulaire */}
                <Box sx={{ 
                    height: '80px', 
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    px: 3,
                    color: 'white',
                    flexShrink: 0
                }} className="profile-form-header">
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px'
                        }}>
                            {editingProfile !== null ? (
                                <EditIcon />
                            ) : (
                                <AddIcon />
                            )}
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {editingProfile !== null ? t('profiles.edit') : t('profiles.create')}
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={handleCancel} 
                        size="medium" 
                        aria-label="close"
                        sx={{
                            position: 'absolute',
                            right: 16,
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)'
                            }
                        }}
                        className="profile-form-close-button"
                    >
                        <CancelIcon />
                    </IconButton>
                </Box>

                {/* Contenu du formulaire avec défilement */}
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        height: 'calc(100% - 80px - 70px)', // hauteur - header - footer
                        overflow: 'hidden'
                    }}
                >
                    {/* Section des détails (fixe) */}
                    <Box sx={{ p: 4, backgroundColor: 'white', flexShrink: 0 }}>
                        <Typography variant="h6" sx={{ 
                            mb: 3, 
                            color: '#4b5563',
                            fontWeight: 600,
                            position: 'relative',
                            pl: 2,
                                '&::before': {
                                    content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 4,
                                height: '70%',
                                borderRadius: 2,
                                backgroundColor: '#7c3aed'
                                }
                            }}>
                                {t('profiles.details')}
                            </Typography>
                            
                        <TextField
                            fullWidth
                            label={t('profiles.name')}
                                value={newProfile.name || ''}
                            onChange={(e) => {
                                    const value = e.target.value;
                                    // Stocker la valeur dans le ref immédiatement
                                    nameInputRef.current = value;
                                    // Et aussi dans l'état pour l'affichage
                                    setNewProfile(prev => ({...prev, name: value}));
                                if (formErrors.name) {
                                        setFormErrors(prev => ({...prev, name: ''}));
                                    }
                                }}
                                onBlur={(e) => {
                                    // Validation supplémentaire lors de la perte de focus
                                    if (!e.target.value || e.target.value.trim() === '') {
                                        setFormErrors(prev => ({...prev, name: t('profiles.nameRequired')}));
                                }
                            }}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                                required
                                inputProps={{
                                    autoComplete: 'off'
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    transition: 'all 0.2s ease',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#7c3aed'
                                    },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#7c3aed',
                                        borderWidth: 2
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#7c3aed'
                                },
                                '& .MuiInputBase-input': {
                                    padding: '14px 16px'
                                    }
                                }}
                            className="profile-form-input"
                        />

                        <TextField
                            fullWidth
                            label={t('profiles.description')}
                                value={newProfile.description || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Stocker la valeur dans le ref immédiatement
                                    descriptionInputRef.current = value;
                                    // Et aussi dans l'état pour l'affichage
                                    setNewProfile(prev => ({...prev, description: value}));
                                }}
                            multiline
                            rows={3}
                                inputProps={{
                                    autoComplete: 'off'
                                }}
                                sx={{
                                    mb: 0,
                                    '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    transition: 'all 0.2s ease',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#7c3aed'
                                    },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#7c3aed',
                                        borderWidth: 2
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#7c3aed'
                                    }
                                }}
                            className="profile-form-input"
                            />
                        </Box>

                        <Divider />

                    {/* Section des modules (défilable) */}
                        <Box sx={{ 
                            backgroundColor: '#f9fafb',
                        flex: '1 1 auto',
                        overflowY: 'auto',
                        p: 4
                    }}
                    className="modules-scrollable-container"
                    >
                        <Typography variant="h6" sx={{ 
                            mb: 3, 
                            color: '#4b5563',
                            fontWeight: 600,
                            position: 'relative',
                            pl: 2,
                                display: 'flex',
                                alignItems: 'center',
                            gap: 1,
                                '&::before': {
                                    content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 4,
                                height: '70%',
                                borderRadius: 2,
                                backgroundColor: '#7c3aed'
                                }
                            }}>
                            {t('profiles.modules')}
                        {formErrors.modules && (
                                    <Chip 
                                        label={formErrors.modules} 
                                        size="small" 
                                        color="error"
                                    sx={{ 
                                        ml: 1, 
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        borderRadius: '6px',
                                        height: '24px'
                                    }}
                                    />
                                )}
                            </Typography>

                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { 
                                xs: '1fr', 
                                sm: 'repeat(2, 1fr)' 
                            },
                            gap: 3
                        }}>
                                {Object.entries(moduleStructureState).map(([moduleName, moduleData]) => (
                                <Paper 
                                        key={moduleName} 
                                    elevation={0}
                                        sx={{
                                            border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                borderColor: '#d1d5db'
                                            }
                                        }}
                                    className="module-card"
                                >
                                    <Box sx={{
                                        p: 2,
                                        backgroundColor: '#f3f4f6',
                                        borderBottom: '1px solid #e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={newProfile.modules[moduleName]?.access || false}
                                                onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                                                    sx={{
                                                        color: '#9ca3af',
                                                        '&.Mui-checked': {
                                                            color: '#7c3aed'
                                                        },
                                                        '& .MuiSvgIcon-root': {
                                                            fontSize: '1.25rem'
                                                        }
                                                    }}
                                            />
                                        }
                                        label={
                                                <Typography variant="subtitle1" sx={{ 
                                                    fontWeight: 600,
                                                    color: '#374151',
                                                    fontSize: '0.95rem'
                                                }}>
                                                {moduleData.title}
                                            </Typography>
                                        }
                                            sx={{
                                                m: 0,
                                                width: '100%'
                                            }}
                                    />
                                    </Box>
                                    
                                    <Box sx={{ 
                                            p: 2,
                                            display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                        gap: 1
                                        }}>
                                            {Object.entries(moduleData.subModules || {}).map(([subModule, label]) => (
                                            <FormControlLabel
                                                key={subModule}
                                                control={
                                                    <Checkbox
                                                        checked={newProfile.modules[moduleName]?.subModules?.[subModule] || false}
                                                        onChange={(e) => handleSubModuleChange(moduleName, subModule, e.target.checked)}
                                                            size="small"
                                                            sx={{
                                                                color: '#9ca3af',
                                                                '&.Mui-checked': {
                                                                color: '#7c3aed'
                                                            },
                                                            '& .MuiSvgIcon-root': {
                                                                fontSize: '1.1rem'
                                                                }
                                                            }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2" sx={{
                                                            color: '#4b5563',
                                                        fontWeight: 500,
                                                        fontSize: '0.85rem'
                                                        }}>
                                                        {label}
                                                    </Typography>
                                                }
                                                    sx={{
                                                        m: 0,
                                                        p: 1,
                                                        borderRadius: '6px',
                                                        '&:hover': {
                                                            backgroundColor: '#f3f4f6'
                                                        }
                                                    }}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Boutons d'action fixes en bas */}
                <Box sx={{ 
                    p: 3,
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    flexShrink: 0,
                    height: '70px'
                }}
                className="form-actions-container"
                >
                    <Button 
                        onClick={handleCancel} 
                        variant="outlined"
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#6b7280',
                            borderColor: '#d1d5db',
                            px: 3,
                            py: 1.2,
                            '&:hover': {
                                backgroundColor: '#f3f4f6',
                                borderColor: '#9ca3af'
                            }
                        }}
                        className="profile-form-cancel-button"
                    >
                        {t('profiles.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            backgroundColor: '#7c3aed',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                            px: 3,
                            py: 1.2,
                            '&:hover': {
                                backgroundColor: '#6d28d9',
                                boxShadow: '0 6px 16px rgba(124, 58, 237, 0.25)'
                            }
                        }}
                        className="profile-form-submit-button"
                    >
                        {editingProfile !== null ? t('profiles.save') : t('profiles.create')}
                    </Button>
                </Box>
            </Dialog>

            {/* Dialog pour afficher les détails essentiels du profil */}
            <Dialog
                open={profileModal}
                onClose={handleCloseProfileModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh'
                    },
                    className: "profile-modal-paper"
                }}
            >
                {selectedProfileDetails && (
                    <>
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            {/* Header coloré */}
                            <Box 
                                className="profile-header-gradient"
                    sx={{ 
                                    height: '120px', 
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                                    position: 'relative',
                                    borderRadius: '20px 20px 0 0'
                                }} 
                            />
                            
                            {/* Bouton de fermeture */}
                            <IconButton 
                                onClick={handleCloseProfileModal}
                                className="profile-close-button"
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                    }
                    }}
                >
                                <CancelIcon />
                            </IconButton>
                            
                            {/* Avatar */}
                            <Avatar
                                className="profile-avatar"
                                sx={{
                                    width: 100,
                                    height: 100,
                                    bgcolor: getAvatarColor(selectedProfileDetails.id),
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    position: 'absolute',
                                    top: 70,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    border: '6px solid white',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                {getInitials(selectedProfileDetails.name)}
                            </Avatar>
                    </Box>
                        
                        {/* Zone principale défilable */}
                        <Box 
                                        sx={{ 
                                mt: 7, 
                                px: 4, 
                                pt: 2, 
                                textAlign: 'center',
                                overflowY: 'auto',
                                flex: '1 1 auto'
                                        }}
                                    >
                            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.75rem', mb: 1 }}>
                                {selectedProfileDetails.name}
                            </Typography>
                            
                            <Chip
                                className="profile-status-chip"
                                label={selectedProfileDetails.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                size="small"
                                data-status={selectedProfileDetails.status?.toLowerCase()}
                                            sx={{ 
                                    mb: 3,
                                    mt: 1,
                                    bgcolor: selectedProfileDetails.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fef2f2',
                                    color: selectedProfileDetails.status?.toLowerCase() === 'active' ? '#10b981' : '#ef4444',
                                    fontWeight: '600',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    padding: '4px 12px',
                                    border: selectedProfileDetails.status?.toLowerCase() === 'active' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                                    '&::before': {
                                        content: '""',
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        marginRight: 6,
                                        backgroundColor: selectedProfileDetails.status?.toLowerCase() === 'active' ? '#10b981' : '#ef4444'
                                                }
                                            }}
                                        />
                            
                            {selectedProfileDetails.description && (
                                <Typography variant="body1" sx={{ 
                                    color: '#6b7280', 
                                    mb: 4,
                                    maxWidth: '90%',
                                    mx: 'auto',
                                    lineHeight: 1.6
                                }}>
                                    {selectedProfileDetails.description}
                                                    </Typography>
                            )}
                            
                            <Divider sx={{ mb: 3 }} />
                            
                            {/* Modules et Permissions */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ 
                                    fontWeight: 600, 
                                    mb: 3,
                                    color: '#4b5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1
                                }}>
                                    <span>Modules et Permissions</span>
                                                    </Typography>
                                
                                {/* Grid layout pour les modules */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                                    {/* Modules du profil */}
                                    {selectedProfileDetails.modules && Array.isArray(selectedProfileDetails.modules) && 
                                        selectedProfileDetails.modules.map((moduleId, index) => {
                                            const module = modules.find(m => m.id === moduleId);
                                            const moduleName = module ? module.title : `Module ${moduleId}`;
                                            
                                            // Trouver les sous-modules (menus) associés au module
                                            const relatedMenus = selectedProfileDetails.menus && Array.isArray(selectedProfileDetails.menus) 
                                                ? menus.filter(menu => menu.module === moduleId && selectedProfileDetails.menus.includes(menu.id))
                                                : [];
                                                
                                            return (
                                                <Box
                                                    key={moduleId}
                                                    className="profile-module-card"
                                                        sx={{ 
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: '#f9fafb',
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': {
                                                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                                                            transform: 'translateY(-3px)'
                                                        }
                                                    }}
                                                >
                                                    {/* En-tête du module */}
                                                    <Box 
                                                        className="profile-module-header" 
                                        sx={{ 
                                                            p: 2,
                                                            backgroundColor: '#eef2ff',
                                                            borderBottom: '1px solid #e0e7ff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                        }}
                                    >
                                                        {getModuleIcon(module?.code?.toLowerCase() || '')}
                                                        <Typography 
                                                            className="profile-module-header-title"
                                            sx={{ 
                                                    fontWeight: 600,
                                                                color: '#4f46e5',
                                                                fontSize: '0.95rem'
                                                            }}
                                                        >
                                                            {moduleName}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    {/* Conteneur des sous-modules */}
                                                    <Box 
                                                        className="profile-submodule-container" 
                                                        sx={{
                                                            p: 2,
                                                            minHeight: '60px'
                                                        }}
                                                    >
                                                        {relatedMenus.length > 0 ? (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {relatedMenus.map(menu => (
                                                                <Chip
                                                                        key={menu.id}
                                                                        label={menu.title}
                                                                        className="profile-submodule-chip"
                                                                        size="small"
                                                                    sx={{ 
                                                                            backgroundColor: 'white',
                                                                            color: '#4b5563',
                                                                            border: '1px solid #e5e7eb',
                                                                            fontSize: '0.75rem',
                                                                        fontWeight: 500,
                                                                            borderRadius: '4px',
                                                                            transition: 'all 0.2s ease',
                                                                            '&:hover': {
                                                                                backgroundColor: '#f3f4f6',
                                                                                borderColor: '#d1d5db',
                                                                                transform: 'translateY(-1px)',
                                                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                                                                            }
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Box 
                                                                className="profile-submodule-empty"
                                        sx={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center', 
                                                                    height: '100%' 
                                                                    }}
                                    >
                                                                <Typography 
                                                                    variant="body2" 
                                            sx={{ 
                                                                        fontStyle: 'italic', 
                                                                        color: '#9ca3af', 
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Accès au module complet
                                                                        </Typography>
                                                            </Box>
                                                                    )}
                                                                </Box>
                                                </Box>
                                                        );
                                                    })
                                    }
                                </Box>
                                
                                {/* Message si aucun module */}
                                {(!selectedProfileDetails.modules || !Array.isArray(selectedProfileDetails.modules) || selectedProfileDetails.modules.length === 0) && (
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ textAlign: 'center', mt: 2 }}
                                    >
                                                    {t('profiles.noModules')}
                                                </Typography>
                                            )}
                        </Box>
                        </Box>
                        
                        {/* Zone des boutons fixes en bas */}
                        <Box 
                                        sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                gap: 2,
                                py: 3,
                                px: 4,
                                borderTop: '1px solid rgba(229, 231, 235, 0.5)',
                                backgroundColor: 'white',
                                flexShrink: 0
                            }}
                            className="profile-action-buttons-container"
                        >
                    <Button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Close the modal first
                                    setProfileModal(false);
                                    // Then handle the edit action with a slight delay to ensure modal is closed
                                    setTimeout(() => {
                                        handleEdit(selectedProfileDetails.id);
                                    }, 50);
                                }}
                                startIcon={<EditIcon />}
                                className="profile-action-button edit-button"
                                            sx={{ 
                                    backgroundColor: '#7c3aed',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)',
                                    minWidth: '140px',
                                    '&:hover': {
                                        backgroundColor: '#6d28d9',
                                        boxShadow: '0 6px 10px rgba(124, 58, 237, 0.3)'
                                    }
                                }}
                            >
                                Edit Profile
                    </Button>
                    <Button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Close the modal first
                                    setProfileModal(false);
                                    // Then handle the delete action with a slight delay to ensure modal is closed
                                    setTimeout(() => {
                                        handleDelete(selectedProfileDetails.id);
                                    }, 50);
                                }}
                                startIcon={<DeleteIcon />}
                                className="profile-action-button delete-button"
                                                                        sx={{ 
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
                                    minWidth: '140px',
                                    '&:hover': {
                                        backgroundColor: '#dc2626',
                                        boxShadow: '0 6px 10px rgba(239, 68, 68, 0.3)'
                                    }
                                }}
                            >
                                Delete Profile
                    </Button>
                    <Button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseProfileModal();
                                }}
                                className="profile-action-button close-button"
                                sx={{ 
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    color: '#4b5563',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    minWidth: '140px',
                                    '&:hover': {
                                        backgroundColor: '#e5e7eb'
                                    }
                                }}
                            >
                                Close
                    </Button>
                                                                </Box>
                    </>
                )}
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
