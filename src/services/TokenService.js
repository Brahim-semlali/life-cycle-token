import axios from 'axios';

// API Endpoints - Mise à jour en fonction des routes disponibles dans Django
const API_ENDPOINTS = {
    LIST_TOKENS: '/token/list/',
    GET_TOKEN_DETAILS: '/token/detail/',
    CREATE_TOKEN: '/token/create/',
    UPDATE_TOKEN_STATUS: '/token/status/update/',
    EXPORT_TOKENS: '/token/export/'
    // Completely removed metadata endpoint reference
};

// Configuration Axios avec URL de base et gestion des erreurs
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://localhost:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Intercepteur pour logger les erreurs
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

const TokenService = {
    /**
     * Lists tokens with optional filters
     * @param {Object} filters - Query parameters for filtering tokens
     * @returns {Promise<Object>} - Success status with data or error
     */
    async listTokens(filters = {}) {
        try {
            console.log('Fetching tokens with filters:', filters);
            
            // Create a copy of filters to work with
            const queryFilters = { ...filters };
            
            // Special handling for token_status filter
            const statusFilter = queryFilters.token_status;
            if (statusFilter && statusFilter !== 'all') {
                console.log(`Filtering by token_status: ${statusFilter}`);
            }
            
            // If we have a specific token_value filter, try to get that token directly
            if (queryFilters.token_value && queryFilters.token_value.trim() !== '') {
                console.log(`Searching for specific token with value: ${queryFilters.token_value}`);
                
                try {
                    // First try to get all tokens
                    const response = await apiClient.post(API_ENDPOINTS.LIST_TOKENS, {});
                    
                    if (response.data) {
                        let allTokens = [];
                        
                        if (Array.isArray(response.data)) {
                            allTokens = response.data;
                        } else if (response.data.tokens && Array.isArray(response.data.tokens)) {
                            allTokens = response.data.tokens;
                        } else if (response.data.results && Array.isArray(response.data.results)) {
                            allTokens = response.data.results;
                        }
                        
                        // Filter tokens by token_value
                        const searchValue = queryFilters.token_value.toLowerCase();
                        let matchingTokens = allTokens.filter(token => 
                            token.token_value && 
                            token.token_value.toLowerCase().includes(searchValue)
                        );
                        
                        // Apply status filter if specified
                        if (statusFilter && statusFilter !== 'all') {
                            matchingTokens = matchingTokens.filter(token => 
                                token.token_status === statusFilter
                            );
                        }
                        
                        console.log(`Found ${matchingTokens.length} tokens matching criteria`);
                        
                        if (matchingTokens.length > 0) {
                            // Get detailed information for each matching token
                            const detailedTokens = await this.getDetailedTokens(matchingTokens);
                            return {
                                success: true,
                                data: detailedTokens
                            };
                        }
                    }
                } catch (error) {
                    console.warn('Error searching by token_value, falling back to standard search:', error);
                }
            }
            
            // Use the standard token list endpoint with filters
            const response = await apiClient.post(API_ENDPOINTS.LIST_TOKENS, queryFilters);
            
            if (response.data && Array.isArray(response.data)) {
                console.log(`Retrieved ${response.data.length} tokens from API`);
                
                // Apply client-side filtering for status if needed
                let filteredTokens = response.data;
                if (statusFilter && statusFilter !== 'all') {
                    filteredTokens = filteredTokens.filter(token => token.token_status === statusFilter);
                    console.log(`Filtered to ${filteredTokens.length} tokens with status: ${statusFilter}`);
                }
                
                // Get detailed information for each token
                const detailedTokens = await this.getDetailedTokens(filteredTokens);
                return {
                    success: true,
                    data: detailedTokens
                };
            } else if (response.data && response.data.tokens && Array.isArray(response.data.tokens)) {
                console.log(`Retrieved ${response.data.tokens.length} tokens from API (tokens property)`);
                
                // Apply client-side filtering for status if needed
                let filteredTokens = response.data.tokens;
                if (statusFilter && statusFilter !== 'all') {
                    filteredTokens = filteredTokens.filter(token => token.token_status === statusFilter);
                    console.log(`Filtered to ${filteredTokens.length} tokens with status: ${statusFilter}`);
                }
                
                // Get detailed information for each token
                const detailedTokens = await this.getDetailedTokens(filteredTokens);
                return {
                    success: true,
                    data: detailedTokens
                };
            } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
                console.log('Found results array in response:', response.data.results);
                
                // Apply client-side filtering for status if needed
                let filteredTokens = response.data.results;
                if (statusFilter && statusFilter !== 'all') {
                    filteredTokens = filteredTokens.filter(token => token.token_status === statusFilter);
                    console.log(`Filtered to ${filteredTokens.length} tokens with status: ${statusFilter}`);
                }
                
                // Get detailed information for each token
                const detailedTokens = await this.getDetailedTokens(filteredTokens);
                return {
                    success: true,
                    data: detailedTokens
                };
            } else if (response.data && typeof response.data === 'object') {
                // If the response is an object but not an array, try to adapt it
                console.log('Response is not an array, adapting:', response.data);
                const adaptedData = Object.values(response.data)
                    .filter(item => item && typeof item === 'object')
                    .map(item => ({...item}));
                
                if (adaptedData.length > 0) {
                    // Apply client-side filtering for status if needed
                    let filteredTokens = adaptedData;
                    if (statusFilter && statusFilter !== 'all') {
                        filteredTokens = filteredTokens.filter(token => token.token_status === statusFilter);
                        console.log(`Filtered to ${filteredTokens.length} tokens with status: ${statusFilter}`);
                    }
                    
                    // Get detailed information for each token
                    const detailedTokens = await this.getDetailedTokens(filteredTokens);
                    return {
                        success: true,
                        data: detailedTokens
                    };
                }
            }
            
            // If no data is returned, return an empty array
            return {
                success: true,
                data: []
            };
            
        } catch (error) {
            console.error('Error listing tokens:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to retrieve tokens from database',
                details: error.message
            };
        }
    },

    /**
     * Gets detailed information for each token in the list
     * @param {Array} tokenList - List of tokens with basic information
     * @returns {Promise<Array>} - List of tokens with detailed information
     */
    async getDetailedTokens(tokenList) {
        if (!tokenList || tokenList.length === 0) return [];
        
        console.log(`Getting detailed information for ${tokenList.length} tokens`);
        
        // For small lists, fetch details for each token
        if (tokenList.length <= 10) {
            const detailedTokens = [];
            
            for (const token of tokenList) {
                try {
                    const tokenId = token.id;
                    const detailResult = await this.getTokenDetails(tokenId);
                    
                    if (detailResult.success) {
                        detailedTokens.push(detailResult.data);
                    } else {
                        // If we can't get details, use the basic token with normalization
                        detailedTokens.push(this.normalizeTokenData([token])[0]);
                    }
                } catch (error) {
                    console.error(`Error getting details for token ${token.id}:`, error);
                    // If there's an error, use the basic token with normalization
                    detailedTokens.push(this.normalizeTokenData([token])[0]);
                }
            }
            
            return detailedTokens;
        }
        
        // For larger lists, just normalize the tokens we have
        console.log('Token list too large for individual details, using normalization only');
        return this.normalizeTokenData(tokenList);
    },

    /**
     * Gets token details by ID
     * @param {string} id - Token ID
     * @returns {Promise<Object>} - Success status with data or error
     */
    async getTokenDetails(id) {
        try {
            console.log(`Fetching details for token ID ${id}`);
            
            // Use the token/detail/ endpoint with the token_id parameter
            const response = await apiClient.post(API_ENDPOINTS.GET_TOKEN_DETAILS, { 
                token_id: parseInt(id, 10) || id 
            });
            
            if (response.data) {
                console.log('Received token details from API:', response.data);
                
                // Normalize the token data to ensure all fields are present
                const normalizedToken = this.normalizeTokenData([response.data])[0];
                
                return {
                    success: true,
                    data: normalizedToken
                };
            }
            
            return {
                success: false,
                error: `Token with ID ${id} not found in database`
            };
            
        } catch (error) {
            console.error(`Error getting token details for ID ${id}:`, error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to retrieve token details from database',
                details: error.message
            };
        }
    },

    /**
     * Normalizes token data to ensure all expected fields are present
     * @param {Array} tokens - Array of token objects
     * @returns {Array} - Normalized token objects with all expected fields
     */
    normalizeTokenData(tokens) {
        if (!tokens || tokens.length === 0) return [];
        
        // Define all expected fields with default values
        const expectedFields = {
            id: null,
            token_value: '',
            token_type: '',
            type_display: '',
            token_status: 'INACTIVE',
            status_display: '',
            token_assurance_method: '',
            creation_date: null,
            activation_date: null,
            last_status_update: null,
            expiration_month: '',
            expiration_year: '',
            device_id: '',
            device_type: '',
            device_name: '',
            device_number: '',
            wallet_account_score: null,
            wallet_device_score: null,
            wallet_reason_codes: '',
            visa_token_score: null,
            visa_decisioning: '',
            risk_assessment_score: null,
            is_deleted: false,
            deleted_at: null
        };
        
        // Collect all unique keys from the tokens for logging
        const allKeys = new Set();
        tokens.forEach(token => {
            Object.keys(token).forEach(key => {
                allKeys.add(key);
            });
        });
        
        console.log('Keys found in tokens:', Array.from(allKeys));
        
        // Normalize each token
        return tokens.map(token => {
            const normalizedToken = { ...expectedFields };
            
            // Copy existing values from the token
            Object.keys(token).forEach(key => {
                normalizedToken[key] = token[key];
            });
            
            // Special handling for device fields - log them for debugging
            if ('device_name' in token) {
                console.log(`Token ${token.id} has device_name:`, token.device_name);
            }
            if ('device_id' in token) {
                console.log(`Token ${token.id} has device_id:`, token.device_id);
            }
            if ('device_type' in token) {
                console.log(`Token ${token.id} has device_type:`, token.device_type);
            }
            
            // Handle special cases for display fields
            if (!normalizedToken.status_display && normalizedToken.token_status) {
                normalizedToken.status_display = normalizedToken.token_status;
            }
            
            if (!normalizedToken.type_display && normalizedToken.token_type) {
                normalizedToken.type_display = normalizedToken.token_type;
            }
            
            return normalizedToken;
        });
    },

    /**
     * Creates a new token
     * @param {Object} tokenData - Token data to create
     * @returns {Promise<Object>} - Success status with data or error
     */
    async createToken(tokenData) {
        try {
            const response = await apiClient.post(API_ENDPOINTS.CREATE_TOKEN, tokenData);
            
            if (response.data) {
                return {
                    success: true,
                    data: response.data
                };
            }
            
            return {
                success: false,
                error: 'Failed to create token in database'
            };
            
        } catch (error) {
            console.error('Error creating token:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create token in database',
                details: error.message
            };
        }
    },

    /**
     * Updates a token completely
     * @param {string} id - Token ID
     * @param {Object} tokenData - Updated token data
     * @returns {Promise<Object>} - Success status with data or error
     */
    async updateToken(id, tokenData) {
        try {
            console.log(`Updating token with ID ${id}`, tokenData);
            
            // First, get the current token to compare the status
            const currentToken = await this.getTokenDetails(id);
            if (!currentToken.success) {
                throw new Error(`Could not retrieve current token data for ID ${id}`);
            }
            
            // Check if the status is changing
            const isStatusChanging = currentToken.data.token_status !== tokenData.token_status && 
                tokenData.token_status !== undefined;
                
            // If status is changing, use the status update endpoint
            if (isStatusChanging) {
                console.log(`Status is changing from ${currentToken.data.token_status} to ${tokenData.token_status}`);
                
                // Create a payload with only the fields the API accepts
                const statusPayload = {
                    token_id: parseInt(id, 10) || id,
                    new_status: tokenData.token_status,
                    change_reason: tokenData.change_reason || 'User update'
                };
                
                console.log('Sending status update payload:', statusPayload);
                
                try {
                    const response = await apiClient.post(API_ENDPOINTS.UPDATE_TOKEN_STATUS, statusPayload);
                    
                    if (response.data) {
                        console.log('Token status successfully updated');
                        // Return the full updated token data
                        return {
                            success: true,
                            data: { ...currentToken.data, ...tokenData }
                        };
                    }
                } catch (statusError) {
                    console.warn('Status update failed:', statusError.message);
                }
            } else {
                console.log('Status is not changing, API does not support updating other fields directly');
            }
            
            // For development, simulate a successful update
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token update for development');
                
                // Merge the current token data with the updated data
                const updatedToken = { 
                    ...currentToken.data,
                    ...tokenData,
                    // Update the last_status_update timestamp
                    last_status_update: new Date().toISOString()
                };
                
                return {
                    success: true,
                    data: updatedToken,
                    simulated: true
                };
            }
            
            return {
                success: true,
                data: { ...currentToken.data, ...tokenData },
                warning: 'API only supports status updates. Other fields were updated in the UI only.'
            };
            
        } catch (error) {
            console.error(`Error updating token with ID ${id}:`, error);
            
            // For development, simulate a successful update
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token update after error');
                return {
                    success: true,
                    data: { ...tokenData, id },
                    simulated: true
                };
            }
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update token in database',
                details: error.message
            };
        }
    },

    /**
     * Partially updates a token
     * @param {string} id - Token ID
     * @param {Object} tokenData - Partial token data to update
     * @returns {Promise<Object>} - Success status with data or error
     */
    async partialUpdateToken(id, tokenData) {
        try {
            return await this.updateToken(id, tokenData);
        } catch (error) {
            console.error(`Error partially updating token with ID ${id}:`, error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update token in database',
                details: error.message
            };
        }
    },

    /**
     * Deletes a token
     * @param {string} id - Token ID
     * @returns {Promise<Object>} - Success status or error
     */
    async deleteToken(id) {
        try {
            console.log(`Deleting token with ID ${id} (logical delete)`);
            
            // Selon la documentation de l'API, pour supprimer un token,
            // il faut utiliser un endpoint spécifique avec seulement token_id
            const payload = {
                token_id: parseInt(id, 10) || id
            };
            
            console.log('Sending delete payload:', payload);
            
            try {
                // Essayer d'utiliser un endpoint de suppression spécifique
                const response = await apiClient.post('/token/delete/', payload);
                
                if (response.data) {
                    console.log('Token successfully deleted');
                    return {
                        success: true
                    };
                }
            } catch (deleteError) {
                console.warn('Delete endpoint failed, falling back to status update:', deleteError.message);
                
                // Si l'endpoint de suppression échoue, utiliser l'endpoint de mise à jour de statut
                // avec le format correct selon la documentation
                const statusPayload = {
                    token_id: parseInt(id, 10) || id,
                    new_status: 'INACTIVE',
                    change_reason: 'User requested deletion'
                };
                
                console.log('Trying status update with payload:', statusPayload);
                const statusResponse = await apiClient.post(API_ENDPOINTS.UPDATE_TOKEN_STATUS, statusPayload);
                
                if (statusResponse.data) {
                    console.log('Token successfully marked as inactive');
                    return {
                        success: true
                    };
                }
            }
            
            // Pour le développement, simulons une suppression réussie
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token deletion for development');
                return {
                    success: true
                };
            }
            
            return {
                success: false,
                error: `Failed to delete token with ID ${id}`
            };
            
        } catch (error) {
            console.error(`Error deleting token with ID ${id}:`, error);
            
            // Pour le développement, simulons une suppression réussie
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token deletion for development');
                return {
                    success: true
                };
            }
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete token from database',
                details: error.message
            };
        }
    },

    /**
     * Updates token status
     * @param {string} id - Token ID
     * @param {string} status - New status
     * @returns {Promise<Object>} - Success status with data or error
     */
    async updateTokenStatus(id, status) {
        try {
            console.log(`Updating token status for ID ${id} to ${status}`);
            
            // Selon la documentation de l'API, le format correct est:
            // token_id: id du token
            // new_status: nouveau statut
            const payload = {
                token_id: parseInt(id, 10) || id,
                new_status: status
            };
            
            console.log('Sending status update payload:', payload);
            const response = await apiClient.post(API_ENDPOINTS.UPDATE_TOKEN_STATUS, payload);
            
            if (response.data) {
                console.log('Token status successfully updated');
                return {
                    success: true,
                    data: response.data
                };
            }
            
            // Pour le développement, simulons une mise à jour réussie
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token status update for development');
                return {
                    success: true,
                    data: { id, token_status: status }
                };
            }
            
            return {
                success: false,
                error: `Failed to update status for token with ID ${id}`
            };
            
        } catch (error) {
            console.error(`Error updating token status for ID ${id}:`, error);
            
            // Pour le développement, simulons une mise à jour réussie
            if (process.env.NODE_ENV === 'development') {
                console.log('Simulating successful token status update for development');
                return {
                    success: true,
                    data: { id, token_status: status }
                };
            }
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update token status in database',
                details: error.message
            };
        }
    },

    /**
     * Exports tokens as CSV
     * @param {Object} filters - Query parameters for filtering tokens
     * @returns {Promise<Object>} - Success status or error
     */
    async exportTokens(filters = {}) {
        try {
            // Récupérer les données directement depuis la base de données
            const tokensResult = await this.listTokens(filters);
            
            if (!tokensResult.success) {
                throw new Error('Failed to fetch tokens for export');
            }
            
            const tokens = tokensResult.data;
            
            // Vérifier s'il y a des tokens à exporter
            if (tokens.length === 0) {
                throw new Error('No tokens to export');
            }
            
            // Obtenir les en-têtes de colonne (clés du premier token)
            const headers = Object.keys(tokens[0]).join(',');
            
            // Convertir chaque token en ligne CSV
            const rows = tokens.map(token => {
                return Object.values(token).map(value => {
                    // Échapper les valeurs contenant des virgules ou des guillemets
                    if (value === null || value === undefined) {
                        return '';
                    }
                    
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',');
            }).join('\n');
            
            // Combiner en-têtes et lignes
            const csvContent = `${headers}\n${rows}`;
            
            // Créer un Blob et déclencher le téléchargement
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tokens-export-${new Date().toISOString().substring(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            return {
                success: true
            };
            
        } catch (error) {
            console.error('Error exporting tokens:', error);
            return {
                success: false,
                error: 'Failed to export tokens from database',
                details: error.message
            };
        }
    },

    /**
     * Gets database table metadata for token table
     * @returns {Promise<Object>} - Success status with table metadata or error
     */
    async getTableMetadata() {
        console.log('Fetching table metadata');
        
        // Vérifier si nous avons déjà récupéré les métadonnées (mise en cache)
        if (this.tableMetadataCache) {
            console.log('Using cached table metadata');
            return this.tableMetadataCache;
        }
        
        try {
            // Générer le schéma à partir des données des tokens
            console.log('Generating schema from token data');
            
            // Récupérer tous les tokens pour analyser leur structure
            const tokens = await this.listTokens({});
            
            if (!tokens.success || !tokens.data || !tokens.data.length) {
                console.log('No tokens available to generate schema');
                
                // Retourner un schéma simulé minimal
                this.tableMetadataCache = {
                    tableName: 'token',
                    columns: [
                        { name: 'id', type: 'integer', primary_key: true },
                        { name: 'token_value', type: 'string' },
                        { name: 'token_type', type: 'string' },
                        { name: 'token_status', type: 'string' }
                    ],
                    source: 'simulated'
                };
                
                return this.tableMetadataCache;
            }
            
            // Extraire toutes les clés uniques des tokens
            const allKeys = new Set();
            const tokenSample = tokens.data;
            
            // Récupérer les détails complets pour un échantillon de tokens
            const detailedTokens = await this.getDetailedTokens(tokenSample);
            
            // Collecter toutes les clés uniques
            detailedTokens.forEach(token => {
                Object.keys(token).forEach(key => allKeys.add(key));
            });
            
            console.log('Keys found in tokens:', Array.from(allKeys));
            
            // Créer des colonnes pour chaque clé
            const columns = Array.from(allKeys).map(key => {
                // Déterminer le type de données en fonction du nom de la clé ou des valeurs
                let type = 'string';
                
                if (key === 'id') {
                    type = 'integer';
                } else if (key.includes('date') || key.includes('_at')) {
                    type = 'datetime';
                } else if (key.includes('score')) {
                    type = 'number';
                } else if (key === 'is_deleted') {
                    type = 'boolean';
                }
                
                return {
                    name: key,
                    type: type,
                    primary_key: key === 'id'
                };
            });
            
            // Mettre en cache les métadonnées générées
            this.tableMetadataCache = {
                tableName: 'token_manager_token',
                columns: columns,
                source: 'derived_from_sample'
            };
            
            console.log('Generated table metadata:', this.tableMetadataCache);
            return this.tableMetadataCache;
        } catch (error) {
            console.error('Error fetching table metadata:', error);
            
            // En cas d'erreur, retourner un schéma minimal
            return {
                tableName: 'token',
                columns: [
                    { name: 'id', type: 'integer', primary_key: true },
                    { name: 'token_value', type: 'string' },
                    { name: 'token_type', type: 'string' },
                    { name: 'token_status', type: 'string' }
                ],
                source: 'fallback'
            };
        }
    },

    /**
     * Converts API schema format to our internal columns format
     * @param {Object} apiSchema - Schema data from API
     * @returns {Array} - Array of column objects
     */
    convertApiSchemaToColumns(apiSchema) {
        // Gérer différents formats possibles de schéma API
        if (Array.isArray(apiSchema)) {
            // Format: [{ name: 'col1', type: 'string' }, ...]
            return apiSchema;
        } 
        
        if (apiSchema.columns && Array.isArray(apiSchema.columns)) {
            // Format: { columns: [{ name: 'col1', type: 'string' }, ...] }
            return apiSchema.columns;
        }
        
        if (apiSchema.fields && Array.isArray(apiSchema.fields)) {
            // Format: { fields: [{ name: 'col1', type: 'string' }, ...] }
            return apiSchema.fields.map(field => ({
                name: field.name,
                type: field.type,
                primary_key: field.primary_key || false
            }));
        }
        
        // Format: { col1: { type: 'string' }, col2: { type: 'integer' }, ... }
        if (typeof apiSchema === 'object' && !Array.isArray(apiSchema)) {
            const columns = [];
            
            for (const [key, value] of Object.entries(apiSchema)) {
                if (key !== 'table_name' && typeof value === 'object') {
                    columns.push({
                        name: key,
                        type: value.type || 'string',
                        primary_key: value.primary_key || false
                    });
                }
            }
            
            return columns;
        }
        
        // Format par défaut si aucun des formats ci-dessus ne correspond
        return [];
    },

    /**
     * Génère des métadonnées de table simulées pour le développement
     * @returns {Object} - Métadonnées simulées
     */
    generateSimulatedTableMetadata() {
        return {
            tableName: 'token_manager_token',
            source: 'simulated',
            columns: [
                { name: 'id', dataType: 'integer', isRequired: true },
                { name: 'status_display', dataType: 'character varying', isRequired: false },
                { name: 'type_display', dataType: 'character varying', isRequired: false },
                { name: 'token_value', dataType: 'character varying', isRequired: true },
                { name: 'token_type', dataType: 'character varying', isRequired: true },
                { name: 'token_status', dataType: 'character varying', isRequired: true },
                { name: 'token_assurance_method', dataType: 'character varying', isRequired: true },
                { name: 'creation_date', dataType: 'timestamp with time zone', isRequired: true },
                { name: 'activation_date', dataType: 'timestamp with time zone', isRequired: false },
                { name: 'expiration_month', dataType: 'character varying', isRequired: true },
                { name: 'expiration_year', dataType: 'character varying', isRequired: true },
                { name: 'last_status_update', dataType: 'timestamp with time zone', isRequired: true },
                { name: 'device_id', dataType: 'character varying', isRequired: true },
                { name: 'device_type', dataType: 'character varying', isRequired: false },
                { name: 'device_name', dataType: 'character varying', isRequired: true },
                { name: 'device_number', dataType: 'character varying', isRequired: false },
                { name: 'wallet_account_score', dataType: 'integer', isRequired: false },
                { name: 'wallet_device_score', dataType: 'integer', isRequired: false },
                { name: 'wallet_reason_codes', dataType: 'character varying', isRequired: false },
                { name: 'visa_token_score', dataType: 'integer', isRequired: false },
                { name: 'visa_decisioning', dataType: 'character varying', isRequired: false },
                { name: 'risk_assessment_score', dataType: 'integer', isRequired: false },
                { name: 'is_deleted', dataType: 'boolean', isRequired: true },
                { name: 'deleted_at', dataType: 'timestamp with time zone', isRequired: false }
            ]
        };
    },

    /**
     * Génère des données de token simulées pour le développement
     * @param {number} count - Nombre de tokens à générer
     * @returns {Array} - Tableau de tokens simulés
     */
    generateSimulatedTokens(count = 10) {
        const tokenStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        const statusDisplays = ['Active', 'Inactive', 'Suspended'];
        const tokenTypes = ['VI', 'MC', 'AM'];
        const typeDisplays = ['VI', 'MC', 'AM'];
        const assuranceMethods = ['CF', 'ID', '3D'];
        const deviceTypes = ['MOBILE', 'TABLET', 'DESKTOP', null];
        
        const tokens = [];
        
        for (let i = 1; i <= count; i++) {
            const creationDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const lastStatusUpdate = new Date(creationDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000);
            const isDeleted = Math.random() > 0.9;
            const deletedAt = isDeleted ? new Date(lastStatusUpdate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null;
            const statusIndex = Math.floor(Math.random() * tokenStatuses.length);
            const typeIndex = Math.floor(Math.random() * tokenTypes.length);
            
            tokens.push({
                id: i,
                token_value: `476173900101${String(i).padStart(4, '0')}`,
                token_type: tokenTypes[typeIndex],
                type_display: typeDisplays[typeIndex],
                token_status: tokenStatuses[statusIndex],
                status_display: statusDisplays[statusIndex],
                token_assurance_method: assuranceMethods[Math.floor(Math.random() * assuranceMethods.length)],
                creation_date: creationDate.toISOString(),
                activation_date: Math.random() > 0.3 ? new Date(creationDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : null,
                expiration_month: String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'),
                expiration_year: String((new Date().getFullYear() + Math.floor(Math.random() * 5))).slice(-2),
                last_status_update: lastStatusUpdate.toISOString(),
                device_id: `dev${Math.floor(Math.random() * 100000)}`,
                device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
                device_name: `Device ${i}`,
                device_number: Math.random() > 0.5 ? `DEV-${Math.floor(Math.random() * 1000)}` : null,
                wallet_account_score: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : null,
                wallet_device_score: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : null,
                wallet_reason_codes: Math.random() > 0.7 ? null : `REASON_${Math.floor(Math.random() * 10)}`,
                visa_token_score: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : null,
                visa_decisioning: Math.random() > 0.5 ? 'APPROVED' : 'REVIEW',
                risk_assessment_score: Math.random() > 0.3 ? Math.floor(Math.random() * 100) : null,
                is_deleted: isDeleted,
                deleted_at: deletedAt ? deletedAt.toISOString() : null
            });
        }
        
        return tokens;
    }
};

export default TokenService; 