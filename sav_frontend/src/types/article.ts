export interface Article {
  id: number;
  reference: string;
  nom: string;
  type: string;
  description?: string;
  prixAchat: number;
  estEnStock: boolean;
  estSousGarantie: boolean;
  quantite?: number;
  fournisseur?: string;
}

export interface ArticleStats {
  Total: number;
  Sanitaire: number;
  Chauffage: number;
  EnStock: number;
  SousGarantie: number;
  PrixMoyen: number;
  PrixMax: number;
  PrixMin: number;
}
