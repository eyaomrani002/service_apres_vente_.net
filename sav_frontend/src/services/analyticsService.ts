// src/services/analyticsService.ts
export const analyticsService = {
  trackLogin: (method: 'email' | 'google' | 'facebook') => {
    // Envoyer à votre service d'analytics
    console.log('Login tracked:', method);
  },
  
  trackRegistration: (source: string) => {
    console.log('Registration tracked:', source);
  },
  
  trackPageView: (page: string) => {
    console.log('Page viewed:', page);
  }
};