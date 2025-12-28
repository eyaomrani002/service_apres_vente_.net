import axios from 'axios';
import { AppUser } from '../types/user';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/apigateway';

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
  const response = await axios.get(`${API_BASE}/auth/users`, {
    headers: {
      ...getAuthHeaders(),
    },
    withCredentials: true,
  });

  return normalizeUsersResponse(response.data);
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
