/**
 * Service pour gérer le stockage sécurisé des tokens JWT
 */
const TokenStorage = {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data',
    EXPIRY_KEY: 'token_expiry',

    /**
     * Sauvegarde le token JWT dans le localStorage
     * @param {string} token - Le token JWT à stocker
     * @param {number} expiresIn - Durée de validité du token en minutes
     */
    setToken(token, expiresIn = 30) {
        if (!token) return;
        
        localStorage.setItem(this.TOKEN_KEY, token);
        
        // Calculer l'heure d'expiration et la stocker
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + expiresIn);
        localStorage.setItem(this.EXPIRY_KEY, expiryTime.getTime().toString());
        
        console.log(`Token stocké avec expiration dans ${expiresIn} minutes`);
    },

    /**
     * Récupère le token JWT depuis le localStorage
     * @returns {string|null} Le token JWT ou null
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Vérifie si le token est présent et valide
     * @returns {boolean} Vrai si le token est présent et non expiré
     */
    isTokenValid() {
        const token = this.getToken();
        if (!token) return false;
        
        const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
        if (!expiryTime) return false;
        
        // Vérifier si le token a expiré
        return parseInt(expiryTime, 10) > new Date().getTime();
    },

    /**
     * Stocke les informations de l'utilisateur connecté
     * @param {Object} userData - Données de l'utilisateur à stocker
     */
    setUser(userData) {
        if (!userData) return;
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    },

    /**
     * Récupère les informations de l'utilisateur
     * @returns {Object|null} Données de l'utilisateur ou null
     */
    getUser() {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Efface les données d'authentification
     */
    clear() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.EXPIRY_KEY);
        console.log('Données d\'authentification effacées');
    },

    /**
     * Calcule le temps restant avant expiration du token en secondes
     * @returns {number} Secondes restantes ou 0 si expiré
     */
    getTimeToExpiry() {
        const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
        if (!expiryTime) return 0;
        
        const timeLeft = parseInt(expiryTime, 10) - new Date().getTime();
        return Math.max(0, Math.floor(timeLeft / 1000));
    }
};

export default TokenStorage; 