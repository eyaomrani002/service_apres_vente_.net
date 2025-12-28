// src/services/authService.ts - Version complète corrigée
import axios, { AxiosError } from 'axios';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  ChangePasswordData,
  UpdateProfileData,
  ForgotPasswordData,
  ResetPasswordData,
  LoginAudit,
  UserStats
} from '../types/auth';

// Par défaut, on pointe vers la passerelle en HTTPS (cohérent avec la config Ocelot)
// Ajustez VITE_API_BASE_URL si vous utilisez un autre port/protocole.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway';

// Configuration Axios avec interceptor
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 secondes timeout
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs réseau et des réponses vides
const handleApiError = (error: any, context: string) => {
  console.error(`API Error (${context}):`, error);
  
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Erreur réseau: ${error.message}. Vérifiez votre connexion.`);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('La requête a expiré. Veuillez réessayer.');
    }
    
    if (error.code === 'ERR_EMPTY_RESPONSE') {
      throw new Error('Le serveur n\'a pas répondu. Vérifiez que l\'API Gateway est en cours d\'exécution.');
    }
    
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          throw new Error(data?.message || 'Données invalides');
        case 401:
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        case 403:
          throw new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        case 404:
          throw new Error('Ressource non trouvée');
        case 422:
          throw new Error(data?.message || 'Erreur de validation');
        case 500:
          throw new Error('Erreur serveur interne. Veuillez réessayer plus tard.');
        default:
          throw new Error(`Erreur ${status}: ${data?.message || 'Erreur inconnue'}`);
      }
    }
  }
  
  throw new Error(error.message || `Erreur inconnue lors de ${context}`);
};

// Intercepteur pour rafraîchir le token automatiquement
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh-token');
        
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        processQueue(null, newToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Échec du rafraîchissement, déconnexion
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        
        // Rediriger vers la page de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  // Authentification
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, refreshToken, ...userData } = response.data;
      
      if (token) {
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'login');
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, refreshToken, ...rest } = response.data;
      
      if (token) {
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(rest));
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'register');
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API error (proceeding anyway):', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      
      // Nettoyer le panier
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const cartKey = `cart_${user.id || 'guest'}`;
          localStorage.removeItem(cartKey);
        }
      } catch {}
    }
  },

  // Gestion de profil
  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getProfile');
    }
  },

  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Mettre à jour le localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateProfile');
    }
  },

  // Gestion des mots de passe
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      console.log('Sending password change request:', {
        oldPassword: data.oldPassword?.substring(0, 3) + '...',
        newPassword: data.newPassword?.substring(0, 3) + '...'
      });
      
      const response = await api.post('/auth/changepassword', data);
      
      console.log('Password change response:', response.data);
      
      // Vérifier si la réponse est vide
      if (!response.data) {
        console.warn('Empty response from password change endpoint');
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'changePassword');
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'forgotPassword');
    }
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'resetPassword');
    }
  },

  // Validation et vérification
  async validateToken(): Promise<{ isValid: boolean; user?: User }> {
    try {
      const response = await api.get('/auth/validate');
      return { isValid: true, user: response.data };
    } catch (error) {
      console.log('Token validation failed:', error);
      return { isValid: false };
    }
  },

  async checkPasswordExpiry(): Promise<{
    requiresChange: boolean;
    daysRemaining: number;
    message: string;
  }> {
    try {
      const response = await api.get('/auth/check-password-expiry');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'checkPasswordExpiry');
    }
  },

  // Historique et statistiques
  async getLoginHistory(days = 30): Promise<LoginAudit[]> {
    try {
      const response = await api.get(`/auth/login-history?days=${days}`);
      return response.data.audits || [];
    } catch (error) {
      throw handleApiError(error, 'getLoginHistory');
    }
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/auth/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserStats');
    }
  },

  // Gestion des tokens
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await api.post('/auth/refresh-token');
      const { token, refreshToken } = response.data;
      
      if (token) {
        localStorage.setItem('accessToken', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return { token, refreshToken };
    } catch (error) {
      throw handleApiError(error, 'refreshToken');
    }
  },

  // Utilitaires
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Vérifier si le token est expiré (simplifié)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role.toLowerCase()) || false;
  },

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    
    const userRoles = user.roles.map(r => r.toLowerCase());
    return roles.some(role => userRoles.includes(role.toLowerCase()));
  },

  // Vérifier la connectivité
  async checkConnectivity(): Promise<boolean> {
    try {
      await axios.head(API_BASE, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  },

  // Révoquer tous les tokens
  async revokeAllTokens(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.warn('Revoke all tokens error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};

export default authService;