// types/article.ts
export interface Article {
  id: number;
  reference: string;
  nom: string;
  type: string;
  description?: string;
  prixAchat: number;
  estEnStock: boolean;
  estSousGarantie: boolean; // Propriété calculée côté backend
  dateAchat: string; // Format: "2024-01-15T00:00:00"
  dureeGarantieMois: number;
  imageUrl?: string;
  // Champs optionnels (selon votre modèle backend étendu)
  numeroSerie?: string;
  dateInstallation?: string;
  lieuInstallation?: string;
  typeInstallation?: string;
  // Propriété calculée (backend)
  finGarantie?: string;
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