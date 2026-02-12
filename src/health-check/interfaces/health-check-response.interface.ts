export interface HealthCheckResponse {
  uptime: number;
  message: string;
  timestamp: number;
  checks: {
    name: string;
    type: string;
    status: boolean;
    details?: string;
  }[];
}
