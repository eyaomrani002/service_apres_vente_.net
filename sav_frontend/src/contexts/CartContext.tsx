import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Article } from '../types/article';
import AuthContext from './AuthContext';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type CartContextValue = {
  items: CartItem[];
  addItem: (article: Article, quantity?: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const getStorageKey = (userKey?: string | number | null) => {
  const part = userKey == null ? 'guest' : String(userKey);
  return `sav_cart_items_${encodeURIComponent(part)}`;
};

const resolveUserKey = (user: any): string | number | null => {
  if (!user) return null;
  // prefer stable identifiers: id (number or string), then email, then other known fields
  const cand = user.id ?? user.userId ?? user.uid ?? user.sub ?? user.email ?? null;
  return cand ?? null;
};

const resolveFallbackTokenKey = () => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;
    return token.slice(0, 12);
  } catch {
    return null;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const storageKey = useMemo(() => {
    const key = resolveUserKey(user) ?? resolveFallbackTokenKey();
    return getStorageKey(key);
  }, [user]);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load cart from storage', e);
      return [];
    }
  });

  // If the user becomes null (logout), clear in-memory cart to avoid leaking previous user's items
  useEffect(() => {
    if (!user) {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart', e);
    }
  }, [items, storageKey]);

  // When user changes, reload cart for that user and reset to empty if none
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn('Failed to load cart for user', e);
      setItems([]);
    }
  }, [storageKey]);

  const addItem = (article: Article, quantity = 1) => {
    if (!article?.id) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === article.id);
      if (existing) {
        return prev.map((i) =>
          i.id === article.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: article.id,
          name: article.nom,
          price: article.prixAchat,
          quantity,
          imageUrl: article.imageUrl,
        },
      ];
    });
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
