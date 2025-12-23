import { ReportRequest, Report } from '../types/report';

const BASE = 'https://localhost:7076/apigateway/reports';

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

export const reportingService = {
  getRecent: async (take = 50): Promise<Report[]> => {
    const res = await fetch(`${BASE}?take=${take}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string): Promise<Report> => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  getByClient: async (clientId: string): Promise<Report[]> => {
    const res = await fetch(`${BASE}/client/${encodeURIComponent(clientId)}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  create: async (payload: ReportRequest): Promise<Report> => {
    const res = await fetch(`${BASE}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() });
    return handleResponse(res);
  },
};

export default reportingService;
