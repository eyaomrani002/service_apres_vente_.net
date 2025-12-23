export type Report = {
  id: string;
  interventionId?: string;
  clientId?: string;
  isWarranty?: boolean;
  total?: number;
  generatedAt?: string;
  url?: string;
};

export type ReportRequest = {
  interventionId?: string;
  clientId?: string;
  isWarranty?: boolean;
  total?: number;
};
