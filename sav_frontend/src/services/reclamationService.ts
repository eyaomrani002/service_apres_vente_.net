import { Reclamation, ReclamationStats } from '../types/reclamation';

const BASE = 'https://localhost:7076/apigateway/reclamations';

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

export const reclamationService = {
  getAll: async (): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  getById: async (id: number): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  getByClient: async (clientId: number): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/client/${clientId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  create: async (payload: Partial<Reclamation>): Promise<Reclamation> => {
    const res = await fetch(`${BASE}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  update: async (id: number, payload: Partial<Reclamation>): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleResponse(res);
  },
  getStats: async (): Promise<ReclamationStats> => {
    const res = await fetch(`${BASE}/stats`, { headers: getAuthHeaders() });
    return handleResponse(res);
  }
};

export default reclamationService;
