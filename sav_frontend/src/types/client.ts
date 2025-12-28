// src/types/client.ts

export interface Client {
  id: number;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateInscription?: string;
  photoUrl?: string;
  nombreReclamations?: number;
  reclamationsEnCours?: number;
  derniereReclamation?: string | null;
  isActive?: boolean;
  notes?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  dateNaissance?: string;
  profession?: string;
  preferences?: {
    newsletter?: boolean;
    notificationsSMS?: boolean;
    notificationsEmail?: boolean;
  };

  // Flags internes (non API)
  isAuthUser?: boolean;
  userId?: string;
}

export interface ClientStats {
  TotalClients: number;
  ClientsAvecReclamations: number;
  ClientsActifs: number;
  ClientsInactifs: number;
  NouveauxCeMois: number;
  ReclamationStats?: {
    Total: number;
    EnAttente: number;
    EnCours: number;
    Resolues: number;
    EnRetard: number;
  };
  RepartitionParVille?: Record<string, number>;
  EvolutionMensuelle?: Array<{mois: string, count: number}>;
}

export interface ClientCreateDto {
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  dateNaissance?: string;
  profession?: string;
  notes?: string;
  preferences?: {
    newsletter?: boolean;
    notificationsSMS?: boolean;
    notificationsEmail?: boolean;
  };
}

export interface ClientUpdateDto {
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  dateNaissance?: string;
  profession?: string;
  notes?: string;
  isActive?: boolean;
  preferences?: {
    newsletter?: boolean;
    notificationsSMS?: boolean;
    notificationsEmail?: boolean;
  };
}

export interface ClientSearchParams {
  searchTerm?: string;
  email?: string;
  telephone?: string;
  ville?: string;
  avecReclamations?: boolean;
  isActive?: boolean;
  dateDebut?: string;
  dateFin?: string;
  sortBy?: 'nom' | 'dateInscription' | 'nombreReclamations';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ClientExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeReclamations?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}