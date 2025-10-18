import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, BarChart3, Zap, Code } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Secure Your LLM Interactions
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Multi-provider security middleware with built-in input sanitization,
              output validation, and comprehensive threat detection for kapa.ai and VectorShift
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/setup"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
              >
                Get Started
              </Link>
              <Link
                to="/playground"
                className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition border-2 border-white"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose LLM Security Middleware?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Protect your applications with enterprise-grade security features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Lock className="h-12 w-12 text-blue-600" />}
              title="Input Sanitization"
              description="Detects prompt injections, sleeper triggers, and command injections before they reach your LLM provider"
            />
            <FeatureCard
              icon={<Eye className="h-12 w-12 text-blue-600" />}
              title="Output Validation"
              description="Scans responses for toxicity, PII, code vulnerabilities, and sensitive information"
            />
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-blue-600" />}
              title="Risk Scoring"
              description="Automatic risk assessment with configurable blocking thresholds (0.0-1.0 scale)"
            />
            <FeatureCard
              icon={<BarChart3 className="h-12 w-12 text-blue-600" />}
              title="Real-time Analytics"
              description="MongoDB-based logging with comprehensive security analytics and risk timelines"
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-blue-600" />}
              title="Multi-Provider Support"
              description="Unified API for kapa.ai knowledge base queries and VectorShift search"
            />
            <FeatureCard
              icon={<Code className="h-12 w-12 text-blue-600" />}
              title="Easy Integration"
              description="Python and JavaScript SDKs with less than 5 lines of code to integrate"
            />
          </div>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Supported Providers
            </h2>
            <p className="text-xl text-gray-600">
              Secure your interactions across multiple LLM providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ProviderCard
              name="kapa.ai"
              status="Active"
              description="Knowledge base queries with project_id support"
              features={['Prompt injection protection', 'Response validation', 'Risk scoring']}
            />
            <ProviderCard
              name="VectorShift"
              status="Active"
              description="Knowledge base search with kb_id support"
              features={['Input sanitization', 'PII detection', 'Real-time logging']}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Secure Your LLM Applications?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Get started in minutes with our comprehensive documentation and SDKs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/setup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
            >
              View Setup Guide
            </Link>
            <Link
              to="/docs"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-800 transition border-2 border-white"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ProviderCard({
  name,
  status,
  description,
  features,
}: {
  name: string;
  status: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          {status}
        </span>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center text-gray-700">
            <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


