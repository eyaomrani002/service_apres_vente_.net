import { Intervention, InterventionStats } from '../types/intervention';

const BASE = 'https://localhost:7076/apigateway/interventions';

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

export const interventionService = {
  getAll: async (): Promise<Intervention[]> => {
    const res = await fetch(`${BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getById: async (id: number): Promise<Intervention> => {
    const res = await fetch(`${BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  create: async (payload: Partial<Intervention>): Promise<Intervention> => {
    const res = await fetch(`${BASE}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(payload) 
    });
    return handleResponse(res);
  },
  
  update: async (id: number, payload: Partial<Intervention>): Promise<Intervention> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(payload) 
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
  
  advancedSearch: async (params: Record<string, any>): Promise<Intervention[]> => {
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
  
  byReclamation: async (reclamationId: number): Promise<Intervention[]> => {
    const res = await fetch(`${BASE}/reclamation/${reclamationId}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  byTechnicien: async (technicienId: number): Promise<Intervention[]> => {
    const res = await fetch(`${BASE}/technicien/${technicienId}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  byStatut: async (statut: string): Promise<Intervention[]> => {
    const res = await fetch(`${BASE}/statut/${encodeURIComponent(statut)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  getStats: async (): Promise<InterventionStats> => {
    const res = await fetch(`${BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  }
};

export default interventionService;