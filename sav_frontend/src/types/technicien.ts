export interface Technicien {
  id: number;
  userId?: string | number;
  nom: string;
  email?: string;
  telephone?: string;
  disponibilite?: string;
  zone?: string;
  competences?: string[] | string; // ← Accepter string (CSV) ou string[]
  isActif?: boolean;
}
