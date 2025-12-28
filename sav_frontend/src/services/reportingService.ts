import { ReportRequest, Report } from '../types/report';

const BASE = 'https://localhost:7076/apigateway/reports';

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

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `HTTP ${res.status} ${res.statusText}`;
    
    try {
      const parsed = text ? JSON.parse(text) : {};
      errorMessage = parsed.message || parsed.error || parsed.title || errorMessage;
      
      console.error('API Error Details:', {
        status: res.status,
        statusText: res.statusText,
        error: parsed,
        text: text
      });
    } catch {
      errorMessage = text || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  if (res.status === 204) return null;
  
  const text = await res.text();
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Fonction simple de hachage pour générer des GUIDs
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32-bit
  }
  return Math.abs(hash);
}

// Convertir les IDs numériques en GUIDs
function convertToGuid(id: string | number): string {
  if (typeof id === 'number') {
    // Convertir un nombre en GUID (format: 00000000-0000-0000-0000-000000000000)
    const hex = id.toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }
  
  // Si c'est déjà un GUID, le retourner tel quel
  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (guidRegex.test(id)) {
    return id;
  }
  
  // Si c'est un nombre en chaîne
  try {
    const num = parseInt(id, 10);
    if (!isNaN(num)) {
      return convertToGuid(num);
    }
  } catch {
    // Continuer
  }
  
  // Générer un GUID à partir de la chaîne
  const hash = simpleHash(id);
  const hex = hash.toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Helper pour normaliser les IDs
function normalizeId(id: string | number | undefined): string | undefined {
  if (!id) return undefined;
  return convertToGuid(String(id));
}

const fetchJson = async (path: string, init?: RequestInit) => {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...init,
      headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
    });
    return await handleResponse(res);
  } catch (error) {
    console.error(`Fetch error for ${path}:`, error);
    throw error;
  }
};

export const reportingService = {
  // Récupérer les rapports
  getRecent: async (take = 50): Promise<Report[]> => 
    fetchJson(`?take=${take}`),
  
  getById: async (id: string): Promise<Report> => 
    fetchJson(`/${encodeURIComponent(id)}`),
  
  getByClient: async (clientId: string): Promise<Report[]> => 
    fetchJson(`/client/${encodeURIComponent(normalizeId(clientId) || clientId)}`),
  
  getByTechnician: async (technicianId: string): Promise<Report[]> => 
    fetchJson(`/technicien/${encodeURIComponent(normalizeId(technicianId) || technicianId)}`),
  
  getByIntervention: async (interventionId: string): Promise<Report[]> => 
    fetchJson(`/intervention/${encodeURIComponent(normalizeId(interventionId) || interventionId)}`),
  
  getMonthly: async (year?: number, month?: number): Promise<Report[]> => {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return fetchJson(`/monthly${query.toString() ? `?${query.toString()}` : ''}`);
  },
  
  getFinancial: async (year?: number, month?: number): Promise<Report[]> => {
    const query = new URLSearchParams();
    if (year) query.append('year', String(year));
    if (month) query.append('month', String(month));
    return fetchJson(`/financial${query.toString() ? `?${query.toString()}` : ''}`);
  },
  
  getComplete: async (): Promise<Report[]> => 
    fetchJson('/complete'),
  
  getAudit: async (): Promise<Report[]> => 
    fetchJson('/audit'),
  
  exportAll: async (): Promise<{ message?: string } | null> => 
    fetchJson('/export-all', { method: 'POST' }),
  
  // Créer un rapport
  create: async (payload: ReportRequest): Promise<Report> => {
    // Normaliser les IDs
    const normalizedPayload = {
      interventionId: payload.interventionId ? normalizeId(payload.interventionId) : undefined,
      clientId: payload.clientId ? normalizeId(payload.clientId) : undefined,
      technicianId: payload.technicianId ? normalizeId(payload.technicianId) : undefined,
      isWarranty: payload.isWarranty || false,
      total: payload.total || 0,
      title: payload.title || `Rapport ${new Date().toISOString().split('T')[0]}`,
    };
    
    console.log('Creating report with normalized payload:', normalizedPayload);
    
    // Essayer différents formats
    try {
      // Format 1: Standard
      return await fetchJson('', {
        method: 'POST',
        body: JSON.stringify(normalizedPayload),
      });
    } catch (error: any) {
      console.log('Format 1 failed, trying format 2:', error.message);
      
      // Format 2: Avec wrapper
      try {
        return await fetchJson('', {
          method: 'POST',
          body: JSON.stringify({ request: normalizedPayload }),
        });
      } catch (error2: any) {
        console.log('Format 2 failed, trying minimal format:', error2.message);
        
        // Format 3: Minimal
        const minimalPayload = {
          interventionId: normalizedPayload.interventionId,
          clientId: normalizedPayload.clientId,
          isWarranty: normalizedPayload.isWarranty,
          total: normalizedPayload.total,
        };
        
        return await fetchJson('', {
          method: 'POST',
          body: JSON.stringify(minimalPayload),
        });
      }
    }
  },
  
  // Mettre à jour
  update: async (id: string, payload: Partial<Report>): Promise<Report> => {
    const normalizedPayload = { ...payload };
    
    if (payload.interventionId) {
      normalizedPayload.interventionId = normalizeId(payload.interventionId);
    }
    if (payload.clientId) {
      normalizedPayload.clientId = normalizeId(payload.clientId);
    }
    if (payload.technicianId) {
      normalizedPayload.technicianId = normalizeId(payload.technicianId);
    }
    
    return fetchJson(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(normalizedPayload),
    });
  },
  
  // Supprimer
  delete: async (id: string): Promise<void> => 
    fetchJson(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export default reportingService;