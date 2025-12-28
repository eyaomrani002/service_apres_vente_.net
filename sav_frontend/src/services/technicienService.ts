import { Technicien } from '../types/technicien';

const API_ROOT = (import.meta.env.VITE_INTERVENTION_API_BASE || import.meta.env.VITE_API_BASE_URL || 'https://localhost:7228/api').replace(/\/$/, '');
const BASE = `${API_ROOT}/techniciens`;

async function handleResponse(res: Response) {
  if (res.status === 401) throw new Error('Unauthorized');
  const text = await res.text();

  if (!res.ok) {
    try {
      const parsed = text ? JSON.parse(text) : {};
      const message = parsed.message || parsed.error || res.statusText || 'HTTP error';
      throw new Error(message);
    } catch {
      throw new Error(text || res.statusText || 'HTTP error');
    }
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as any;
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
}

const fetchJson = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  });
  return handleResponse(res);
};

export const technicienService = {
  getAll: async (): Promise<Technicien[]> => fetchJson(''),
  getDisponibles: async (): Promise<Technicien[]> => fetchJson('/disponibles'),
  getById: async (id: number): Promise<Technicien> => fetchJson(`/${id}`),
  create: async (payload: Partial<Technicien>): Promise<Technicien> =>
    fetchJson('', { method: 'POST', body: JSON.stringify(payload) }),
  update: async (id: number, payload: Partial<Technicien>): Promise<Technicien> =>
    fetchJson(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: async (id: number): Promise<void> => fetchJson(`/${id}`, { method: 'DELETE' }),
};

export default technicienService;
