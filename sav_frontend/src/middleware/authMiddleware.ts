// src/middleware/authMiddleware.ts
import { NavigateFunction } from 'react-router-dom';

export const authMiddleware = {
  checkTokenExpiry: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  },
  
  validateRole: (userRoles: string[], requiredRoles: string[]): boolean => {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => 
      userRoles.includes(role.toLowerCase())
    );
  },
  
  redirectIfUnauthenticated: (
    isAuthenticated: boolean,
    navigate: NavigateFunction,
    fallbackPath = '/login'
  ) => {
    if (!isAuthenticated) {
      navigate(fallbackPath, { 
        replace: true,
        state: { from: window.location.pathname }
      });
      return false;
    }
    return true;
  }
};