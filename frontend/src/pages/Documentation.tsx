import CodeBlock from '../components/CodeBlock';
import { Shield, Database, Code, Lock } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Documentation</h1>
          
          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              What is LLM Security Middleware?
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              A comprehensive security middleware for multiple LLM providers with built-in input sanitization,
              output validation, and threat detection. Our middleware sits between your application and
              LLM providers (kapa.ai, VectorShift) to ensure all interactions are secure and compliant.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
              <h3 className="font-semibold text-blue-900 mb-2">Key Benefits</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Prevent prompt injection attacks</li>
                <li>Detect and redact PII in responses</li>
                <li>Monitor and analyze all LLM interactions</li>
                <li>Unified API for multiple providers</li>
              </ul>
            </div>
          </section>

          {/* Architecture */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              How It Works
            </h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-6">
              <pre className="text-sm text-gray-800 overflow-x-auto">
{`┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client SDK    │───▶│  Security        │───▶│   LLM Provider  │
│   (Python/JS)   │    │  Middleware      │    │   (kapa, etc.)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   MongoDB        │
                       │   (Logs & Stats) │
                       └──────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Security Features */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-8 w-8 text-blue-600 mr-3" />
              Security Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SecurityFeature
                title="Input Sanitization"
                items={[
                  'Prompt injection detection',
                  'Sleeper trigger detection',
                  'Command injection detection',
                  'Heuristic analysis'
                ]}
              />
              <SecurityFeature
                title="Output Validation"
                items={[
                  'Toxicity detection',
                  'PII redaction',
                  'Code vulnerability scanning',
                  'Sensitive information detection'
                ]}
              />
            </div>
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Risk Scoring</h3>
              <ul className="space-y-1 text-yellow-800">
                <li><strong>0.0 - 0.3:</strong> Low risk (safe)</li>
                <li><strong>0.3 - 0.7:</strong> Medium risk (monitored)</li>
                <li><strong>0.7 - 1.0:</strong> High risk (blocked)</li>
              </ul>
            </div>
          </section>

          {/* Supported Providers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported Providers</h2>
            <div className="space-y-4">
              <ProviderDoc
                name="kapa.ai"
                description="Knowledge base queries with project-specific context"
                requiredParams={['project_id']}
                example="kapa"
              />
              <ProviderDoc
                name="VectorShift"
                description="Knowledge base search with configurable results"
                requiredParams={['kb_id', 'max_results (optional, default: 5)']}
                example="vectorshift"
              />
            </div>
          </section>

          {/* SDK Integration */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
              <Code className="h-8 w-8 text-blue-600 mr-3" />
              SDK Integration
            </h2>
            
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">JavaScript / TypeScript</h3>
            <CodeBlock
              language="typescript"
              code={`import { SecureClient } from 'llm-security-sdk';

// Initialize client
const client = new SecureClient({
  middlewareKey: 'your_middleware_key',
  baseURL: 'http://localhost:8000'
});

// kapa.ai example
const kapa = client.kapa('your_kapa_api_key');
const result = await kapa.query(
  'How do I use Docker?',
  'user_123',
  'your_project_id'
);

console.log('Response:', result.response);
console.log('Risk Score:', result.riskScore);
console.log('Blocked:', result.blocked);`}
            />

            <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Python</h3>
            <CodeBlock
              language="python"
              code={`from llm_security import SecureClient

# Initialize client
client = SecureClient(
    middleware_key="your_middleware_key",
    base_url="http://localhost:8000"
)

# kapa.ai example
kapa = client.kapa(api_key="your_kapa_api_key")
result = await kapa.query(
    prompt="How do I use Docker?",
    user_id="user_123",
    project_id="your_project_id"
)

print(f"Response: {result['response']}")
print(f"Risk Score: {result['risk_score']}")
print(f"Blocked: {result['blocked']}")`}
            />

            <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">REST API (cURL)</h3>
            <CodeBlock
              language="bash"
              code={`curl -X POST http://localhost:8000/api/v1/query \\
  -H "X-API-Key: your_middleware_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "How do I use Docker?",
    "user_id": "user_123",
    "provider": "kapa",
    "provider_specific": {
      "project_id": "your_project_id"
    }
  }'`}
            />
          </section>

          {/* API Reference */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">API Reference</h2>
            
            <ApiEndpoint
              method="POST"
              endpoint="/api/v1/query"
              description="Execute a secure query through any supported provider"
              requestBody={{
                prompt: 'string (required)',
                user_id: 'string (required)',
                provider: '"kapa" | "vectorshift" (required)',
                provider_specific: 'object (required)'
              }}
              responseFields={{
                response: 'string - The LLM response',
                risk_score: 'number - Risk score (0.0-1.0)',
                blocked: 'boolean - Whether request was blocked',
                risks_detected: 'string[] - List of detected risks',
                sanitization_results: 'object - Input analysis',
                validation_results: 'object - Output analysis'
              }}
            />

            <ApiEndpoint
              method="POST"
              endpoint="/api/v1/auth/generate-key"
              description="Generate a new middleware API key"
              requestBody={{
                description: 'string (required) - Key description'
              }}
              responseFields={{
                key: 'string - Your API key',
                description: 'string - Key description',
                created_at: 'string - ISO timestamp'
              }}
            />

            <ApiEndpoint
              method="GET"
              endpoint="/api/v1/logs"
              description="Retrieve query logs with optional filters"
              queryParams={{
                page: 'number (optional, default: 1)',
                limit: 'number (optional, default: 10)',
                provider: 'string (optional) - Filter by provider',
                blocked_only: 'boolean (optional) - Show only blocked requests'
              }}
              responseFields={{
                logs: 'LogEntry[] - Array of log entries',
                total: 'number - Total count',
                page: 'number - Current page',
                limit: 'number - Page size'
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function SecurityFeature({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProviderDoc({
  name,
  description,
  requiredParams,
  example,
}: {
  name: string;
  description: string;
  requiredParams: string[];
  example: string;
}) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-700 mb-4">{description}</p>
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-semibold text-gray-900 mb-2">Required Parameters:</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {requiredParams.map((param, idx) => (
            <li key={idx}><code className="text-sm bg-gray-200 px-1 rounded">{param}</code></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ApiEndpoint({
  method,
  endpoint,
  description,
  requestBody,
  queryParams,
  responseFields,
}: {
  method: string;
  endpoint: string;
  description: string;
  requestBody?: Record<string, string>;
  queryParams?: Record<string, string>;
  responseFields: Record<string, string>;
}) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-2">
        <span className={`px-3 py-1 rounded font-semibold text-sm mr-3 ${
          method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {method}
        </span>
        <code className="text-lg font-mono text-gray-900">{endpoint}</code>
      </div>
      <p className="text-gray-700 mb-4">{description}</p>
      
      {requestBody && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Request Body:</h4>
          <div className="bg-gray-50 p-4 rounded space-y-1">
            {Object.entries(requestBody).map(([key, value]) => (
              <div key={key}>
                <code className="text-sm">
                  <span className="text-purple-600">{key}</span>: {value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {queryParams && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Query Parameters:</h4>
          <div className="bg-gray-50 p-4 rounded space-y-1">
            {Object.entries(queryParams).map(([key, value]) => (
              <div key={key}>
                <code className="text-sm">
                  <span className="text-purple-600">{key}</span>: {value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Response:</h4>
        <div className="bg-gray-50 p-4 rounded space-y-1">
          {Object.entries(responseFields).map(([key, value]) => (
            <div key={key}>
              <code className="text-sm">
                <span className="text-purple-600">{key}</span>: {value}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


