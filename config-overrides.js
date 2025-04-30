module.exports = function override(config, env) {
    // Ajouter la configuration pour HTTPS
    config.resolve = {
        ...config.resolve,
        fallback: {
            ...config.resolve.fallback,
            https: false,
            http: false,
            url: false
        }
    };
    return config;
}; 