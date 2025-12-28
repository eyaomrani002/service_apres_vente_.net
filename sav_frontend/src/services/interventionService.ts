// services/interventionService.ts
import { Intervention, InterventionStats, InterventionFilterParams } from '../types/intervention';

// Utilise la gateway par défaut pour aligner les autres services (clients/réclamations)
const BASE = (import.meta.env.VITE_INTERVENTION_API_BASE
  || import.meta.env.VITE_API_GATEWAY_BASE
  || 'https://localhost:7076/apigateway')
  .replace(/\/$/, '') + '/interventions';

async function handleResponse(res: Response) {
  if (res.status === 401) throw new Error('Unauthorized');
  const text = await res.text();

  if (!res.ok) {
    // Essaie de renvoyer un message d'erreur lisible
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

export const interventionService = {
  getAll: async (): Promise<Intervention[]> => fetchJson(''),

  getById: async (id: number): Promise<Intervention> => fetchJson(`/${id}`),

  create: async (payload: Partial<Intervention>): Promise<Intervention> =>
    fetchJson('', { method: 'POST', body: JSON.stringify(payload) }),

  update: async (id: number, payload: Partial<Intervention>): Promise<Intervention> =>
    fetchJson(`/${id}`, { method: 'PUT', body: JSON.stringify({ ...payload, id }) }),

  delete: async (id: number): Promise<void> => fetchJson(`/${id}`, { method: 'DELETE' }),

  advancedSearch: async (params: InterventionFilterParams): Promise<Intervention[]> => {
    const query = buildQuery(params);
    return fetchJson(`/advanced?${query}`);
  },

  byReclamation: async (reclamationId: number): Promise<Intervention[]> =>
    fetchJson(`/reclamation/${reclamationId}`),

  byTechnicien: async (technicienId: number): Promise<Intervention[]> =>
    fetchJson(`/technicien/${technicienId}`),

  byStatut: async (statut: string): Promise<Intervention[]> =>
    fetchJson(`/statut/${encodeURIComponent(statut)}`),

  gratuites: async (): Promise<Intervention[]> => fetchJson('/gratuites'),
  payantes: async (): Promise<Intervention[]> => fetchJson('/payantes'),
  enRetard: async (): Promise<Intervention[]> => fetchJson('/en-retard'),
  sansFacture: async (): Promise<Intervention[]> => fetchJson('/sans-facture'),
  search: async (term: string): Promise<Intervention[]> => fetchJson(`/search/${encodeURIComponent(term)}`),

  changeStatus: async (id: number, statut: string): Promise<Intervention> =>
    fetchJson(`/${id}/changer-statut`, { method: 'PUT', body: JSON.stringify(statut) }),

  createInvoiceForIntervention: async (id: number) =>
    fetchJson(`/${id}/creer-facture`, { method: 'POST' }),

  getStats: async (): Promise<InterventionStats> => fetchJson('/stats'),
};

export default interventionService;