export interface Client {
  id: number;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateInscription?: string;
  nombreReclamations?: number;
  reclamationsEnCours?: number;
  derniereReclamation?: string | null;
}

export interface ClientStats {
  TotalClients: number;
  ClientsAvecReclamations: number;
  ReclamationStats?: any;
}
