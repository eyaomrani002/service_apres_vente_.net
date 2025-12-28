// services/articleService.ts
import { Article, ArticleStats } from '../types/article';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway';
const ARTICLE_BASE = import.meta.env.VITE_ARTICLE_BASE_URL || `${API_BASE}/articles`;

async function handleResponse(res: Response) {
  if (res.status === 401) {
    throw new Error('Non autorisé - Veuillez vous reconnecter');
  }
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = text || res.statusText || `Erreur HTTP ${res.status}`;
    
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.message || errorJson.title || errorMessage;
    } catch {
      // Garder le message texte
    }
    
    throw new Error(errorMessage);
  }
  return res.status === 204 ? null : res.json();
}

function getAuthHeaders(contentType = 'application/json'): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }
  
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Erreur lors de la récupération du token', e);
  }
  
  return headers;
}

export const articleService = {
  getAll: async (): Promise<Article[]> => {
    const res = await fetch(`${ARTICLE_BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getById: async (id: number): Promise<Article> => {
    const res = await fetch(`${ARTICLE_BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getByType: async (type: string): Promise<Article[]> => {
    const res = await fetch(`${ARTICLE_BASE}/type/${encodeURIComponent(type)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  search: async (reference: string): Promise<Article[]> => {
    const res = await fetch(`${ARTICLE_BASE}/search/${encodeURIComponent(reference)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  advancedSearch: async (params: {
    searchTerm?: string;
    type?: string;
    prixMin?: number;
    prixMax?: number;
    enStock?: boolean;
    sousGarantie?: boolean;
    sortBy?: string;
  }): Promise<Article[]> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    
    const res = await fetch(`${ARTICLE_BASE}/advanced?${query.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  create: async (article: Partial<Article>): Promise<Article> => {
    // Préparer l'objet pour le backend
    const articleData = {
      ...article,
      // S'assurer que les dates sont au bon format
      dateAchat: article.dateAchat ? new Date(article.dateAchat).toISOString() : new Date().toISOString(),
      // Les booléens doivent être envoyés comme tels
      estEnStock: article.estEnStock ?? true,
    };
    
    const res = await fetch(`${ARTICLE_BASE}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(articleData),
    });
    
    const created = await handleResponse(res);
    
    // Si on a une image dans l'article, il faut l'uploader séparément
    // Note: Vous avez déjà une méthode uploadImage séparée
    return created;
  },
  
  update: async (id: number, article: Partial<Article>): Promise<Article> => {
    const res = await fetch(`${ARTICLE_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(article),
    });
    return handleResponse(res);
  },
  
  uploadImage: async (id: number, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${ARTICLE_BASE}/${id}/upload-image`, {
      method: 'POST',
      headers: getAuthHeaders('multipart/form-data'),
      credentials: 'include',
      body: formData,
    });
    
    return handleResponse(res);
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${ARTICLE_BASE}/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getStats: async (): Promise<ArticleStats> => {
    const res = await fetch(`${ARTICLE_BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  checkGarantie: async (id: number): Promise<boolean> => {
    const res = await fetch(`${ARTICLE_BASE}/${id}/garantie`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
};

export default articleService;