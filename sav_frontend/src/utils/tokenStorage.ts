// src/utils/tokenStorage.ts
export const tokenStorage = {
  getAccessToken: () => {
    try {
      return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  },
  
  setAccessToken: (token: string, rememberMe = false) => {
    try {
      if (rememberMe) {
        localStorage.setItem('accessToken', token);
      } else {
        sessionStorage.setItem('accessToken', token);
      }
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },
  
  clearTokens: () => {
    ['accessToken', 'refreshToken', 'user'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },
  
  // Optionnel: Chiffrement simple pour les données sensibles
  encryptData: (data: string) => {
    if (!import.meta.env.VITE_ENCRYPTION_KEY) return data;
    // Implémentation de chiffrement simple
    return btoa(data);
  }
};