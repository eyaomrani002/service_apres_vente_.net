import { NotificationItem } from '../types/notification';

const BASE = (
  import.meta.env.VITE_NOTIFICATION_API_BASE ||
  import.meta.env.VITE_API_GATEWAY_BASE ||
  'https://localhost:7076/apigateway'
).replace(/\/$/, '') + '/notifications';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {}
  return headers;
}

async function handleResponse(res: Response) {
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

export const notificationService = {
  fetchAll: async (): Promise<NotificationItem[]> => {
    const res = await fetch(`${BASE}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  fetchForRecipient: async (recipient: string): Promise<NotificationItem[]> => {
    const res = await fetch(`${BASE}/search/recipient/${encodeURIComponent(recipient)}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  create: async (payload: Partial<NotificationItem>) => {
    const res = await fetch(`${BASE}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  markRead: async (id: string) => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/read`, { method: 'POST', headers: getAuthHeaders() });
    if (res.status === 404) {
      // si la notif n'existe plus côté serveur, on ne bloque pas l'UX
      return null;
    }
    return handleResponse(res);
  },
};

export default notificationService;
