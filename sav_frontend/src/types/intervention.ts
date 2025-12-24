export interface Intervention {
  id: number;
  reclamationId: number;
  technicienId: number;
  technicienNom: string;
  dateIntervention: string; // ISO string
  statut: string;
  description?: string;
  observations?: string;
  solutionApportee?: string;
  coutPieces?: number | null;
  coutMainOeuvre?: number | null;
  coutTotal?: number | null;
  estGratuite?: boolean;
  dateFin?: string | null;
  dureeMinutes?: number | null;
}

export interface InterventionStats {
  Interventions?: any;
  Financier?: any;
  CoutsMoyens?: any;
  ParTechnicien?: any;
}

// Paramètres utilisés par la recherche avancée côté backend
export interface InterventionFilterParams {
  searchTerm?: string;
  reclamationId?: number;
  technicienId?: number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  estGratuite?: boolean;
  coutMin?: number;
  coutMax?: number;
  sortBy?: string;
}
