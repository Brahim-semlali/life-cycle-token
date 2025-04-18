import React, {useEffect, useState} from "react";
import { useMenu } from "../../../context/MenuContext";
import "./Profiles.css";

const Profiles = () => {
    const { isMinimized } = useMenu();
    const [profiles, setProfiles] = useState([]);
    const [editingProfile, setEditingProfile] = useState(null);
    const emptyProfile = {
        name: "",
        modules: {
            administration: {
                access: false,
                subModules: {
                    profiles: false,
                    users: false,
                    security: false
                }
            },
            issuerTSP: {
                access: false,
                subModules: {
                    certificates: false,
                    validation: false,
                    settings: false
                }
            },
            tokenManager: {
                access: false,
                subModules: {
                    tokens: false,
                    distribution: false,
                    monitoring: false
                }
            },
            clients: {
                access: false,
                subModules: {
                    management: false,
                    contracts: false,
                    billing: false
                }
            }
        }
    };

    const [newProfile, setNewProfile] = useState(emptyProfile);

    useEffect(() => {
        document.body.classList.add('profils-body');
        return () => {
            document.body.classList.remove('profils-body');
        };
    }, []);

    const handleModuleChange = (moduleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
        profileToUpdate.modules[moduleName] = {
            ...profileToUpdate.modules[moduleName],
            access: isChecked,
            subModules: isChecked 
                ? profileToUpdate.modules[moduleName].subModules 
                : Object.keys(profileToUpdate.modules[moduleName].subModules).reduce((acc, key) => ({
                    ...acc,
                    [key]: false
                }), {})
        };

        if (editingProfile !== null) {
            const updatedProfiles = [...profiles];
            updatedProfiles[editingProfile] = profileToUpdate;
            setProfiles(updatedProfiles);
        } else {
            setNewProfile(profileToUpdate);
        }
    };

    const handleSubModuleChange = (moduleName, subModuleName, isChecked) => {
        const profileToUpdate = editingProfile !== null ? {...profiles[editingProfile]} : {...newProfile};
        
        profileToUpdate.modules[moduleName] = {
            ...profileToUpdate.modules[moduleName],
            access: isChecked ? true : profileToUpdate.modules[moduleName].access,
            subModules: {
                ...profileToUpdate.modules[moduleName].subModules,
                [subModuleName]: isChecked
            }
        };

        if (editingProfile !== null) {
            const updatedProfiles = [...profiles];
            updatedProfiles[editingProfile] = profileToUpdate;
            setProfiles(updatedProfiles);
        } else {
            setNewProfile(profileToUpdate);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const profileToSave = editingProfile !== null ? profiles[editingProfile] : newProfile;
        
        if (!profileToSave.name.trim()) {
            alert("Veuillez entrer un nom de profil");
            return;
        }

        if (editingProfile !== null) {
            const updatedProfiles = [...profiles];
            updatedProfiles[editingProfile] = profileToSave;
            setProfiles(updatedProfiles);
            setEditingProfile(null);
        } else {
            setProfiles([...profiles, profileToSave]);
        }
        
        setNewProfile(emptyProfile);
    };

    const handleEdit = (index) => {
        setEditingProfile(index);
        setNewProfile(profiles[index]);
    };

    const handleDelete = (index) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
            const updatedProfiles = profiles.filter((_, i) => i !== index);
            setProfiles(updatedProfiles);
            if (editingProfile === index) {
                setEditingProfile(null);
                setNewProfile(emptyProfile);
            }
        }
    };

    const handleCancel = () => {
        setEditingProfile(null);
        setNewProfile(emptyProfile);
    };

    const renderModuleSection = (moduleName, moduleData, displayName) => (
        <div className="module-section">
            <label className="module-label">
                <input
                    type="checkbox"
                    checked={moduleData.access}
                    onChange={(e) => handleModuleChange(moduleName, e.target.checked)}
                />
                {displayName}
            </label>
            {moduleData.access && (
                <div className="submodule-section">
                    {Object.entries(moduleData.subModules).map(([subModule, isChecked]) => (
                        <label key={subModule} className="submodule-label">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleSubModuleChange(moduleName, subModule, e.target.checked)}
                            />
                            {subModule.charAt(0).toUpperCase() + subModule.slice(1)}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={`profiles-container ${isMinimized ? 'minimized' : ''}`}>
            <h2>{editingProfile !== null ? 'Modifier le Profil' : 'Créer un Profil'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nom du profil"
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
                    }}
                    name="name"
                    required
                />
                <div className="modules-container">
                    {renderModuleSection('administration', editingProfile !== null ? profiles[editingProfile].modules.administration : newProfile.modules.administration, 'Administration')}
                    {renderModuleSection('issuerTSP', editingProfile !== null ? profiles[editingProfile].modules.issuerTSP : newProfile.modules.issuerTSP, 'Issuer TSP')}
                    {renderModuleSection('tokenManager', editingProfile !== null ? profiles[editingProfile].modules.tokenManager : newProfile.modules.tokenManager, 'Token Manager')}
                    {renderModuleSection('clients', editingProfile !== null ? profiles[editingProfile].modules.clients : newProfile.modules.clients, 'Clients / Institutions')}
                </div>
                <div className="button-group">
                    <button type="submit" className="submit-button">
                        {editingProfile !== null ? 'Enregistrer les modifications' : 'Ajouter Profil'}
                    </button>
                    {editingProfile !== null && (
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            {profiles.length > 0 && (
                <>
                    <h3>Liste des Profils</h3>
                    <ul>
                        {profiles.map((profile, index) => (
                            <li key={index}>
                                <div className="profile-header">
                                    <strong>{profile.name}</strong>
                                    <div className="profile-actions">
                                        <button 
                                            className="edit-button"
                                            onClick={() => handleEdit(index)}
                                            disabled={editingProfile !== null}
                                        >
                                            Modifier
                                        </button>
                                        <button 
                                            className="delete-button"
                                            onClick={() => handleDelete(index)}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                                <div className="profile-modules">
                                    {Object.entries(profile.modules)
                                        .filter(([_, moduleData]) => moduleData.access)
                                        .map(([moduleName, moduleData]) => (
                                            <div key={moduleName} className="profile-module">
                                                <span className="module-name">
                                                    {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                                                </span>
                                                <span className="submodules">
                                                    {Object.entries(moduleData.subModules)
                                                        .filter(([_, isEnabled]) => isEnabled)
                                                        .map(([subModule]) => subModule)
                                                        .join(", ")}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default Profiles;
