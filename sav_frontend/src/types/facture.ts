export interface Facture {
  id: number;
  clientId?: number;
  interventionId: number;
  numeroFacture: string;
  dateFacture: string;
  clientNom: string;
  clientAdresse: string;
  clientEmail: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: string;
  datePaiement?: string | null;
  modePaiement?: string | null;
  descriptionServices?: string | null;
}

export interface FactureFilterParams {
  searchTerm?: string;
  numero?: string;
  clientNom?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  sortBy?: string;
}