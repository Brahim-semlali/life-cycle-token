// Utilisateurs prédéfinis
export const PREDEFINED_USERS = {};

// Fonction pour obtenir les utilisateurs prédéfinis sous forme de tableau
export const getPredefinedUsersArray = () => {
  return Object.values(PREDEFINED_USERS);
};

// Fonction pour récupérer tous les utilisateurs (prédéfinis + personnalisés)
export const getAllUsers = async () => {
  try {
    // Ici, vous pouvez ajouter la logique pour récupérer les utilisateurs depuis votre API
    // Pour l'instant, nous retournons juste les utilisateurs prédéfinis
    return getPredefinedUsersArray();
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
};

// Fonction pour sauvegarder un utilisateur personnalisé
export const saveCustomUser = async (user) => {
  try {
    // Ici, vous pouvez ajouter la logique pour sauvegarder l'utilisateur dans votre API
    // Pour l'instant, nous retournons juste l'utilisateur
    return user;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    return null;
  }
};

// Fonction pour supprimer un utilisateur
export const deleteUser = async (id) => {
  try {
    // Ici, vous pouvez ajouter la logique pour supprimer l'utilisateur de votre API
    // Pour l'instant, nous retournons juste true
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return false;
  }
}; 