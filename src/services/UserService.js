export const saveUser = (user) => {
    try {
        // Charger les utilisateurs existants
        let users = loadUsers();
        
        // Vérifier si l'utilisateur existe déjà
        const existingUserIndex = users.findIndex(u => u.id === user.id);
        
        if (existingUserIndex !== -1) {
            // Mettre à jour l'utilisateur existant
            users[existingUserIndex] = {
                ...users[existingUserIndex],
                ...user,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Ajouter le nouvel utilisateur
            users.push({
                ...user,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        // Sauvegarder les utilisateurs mis à jour
        localStorage.setItem('users', JSON.stringify(users));
        
        console.log('Utilisateur sauvegardé avec succès:', user);
        return user;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
        throw error;
    }
}; 