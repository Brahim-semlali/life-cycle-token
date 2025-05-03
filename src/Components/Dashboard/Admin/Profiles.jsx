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
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
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

    // Déclaration des gestionnaires d'événements avant leur utilisation
    const handleRowClick = useCallback((params) => {
        const id = params.id;
        setSelectedProfiles(prev => 
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    const handleHeaderCheckboxClick = useCallback(() => {
        setSelectedProfiles(prev => 
            prev.length === profiles.length ? [] : profiles.map(profile => profile.id)
        );
    }, [profiles]);

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
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <Checkbox
                        checked={selectedProfiles.includes(params.row.id)}
                        onChange={() => handleRowClick(params)}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(params);
                        }}
                        size="small"
                        width="90px"
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
                    width: '0%'
                }}>
                    <Checkbox
                        checked={profiles.length > 0 && selectedProfiles.length === profiles.length}
                        indeterminate={selectedProfiles.length > 0 && selectedProfiles.length < profiles.length}
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
            field: 'name', 
            headerName: t('profiles.name'), 
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box className="name-cell">
                    <Typography variant="subtitle1">{params.value}</Typography>
                </Box>
            )
        },
        { 
            field: 'description', 
            headerName: t('profiles.description'), 
            flex: 2,
            minWidth: 300,
            renderCell: (params) => (
                <Box className="description-cell">
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            )
        },
        { 
            field: 'status', 
            headerName: t('profiles.status'), 
            flex: 0.7,
            minWidth: 120,
            renderCell: (params) => {
                if (!params || !params.value) return null;
                const statusClass = params.value.toLowerCase();
                return (
                    <Box className="status-cell">
                        <span className={`status-badge ${statusClass}`}>
                            {t(`profiles.status.${statusClass}`)}
                        </span>
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
    ], [selectedProfiles, profiles.length, handleRowClick, handleHeaderCheckboxClick]);

    // Chargement des profils
    const loadProfiles = async () => {
        try {
            setLoading(true);
            setError(null);
            
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
            
            // Charger les modules et menus
            try {
                const moduleMenuData = await loadModulesAndMenus();
                const loadedModules = moduleMenuData.modules || [];
                const loadedMenus = moduleMenuData.menus || [];
                
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

    const handleDelete = (id) => {
        if (window.confirm(t('profiles.confirmDelete'))) {
            const index = profiles.findIndex(p => p.id === id);
            const profileToDelete = profiles[index];
            if (deleteProfile(profileToDelete.id)) {
                const updatedProfiles = profiles.filter((_, i) => i !== index);
                setProfiles(updatedProfiles);
                if (editingProfile === index) {
                    setEditingProfile(null);
                    setNewProfile({
                        name: "",
                        description: "",
                        status: "active",
                        modules: initialModuleState
                    });
                }
            }
        }
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

    return (
        <Box className={`profiles-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <Box className="profiles-header">
                <Typography variant="h4" component="h1">
                    {t('profiles.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {selectedProfiles.length > 0 && (
                        <>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                    if (window.confirm(t('profiles.confirmDeleteMultiple'))) {
                                        selectedProfiles.forEach(id => {
                                            const success = deleteProfile(id);
                                            if (success) {
                                                const updatedProfiles = profiles.filter(p => p.id !== id);
                                                setProfiles(updatedProfiles);
                                            }
                                        });
                                        setSelectedProfiles([]);
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
                            {t('profiles.deleteSelected')} ({selectedProfiles.length})
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setSelectedProfiles([])}
                                startIcon={<CancelIcon />}
                                sx={{
                                    borderColor: '#4a5568',
                                    color: '#4a5568',
                                    '&:hover': {
                                        borderColor: '#2d3748',
                                        backgroundColor: 'rgba(74, 85, 104, 0.08)',
                                    },
                                    height: '40px'
                                }}
                            >
                                {t('profiles.cancelSelection')}
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
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
                            backgroundColor: '#4299e1',
                            '&:hover': {
                                backgroundColor: '#3182ce',
                            },
                            height: '40px'
                        }}
                        className="create-button"
                    >
                        {t('profiles.create')}
                    </Button>
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
            ) : (
            <Paper className="profiles-table-container" sx={{
                '& .MuiDataGrid-root': {
                    border: 'none',
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e2e8f0',
                },
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc',
                    borderBottom: '2px solid #e2e8f0',
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: '2px solid #e2e8f0',
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
            }}>
                <DataGrid
                    rows={profiles}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection={false}
                    disableSelectionOnClick
                    disableColumnMenu
                    disableColumnResize
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
            )}

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
            >
                <DialogTitle className="dialog-title">
                    {editingProfile !== null ? t('profiles.edit') : t('profiles.create')}
                </DialogTitle>
                <DialogContent className="dialog-content">
                    <Box component="form" onSubmit={handleSubmit} className="profile-form">
                        <TextField
                            fullWidth
                            label={t('profiles.name')}
                            value={newProfile.name || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                console.log("Name input changed:", value);
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
                            className="form-field"
                            required
                            inputProps={{
                                autoComplete: 'off'  // Désactiver l'autocomplétion
                            }}
                        />

                        <TextField
                            fullWidth
                            label={t('profiles.description')}
                            value={newProfile.description || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                console.log("Description input changed:", value);
                                // Stocker la valeur dans le ref immédiatement
                                descriptionInputRef.current = value;
                                // Et aussi dans l'état pour l'affichage
                                setNewProfile(prev => ({...prev, description: value}));
                            }}
                            multiline
                            rows={3}
                            className="form-field description-field"
                            inputProps={{
                                autoComplete: 'off'
                            }}
                        />

                        <Typography variant="h6" className="modules-title">
                            {t('profiles.modules')}
                        </Typography>
                        {formErrors.modules && (
                            <Typography color="error" className="error-message">
                                {formErrors.modules}
                            </Typography>
                        )}

                        <FormGroup className="modules-group">
                            {Object.entries(moduleStructureState).map(([moduleName, moduleData]) => (
                                <Box key={moduleName} className="module-section">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={newProfile.modules[moduleName]?.access || false}
                                                onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                                                className="module-checkbox"
                                            />
                                        }
                                        label={
                                            <Typography variant="subtitle1" className="module-label">
                                                {moduleData.title}
                                            </Typography>
                                        }
                                        className="module-control"
                                    />
                                    <Box className="submodules-section">
                                        {Object.entries(moduleData.subModules || {}).map(([subModule, label]) => (
                                            <FormControlLabel
                                                key={subModule}
                                                control={
                                                    <Checkbox
                                                        checked={newProfile.modules[moduleName]?.subModules?.[subModule] || false}
                                                        onChange={(e) => handleSubModuleChange(moduleName, subModule, e.target.checked)}
                                                        className="submodule-checkbox"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2" className="submodule-label">
                                                        {label}
                                                    </Typography>
                                                }
                                                className="submodule-control"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </FormGroup>
                    </Box>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button 
                        onClick={handleCancel} 
                        startIcon={<CancelIcon />}
                        className="cancel-button"
                    >
                        {t('profiles.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        startIcon={<SaveIcon />}
                        className="submit-button"
                    >
                        {editingProfile !== null ? t('profiles.save') : t('profiles.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(Profiles);
