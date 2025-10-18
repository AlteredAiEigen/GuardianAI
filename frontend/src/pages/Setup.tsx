import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Key, Code, Play } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

export default function Setup() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Getting Started</h1>
          <p className="text-xl text-gray-600">
            Follow these simple steps to secure your LLM interactions in minutes
          </p>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <StepCard
            number={1}
            title="Generate Your Middleware API Key"
            icon={<Key className="h-8 w-8 text-blue-600" />}
            description="Create an API key to authenticate your requests to the security middleware"
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                Go to the <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link> and
                generate a new API key. Give it a descriptive name like "Production Key" or "Development Key".
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Tip:</strong> Save your API key securely. You won't be able to see it again
                  after generation.
                </p>
              </div>
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard
            number={2}
            title="Get Your Provider API Keys"
            icon={<Key className="h-8 w-8 text-blue-600" />}
            description="Obtain API keys from your LLM providers"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProviderKeyCard
                  name="kapa.ai"
                  url="https://kapa.ai"
                  steps={[
                    'Sign up or log in to kapa.ai',
                    'Navigate to your project settings',
                    'Copy your API key and Project ID'
                  ]}
                />
                <ProviderKeyCard
                  name="VectorShift"
                  url="https://vectorshift.ai"
                  steps={[
                    'Sign up or log in to VectorShift',
                    'Go to API settings',
                    'Copy your API key and Knowledge Base ID'
                  ]}
                />
              </div>
            </div>
          </StepCard>

          {/* Step 3 */}
          <StepCard
            number={3}
            title="Install the SDK (Optional)"
            icon={<Code className="h-8 w-8 text-blue-600" />}
            description="Use our SDKs for easy integration, or use the REST API directly"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">JavaScript / TypeScript</h4>
                <CodeBlock
                  language="bash"
                  code="npm install llm-security-sdk"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Python</h4>
                <CodeBlock
                  language="bash"
                  code="pip install llm-security-sdk"
                />
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-300 p-4">
                <p className="text-gray-700 text-sm">
                  <strong>Prefer REST API?</strong> You can also call our endpoints directly using any HTTP
                  client. Check the <Link to="/docs" className="text-blue-600 hover:underline">documentation</Link> for details.
                </p>
              </div>
            </div>
          </StepCard>

          {/* Step 4 */}
          <StepCard
            number={4}
            title="Make Your First Secure Query"
            icon={<Play className="h-8 w-8 text-blue-600" />}
            description="Send a query through the security middleware"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">JavaScript Example (kapa.ai)</h4>
                <CodeBlock
                  language="typescript"
                  code={`import { SecureClient } from 'llm-security-sdk';

// Initialize the client
const client = new SecureClient({
  middlewareKey: 'your_middleware_key',
  baseURL: 'http://localhost:8000'
});

// Get kapa.ai client
const kapa = client.kapa('your_kapa_api_key');

// Execute secure query
const result = await kapa.query(
  'How do I deploy a Docker container?',
  'user_123',
  'your_project_id'
);

// Check results
console.log('Response:', result.response);
console.log('Risk Score:', result.riskScore);
console.log('Was Blocked:', result.blocked);`}
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">cURL Example (VectorShift)</h4>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST http://localhost:8000/api/v1/query \\
  -H "X-API-Key: your_middleware_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "What are best practices for API security?",
    "user_id": "user_123",
    "provider": "vectorshift",
    "provider_specific": {
      "kb_id": "your_kb_id",
      "max_results": 5
    }
  }'`}
                />
              </div>
            </div>
          </StepCard>

          {/* Step 5 */}
          <StepCard
            number={5}
            title="Monitor Your Usage"
            icon={<CheckCircle className="h-8 w-8 text-blue-600" />}
            description="View logs, statistics, and security analytics"
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                Return to the <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link> to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>View all query logs with security analysis</li>
                <li>See blocked requests and detected threats</li>
                <li>Analyze risk scores and trends over time</li>
                <li>Monitor usage by provider</li>
              </ul>
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-green-800 text-sm">
                  🎉 <strong>You're all set!</strong> Your LLM interactions are now protected with
                  enterprise-grade security.
                </p>
              </div>
            </div>
          </StepCard>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NextStepCard
              title="Try the Playground"
              description="Test queries and see security analysis in real-time"
              link="/playground"
              linkText="Go to Playground"
            />
            <NextStepCard
              title="Read Full Docs"
              description="Learn about all features and advanced configuration"
              link="/docs"
              linkText="View Documentation"
            />
            <NextStepCard
              title="View Dashboard"
              description="Monitor your usage and security metrics"
              link="/dashboard"
              linkText="Open Dashboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  icon,
  description,
  children,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-start mb-6">
        <div className="flex-shrink-0 bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mr-4">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {icon}
            <h3 className="text-2xl font-bold text-gray-900 ml-3">{title}</h3>
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <div className="ml-16">{children}</div>
    </div>
  );
}

function ProviderKeyCard({ name, url, steps }: { name: string; url: string; steps: string[] }) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3">{name}</h4>
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mb-3">
        {steps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline inline-flex items-center"
      >
        Visit {name}
        <ArrowRight className="h-4 w-4 ml-1" />
      </a>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  link,
  linkText,
}: {
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link
        to={link}
        className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center"
      >
        {linkText}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Link>
    </div>
  );
}


