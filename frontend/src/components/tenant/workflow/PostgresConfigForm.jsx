import React from 'react';
import { Eye, EyeOff, Plug, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PostgresConfigForm({
  config = {},
  onChange,
  showPassword,
  onTogglePassword,
  onTestConnection,
  isTesting,
  testResult,
  errors = {},
  readOnly = false,
}) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="space-y-4 text-xs text-left">
      {/* Configuration Name */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Configuration Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.name ?? ''}
          placeholder="e.g. Primary Production Database"
          disabled={readOnly}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 text-xs outline-none shadow-xs transition-all"
        />
      </div>

      {/* Host */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Host <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.host ?? ''}
          placeholder="e.g. localhost or 127.0.0.1"
          disabled={readOnly}
          onChange={(e) => handleChange('host', e.target.value)}
          className={`w-full ${
            errors?.host
              ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
          } rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium outline-none shadow-xs transition-all`}
        />
        {errors?.host && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.host}
          </span>
        )}
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
            className={`w-full ${
              errors?.port
                ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
            } rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium outline-none shadow-xs transition-all`}
          />
          {errors?.port && (
            <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
              <AlertCircle size={12} className="shrink-0 text-rose-500" />
              {errors.port}
            </span>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Database Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={config.database ?? ''}
            placeholder="e.g. chunkflow_tenant_acme"
            disabled={readOnly}
            onChange={(e) => handleChange('database', e.target.value)}
            className={`w-full ${
              errors?.database
                ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900 font-bold'
                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-sky-600 font-bold'
            } rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none shadow-xs transition-all`}
          />
          {errors?.database && (
            <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
              <AlertCircle size={12} className="shrink-0 text-rose-500" />
              {errors.database}
            </span>
          )}
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Username <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.username ?? ''}
          placeholder="e.g. postgres or db_user"
          disabled={readOnly}
          onChange={(e) => handleChange('username', e.target.value)}
          className={`w-full ${
            errors?.username
              ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
          } rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium outline-none shadow-xs transition-all`}
        />
        {errors?.username && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.username}
          </span>
        )}
      </div>

      {/* Password with Eye Toggle */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            value={config.password ?? ''}
            placeholder="Enter database password..."
            disabled={readOnly}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`w-full ${
              errors?.password
                ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
            } rounded-xl pl-3.5 pr-10 py-2.5 text-xs outline-none shadow-xs transition-all font-mono`}
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
        {errors?.password && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.password}
          </span>
        )}
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
            className={`w-full ${
              errors?.retentionDays
                ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
            } rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none shadow-xs transition-all`}
          />
          {errors?.retentionDays && (
            <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
              <AlertCircle size={12} className="shrink-0 text-rose-500" />
              {errors.retentionDays}
            </span>
          )}
        </div>
      </div>

      {/* Test Connection Disclaimer & Status */}
      {testResult && (testResult.success || testResult.type === 'success') && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/50 border border-emerald-300/80 text-emerald-900 text-xs font-medium shadow-xs animate-in fade-in zoom-in-95 duration-200 space-y-1 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-xs font-black tracking-tight text-emerald-950">Connection Verified</span>
            <span className="ml-auto text-[10px] font-mono bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
              Save Active
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-snug pl-8">
            <strong className="font-bold text-emerald-900">Disclaimer:</strong> Database parameters authenticated successfully. The <span className="font-bold text-slate-900 underline decoration-emerald-500 decoration-2">"Save Config"</span> button is now activated.
          </p>
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
          <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
        </button>
      )}
    </div>
  );
}
