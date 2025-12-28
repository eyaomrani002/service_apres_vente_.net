// src/utils/errorHandler.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleAuthError = (error: any): string => {
  if (error.response) {
    // Erreur serveur
    switch (error.response.status) {
      case 400:
        return 'Données invalides. Vérifiez vos informations.';
      case 401:
        return 'Identifiants incorrects ou session expirée.';
      case 403:
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      case 429:
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return `Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur inconnue'}`;
    }
  } else if (error.request) {
    // Pas de réponse du serveur
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  } else {
    // Erreur de configuration
    return 'Erreur de configuration. Contactez l\'administrateur.';
  }
};