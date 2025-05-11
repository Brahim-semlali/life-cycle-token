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
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  People,
  ArrowDownward as ArrowDownwardIcon,
  Details as DetailsIcon
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
    // Modifier l'état par défaut pour afficher la vue liste par défaut au lieu de la grille
    const [viewMode, setViewMode] = useState('list'); // Changé de 'grid' à 'list'
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
    const handleProfileClick = async (profile, event) => {
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
                                    gap: '4px',
                                    position: 'relative'
                            }}
                        >
                                <GridViewIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                <span>Grid</span>
                                {viewMode === 'grid' && (
                                    <Box 
                                        sx={{
                                            position: 'absolute',
                                            bottom: '5px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '15px',
                                            height: '2px',
                                            backgroundColor: 'currentColor',
                                            borderRadius: '2px'
                                        }}
                                    />
                                )}
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
                                    gap: '4px',
                                    position: 'relative'
                            }}
                        >
                                <ListViewIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                <span>List</span>
                                {viewMode === 'list' && (
                                    <Box 
                                        sx={{
                                            position: 'absolute',
                                            bottom: '5px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '15px',
                                            height: '2px',
                                            backgroundColor: 'currentColor',
                                            borderRadius: '2px'
                                        }}
                                    />
                                )}
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
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </div>
                    <h3 className="empty-state-title">No profiles found</h3>
                    <p className="empty-state-text">
                        {searchQuery 
                            ? 'No profiles match your search criteria. Try adjusting your filters or search term.' 
                            : 'There are no profiles available. Create a new profile to get started.'}
                    </p>
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
                                background: 'linear-gradient(45deg, #7c3aed 0%, #8b5cf6 100%)',
                                borderRadius: '12px',
                                padding: '10px 20px',
                                minHeight: '42px',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #6d28d9 0%, #7c3aed 100%)',
                                    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                            startIcon={<AddIcon />}
                        >
                            Create your first profile
                        </Button>
                    )}
                </div>
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
                                                    ? '#ff0303'
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
                                            borderRadius: '16px',
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: selectedProfiles.includes(profile.id) 
                                                ? '2px solid #4f46e5' 
                                                : '1px solid rgba(226, 232, 240, 0.6)',
                                            backgroundColor: selectedProfiles.includes(profile.id) 
                                                ? 'rgba(79, 70, 229, 0.03)' 
                                                : 'white',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: '-50%',
                                                left: '-50%',
                                                width: '200%',
                                                height: '200%',
                                                background: 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%)',
                                                transform: 'rotate(30deg)',
                                                opacity: 0,
                                                transition: 'opacity 0.5s ease',
                                                zIndex: 1,
                                                pointerEvents: 'none'
                                            },
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
                                            },
                                            '&:hover::before': {
                                                opacity: 1,
                                                animation: 'shine 3s infinite linear'
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
                                        flex: 1,
                                        position: 'relative',
                                        zIndex: 2
                                    }}>
                                        <Avatar
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                mb: 2,
                                                bgcolor: getAvatarColor(profile.id),
                                                fontSize: '1.8rem',
                                                fontWeight: 'bold',
                                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                                                border: '3px solid white',
                                                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                '&:hover': {
                                                    transform: 'scale(1.12)',
                                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)'
                                                }
                                            }}
                                        >
                                            {getInitials(profile.name)}
                                        </Avatar>
                                            
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: '600', 
                                            mb: 0.5, 
                                            textAlign: 'center',
                                            fontSize: '1.1rem',
                                            background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            display: 'inline-block'
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
                                                bgcolor: profile.status?.toLowerCase() === 'active' 
                                                    ? 'rgba(16, 185, 129, 0.1)' 
                                                    : 'rgba(239, 68, 68, 0.1)',
                                                color: profile.status?.toLowerCase() === 'active' ? '#059669' : '#dc2626',
                                                fontWeight: '600',
                                                py: 0.5,
                                                px: 1.5,
                                                height: '24px',
                                                fontSize: '0.75rem',
                                                borderRadius: '12px',
                                                border: profile.status?.toLowerCase() === 'active' 
                                                    ? '1px solid rgba(110, 231, 183, 0.6)' 
                                                    : '1px solid rgba(252, 165, 165, 0.6)',
                                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                                }
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
                                                                bgcolor: 'rgba(79, 70, 229, 0.08)',
                                                                color: '#4f46e5',
                                                                fontSize: '0.7rem',
                                                                height: '22px',
                                                                borderRadius: '6px',
                                                                my: 0.5,
                                                                fontWeight: 500,
                                                                transition: 'all 0.3s ease',
                                                                border: '1px solid rgba(129, 140, 248, 0.2)',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(79, 70, 229, 0.12)',
                                                                    transform: 'translateY(-2px)',
                                                                    boxShadow: '0 4px 8px rgba(79, 70, 229, 0.15)'
                                                                }
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
                                                        backgroundColor: 'rgba(148, 163, 184, 0.15)', 
                                                        color: '#64748b',
                                                        fontSize: '0.7rem',
                                                        height: '22px',
                                                        borderRadius: '6px',
                                                        my: 0.5,
                                                        fontWeight: 500,
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(148, 163, 184, 0.25)',
                                                            transform: 'translateY(-2px)'
                                                        }
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
                                            background: 'linear-gradient(to top, white 0%, rgba(255, 255, 255, 0.9) 100%)',
                                            borderTop: '1px solid rgba(229, 231, 235, 0.7)',
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
                                                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    boxShadow: '0 4px 10px rgba(147, 51, 234, 0.25)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                                                        boxShadow: '0 6px 15px rgba(147, 51, 234, 0.35)',
                                                        transform: 'translateY(-3px)'
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                                        boxShadow: '0 6px 15px rgba(239, 68, 68, 0.35)',
                                                        transform: 'translateY(-3px)'
                                                    },
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                    // Replace this section with a table
                    <table className="contact-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <IconButton
                                        size="small"
                                        onClick={handleHeaderCheckboxClick}
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
                                            width: '24px',
                                            height: '24px'
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
                                </th>
                                <th>NAME</th>
                                <th>DESCRIPTION</th>
                                <th>MODULES</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.map(profile => (
                                <tr key={profile.id} onClick={(e) => handleProfileClick(profile, e)}>
                                    <td>
                                        <IconButton
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
                                                padding: '4px',
                                                width: '24px',
                                                height: '24px'
                                            }}
                                        >
                                            {selectedProfiles.includes(profile.id) ? (
                                                <CheckIcon fontSize="small" />
                                            ) : (
                                                <AddIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </td>
                                    <td>
                                        <div className="name-cell">
                                            <div className="user-avatar">
                                                    {getInitials(profile.name)}
                                            </div>
                                            <div>
                                                <div className="profile-name">{profile.name}</div>
                                                <div className="profile-title">{profile.title || ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{profile.description || t('profiles.noDescription')}</td>
                                    <td>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {profile.modules && Array.isArray(profile.modules) && profile.modules.length > 0 ? (
                                                        profile.modules.slice(0, 2).map((moduleId, index) => {
                                                            const module = modules.find(m => m.id === moduleId);
                                                            return (
                                                                <Chip
                                                                    key={index}
                                                                    label={module ? module.title : `Module ${moduleId}`}
                                                                    size="small"
                                                                    sx={{ 
                                                                bgcolor: 'rgba(79, 70, 229, 0.08)',
                                                                        color: '#4f46e5',
                                                                        fontSize: '0.7rem',
                                                                        height: '22px',
                                                                borderRadius: '6px',
                                                                my: 0.5,
                                                                fontWeight: 500
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    {t('profiles.noModules')}
                                                        </Typography>
                                                    )}
                                                    {profile.modules && profile.modules.length > 2 && (
                                                        <Chip
                                                            label={`+${profile.modules.length - 2}`}
                                                            size="small"
                                                            sx={{ 
                                                        backgroundColor: 'rgba(148, 163, 184, 0.15)', 
                                                                color: '#64748b',
                                                                fontSize: '0.7rem',
                                                                height: '22px',
                                                        borderRadius: '6px',
                                                        my: 0.5,
                                                        fontWeight: 500
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                    </td>
                                    <td>
                                        <div className={`status-badge ${profile.status?.toLowerCase() || 'inactive'}`}>
                                            <span className="status-dot"></span>
                                            {profile.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="action-button edit"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleEdit(profile.id);
                                                        }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </button>
                                            <button 
                                                className="action-button delete"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDelete(profile.id);
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
                )
            )}

            {/* Dialogue pour éditer un profil */}
            <Dialog 
                open={openDialog} 
                onClose={handleCancel} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <div className="profile-form-header">
                    <h2>
                        <span className="icon">
                                <AddIcon />
                        </span>
                        {editingProfile !== null ? 'Edit Profile' : 'Create Profile'}
                    </h2>
                    <IconButton 
                        onClick={handleCancel} 
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    >
                        <CancelIcon />
                    </IconButton>
                </div>
                
                <div className="profile-form-nav">
                    <div 
                        className={`profile-form-nav-item ${activeNavItem === 'details' ? 'active' : ''}`}
                        onClick={() => scrollToSection(detailsSectionRef, 'details')}
                    >
                        <span className="nav-icon"><DetailsIcon fontSize="small" /></span>
                        Details
                    </div>
                    <div 
                        className={`profile-form-nav-item ${activeNavItem === 'modules' ? 'active' : ''}`}
                        onClick={() => scrollToSection(modulesSectionRef, 'modules')}
                    >
                        <span className="nav-icon"><SecurityIcon fontSize="small" /></span>
                        Modules and Permissions
                    </div>
                </div>
                
                <div 
                    className="profile-form-content profile-form-scrollable" 
                    ref={formScrollRef}
                    onScroll={handleFormScroll}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="profile-form-section" ref={detailsSectionRef}>
                            <div className="profile-form-section-title">Details</div>
                            <div className="profile-form-field">
                                <label>
                                    Profile Name
                                    <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editingProfile !== null ? profiles[editingProfile]?.name || '' : newProfile.name || ''}
                            onChange={(e) => {
                                        nameInputRef.current = e.target.value;
                                        if (editingProfile !== null) {
                                            const updatedProfiles = [...profiles];
                                            updatedProfiles[editingProfile] = {
                                                ...updatedProfiles[editingProfile],
                                                name: e.target.value
                                            };
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
                                />
                                {formErrors.name && (
                                    <div className="field-error">{formErrors.name}</div>
                                )}
                            </div>
                            
                            <div className="profile-form-field">
                                <label>Description</label>
                                <textarea
                                    value={editingProfile !== null ? profiles[editingProfile]?.description || '' : newProfile.description || ''}
                                onChange={(e) => {
                                        descriptionInputRef.current = e.target.value;
                                        if (editingProfile !== null) {
                                            const updatedProfiles = [...profiles];
                                            updatedProfiles[editingProfile] = {
                                                ...updatedProfiles[editingProfile],
                                                description: e.target.value
                                            };
                                            setProfiles(updatedProfiles);
                                        } else {
                                            setNewProfile({ ...newProfile, description: e.target.value });
                                        }
                                    }}
                                    placeholder="Enter profile description"
                                />
                            </div>
                        </div>
                        
                        <div className="profile-form-section" ref={modulesSectionRef}>
                            <div className="profile-form-section-title">Modules and Permissions</div>
                            
                        {formErrors.modules && (
                                <div className="field-error" style={{ marginBottom: '16px' }}>
                                    {formErrors.modules}
                                </div>
                            )}
                            
                            <div className="modules-grid">
                                {Object.keys(moduleStructureState).map(moduleName => {
                                    const module = moduleStructureState[moduleName];
                                    const profileData = editingProfile !== null ? profiles[editingProfile] : newProfile;
                                    const moduleAccess = profileData?.modules?.[moduleName]?.access || false;
                                    
                                    return (
                                        <div className="module-card" key={moduleName}>
                                            <div className="module-card-header">
                                                <label className="module-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={moduleAccess}
                                                onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                                                    />
                                                </label>
                                                <span className="module-name">{module.title}</span>
                                            </div>
                                            
                                            <div className="module-card-content">
                                                <div className="submodule-list">
                                                    {Object.keys(module.subModules || {}).map(subModuleName => {
                                                        const subModuleChecked = profileData?.modules?.[moduleName]?.subModules?.[subModuleName] || false;
                                                        
                                                        return (
                                                            <div className="submodule-item" key={subModuleName}>
                                                                <label className="submodule-checkbox">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={subModuleChecked}
                                                                        onChange={(e) => handleSubModuleChange(moduleName, subModuleName, e.target.checked)}
                                                                    />
                                                                </label>
                                                                <span className="submodule-name">
                                                                    {module.subModules[subModuleName]}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="profile-form-actions">
                    <button 
                        type="button" 
                        className="cancel-button"
                        onClick={handleCancel} 
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        className="submit-button"
                        onClick={handleSubmit} 
                    >
                        {editingProfile !== null ? 'Update Profile' : 'Create Profile'}
                    </button>
                </div>
                
                {/* Bouton de défilement vers le bas */}
                <button className="scroll-button" onClick={scrollToBottom}>
                    <ArrowDownwardIcon />
                </button>
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
