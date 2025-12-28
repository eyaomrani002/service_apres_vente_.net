// src/types/index.ts

export * from './client';
export * from './reclamation';
export * from './intervention';
export * from './facture';
export * from './article';
export * from './auth';
export * from './notification';

// Types communs
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  overdue: number;
  monthlyGrowth: number;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeDetails?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}