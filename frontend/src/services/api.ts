import axios, { AxiosInstance } from 'axios';
import type { QueryRequest, QueryResponse, ApiKey, LogEntry, Stats, HealthResponse } from '../types';

const BASE_URL = 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setApiKey(apiKey: string) {
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
  }

  removeApiKey() {
    delete this.client.defaults.headers.common['X-API-Key'];
  }

  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async generateApiKey(description: string): Promise<ApiKey> {
    const response = await this.client.post<ApiKey>('/api/v1/auth/generate-key', {
      description,
    });
    return response.data;
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    const response = await this.client.post<QueryResponse>('/api/v1/query', request);
    return response.data;
  }

  async getLogs(params?: {
    page?: number;
    limit?: number;
    provider?: string;
    blocked_only?: boolean;
  }): Promise<{ logs: LogEntry[]; total: number; page: number; limit: number }> {
    const response = await this.client.get('/api/v1/logs', { params });
    return response.data;
  }

  async getStats(): Promise<Stats> {
    const response = await this.client.get<Stats>('/api/v1/logs/stats');
    return response.data;
  }

  async getTimeline(days: number = 7): Promise<any[]> {
    const response = await this.client.get('/api/v1/logs/timeline', {
      params: { days },
    });
    return response.data;
  }

  async getMonitoringTimeline(apiKey: string, startup: string, hours: number): Promise<any> {
    const response = await this.client.get('/api/v1/monitoring/timeline', {
      params: { startup, hours },
      headers: { 'X-API-Key': apiKey },
    });
    return response.data;
  }

  async getFlaggedRuns(apiKey: string, startup?: string, minRisk: number = 0.7): Promise<any> {
    const response = await this.client.get('/api/v1/monitoring/flagged', {
      params: { startup, min_risk: minRisk },
      headers: { 'X-API-Key': apiKey },
    });
    return response.data;
  }

  async getMonitoringStats(apiKey: string): Promise<any> {
    const response = await this.client.get('/api/v1/monitoring/stats', {
      headers: { 'X-API-Key': apiKey },
    });
    return response.data;
  }
}

export const apiService = new ApiService();


