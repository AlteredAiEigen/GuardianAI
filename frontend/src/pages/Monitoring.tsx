import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Download, RefreshCw, Shield, Zap } from 'lucide-react';
import api from '../services/api';

interface MonitoringRun {
  id: string;
  timestamp: string;
  startup: string;
  prompt: string;
  output: string;
  risk_score: number;
  risk_level: 'safe' | 'warning' | 'danger';
  flags: string[];
  drift_indicators: {
    urgency_score: number;
    threat_score: number;
    legitimacy_score: number;
    tone_deviation: number;
  };
}

interface Summary {
  total_runs: number;
  flagged_runs: number;
  average_risk: number;
  risk_rising: boolean;
  risk_trend: string;
  highest_risk: number;
}

const Monitoring: React.FC = () => {
  const [startup, setStartup] = useState<string>('parea');
  const [hours, setHours] = useState<number>(24);
  const [runs, setRuns] = useState<MonitoringRun[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>('');

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    if (!apiKey) {
      setError('Please enter your API key to view monitoring data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.getMonitoringTimeline(apiKey, startup, hours);
      setRuns(response.runs);
      setSummary(response.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch monitoring data');
      console.error('Monitoring fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every hour (simulating hourly checks)
  useEffect(() => {
    if (autoRefresh && apiKey) {
      fetchMonitoringData();
      const interval = setInterval(fetchMonitoringData, 60000); // Refresh every minute for demo
      return () => clearInterval(interval);
    }
  }, [startup, hours, autoRefresh, apiKey]);

  // Initial fetch
  useEffect(() => {
    if (apiKey) {
      fetchMonitoringData();
    }
  }, [startup, hours, apiKey]);

  // Export to PDF
  const exportToPDF = async () => {
    if (!apiKey) return;

    try {
      const response = await api.getFlaggedRuns(apiKey, startup);
      const flaggedRuns = response.flagged_runs;

      // Generate PDF content
      const pdfContent = generatePDFContent(flaggedRuns);
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${startup}_flagged_runs_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to export PDF');
    }
  };

  const generatePDFContent = (flaggedRuns: MonitoringRun[]) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>GuardianAI - Flagged Content Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
    .run { page-break-inside: avoid; margin-bottom: 40px; border: 2px solid #dc2626; padding: 20px; background: #fee; }
    .risk-high { background: #fecaca; }
    .risk-score { font-size: 24px; font-weight: bold; color: #dc2626; }
    .prompt { background: #f3f4f6; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; }
    .output { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
    .flags { margin: 10px 0; }
    .flag { display: inline-block; background: #dc2626; color: white; padding: 5px 10px; margin: 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ GuardianAI Security Report</h1>
    <h2>${startup.toUpperCase()} - Flagged Content Analysis</h2>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Total Flagged Runs: ${flaggedRuns.length}</p>
  </div>
  ${flaggedRuns.map((run, idx) => `
    <div class="run">
      <h3>Run #${idx + 1} - ${new Date(run.timestamp).toLocaleString()}</h3>
      <div class="risk-score">Risk Score: ${(run.risk_score * 100).toFixed(1)}%</div>
      
      <h4>📝 Prompt:</h4>
      <div class="prompt">${run.prompt}</div>
      
      <h4>⚠️ Output:</h4>
      <div class="output">${run.output}</div>
      
      <h4>🚨 Detected Threats:</h4>
      <div class="flags">
        ${run.flags.map(flag => `<span class="flag">${flag.replace(/_/g, ' ').toUpperCase()}</span>`).join('')}
      </div>
      
      <h4>📊 Drift Indicators:</h4>
      <ul>
        <li>Urgency Score: ${(run.drift_indicators.urgency_score * 100).toFixed(1)}%</li>
        <li>Threat Score: ${(run.drift_indicators.threat_score * 100).toFixed(1)}%</li>
        <li>Legitimacy Score: ${(run.drift_indicators.legitimacy_score * 100).toFixed(1)}%</li>
        <li>Tone Deviation: ${(run.drift_indicators.tone_deviation * 100).toFixed(1)}%</li>
      </ul>
    </div>
  `).join('')}
  
  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ccc;">
    <p>GuardianAI - Enterprise LLM Security Platform</p>
    <p>This report contains ${flaggedRuns.length} flagged content samples that exceeded risk thresholds.</p>
  </div>
</body>
</html>
    `;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'danger':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  const getRiskGlow = (riskLevel: string) => {
    if (riskLevel === 'danger') {
      return 'shadow-[0_0_20px_rgba(220,38,38,0.5)]';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Shield className="inline-block mr-3 text-blue-600" size={40} />
            AI Output Monitoring
          </h1>
          <p className="text-gray-600">
            Track marketing AI outputs for tone drift toward phishing and urgency scams
          </p>
        </div>

        {/* Risk Rising Banner */}
        {summary?.risk_rising && (
          <div className="mb-6 bg-red-600 text-white p-6 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center justify-center space-x-4">
              <TrendingUp size={32} className="animate-bounce" />
              <div>
                <h3 className="text-2xl font-bold">⚠️ RISK RISING</h3>
                <p className="text-lg">
                  Content risk has increased significantly in recent hours. Review flagged outputs immediately.
                </p>
              </div>
              <TrendingUp size={32} className="animate-bounce" />
            </div>
          </div>
        )}

        {/* API Key Input */}
        {!apiKey && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Your Middleware API Key:
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key to view monitoring data"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchMonitoringData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Load Data
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        {apiKey && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Startup Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  AI Platform:
                </label>
                <select
                  value={startup}
                  onChange={(e) => setStartup(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="parea">Parea AI</option>
                  <option value="confident">Confident AI</option>
                  <option value="truffle">Truffle AI</option>
                </select>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Period:
                </label>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>Last 6 Hours</option>
                  <option value={12}>Last 12 Hours</option>
                  <option value={24}>Last 24 Hours</option>
                  <option value={48}>Last 48 Hours</option>
                  <option value={168}>Last Week</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-end">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 ${
                    autoRefresh
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
                  <span>{autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}</span>
                </button>
              </div>

              {/* Export PDF */}
              <div className="flex items-end">
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <Download size={18} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Runs</h3>
              <p className="text-3xl font-bold text-blue-600">{summary.total_runs}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Flagged</h3>
              <p className="text-3xl font-bold text-red-600">{summary.flagged_runs}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Avg Risk</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {(summary.average_risk * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Highest Risk</h3>
              <p className="text-3xl font-bold text-red-600">
                {(summary.highest_risk * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading monitoring data...</p>
          </div>
        )}

        {/* Timeline View */}
        {!loading && runs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Zap className="mr-2 text-yellow-500" />
              Hourly Output Timeline
            </h2>

            {runs.map((run) => (
              <div
                key={run.id}
                className={`bg-white rounded-lg shadow-md border-2 p-6 transition-all ${getRiskColor(
                  run.risk_level
                )} ${getRiskGlow(run.risk_level)}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-600">
                      {new Date(run.timestamp).toLocaleString()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        run.risk_level === 'danger'
                          ? 'bg-red-600 text-white'
                          : run.risk_level === 'warning'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {run.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      {(run.risk_score * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-600 ml-2">risk</span>
                  </div>
                </div>

                {/* Side-by-side Prompt and Output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prompt (Left) */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                        PROMPT
                      </span>
                    </h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-gray-800 text-sm">{run.prompt}</p>
                    </div>
                  </div>

                  {/* Output (Right) */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2">
                        OUTPUT
                      </span>
                    </h4>
                    <div
                      className={`border-l-4 p-4 rounded ${
                        run.risk_level === 'danger'
                          ? 'bg-red-100 border-red-500'
                          : run.risk_level === 'warning'
                          ? 'bg-yellow-100 border-yellow-500'
                          : 'bg-green-100 border-green-500'
                      }`}
                    >
                      <p className="text-gray-800 text-sm">{run.output}</p>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                {run.flags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">
                      🚨 Detected Threats:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {run.flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {flag.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drift Indicators */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-600">Urgency</p>
                    <p className="text-lg font-bold text-orange-600">
                      {(run.drift_indicators.urgency_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-600">Threat</p>
                    <p className="text-lg font-bold text-red-600">
                      {(run.drift_indicators.threat_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-600">Legitimacy</p>
                    <p className="text-lg font-bold text-green-600">
                      {(run.drift_indicators.legitimacy_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-600">Deviation</p>
                    <p className="text-lg font-bold text-purple-600">
                      {(run.drift_indicators.tone_deviation * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && runs.length === 0 && apiKey && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No monitoring data available.</p>
            <p className="text-gray-500 text-sm">Select a platform and time range to view data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;

