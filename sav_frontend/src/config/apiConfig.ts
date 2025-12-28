// src/config/apiConfig.ts

const API_CONFIG = {
  // URLs des microservices via l'API Gateway
  BASE_URL: 'https://localhost:7076/apigateway',
  
  // Endpoints spécifiques
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      PROFILE: '/auth/profile',
      REFRESH_TOKEN: '/auth/refresh-token',
      LOGOUT: '/auth/logout',
      CHANGE_PASSWORD: '/auth/changepassword',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password'
    },
    
    // Clients
    CLIENTS: {
      BASE: '/clients',
      BY_ID: '/clients/:id',
      BY_EMAIL: '/clients/email/:email',
      SEARCH: '/clients/search/:term',
      ADVANCED: '/clients/advanced',
      STATS: '/clients/stats',
      WITH_RECLAMATIONS: '/clients/avec-reclamations',
      CLIENT_RECLAMATIONS: '/clients/:id/reclamations',
      UPLOAD_PHOTO: '/clients/:id/upload-photo',
      CHANGE_PASSWORD: '/clients/:id/change-password'
    },
    
    // Réclamations
    RECLAMATIONS: {
      BASE: '/reclamations',
      BY_ID: '/reclamations/:id',
      BY_CLIENT: '/reclamations/client/:clientId',
      BY_ARTICLE: '/reclamations/article/:articleId',
      SEARCH: '/reclamations/search/:term',
      ADVANCED: '/reclamations/advanced',
      STATS: '/reclamations/stats',
      DASHBOARD_STATS: '/reclamations/dashboard/stats',
      EN_RETARD: '/reclamations/en-retard',
      RESOLUES: '/reclamations/resolues',
      CHANGE_STATUS: '/reclamations/:id/changer-statut',
      ASSIGN_TECHNICIAN: '/reclamations/:id/assign-technician',
      UPLOAD_PHOTO: '/reclamations/:id/upload-photo',
      ADD_PIECE: '/reclamations/:id/add-piece',
      UPDATE_PIECE: '/reclamations/:id/update-piece/:pieceId',
      REMOVE_PIECE: '/reclamations/:id/remove-piece/:pieceId'
    },
    
    // Interventions
    INTERVENTIONS: {
      BASE: '/interventions',
      BY_ID: '/interventions/:id',
      BY_RECLAMATION: '/interventions/reclamation/:reclamationId',
      BY_TECHNICIAN: '/interventions/technicien/:technicienId',
      BY_STATUS: '/interventions/statut/:statut',
      GRATUITES: '/interventions/gratuites',
      PAYANTES: '/interventions/payantes',
      EN_RETARD: '/interventions/en-retard',
      SANS_FACTURE: '/interventions/sans-facture',
      SEARCH: '/interventions/search/:term',
      ADVANCED: '/interventions/advanced',
      CHANGE_STATUS: '/interventions/:id/changer-statut',
      CREATE_INVOICE: '/interventions/:id/creer-facture',
      STATS: '/interventions/stats'
    },
    
    // Factures
    FACTURES: {
      BASE: '/interventions/factures',
      BY_ID: '/interventions/factures/:id',
      BY_INTERVENTION: '/interventions/factures/intervention/:interventionId',
      BY_NUMBER: '/interventions/factures/numero/:numero',
      BY_STATUS: '/interventions/factures/statut/:statut',
      IMPAYEES: '/interventions/factures/impayees',
      BY_PERIOD: '/interventions/factures/periode',
      SEARCH: '/interventions/factures/search/:term',
      ADVANCED: '/interventions/factures/advanced',
      CHANGE_STATUS: '/interventions/factures/:id/changer-statut'
    }
  },
  
  // Configuration des requêtes
  REQUEST_CONFIG: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 5 * 60 * 1000 // 5 minutes
  },
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export default API_CONFIG;

// Helper pour construire les URLs
export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    });
  }
  
  return url;
};

// Helper pour gérer les erreurs API
export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      try {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // Ignore
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return response;
};