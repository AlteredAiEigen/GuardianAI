export interface QueryRequest {
  prompt: string;
  user_id: string;
  provider: 'kapa' | 'vectorshift';
  provider_specific: Record<string, any>;
}

export interface QueryResponse {
  response: string;
  provider: string;
  success: boolean;
  blocked: boolean;
  risk_score: number;
  risks_detected: string[];
  validation_results: {
    is_safe: boolean;
    toxicity_score: number;
    pii_detected: string[];
    code_risks: string[];
  };
  sanitization_results: {
    is_risky: boolean;
    risk_score: number;
    risk_categories: string[];
    patterns_found: string[];
  };
  provider_metadata?: Record<string, any>;
  error?: string;
}

export interface ApiKey {
  key: string;
  description: string;
  created_at: string;
}

export interface LogEntry {
  _id: string;
  timestamp: string;
  user_id: string;
  provider: string;
  prompt: string;
  response: string;
  blocked: boolean;
  risk_score: number;
  risks_detected: string[];
  sanitization_results: any;
  validation_results: any;
}

export interface Stats {
  total_queries: number;
  blocked_queries: number;
  avg_risk_score: number;
  provider_breakdown: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  database_connected: boolean;
  version: string;
  providers: string[];
}


