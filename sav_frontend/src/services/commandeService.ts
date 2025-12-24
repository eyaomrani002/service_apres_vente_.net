import { Article } from '../types/article';

const BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7076/apigateway'}/commandes`;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (err) {
    console.warn('Auth header error', err);
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || 'HTTP error');
  }
  return res.status === 204 ? (null as T) : res.json();
}

export interface CommandePayload {
  clientId: number;
  lignes: Array<{ articleId: number; quantite: number; prixUnitaire: number }>;
  statut?: string;
}

export interface CommandeResponse {
  id: number;
  clientId: number;
  total: number;
  statut: string;
  lignes: Array<{ id: number; articleId: number; quantite: number; prixUnitaire: number; montantLigne: number }>;
}

export const commandeService = {
  create: async (payload: CommandePayload): Promise<CommandeResponse> => {
    const res = await fetch(`${BASE}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ClientId: payload.clientId,
        Lignes: payload.lignes.map((l) => ({
          ArticleId: l.articleId,
          Quantite: l.quantite,
          PrixUnitaire: l.prixUnitaire,
        })),
        Statut: payload.statut,
      }),
    });
    return handleResponse(res);
  },

  getByClient: async (clientId: number): Promise<CommandeResponse[]> => {
    const res = await fetch(`${BASE}/client/${clientId}`, {
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

export default commandeService;
