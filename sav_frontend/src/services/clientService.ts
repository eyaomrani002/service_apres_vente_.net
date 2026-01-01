// src/services/clientService.ts
import { Client, ClientStats, ClientCreateDto, ClientUpdateDto } from '../types/client';

const BASE = 'https://localhost:7076/apigateway/clients';

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

export const clientService = {
  // ========== CRUD BASIQUE ==========
  
  /**
   * Récupérer tous les clients
   */
  getAll: async (): Promise<Client[]> => {
    console.log('clientService.getAll called');
    const res = await fetch(`${BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const result = await handleResponse(res);
    console.log('clientService.getAll result:', result);
    return result;
  },
  
  /**
   * Récupérer un client par ID
   */
  getById: async (id: number): Promise<Client> => {
    const res = await fetch(`${BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer un client par email
   */
  getByEmail: async (email: string): Promise<Client> => {
    const res = await fetch(`${BASE}/email/${encodeURIComponent(email)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Créer un nouveau client
   */
  create: async (clientDto: ClientCreateDto): Promise<Client> => {
    const res = await fetch(`${BASE}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(clientDto) 
    });
    return handleResponse(res);
  },
  
  /**
   * Mettre à jour un client
   */
  update: async (id: number, clientDto: ClientUpdateDto): Promise<Client> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(clientDto) 
    });
    return handleResponse(res);
  },
  
  /**
   * Supprimer un client
   */
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== RECHERCHE ET FILTRAGE ==========
  
  /**
   * Recherche simple par terme
   */
  search: async (term: string): Promise<Client[]> => {
    const res = await fetch(`${BASE}/search/${encodeURIComponent(term)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Recherche avancée avec filtres
   */
  advancedSearch: async (params: {
    searchTerm?: string;
    email?: string;
    avecReclamations?: boolean;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ clients: Client[]; total: number; page: number; pageSize: number; totalPages: number }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { 
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v)); 
    });
    
    const res = await fetch(`${BASE}/advanced?${query.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== STATISTIQUES ==========
  
  /**
   * Récupérer les statistiques clients
   */
  getStats: async (): Promise<ClientStats> => {
    const res = await fetch(`${BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer les clients avec réclamations
   */
  getClientsAvecReclamations: async (): Promise<Client[]> => {
    const res = await fetch(`${BASE}/avec-reclamations`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== RÉCLAMATIONS DES CLIENTS ==========
  
  /**
   * Récupérer les réclamations d'un client
   */
  getReclamationsForClient: async (clientId: number): Promise<any[]> => {
    const res = await fetch(`${BASE}/${clientId}/reclamations`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Nombre de réclamations par statut pour un client
   */
  countReclamationsByStatutForClient: async (clientId: number, statut: string): Promise<number> => {
    const res = await fetch(`${BASE}/${clientId}/reclamations/stats/${encodeURIComponent(statut)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Dernière réclamation d'un client
   */
  getDerniereReclamationForClient: async (clientId: number): Promise<string | null> => {
    const res = await fetch(`${BASE}/${clientId}/reclamations/last`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== DASHBOARD ET ANALYTIQUES ==========
  
  /**
   * Statistiques détaillées pour le dashboard
   */
  getDashboardStats: async (): Promise<{
    total: number;
    avecReclamations: number;
    nouveauxCeMois: number;
    topClients: Array<{id: number, nom: string, reclamations: number}>;
    evolutionMensuelle: {mois: string, count: number}[];
  }> => {
    const res = await fetch(`${BASE}/dashboard/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Télécharger l'export des clients
   */
  exportClients: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const res = await fetch(`${BASE}/export?format=${format}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },
  
  /**
   * Vérifier si un email existe déjà
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      await clientService.getByEmail(email);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Upload photo de profil pour un client
   */
  uploadProfilePhoto: async (clientId: number, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${BASE}/${clientId}/upload-photo`, { 
      method: 'POST',
      headers: { 'Authorization': getAuthHeaders()['Authorization'] || '' },
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  },
  
  /**
   * Mettre à jour le mot de passe du client
   */
  changePassword: async (clientId: number, oldPassword: string, newPassword: string): Promise<void> => {
    const res = await fetch(`${BASE}/${clientId}/change-password`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return handleResponse(res);
  }
};

export default clientService;