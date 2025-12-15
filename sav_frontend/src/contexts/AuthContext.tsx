import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type User = {
  id?: number;
  email?: string;
  name?: string;
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
      // Optionally fetch profile from backend. For now, keep null until login flow sets user.
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
      const res = await fetch(`${base}/Auth/login`, {
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

      // If server returned user object, use it. Otherwise try to fetch profile.
      let resolvedUser = data.user || null;
      if (!resolvedUser) {
        try {
          const profileRes = await fetch(`${base}/Auth/profile`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json().catch(() => null);
            if (profileData) resolvedUser = profileData;
          }
        } catch (err) {
          // ignore profile fetch errors; user may still be authenticated by token
        }

        // If profile endpoint is missing (404) or not returning user, fall back to decoding the JWT.
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
              name: nameParts.join(' ') || payload.name || payload.fullname || undefined,
              ...payload,
            } as any;
          }
        }
      }

      if (resolvedUser) {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
        setUser(resolvedUser);
      }
      setLoading(false);
      return { ok: true };
    } catch (err: any) {
      setLoading(false);
      return { ok: false, message: err?.message || 'Erreur connexion' };
    }
  };

  const logout = () => {
    // clear local storage and user
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    // Optionally call backend logout to clear refresh token cookie
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway';
      fetch(`${base}/Auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
