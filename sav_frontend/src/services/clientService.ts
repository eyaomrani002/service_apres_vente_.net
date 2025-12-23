import { Client, ClientStats } from '../types/client';

const BASE = 'https://localhost:7076/apigateway/clients';

async function handleResponse(res: Response) {
  if (res.status === 401) throw new Error('Unauthorized');
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
  } catch {}
  return headers;
}

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const res = await fetch(`${BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getById: async (id: number): Promise<Client> => {
    const res = await fetch(`${BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getByEmail: async (email: string): Promise<Client> => {
    const res = await fetch(`${BASE}/email/${encodeURIComponent(email)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  search: async (term: string): Promise<Client[]> => {
    const res = await fetch(`${BASE}/search/${encodeURIComponent(term)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  advancedSearch: async (params: Record<string, any>): Promise<Client[]> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { 
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v)); 
    });
    const res = await fetch(`${BASE}/advanced?${q.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  create: async (client: Partial<Client>): Promise<Client> => {
    const res = await fetch(`${BASE}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(client) 
    });
    return handleResponse(res);
  },
  
  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(client) 
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
  
  getStats: async (): Promise<ClientStats> => {
    const res = await fetch(`${BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getClientsAvecReclamations: async (): Promise<Client[]> => {
    const res = await fetch(`${BASE}/avec-reclamations`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getReclamationsForClient: async (id: number) => {
    const res = await fetch(`${BASE}/${id}/reclamations`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  }
};

export default clientService;