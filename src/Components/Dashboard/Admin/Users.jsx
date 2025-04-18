import React, { useState, useEffect } from 'react';
import { useMenu } from "../../../context/MenuContext";
import "./Users.css";

const Users = () => {
    const { isMinimized } = useMenu();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [profiles, setProfiles] = useState([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
        { id: 3, name: 'User' }
    ]);

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

    useEffect(() => {
        document.body.classList.add('users-body');
        return () => {
            document.body.classList.remove('users-body');
        };
    }, []);

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
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const userToSave = editingUser !== null ? users[editingUser] : newUser;

        if (!userToSave.firstName || !userToSave.lastName || !userToSave.email || !userToSave.username || !userToSave.password || !userToSave.profileId) {
            alert("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (editingUser !== null) {
            const updatedUsers = [...users];
            updatedUsers[editingUser] = userToSave;
            setUsers(updatedUsers);
            setEditingUser(null);
        } else {
            setUsers([...users, { ...userToSave, id: Date.now() }]);
        }

        setNewUser(emptyUser);
    };

    const handleEdit = (index) => {
        setEditingUser(index);
        setNewUser(users[index]);
    };

    const handleDelete = (index) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            const updatedUsers = users.filter((_, i) => i !== index);
            setUsers(updatedUsers);
            if (editingUser === index) {
                setEditingUser(null);
                setNewUser(emptyUser);
            }
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
        setNewUser(emptyUser);
    };

    return (
        <div className={`users-container ${isMinimized ? 'minimized' : ''}`}>
            <h2>{editingUser !== null ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</h2>
            
            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Prénom</label>
                        <input
                            type="text"
                            name="firstName"
                            value={editingUser !== null ? users[editingUser].firstName : newUser.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Nom</label>
                        <input
                            type="text"
                            name="lastName"
                            value={editingUser !== null ? users[editingUser].lastName : newUser.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={editingUser !== null ? users[editingUser].email : newUser.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            name="username"
                            value={editingUser !== null ? users[editingUser].username : newUser.username}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={editingUser !== null ? users[editingUser].password : newUser.password}
                            onChange={handleInputChange}
                            required={!editingUser}
                        />
                    </div>
                    <div className="form-group">
                        <label>Profil</label>
                        <select
                            name="profileId"
                            value={editingUser !== null ? users[editingUser].profileId : newUser.profileId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Sélectionner un profil</option>
                            {profiles.map((profile) => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Statut</label>
                        <select
                            name="status"
                            value={editingUser !== null ? users[editingUser].status : newUser.status}
                            onChange={handleInputChange}
                        >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>
                </div>

                <div className="button-group">
                    <button type="submit" className="submit-button">
                        {editingUser !== null ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                    </button>
                    {editingUser !== null && (
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            {users.length > 0 && (
                <>
                    <h3>Liste des Utilisateurs</h3>
                    <div className="users-list">
                        {users.map((user, index) => (
                            <div key={index} className="user-card">
                                <div className="user-info">
                                    <div className="user-name">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <div className="user-details">
                                        <span>{user.email}</span>
                                        <span className={`user-status ${user.status}`}>
                                            {user.status === 'active' ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <div className="user-profile">
                                        Profil : {profiles.find(p => p.id === Number(user.profileId))?.name}
                                    </div>
                                </div>
                                <div className="user-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEdit(index)}
                                        disabled={editingUser !== null}
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
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Users;