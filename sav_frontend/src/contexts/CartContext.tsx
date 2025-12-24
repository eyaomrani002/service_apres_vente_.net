import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Article } from '../types/article';

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

const STORAGE_KEY = 'sav_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load cart from storage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist cart', e);
    }
  }, [items]);

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
