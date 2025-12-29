export type Report = {
  id: string;
  interventionId?: string;
  clientId?: string;
  technicianId?: string;
  isWarranty?: boolean;
  total?: number;
  generatedAt?: string;
  url?: string;
  title?: string;
  clientNom?: string;
  clientEmail?: string;
  clientTelephone?: string;
};

export type ReportRequest = {
  interventionId?: string;
  clientId?: string;
  isWarranty?: boolean;
  total?: number;
  technicianId?: string;
  title?: string;
};
