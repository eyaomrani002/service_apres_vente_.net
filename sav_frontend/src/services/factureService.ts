import { Facture, FactureFilterParams } from '../types/facture';

const API_ROOT = (import.meta.env.VITE_INTERVENTION_API_BASE || import.meta.env.VITE_API_BASE_URL || 'https://localhost:7228/api').replace(/\/$/, '');
const BASE = `${API_ROOT}/interventions/factures`;

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
  } catch (e) {
    console.warn('Failed to read auth token', e);
  }
  return headers;
}

const buildQuery = (params: Record<string, any>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

const fetchJson = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  });
  return handleResponse(res);
};

export const factureService = {
  getAll: async (): Promise<Facture[]> => fetchJson(''),

  getById: async (id: number): Promise<Facture> => fetchJson(`/${id}`),

  getByIntervention: async (interventionId: number): Promise<Facture> =>
    fetchJson(`/intervention/${interventionId}`),

  getByNumero: async (numero: string): Promise<Facture> =>
    fetchJson(`/numero/${encodeURIComponent(numero)}`),

  getByStatut: async (statut: string): Promise<Facture[]> =>
    fetchJson(`/statut/${encodeURIComponent(statut)}`),

  getImpayees: async (): Promise<Facture[]> => fetchJson('/impayees'),

  search: async (term: string): Promise<Facture[]> =>
    fetchJson(`/search/${encodeURIComponent(term)}`),

  advancedSearch: async (params: FactureFilterParams): Promise<Facture[]> => {
    const query = buildQuery(params);
    return fetchJson(`/advanced?${query}`);
  },

  getByPeriode: async (dateDebut: string, dateFin: string): Promise<Facture[]> =>
    fetchJson(`/periode?debut=${encodeURIComponent(dateDebut)}&fin=${encodeURIComponent(dateFin)}`),

  create: async (payload: Partial<Facture>): Promise<Facture> =>
    fetchJson('', { method: 'POST', body: JSON.stringify(payload) }),

  update: async (id: number, payload: Partial<Facture>): Promise<Facture> =>
    fetchJson(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  delete: async (id: number): Promise<void> => fetchJson(`/${id}`, { method: 'DELETE' }),

  changeStatus: async (id: number, statut: string): Promise<Facture> =>
    fetchJson(`/${id}/changer-statut`, { method: 'PUT', body: JSON.stringify(statut) }),
};

export default factureService;