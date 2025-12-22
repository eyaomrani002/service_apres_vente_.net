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
