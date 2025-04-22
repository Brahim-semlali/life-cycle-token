import React, { useState, useEffect } from 'react';
import { useMenu } from "../../../context/MenuContext";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { PREDEFINED_PROFILES } from '../../../config/predefinedProfiles';
import { getAllUsers, saveCustomUser } from '../../../config/predefinedUsers';
import "./Users.css";

const Users = () => {
    const { isMinimized } = useMenu();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [profiles] = useState(Object.values(PREDEFINED_PROFILES));

    const emptyUser = {
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        profileId: '',
        status: 'active'
    };

    const [newUser, setNewUser] = useState(emptyUser);
    const [formErrors, setFormErrors] = useState({});

    // Charger les utilisateurs au démarrage
    useEffect(() => {
        document.body.classList.add('users-body');
        loadUsers();
        return () => {
            document.body.classList.remove('users-body');
        };
    }, []);

    const loadUsers = () => {
        try {
            console.log('Chargement des utilisateurs...');
            const allUsers = getAllUsers();
            
            // Trier les utilisateurs : d'abord les utilisateurs personnalisés, puis les prédéfinis
            const sortedUsers = allUsers.sort((a, b) => {
                // Si l'un est prédéfini et l'autre non, trier en conséquence
                if (a.isPredefined !== b.isPredefined) {
                    return a.isPredefined ? 1 : -1;
                }
                // Sinon, trier par nom
                return a.firstName.localeCompare(b.firstName);
            });
            
            console.log('Utilisateurs chargés et triés:', sortedUsers.map(user => ({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isPredefined: user.isPredefined
            })));
            
            setUsers(sortedUsers);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    };

    const validateForm = (user) => {
        const errors = {};
        if (!user.firstName.trim()) errors.firstName = t('users.firstNameRequired');
        if (!user.lastName.trim()) errors.lastName = t('users.lastNameRequired');
        if (!user.email.trim()) errors.email = t('users.emailRequired');
        if (!user.username.trim()) errors.username = t('users.usernameRequired');
        if (!editingUser && !user.password.trim()) errors.password = t('users.passwordRequired');
        if (!user.profileId) errors.profileId = t('users.profileRequired');
        
        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (user.email && !emailRegex.test(user.email)) {
            errors.email = t('users.invalidEmail');
        }

        // Vérifier si l'email existe déjà
        const existingUser = users.find(u => 
            u.email === user.email && 
            (!editingUser || u.email !== users[editingUser].email)
        );
        if (existingUser) {
            errors.email = t('users.emailExists');
        }

        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingUser !== null) {
            const updatedUsers = [...users];
            updatedUsers[editingUser] = {
                ...updatedUsers[editingUser],
                [name]: value
            };
            setUsers(updatedUsers);
        } else {
            setNewUser({
                ...newUser,
                [name]: value
            });
        }
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userToSave = editingUser !== null ? users[editingUser] : newUser;

        // Validation du formulaire
        const errors = validateForm(userToSave);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const now = new Date().toISOString();
            const selectedProfile = profiles.find(p => p.id === userToSave.profileId);
            
            if (!selectedProfile) {
                console.error('Profil non trouvé:', userToSave.profileId);
                alert(t('users.errorSaving'));
                return;
            }

            console.log('Profil sélectionné:', selectedProfile);
            
            const newUserWithProfile = {
                ...userToSave,
                id: editingUser !== null ? userToSave.id : `user-${Date.now()}`,
                firstName: userToSave.firstName.trim(),
                lastName: userToSave.lastName.trim(),
                email: userToSave.email.trim(),
                username: userToSave.username.trim(),
                password: userToSave.password,
                profileId: selectedProfile.id,
                profile: {
                    ...selectedProfile,
                    modules: { ...selectedProfile.modules }
                },
                status: userToSave.status || 'active',
                createdAt: editingUser !== null ? userToSave.createdAt : now,
                updatedAt: now
            };

            console.log('Tentative de sauvegarde de l\'utilisateur:', {
                ...newUserWithProfile,
                password: '***',
                profile: {
                    id: newUserWithProfile.profile.id,
                    name: newUserWithProfile.profile.name
                }
            });

            const success = await saveCustomUser(newUserWithProfile);
            
            if (success) {
                console.log('Utilisateur sauvegardé avec succès, rechargement de la liste...');
                loadUsers(); // Recharger la liste après la sauvegarde
                setNewUser(emptyUser);
                setEditingUser(null);
                setFormErrors({});
            } else {
                console.error('Erreur lors de la sauvegarde');
                alert(t('users.errorSaving'));
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert(t('users.errorSaving'));
        }
    };

    const handleEdit = (index) => {
        setEditingUser(index);
        setNewUser(users[index]);
        setFormErrors({});
    };

    const handleDelete = (index) => {
        if (window.confirm(t('users.confirmDelete'))) {
            const updatedUsers = users.filter((_, i) => i !== index);
            setUsers(updatedUsers);
            if (editingUser === index) {
                setEditingUser(null);
                setNewUser(emptyUser);
            }
            // Mettre à jour le localStorage
            const usersObj = updatedUsers.reduce((acc, user) => {
                acc[user.email] = user;
                return acc;
            }, {});
            localStorage.setItem('users', JSON.stringify(usersObj));
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
        setNewUser(emptyUser);
        setFormErrors({});
    };

    const getProfileName = (profileId) => {
        const profile = profiles.find(p => p.id === profileId);
        return profile ? profile.name : '';
    };

    return (
        <div className={`users-container ${isMinimized ? 'minimized' : ''} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <h2>{editingUser !== null ? t('users.edit') : t('users.create')}</h2>
            
            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>{t('users.firstName')}</label>
                        <input
                            type="text"
                            name="firstName"
                            value={editingUser !== null ? users[editingUser].firstName : newUser.firstName}
                            onChange={handleInputChange}
                            className={formErrors.firstName ? 'error' : ''}
                        />
                        {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
                    </div>
                    <div className="form-group">
                        <label>{t('users.lastName')}</label>
                        <input
                            type="text"
                            name="lastName"
                            value={editingUser !== null ? users[editingUser].lastName : newUser.lastName}
                            onChange={handleInputChange}
                            className={formErrors.lastName ? 'error' : ''}
                        />
                        {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t('users.email')}</label>
                        <input
                            type="email"
                            name="email"
                            value={editingUser !== null ? users[editingUser].email : newUser.email}
                            onChange={handleInputChange}
                            className={formErrors.email ? 'error' : ''}
                        />
                        {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label>{t('users.username')}</label>
                        <input
                            type="text"
                            name="username"
                            value={editingUser !== null ? users[editingUser].username : newUser.username}
                            onChange={handleInputChange}
                            className={formErrors.username ? 'error' : ''}
                        />
                        {formErrors.username && <span className="error-message">{formErrors.username}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t('users.password')}</label>
                        <input
                            type="password"
                            name="password"
                            value={editingUser !== null ? users[editingUser].password : newUser.password}
                            onChange={handleInputChange}
                            className={formErrors.password ? 'error' : ''}
                            required={!editingUser}
                        />
                        {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                    </div>
                    <div className="form-group">
                        <label>{t('users.profile')}</label>
                        <select
                            name="profileId"
                            value={editingUser !== null ? users[editingUser].profileId : newUser.profileId}
                            onChange={handleInputChange}
                            className={formErrors.profileId ? 'error' : ''}
                        >
                            <option value="">{t('users.selectProfile')}</option>
                            {profiles.map((profile) => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name}
                                </option>
                            ))}
                        </select>
                        {formErrors.profileId && <span className="error-message">{formErrors.profileId}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t('users.status')}</label>
                        <select
                            name="status"
                            value={editingUser !== null ? users[editingUser].status : newUser.status}
                            onChange={handleInputChange}
                        >
                            <option value="active">{t('users.statusActive')}</option>
                            <option value="inactive">{t('users.statusInactive')}</option>
                        </select>
                    </div>
                </div>

                <div className="button-group">
                    <button type="submit" className="submit-button">
                        {editingUser !== null ? t('users.save') : t('users.create')}
                    </button>
                    {editingUser !== null && (
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            {t('users.cancel')}
                        </button>
                    )}
                </div>
            </form>

            {users.length > 0 && (
                <>
                    <h3>{t('users.list')}</h3>
                    <ul className="users-list">
                        {users.map((user, index) => (
                            <li key={index} className="user-item">
                                <div className="user-info">
                                    <strong>{`${user.firstName} ${user.lastName}`}</strong>
                                    <span>{user.email}</span>
                                    <span>{user.username}</span>
                                    <span>{getProfileName(user.profileId)}</span>
                                    <span className={`status ${user.status}`}>
                                        {t(`users.status${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`)}
                                    </span>
                                </div>
                                <div className="user-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEdit(index)}
                                        disabled={editingUser !== null}
                                    >
                                        {t('users.edit')}
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(index)}
                                    >
                                        {t('users.delete')}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default Users;