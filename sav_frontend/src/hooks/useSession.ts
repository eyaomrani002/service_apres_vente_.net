// src/hooks/useSession.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSession = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      if (!token && window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    
    // Vérifier la session au chargement
    checkSession();
    
    // Vérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);
};