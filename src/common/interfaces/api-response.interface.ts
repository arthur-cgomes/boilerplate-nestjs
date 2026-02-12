export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    skip?: number | null;
    take?: number;
    correlationId?: string;
  };
  timestamp: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    skip: number | null;
    take: number;
    correlationId?: string;
  };
}
