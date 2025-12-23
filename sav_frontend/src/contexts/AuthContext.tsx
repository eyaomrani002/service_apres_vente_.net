import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type User = {
  id?: number;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    } else if (token) {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Lightweight JWT decode (browser). Returns payload object or null.
  const decodeJwt = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // atob -> percent-encoding -> decodeURIComponent to support utf8
      const json = decodeURIComponent(
        atob(payload)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway';
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setLoading(false);
        return { ok: false, message: errBody.message || `Erreur ${res.status}` };
      }
      
      const data = await res.json();
      const token = data?.token || data?.Token || data?.accessToken || data?.AccessToken;
      
      if (!token) {
        setLoading(false);
        return { ok: false, message: 'Aucun token reçu du serveur' };
      }
      
      localStorage.setItem('accessToken', token);

      // D'abord essayer de récupérer les données utilisateur depuis la réponse
      let resolvedUser: User | null = null;
      
      // Si le serveur retourne des infos utilisateur dans la réponse
      if (data.email || data.userId || data.username) {
        resolvedUser = {
          id: data.userId || data.id,
          email: data.email,
          name: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          roles: data.roles || [],
          ...data
        };
      }
      
      // Si pas d'infos utilisateur dans la réponse, essayer de décoder le JWT
      if (!resolvedUser) {
        const payload = decodeJwt(token);
        if (payload) {
          const nameParts = [
            payload.firstName || payload.given_name || payload.firstname || payload.first_name,
            payload.lastName || payload.family_name || payload.lastname || payload.last_name,
          ].filter(Boolean);
          
          resolvedUser = {
            id: payload.uid || payload.sub || payload.id,
            email: payload.email || payload.Email,
            name: payload.name || payload.username || payload.sub,
            firstName: payload.firstName,
            lastName: payload.lastName,
            roles: payload.roles || payload.role || [],
            ...payload,
          } as User;
        }
      }
      
      // Si toujours pas d'utilisateur, créer un objet minimal
      if (!resolvedUser) {
        resolvedUser = {
          email: email,
          name: email.split('@')[0],
          roles: ['Client']
        };
      }
      
      // Sauvegarder l'utilisateur
      localStorage.setItem('user', JSON.stringify(resolvedUser));
      setUser(resolvedUser);
      
      setLoading(false);
      return { ok: true };
    } catch (err: any) {
      setLoading(false);
      return { ok: false, message: err?.message || 'Erreur de connexion' };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway';
      fetch(`${base}/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      }).catch(() => {});
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;