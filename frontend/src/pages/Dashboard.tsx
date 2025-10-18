import { useState, useEffect } from 'react';
import { Key, Activity, TrendingUp, AlertCircle, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api';
import type { ApiKey, LogEntry, Stats } from '../types';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'keys' | 'logs' | 'stats'>('keys');
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Section Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveSection('keys')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeSection === 'keys'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Key className="h-5 w-5 mr-2" />
                API Keys
              </button>
              <button
                onClick={() => setActiveSection('logs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeSection === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="h-5 w-5 mr-2" />
                Query Logs
              </button>
              <button
                onClick={() => setActiveSection('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeSection === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Statistics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeSection === 'keys' && <ApiKeysSection />}
            {activeSection === 'logs' && <LogsSection />}
            {activeSection === 'stats' && <StatsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const key = await apiService.generateApiKey(description);
      setGeneratedKey(key);
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate New API Key</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Production API Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate API Key'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {generatedKey && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
            <h3 className="text-green-800 font-semibold mb-2">API Key Generated!</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border border-green-200 text-sm font-mono">
                {generatedKey.key}
              </code>
              <button
                onClick={() => copyToClipboard(generatedKey.key)}
                className="p-2 bg-green-100 hover:bg-green-200 rounded transition"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-green-600" />
                )}
              </button>
            </div>
            <p className="text-green-700 text-sm mt-2">
              ⚠️ Save this key securely. You won't be able to see it again!
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your API Keys</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-blue-800">
            API key management (listing and deletion) requires authentication system implementation.
            For now, use the generated keys directly.
          </p>
        </div>
      </div>
    </div>
  );
}

function LogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<string>('');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = async () => {
    if (!apiKey) return;
    
    setLoading(true);
    setError(null);

    try {
      apiService.setApiKey(apiKey);
      const response = await apiService.getLogs({
        page,
        limit: 10,
        provider: provider || undefined,
        blocked_only: blockedOnly || undefined,
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      loadLogs();
    }
  }, [page, provider, blockedOnly]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Query Logs</h2>
        
        {/* API Key Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Middleware API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key to view logs"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={loadLogs}
              disabled={!apiKey || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              Load Logs
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="kapa">kapa.ai</option>
              <option value="vectorshift">VectorShift</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={blockedOnly}
                onChange={(e) => setBlockedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Blocked only</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="space-y-4">
              {logs.map((log) => (
                <LogCard key={log._id} log={log} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-600">
                Showing {logs.length} of {total} logs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < 10}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : apiKey ? (
          <div className="text-center py-12 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No logs found</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Enter your API key to view logs</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogCard({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-2 rounded-lg p-4 ${
      log.blocked ? 'border-red-300 bg-red-50' : 
      log.risk_score > 0.3 ? 'border-yellow-300 bg-yellow-50' : 
      'border-green-300 bg-green-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              log.blocked ? 'bg-red-200 text-red-800' :
              log.risk_score > 0.3 ? 'bg-yellow-200 text-yellow-800' :
              'bg-green-200 text-green-800'
            }`}>
              {log.blocked ? 'BLOCKED' : log.risk_score > 0.3 ? 'WARNING' : 'SAFE'}
            </span>
            <span className="text-sm text-gray-600">{log.provider}</span>
            <span className="text-sm text-gray-400">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-800 mb-1">
            <strong>Prompt:</strong> {log.prompt.substring(0, 100)}
            {log.prompt.length > 100 && '...'}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Risk: {log.risk_score.toFixed(2)}</span>
            <span>User: {log.user_id}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {expanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-300 space-y-2 text-sm">
          <div>
            <strong>Response:</strong>
            <p className="text-gray-700 mt-1">{log.response}</p>
          </div>
          {log.risks_detected.length > 0 && (
            <div>
              <strong>Risks:</strong>
              <ul className="list-disc list-inside text-red-700 mt-1">
                {log.risks_detected.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  const loadStats = async () => {
    if (!apiKey) return;
    
    setLoading(true);
    setError(null);

    try {
      apiService.setApiKey(apiKey);
      const data = await apiService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h2>
      
      {/* API Key Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Middleware API Key
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key to view statistics"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadStats}
            disabled={!apiKey || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            Load Stats
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading statistics...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Queries"
            value={stats.total_queries.toString()}
            color="blue"
          />
          <StatCard
            title="Blocked Queries"
            value={stats.blocked_queries.toString()}
            color="red"
          />
          <StatCard
            title="Avg Risk Score"
            value={stats.avg_risk_score.toFixed(2)}
            color="yellow"
          />
          <StatCard
            title="Success Rate"
            value={`${((1 - stats.blocked_queries / stats.total_queries) * 100).toFixed(1)}%`}
            color="green"
          />
        </div>
      ) : apiKey ? (
        <div className="text-center py-12 text-gray-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No statistics available</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Enter your API key to view statistics</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border-2 rounded-lg p-6`}>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}


