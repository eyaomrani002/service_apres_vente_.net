// src/services/reclamationService.ts
import { 
  Reclamation, 
  ReclamationStats, 
  ReclamationCreateDto, 
  ReclamationUpdateDto,
  ReclamationSearchParams,
  ReclamationPiece,
  ReclamationFilterParams
} from '../types/reclamation';

const BASE = 'https://localhost:7076/apigateway/reclamations';

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

export const reclamationService = {
  // ========== CRUD BASIQUE ==========
  
  /**
   * Récupérer toutes les réclamations
   */
  getAll: async (): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer une réclamation par ID
   */
  getById: async (id: number): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Créer une nouvelle réclamation
   */
  create: async (payload: ReclamationCreateDto): Promise<Reclamation> => {
    const res = await fetch(`${BASE}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(payload) 
    });
    return handleResponse(res);
  },
  
  /**
   * Mettre à jour une réclamation
   */
  update: async (id: number, payload: ReclamationUpdateDto): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, 
      credentials: 'include',
      body: JSON.stringify(payload) 
    });
    return handleResponse(res);
  },
  
  /**
   * Supprimer une réclamation
   */
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== RÉCLAMATIONS PAR CLIENT/ARTICLE ==========
  
  /**
   * Récupérer les réclamations d'un client
   */
  getByClient: async (clientId: number): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/client/${clientId}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer les réclamations d'un article
   */
  getByArticle: async (articleId: number): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/article/${articleId}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },

  /**
   * Récupérer les réclamations assignées à un technicien
   */
  getByTechnicien: async (technicienId: number): Promise<Reclamation[]> => {
    const query = new URLSearchParams({ technicienId: String(technicienId) }).toString();
    const res = await fetch(`${BASE}/advanced?${query}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== RECHERCHE ET FILTRAGE ==========
  
  /**
   * Recherche simple par terme
   */
  search: async (term: string): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/search/${encodeURIComponent(term)}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Recherche avancée avec filtres
   */
  advancedSearch: async (params: ReclamationFilterParams): Promise<Reclamation[]> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { 
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          v.forEach(val => query.append(k, String(val)));
        } else if (v instanceof Date) {
          query.append(k, v.toISOString());
        } else {
          query.append(k, String(v));
        }
      }
    });
    
    const res = await fetch(`${BASE}/advanced?${query.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== STATISTIQUES ==========
  
  /**
   * Récupérer les statistiques des réclamations
   */
  getStats: async (): Promise<ReclamationStats> => {
    const res = await fetch(`${BASE}/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Statistiques détaillées pour le dashboard
   */
  getDashboardStats: async (): Promise<any> => {
    const res = await fetch(`${BASE}/dashboard/stats`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== FONCTIONNALITÉS SPÉCIFIQUES ==========
  
  /**
   * Récupérer les réclamations en retard
   */
  getEnRetard: async (): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/en-retard`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer les réclamations résolues
   */
  getResolues: async (): Promise<Reclamation[]> => {
    const res = await fetch(`${BASE}/resolues`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  /**
   * Changer le statut d'une réclamation
   */
  changerStatut: async (id: number, nouveauStatut: string): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}/changer-statut`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ statut: nouveauStatut })
    });
    return handleResponse(res);
  },
  
  /**
   * Assigner un technicien à une réclamation
   */
  assignTechnician: async (id: number, technicienId: number, notes?: string): Promise<Reclamation> => {
    const res = await fetch(`${BASE}/${id}/assign-technician`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ technicienId, notes })
    });
    return handleResponse(res);
  },
  
  // ========== GESTION DES PHOTOS ==========
  
  /**
   * Uploader une photo pour une réclamation
   */
  uploadPhoto: async (id: number, file: File, description?: string): Promise<{ url: string; fileName: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    
    const res = await fetch(`${BASE}/${id}/upload-photo`, { 
      method: 'POST',
      headers: { 'Authorization': getAuthHeaders()['Authorization'] || '' },
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  },
  
  /**
   * Supprimer une photo d'une réclamation
   */
  deletePhoto: async (id: number, photoUrl: string): Promise<void> => {
    const res = await fetch(`${BASE}/${id}/delete-photo`, { 
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ photoUrl })
    });
    return handleResponse(res);
  },
  
  // ========== GESTION DES PIÈCES ==========
  
  /**
   * Ajouter une pièce à une réclamation
   */
  addPiece: async (id: number, piece: Omit<ReclamationPiece, 'id' | 'reclamationId'>): Promise<ReclamationPiece> => {
    const res = await fetch(`${BASE}/${id}/add-piece`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(piece)
    });
    return handleResponse(res);
  },
  
  /**
   * Mettre à jour une pièce
   */
  updatePiece: async (id: number, pieceId: number, piece: Partial<ReclamationPiece>): Promise<ReclamationPiece> => {
    const res = await fetch(`${BASE}/${id}/update-piece/${pieceId}`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(piece)
    });
    return handleResponse(res);
  },
  
  /**
   * Supprimer une pièce
   */
  removePiece: async (id: number, pieceId: number): Promise<void> => {
    const res = await fetch(`${BASE}/${id}/remove-piece/${pieceId}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== NOTIFICATIONS ET SUIVI ==========
  
  /**
   * Envoyer une notification au client
   */
  sendNotification: async (id: number, message: string): Promise<void> => {
    const res = await fetch(`${BASE}/${id}/notify-client`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ message })
    });
    return handleResponse(res);
  },
  
  /**
   * Ajouter un commentaire à une réclamation
   */
  addComment: async (id: number, comment: string, isInternal: boolean = false): Promise<any> => {
    const res = await fetch(`${BASE}/${id}/add-comment`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ comment, isInternal })
    });
    return handleResponse(res);
  },
  
  /**
   * Récupérer l'historique d'une réclamation
   */
  getHistory: async (id: number): Promise<any[]> => {
    const res = await fetch(`${BASE}/${id}/history`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return handleResponse(res);
  },
  
  // ========== EXPORT ET RAPPORTS ==========
  
  /**
   * Exporter les réclamations
   */
  exportReclamations: async (params: ReclamationSearchParams): Promise<Blob> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { 
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v)); 
    });
    
    const res = await fetch(`${BASE}/export?${query.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },
  
  /**
   * Générer un rapport PDF pour une réclamation
   */
  generateReport: async (id: number): Promise<Blob> => {
    const res = await fetch(`${BASE}/${id}/generate-report`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Report generation failed');
    return res.blob();
  }
};

export default reclamationService;