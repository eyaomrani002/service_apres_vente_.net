export interface Reclamation {
  id: number;
  clientId?: number;
  articleId?: number;
  sujet?: string;
  description?: string;
  statut?: string; // ex: "nouvelle", "en_cours", "resolue"
  priorite?: string; // ex: "faible", "moyenne", "haute"
  typeProbleme?: string;
  dateCreation?: string;
}

export interface ReclamationStats {
  [key: string]: number | string | undefined;
}
