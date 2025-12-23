import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  dark: boolean;
  shadow: boolean;
  toggleDark: () => void;
  toggleShadow: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('theme:dark');
      return v ? JSON.parse(v) : false;
    } catch { return false; }
  });

  const [shadow, setShadow] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('theme:shadow');
      return v ? JSON.parse(v) : true;
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('theme:dark', JSON.stringify(dark)); } catch {}
    const root = document.documentElement;
    if (dark) root.classList.add('theme-dark'); else root.classList.remove('theme-dark');
  }, [dark]);

  useEffect(() => {
    try { localStorage.setItem('theme:shadow', JSON.stringify(shadow)); } catch {}
    const root = document.documentElement;
    if (shadow) root.classList.add('with-shadow'); else root.classList.remove('with-shadow');
  }, [shadow]);

  const value: ThemeContextType = {
    dark,
    shadow,
    toggleDark: () => setDark((s) => !s),
    toggleShadow: () => setShadow((s) => !s),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
