// src/utils/validators/authValidators.ts
export const authValidators = {
  email: (email: string): string | null => {
    if (!email) return 'Email requis';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email invalide';
    return null;
  },
  
  password: (password: string): string | null => {
    if (!password) return 'Mot de passe requis';
    if (password.length < 6) return 'Minimum 6 caractères';
    if (password.length > 100) return 'Maximum 100 caractères';
    // Optionnel: ajouter des critères de complexité
    // if (!/(?=.*[A-Z])/.test(password)) return 'Au moins une majuscule';
    return null;
  },
  
  phone: (phone: string): string | null => {
    if (!phone) return null; // Optionnel
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone)) return 'Téléphone invalide';
    return null;
  },
  
  username: (username: string): string | null => {
    if (!username) return 'Nom d\'utilisateur requis';
    if (username.length < 3) return 'Minimum 3 caractères';
    if (username.length > 50) return 'Maximum 50 caractères';
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) return 'Caractères spéciaux non autorisés';
    return null;
  }
};