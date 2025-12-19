import React, { useState, useEffect } from 'react';
import { syncPayroll, getPayrollSyncStatus, validatePrePayroll, runPrePayrollClosure, generatePayrollPayload } from '../../../services/timeManagementApi';

interface PayrollSync {
  _id?: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  syncedAt?: string;
  payloadSummary?: any;
  errors?: string[];
}

export default function PayrollSync() {
  const [syncHistory, setSyncHistory] = useState<PayrollSync[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncFormData, setSyncFormData] = useState({
    periodStart: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleValidate = async () => {
    try {
      setValidating(true);
      setError(null);
      setSuccess(null);
      const response = await validatePrePayroll({
        periodStart: syncFormData.periodStart,
        periodEnd: syncFormData.periodEnd,
      });
      setValidationResult(response.data);
      if (response.data?.isValid) {
        setSuccess('Pre-payroll validation passed');
      } else {
        setError('Pre-payroll validation failed. Please review the issues.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      const response = await syncPayroll({
        periodStart: syncFormData.periodStart,
        periodEnd: syncFormData.periodEnd,
      });
      setSuccess('Payroll sync initiated successfully');
      setShowSyncModal(false);
      // Reload sync history if available
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleGeneratePayload = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await generatePayrollPayload({
        periodStart: syncFormData.periodStart,
        periodEnd: syncFormData.periodEnd,
      });
      // Open payload in new window or download
      if (response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll-payload-${syncFormData.periodStart}-${syncFormData.periodEnd}.json`;
        a.click();
        setSuccess('Payroll payload generated and downloaded');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate payload');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-500/20 text-green-300 border-green-400/30',
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      FAILED: 'bg-red-500/20 text-red-300 border-red-400/30',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-400/30';
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-white">Payroll Integration</h2>
        <p className="text-gray-400 text-sm">Sync attendance data with payroll system and generate payroll payloads</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300">
          {success}
        </div>
      )}

      {/* Payroll Period Selection */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payroll Period</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Period Start *</label>
            <input
              type="date"
              value={syncFormData.periodStart}
              onChange={(e) => setSyncFormData({ ...syncFormData, periodStart: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Period End *</label>
            <input
              type="date"
              value={syncFormData.periodEnd}
              onChange={(e) => setSyncFormData({ ...syncFormData, periodEnd: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 hover:bg-blue-500/20 transition-all disabled:opacity-50"
          >
            {validating ? 'Validating...' : '🔍 Validate Pre-Payroll'}
          </button>
          <button
            onClick={() => setShowSyncModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all"
          >
            💰 Sync to Payroll
          </button>
          <button
            onClick={handleGeneratePayload}
            disabled={loading}
            className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Generating...' : '📄 Generate Payroll Payload'}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className={`mb-6 border rounded-2xl p-6 ${
          validationResult.isValid
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <h3 className="text-lg font-semibold mb-4 text-white">
            {validationResult.isValid ? '✅ Validation Passed' : '❌ Validation Failed'}
          </h3>
          {validationResult.issues && validationResult.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-300 font-semibold">Issues Found:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {validationResult.issues.map((issue: string, index: number) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {validationResult.summary && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(validationResult.summary).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{key}</p>
                  <p className="text-white font-semibold">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync History */}
      {syncHistory.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sync History</h3>
          <div className="space-y-3">
            {syncHistory.map((sync) => (
              <div
                key={sync._id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      {new Date(sync.periodStart).toLocaleDateString()} - {new Date(sync.periodEnd).toLocaleDateString()}
                    </p>
                    {sync.syncedAt && (
                      <p className="text-sm text-gray-400">
                        Synced: {new Date(sync.syncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(sync.status)}`}>
                    {sync.status}
                  </span>
                </div>
                {sync.errors && sync.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300 font-semibold mb-1">Errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-200">
                      {sync.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Sync to Payroll</h3>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Period</p>
                <p className="text-white">
                  {new Date(syncFormData.periodStart).toLocaleDateString()} - {new Date(syncFormData.periodEnd).toLocaleDateString()}
                </p>
              </div>

              {validationResult && !validationResult.isValid && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Pre-payroll validation has issues. It's recommended to resolve them before syncing.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Confirm Sync'}
                </button>
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
