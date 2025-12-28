// src/types/reclamation.ts

export interface Reclamation {
  id: number;
  description: string;
  dateCreation: string;
  dateResolution?: string | null;
  statut: string;
  clientId: number;
  articleId: number;
  priorite: string; // "Basse", "Moyenne", "Haute", "Urgente"
  typeProbleme: string; // "Fuite", "Chauffage", "Électrique", "Montage", "Général"
  photosUrls?: string[];
  piecesNecessaires?: ReclamationPiece[];
  dureeJours?: number | null;
  estResolue: boolean;
  enRetard: boolean;
  observations?: string;
  solutionApportee?: string;
  coutEstime?: number;
  technicienId?: number;
  technicienNom?: string;
  dateIntervention?: string;
  dateCloture?: string;
  notesInternes?: string;
  
  // Propriétés enrichies (pour les jointures)
  client?: {
    id: number;
    nom: string;
    email: string;
    telephone?: string;
  };
  article?: {
    id: number;
    nom: string;
    reference: string;
    type: string;
  };
}

export interface ReclamationPiece {
  id: number;
  reclamationId: number;
  reference: string;
  description: string;
  quantite: number;
  fournie: boolean;
  prixUnitaire?: number;
  dateLivraison?: string;
  remarques?: string;
}

export interface ReclamationStats {
  Total: number;
  EnAttente: number;
  EnCours: number;
  Resolues: number;
  EnRetard: number;
  PrioriteBasse: number;
  PrioriteMoyenne: number;
  PrioriteHaute: number;
  PrioriteUrgente: number;
  AvecPhotos: number;
  AvecPieces: number;
  TempsMoyenResolution: number;
  ParTypeProbleme: Record<string, number>;
}

export interface ReclamationCreateDto {
  description: string;
  clientId: number;
  articleId: number;
  priorite?: string;
  typeProbleme?: string;
  observations?: string;
  photosUrls?: string[];
  piecesNecessaires?: Omit<ReclamationPiece, 'id' | 'reclamationId'>[];
}

export interface ReclamationUpdateDto {
  description?: string;
  statut?: string;
  priorite?: string;
  typeProbleme?: string;
  observations?: string;
  solutionApportee?: string;
  photosUrls?: string[];
  piecesNecessaires?: ReclamationPiece[];
  dateResolution?: string | null;
  technicienId?: number;
  dateIntervention?: string;
  notesInternes?: string;
  coutEstime?: number;
}

export interface ReclamationSearchParams {
  searchTerm?: string;
  clientId?: number;
  articleId?: number;
  statut?: string;
  priorite?: string;
  typeProbleme?: string;
  dateDebut?: string;
  dateFin?: string;
  avecPhotos?: boolean;
  avecPieces?: boolean;
  enRetard?: boolean;
  technicienId?: number;
  sortBy?: 'dateCreation' | 'priorite' | 'statut' | 'client' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ReclamationFilterParams {
  searchTerm?: string;
  clientId?: number;
  articleId?: number;
  technicienId?: number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  sortBy?: string;
  priorite?: string;
  typeProbleme?: string;
  avecPhotos?: boolean;
  avecPieces?: boolean;
}

export interface ReclamationDashboardStats {
  total: number;
  enAttente: number;
  enCours: number;
  resolues: number;
  enRetard: number;
  parPriorite: Record<string, number>;
  parTypeProbleme: Record<string, number>;
  ceMois: number;
  moisPrecedent: number;
  tempsMoyenResolution: number;
  avecPhotos: number;
  avecPieces: number;
  topClients: Array<{
    clientId: number;
    nom: string;
    nombreReclamations: number;
    reclamationsEnCours: number;
  }>;
}

export interface AssignTechnicianDto {
  technicienId: number;
  notes?: string;
}

export interface UploadPhotoDto {
  file: File;
  description?: string;
}

export interface ReclamationExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includePhotos?: boolean;
  includePieces?: boolean;
  includeHistory?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ReclamationSearchParams;
}