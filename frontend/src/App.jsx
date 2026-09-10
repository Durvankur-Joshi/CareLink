import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/health`);
      setHealthStatus(response.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend');
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
          <p className="text-sm text-slate-400 mt-1">Phase 0 — Project Foundation</p>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Frontend Status</div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-emerald-400">React + Vite Running (Port 5173)</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Backend Connection Test</div>
          <div className="text-xs text-slate-500 font-mono">GET {apiUrl}/api/health</div>

          {loading && (
            <p className="text-sm text-amber-400">Connecting to backend...</p>
          )}

          {error && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                <span className="text-sm font-medium text-rose-400">Connection Failed</span>
              </div>
              <p className="text-xs text-rose-300/80 font-mono">{error}</p>
            </div>
          )}

          {healthStatus && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-medium text-emerald-400">Connected</span>
              </div>
              <pre className="text-xs bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 font-mono overflow-x-auto">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <button
          onClick={checkHealth}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retest Connection
        </button>
      </div>
    </div>
  );
}

export default App;
