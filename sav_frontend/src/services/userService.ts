import axios from 'axios';
import { AppUser } from '../types/user';

// Aligner l'origine sur la gateway HTTPS pour éviter les 401 quand Vite proxifie en http://localhost:5173
const API_BASE = (
  (import.meta.env.VITE_API_GATEWAY_BASE as string | undefined)
  || (import.meta.env.VITE_API_BASE_URL as string | undefined)
  || 'https://localhost:7076/apigateway'
).replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeUsersResponse = (payload: unknown): AppUser[] => {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && payload !== null) {
    const candidate = (payload as Record<string, unknown>).users;
    if (Array.isArray(candidate)) return candidate as AppUser[];
    const candidate2 = (payload as Record<string, unknown>).data;
    if (Array.isArray(candidate2)) return candidate2 as AppUser[];
  }
  throw new Error('Le backend n\'a pas renvoyé une liste d\'utilisateurs valide.');
};

export async function getUsers(): Promise<AppUser[]> {
  try {
    const response = await axios.get(`${API_BASE}/auth/users`, {
      headers: {
        ...getAuthHeaders(),
      },
      withCredentials: true,
      // Eviter les requêtes parallèles de pré-chargement qui peuvent être annulées côté gateway
      signal: undefined,
    });

    return normalizeUsersResponse(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Erreur lors du chargement des utilisateurs';
      const wrapped = new Error(message);
      (wrapped as any).status = status;
      throw wrapped;
    }
    throw error;
  }
}

export async function addRoleToUser(userId: string, role: string): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE}/auth/addrole`,
      { UserId: userId, Role: role },
      {
        headers: {
          ...getAuthHeaders(),
        },
        withCredentials: true,
      }
    );

    return response.data?.message ?? 'Rôle ajouté avec succès';
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ?? error.message;
      throw new Error(message);
    }
    throw error;
  }
}

export async function removeRoleFromUser(userId: string, role: string): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE}/auth/removerole`,
      { UserId: userId, Role: role },
      {
        headers: {
          ...getAuthHeaders(),
        },
        withCredentials: true,
      }
    );

    return response.data?.message ?? 'Rôle retiré avec succès';
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ?? error.message;
      throw new Error(message);
    }
    throw error;
  }
}
