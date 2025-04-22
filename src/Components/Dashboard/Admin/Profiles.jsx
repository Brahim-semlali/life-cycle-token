import React, { useEffect, useState } from "react";
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../../context/AuthContext";
import { 
  getAllProfiles, 
  createProfile, 
  updateProfile, 
  deleteProfile,
  initializeProfiles
} from "../../../services/ProfileService";
import "./Profiles.css";

const Profiles = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const { checkModuleAccess } = useAuth();
    
    // États pour la gestion des profils
    const [profiles, setProfiles] = useState([]);
    const [editingProfile, setEditingProfile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const moduleStructure = {
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
    };
    
    const emptyProfile = {
        name: "",
        description: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        modules: Object.keys(moduleStructure).reduce((acc, moduleName) => ({
            ...acc,
            [moduleName]: {
                access: false,
                subModules: Object.keys(moduleStructure[moduleName].subModules).reduce((subAcc, subModule) => ({
                    ...subAcc,
                    [subModule]: false
                }), {})
            }
        }), {})
    };

    const [newProfile, setNewProfile] = useState(emptyProfile);

    // Initialiser les profils au chargement du composant
    useEffect(() => {
        // Initialiser les profils prédéfinis si nécessaire
        initializeProfiles();
        // Charger tous les profils
        const loadedProfiles = getAllProfiles();
        setProfiles(loadedProfiles);
        
        document.body.classList.add('profils-body');
        return () => {
            document.body.classList.remove('profils-body');
        };
    }, []);

    // Fonction de validation du formulaire
    const validateForm = (profile) => {
        const errors = {};
        if (!profile.name.trim()) {
            errors.name = t('profiles.nameRequired');
        }
        
        // Vérifier si au moins un module ou sous-module est sélectionné
        const hasAnyAccess = Object.values(profile.modules).some(module => 
            module.access || Object.values(module.subModules).some(access => access)
        );
        
        if (!hasAnyAccess) {
            errors.modules = t('profiles.moduleRequired');
        }

        return errors;
    };

    // Gestion du tri
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filtrage des profils
    const filteredProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tri des profils
    const sortedProfiles = [...filteredProfiles].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (a[sortField] < b[sortField]) return -1 * direction;
        if (a[sortField] > b[sortField]) return 1 * direction;
        return 0;
    });

    const handleModuleChange = (moduleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
        profileToUpdate.modules[moduleName] = {
            ...profileToUpdate.modules[moduleName],
            access: isChecked,
            subModules: Object.keys(profileToUpdate.modules[moduleName].subModules).reduce((acc, key) => ({
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
    };

    const handleSubModuleChange = (moduleName, subModuleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
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
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const profileToSave = editingProfile !== null ? profiles[editingProfile] : newProfile;
        
        const errors = validateForm(profileToSave);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const now = new Date().toISOString();
        const updatedProfile = {
            ...profileToSave,
            updatedAt: now,
            createdAt: profileToSave.createdAt || now
        };

        if (editingProfile !== null) {
            // Mettre à jour un profil existant
            const updated = updateProfile(updatedProfile.id, updatedProfile);
            if (updated) {
                const updatedProfiles = [...profiles];
                updatedProfiles[editingProfile] = updated;
                setProfiles(updatedProfiles);
                setEditingProfile(null);
            }
        } else {
            // Créer un nouveau profil
            const created = createProfile(updatedProfile);
            setProfiles([...profiles, created]);
        }
        
        setNewProfile(emptyProfile);
        setFormErrors({});
    };

    const handleEdit = (index) => {
        setEditingProfile(index);
        setNewProfile(profiles[index]);
        setFormErrors({});
    };

    const handleDelete = (index) => {
        if (window.confirm(t('profiles.confirmDelete'))) {
            const profileToDelete = profiles[index];
            if (deleteProfile(profileToDelete.id)) {
                const updatedProfiles = profiles.filter((_, i) => i !== index);
                setProfiles(updatedProfiles);
                if (editingProfile === index) {
                    setEditingProfile(null);
                    setNewProfile(emptyProfile);
                }
            }
        }
    };

    const handleBulkDelete = () => {
        const profilesToDelete = selectedProfiles.map(index => profiles[index]);
        let success = true;
        
        for (const profile of profilesToDelete) {
            if (!deleteProfile(profile.id)) {
                success = false;
                break;
            }
        }
        
        if (success) {
            const updatedProfiles = profiles.filter((_, index) => !selectedProfiles.includes(index));
            setProfiles(updatedProfiles);
            setSelectedProfiles([]);
            setShowDeleteModal(false);
        }
    };

    const handleCancel = () => {
        setEditingProfile(null);
        setNewProfile(emptyProfile);
        setFormErrors({});
    };

    const handleProfileSelect = (index) => {
        setSelectedProfiles(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleSelectAll = (e) => {
        setSelectedProfiles(
            e.target.checked 
                ? sortedProfiles.map((_, index) => index)
                : []
        );
    };

    const renderModuleSection = (moduleName, moduleData) => (
        <div className="module-section" key={moduleName}>
            <div className="module-header">
                <label className="module-label">
                    <input
                        type="checkbox"
                        checked={moduleData.access}
                        onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                    />
                    <span className="module-title">{moduleStructure[moduleName].title}</span>
                </label>
            </div>
            <div className="submodule-section">
                {Object.entries(moduleStructure[moduleName].subModules).map(([subModule, label]) => (
                    <label key={subModule} className="submodule-label">
                        <input
                            type="checkbox"
                            checked={moduleData.subModules[subModule]}
                            onChange={(e) => handleSubModuleChange(moduleName, subModule, e.target.checked)}
                        />
                        <span className="submodule-title">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`profiles-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="profiles-header">
                <h2>{editingProfile !== null ? t('profiles.edit') : t('profiles.create')}</h2>
                <div className="profiles-actions">
                    <input
                        type="text"
                        placeholder={t('profiles.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {selectedProfiles.length > 0 && (
                        <button 
                            className="delete-button"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            {t('profiles.deleteSelected')} ({selectedProfiles.length})
                        </button>
                    )}
                </div>
            </div>

            {checkModuleAccess('administration') ? (
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder={t('profiles.name')}
                            value={editingProfile !== null ? profiles[editingProfile].name : newProfile.name}
                            onChange={(e) => {
                                if (editingProfile !== null) {
                                    const updatedProfiles = [...profiles];
                                    updatedProfiles[editingProfile] = {
                                        ...updatedProfiles[editingProfile],
                                        name: e.target.value
                                    };
                                    setProfiles(updatedProfiles);
                                } else {
                                    setNewProfile({...newProfile, name: e.target.value});
                                }
                                if (formErrors.name) {
                                    setFormErrors({...formErrors, name: ''});
                                }
                            }}
                            className={formErrors.name ? 'error' : ''}
                        />
                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                    </div>

                    <div className="form-group">
                        <textarea
                            placeholder={t('profiles.description')}
                            value={editingProfile !== null ? profiles[editingProfile].description || '' : newProfile.description}
                            onChange={(e) => {
                                if (editingProfile !== null) {
                                    const updatedProfiles = [...profiles];
                                    updatedProfiles[editingProfile] = {
                                        ...updatedProfiles[editingProfile],
                                        description: e.target.value
                                    };
                                    setProfiles(updatedProfiles);
                                } else {
                                    setNewProfile({...newProfile, description: e.target.value});
                                }
                            }}
                            rows="3"
                        />
                    </div>

                    <div className="modules-container">
                        {formErrors.modules && <span className="error-message modules-error">{formErrors.modules}</span>}
                        {Object.entries(editingProfile !== null ? profiles[editingProfile].modules : newProfile.modules)
                            .map(([moduleName, moduleData]) => renderModuleSection(moduleName, moduleData))}
                    </div>

                    <div className="button-group">
                        <button type="submit" className="submit-button">
                            {editingProfile !== null ? t('profiles.save') : t('profiles.create')}
                        </button>
                        {editingProfile !== null && (
                            <button type="button" className="cancel-button" onClick={handleCancel}>
                                {t('profiles.cancel')}
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <div className="access-denied">
                    <p>{t('profiles.accessDenied')}</p>
                </div>
            )}

            {profiles.length > 0 && (
                <div className="profiles-list">
                    <div className="profiles-table-header">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={selectedProfiles.length === sortedProfiles.length}
                                onChange={handleSelectAll}
                            />
                            <span className="checkmark"></span>
                        </label>
                        <div className="header-cell" onClick={() => handleSort('name')}>
                            {t('profiles.name')}
                            {sortField === 'name' && (
                                <span className="sort-indicator">
                                    {sortDirection === 'asc' ? '▲' : '▼'}
                                </span>
                            )}
                        </div>
                        <div className="header-cell" onClick={() => handleSort('createdAt')}>
                            {t('profiles.createdAt')}
                            {sortField === 'createdAt' && (
                                <span className="sort-indicator">
                                    {sortDirection === 'asc' ? '▲' : '▼'}
                                </span>
                            )}
                        </div>
                        <div className="header-cell" onClick={() => handleSort('status')}>
                            {t('profiles.status')}
                            {sortField === 'status' && (
                                <span className="sort-indicator">
                                    {sortDirection === 'asc' ? '▲' : '▼'}
                                </span>
                            )}
                        </div>
                        <div className="header-cell">{t('profiles.actions')}</div>
                    </div>

                    <div className="profiles-table-body">
                        {sortedProfiles.map((profile, index) => (
                            <div key={index} className="profile-row">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={selectedProfiles.includes(index)}
                                        onChange={() => handleProfileSelect(index)}
                                    />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="profile-cell">
                                    <strong>{profile.name}</strong>
                                    {profile.description && (
                                        <p className="profile-description">{profile.description}</p>
                                    )}
                                </div>
                                <div className="profile-cell">
                                    {new Date(profile.createdAt).toLocaleDateString()}
                                </div>
                                <div className="profile-cell">
                                    <span className={`status-badge ${profile.status}`}>
                                        {t(`profiles.status.${profile.status}`)}
                                    </span>
                                </div>
                                <div className="profile-cell actions">
                                    {checkModuleAccess('administration') && (
                                        <>
                                            <button
                                                className="edit-button"
                                                onClick={() => handleEdit(index)}
                                                disabled={editingProfile !== null}
                                            >
                                                {t('profiles.edit')}
                                            </button>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDelete(index)}
                                            >
                                                {t('profiles.delete')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{t('profiles.confirmDeleteMultiple')}</h3>
                        <p>{t('profiles.deleteWarning', { count: selectedProfiles.length })}</p>
                        <div className="modal-actions">
                            <button onClick={handleBulkDelete} className="delete-button">
                                {t('profiles.confirmDelete')}
                            </button>
                            <button onClick={() => setShowDeleteModal(false)} className="cancel-button">
                                {t('profiles.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profiles;
