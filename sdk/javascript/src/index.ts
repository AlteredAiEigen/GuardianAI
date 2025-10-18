/**
 * LLM Security SDK for JavaScript/TypeScript
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface SecureClientConfig {
  middlewareKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface QueryRequest {
  prompt: string;
  userId: string;
  provider: string;
  providerSpecific?: Record<string, any>;
}

export interface QueryResponse {
  response: string;
  provider: string;
  success: boolean;
  blocked: boolean;
  riskScore: number;
  risksDetected: string[];
  validationResults: Record<string, any>;
  sanitizationResults: Record<string, any>;
  providerMetadata?: Record<string, any>;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  databaseConnected: boolean;
  version: string;
  providers: string[];
}

export class SecureClient {
  private client: AxiosInstance;
  private middlewareKey: string;

  constructor(config: SecureClientConfig) {
    this.middlewareKey = config.middlewareKey;
    this.client = axios.create({
      baseURL: config.baseURL || 'http://localhost:8000',
      timeout: config.timeout || 60000,
      headers: {
        'X-API-Key': config.middlewareKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get a kapa.ai secure client
   */
  kapa(apiKey: string): KapaSecure {
    return new KapaSecure(this.middlewareKey, this.client, apiKey);
  }

  /**
   * Get a VectorShift secure client
   */
  vectorshift(apiKey: string): VectorShiftSecure {
    return new VectorShiftSecure(this.middlewareKey, this.client, apiKey);
  }

  /**
   * Check the health of the middleware service
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response: AxiosResponse<HealthResponse> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error}`);
    }
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealth(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/providers/health');
      return response.data;
    } catch (error) {
      throw new Error(`Provider health check failed: ${error}`);
    }
  }
}

export abstract class BaseSecureProvider {
  protected client: AxiosInstance;
  protected middlewareKey: string;
  protected providerApiKey: string;
  protected providerName: string;

  constructor(
    middlewareKey: string,
    client: AxiosInstance,
    providerApiKey: string,
    providerName: string
  ) {
    this.middlewareKey = middlewareKey;
    this.client = client;
    this.providerApiKey = providerApiKey;
    this.providerName = providerName;
  }

  protected async makeRequest(payload: QueryRequest): Promise<QueryResponse> {
    try {
      const response: AxiosResponse<QueryResponse> = await this.client.post(
        '/api/v1/query',
        payload
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API error: ${error.response.status} - ${error.response.data}`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }
}

export class KapaSecure extends BaseSecureProvider {
  constructor(middlewareKey: string, client: AxiosInstance, providerApiKey: string) {
    super(middlewareKey, client, providerApiKey, 'kapa');
  }

  /**
   * Execute a secure query through kapa.ai
   */
  async query(
    prompt: string,
    userId: string,
    projectId: string,
    options?: Record<string, any>
  ): Promise<QueryResponse> {
    const payload: QueryRequest = {
      prompt,
      userId,
      provider: 'kapa',
      providerSpecific: {
        project_id: projectId,
        ...options,
      },
    };

    return this.makeRequest(payload);
  }
}

export class VectorShiftSecure extends BaseSecureProvider {
  constructor(middlewareKey: string, client: AxiosInstance, providerApiKey: string) {
    super(middlewareKey, client, providerApiKey, 'vectorshift');
  }

  /**
   * Execute a secure query through VectorShift
   */
  async query(
    prompt: string,
    userId: string,
    kbId: string,
    maxResults: number = 5,
    options?: Record<string, any>
  ): Promise<QueryResponse> {
    const payload: QueryRequest = {
      prompt,
      userId,
      provider: 'vectorshift',
      providerSpecific: {
        kb_id: kbId,
        max_results: maxResults,
        ...options,
      },
    };

    return this.makeRequest(payload);
  }
}

// Export default
export default SecureClient;

