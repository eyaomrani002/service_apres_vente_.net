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
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ ok: false }),
  logout: () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeRoles = (roles?: any): string[] => {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles.map((r) => String(r).toLowerCase());
    return [String(roles).toLowerCase()];
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ ...parsed, roles: normalizeRoles(parsed.roles) });
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
          roles: normalizeRoles(data.roles || data.role),
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
            roles: normalizeRoles(payload.roles || payload.role),
            ...payload,
          } as User;
        }
      }
      
      // Si toujours pas d'utilisateur, créer un objet minimal
      if (!resolvedUser) {
        resolvedUser = {
          email: email,
          name: email.split('@')[0],
          roles: ['client']
        };
      }

      resolvedUser.roles = normalizeRoles(resolvedUser.roles);
      
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
    // try to remove any cart keys related to current user / token / guest
    try {
      const storedRaw = localStorage.getItem('user');
      if (storedRaw) {
        const storedUser = JSON.parse(storedRaw as string);
        const cand = storedUser?.id ?? storedUser?.userId ?? storedUser?.uid ?? storedUser?.sub ?? storedUser?.email ?? null;
        const part = cand == null ? 'guest' : String(cand);
        const key = `sav_cart_items_${encodeURIComponent(part)}`;
        localStorage.removeItem(key);
      }

      // remove token-based fallback key if present
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        const tokenKey = `sav_cart_items_${encodeURIComponent(token.slice(0, 12))}`;
        localStorage.removeItem(tokenKey);
      }

      // always remove generic guest key
      localStorage.removeItem('sav_cart_items_guest');
    } catch {}

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
      logout,
      hasRole: (role: string) => user?.roles?.includes(role.toLowerCase()) || false,
      hasAnyRole: (roles: string[]) => roles.some((r) => user?.roles?.includes(String(r).toLowerCase())),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;