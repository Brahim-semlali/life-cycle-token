// Profils prédéfinis pour les différentes équipes
export const PREDEFINED_PROFILES = {
  // Profil Administrateur (accès complet)
  ADMIN: {
    id: 'admin',
    name: 'Administrateur',
    description: 'Accès complet à tous les modules',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    modules: {
      administration: {
        access: true,
        subModules: {
          profiles: true,
          users: true,
          security: true
        }
      },
      issuerTSP: {
        access: true,
        subModules: {
          certificates: true,
          validation: true,
          settings: true
        }
      },
      tokenManager: {
        access: true,
        subModules: {
          tokens: true,
          distribution: true,
          monitoring: true
        }
      },
      clients: {
        access: true,
        subModules: {
          management: true,
          contracts: true,
          billing: true
        }
      }
    }
  },

  // Profil pour l'équipe sécurité (accès uniquement au module administration)
  SECURITY_TEAM: {
    id: 'security-team',
    name: 'Équipe Sécurité',
    description: 'Accès uniquement au module administration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    modules: {
      administration: {
        access: true,
        subModules: {
          profiles: true,
          users: true,
          security: true
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
  },
  
  // Profil pour l'équipe de la banque (accès uniquement au module Issuer TSP)
  BANK_TEAM: {
    id: 'bank-team',
    name: 'Équipe Banque',
    description: 'Accès uniquement au module Issuer TSP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
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
        access: true,
        subModules: {
          certificates: true,
          validation: true,
          settings: true
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
  },
  
  // Profil pour l'équipe call center (accès uniquement au module Token Manager)
  CALL_CENTER_TEAM: {
    id: 'call-center-team',
    name: 'Équipe Call Center',
    description: 'Accès uniquement au module Token Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
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
        access: true,
        subModules: {
          tokens: true,
          distribution: true,
          monitoring: true
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
  }
};

// Fonction pour obtenir les profils prédéfinis sous forme de tableau
export const getPredefinedProfilesArray = () => {
  return Object.values(PREDEFINED_PROFILES);
}; 