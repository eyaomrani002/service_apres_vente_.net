import { Article, ArticleStats } from '../types/article';

const BASE = 'https://localhost:7076/apigateway/articles';

async function handleResponse(res: Response) {
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || 'HTTP error');
  }
  return res.status === 204 ? null : res.json();
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    console.warn('Failed to get auth token', e);
  }
  return headers;
}

export const articleService = {
  getAll: async (): Promise<Article[]> => {
    const res = await fetch(`${BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getById: async (id: number): Promise<Article> => {
    const res = await fetch(`${BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getByType: async (type: string): Promise<Article[]> => {
    const res = await fetch(`${BASE}/type/${encodeURIComponent(type)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  search: async (reference: string): Promise<Article[]> => {
    const res = await fetch(`${BASE}/search/${encodeURIComponent(reference)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  advancedSearch: async (params: Record<string, any>): Promise<Article[]> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const res = await fetch(`${BASE}/advanced?${query.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  create: async (article: Partial<Article>): Promise<Article> => {
    const res = await fetch(`${BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(article),
    });
    return handleResponse(res);
  },
  
  update: async (id: number, article: Partial<Article>): Promise<Article> => {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(article),
    });
    return handleResponse(res);
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getStats: async (): Promise<ArticleStats> => {
    const res = await fetch(`${BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  checkGarantie: async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE}/${id}/garantie`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
};

export default articleService;