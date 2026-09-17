import React from 'react';
import { Eye, EyeOff, Plug, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PostgresConfigForm({
  config = {},
  onChange,
  showPassword,
  onTogglePassword,
  onTestConnection,
  isTesting,
  testResult,
  readOnly = false,
}) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="space-y-4 text-xs text-left">
      {/* Host */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Host *</label>
        <input
          type="text"
          value={config.host ?? ''}
          placeholder="e.g. localhost or 127.0.0.1"
          disabled={readOnly}
          onChange={(e) => handleChange('host', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-medium outline-none shadow-xs transition-all"
        />
      </div>

      {/* Port & Database */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Port</label>
          <input
            type="text"
            value={config.port ?? ''}
            placeholder="e.g. 5432"
            disabled={readOnly}
            onChange={(e) => handleChange('port', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-medium outline-none shadow-xs transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Database Name *</label>
          <input
            type="text"
            value={config.database ?? ''}
            placeholder="e.g. chunkflow_tenant_acme"
            disabled={readOnly}
            onChange={(e) => handleChange('database', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-sky-600 font-mono font-bold outline-none shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Username *</label>
        <input
          type="text"
          value={config.username ?? ''}
          placeholder="e.g. postgres or db_user"
          disabled={readOnly}
          onChange={(e) => handleChange('username', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-medium outline-none shadow-xs transition-all"
        />
      </div>

      {/* Password with Eye Toggle */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Password *</label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            value={config.password ?? ''}
            placeholder="Enter database password..."
            disabled={readOnly}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 outline-none shadow-xs transition-all font-mono"
          />
          {onTogglePassword && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* SSL Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="use-ssl-check"
          checked={!!config.useSSL}
          disabled={readOnly}
          onChange={(e) => handleChange('useSSL', e.target.checked)}
          className="w-4 h-4 rounded text-[#f95716] focus:ring-[#f95716] border-slate-300 cursor-pointer"
        />
        <label htmlFor="use-ssl-check" className="text-xs font-medium text-slate-700 cursor-pointer">
          Use SSL connection
        </label>
      </div>

      {/* Backup Settings */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <h4 className="font-bold text-xs text-slate-900">Backup Settings</h4>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Schedule (Cron)</label>
          <input
            type="text"
            value={config.backupSchedule ?? ''}
            placeholder="e.g. 0 30 15 * * *"
            disabled={readOnly}
            onChange={(e) => handleChange('backupSchedule', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs font-mono text-sky-600 font-bold outline-none shadow-xs transition-all"
          />
          <span className="text-[11px] text-slate-400 font-normal block mt-1">
            Daily at 2 AM by default
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Retention Days</label>
          <input
            type="number"
            value={config.retentionDays ?? ''}
            placeholder="e.g. 30"
            disabled={readOnly}
            onChange={(e) => handleChange('retentionDays', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Test Connection Result Notice */}
      {testResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
            testResult.type === 'success' || testResult.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium'
              : 'bg-rose-50 text-rose-900 border-rose-200 font-medium'
          }`}
        >
          {testResult.type === 'success' || testResult.success ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{testResult.message || testResult.msg}</span>
        </div>
      )}

      {/* Test Connection Button */}
      {onTestConnection && (
        <button
          type="button"
          onClick={onTestConnection}
          disabled={isTesting}
          className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isTesting ? (
            <RefreshCw size={14} className="animate-spin text-blue-600" />
          ) : (
            <Plug size={14} className="text-blue-600" />
          )}
          <span>{isTesting ? 'Testing PostgreSQL Connection...' : 'Test PostgreSQL Connection'}</span>
        </button>
      )}
    </div>
  );
}
