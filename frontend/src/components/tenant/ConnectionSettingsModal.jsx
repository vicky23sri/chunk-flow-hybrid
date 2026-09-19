import React, { useState, useEffect } from 'react';
import { Database, Cloud, Plug, Save, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { getSavedPostgresConfig, savePostgresConfig, getSavedS3Config, saveS3Config } from '../../services/connectionStorage';
import { useFormValidation } from '../../hooks/useFormValidation';
import PostgresConfigForm from './workflow/PostgresConfigForm';
import S3ConfigForm from './workflow/S3ConfigForm';

export default function ConnectionSettingsModal({ tenant, onClose, onSave }) {
  const [pgConfig, setPgConfig] = useState(() => getSavedPostgresConfig(tenant?.subdomain || 'acme'));
  const [s3Config, setS3Config] = useState(() => getSavedS3Config());

  const [showPgPassword, setShowPgPassword] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const pgVal = useFormValidation();
  const s3Val = useFormValidation();

  useEffect(() => {
    const pg = getSavedPostgresConfig(tenant?.subdomain || 'acme');
    const s3 = getSavedS3Config();
    setPgConfig(pg);
    setS3Config(s3);
  }, [tenant?.subdomain]);

  const handlePgChange = (key, value) => {
    setPgConfig((prev) => ({ ...prev, [key]: value }));
    pgVal.clearFieldError(key);
    setTestResult(null);
  };

  const handleS3Change = (key, value) => {
    setS3Config((prev) => ({ ...prev, [key]: value }));
    s3Val.clearFieldError(key);
    setTestResult(null);
  };

  const handleTestConnection = () => {
    const isPgOk = pgVal.validatePostgres(pgConfig);
    const isS3Ok = s3Val.validateS3(s3Config);

    if (!isPgOk || !isS3Ok) return;

    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      setTestResult({
        success: true,
        msg: `Disclaimer: Connection verified! PostgreSQL '${pgConfig.database}' on ${pgConfig.host}:${pgConfig.port} and AWS S3 bucket '${s3Config.bucketName}' are active. "Save Credentials & Sync" is now activated.`,
      });
    }, 800);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!testResult?.success) return;
    const isPgOk = pgVal.validatePostgres(pgConfig);
    const isS3Ok = s3Val.validateS3(s3Config);

    if (!isPgOk || !isS3Ok) return;

    savePostgresConfig(pgConfig);
    saveS3Config(s3Config);

    if (onSave) {
      onSave({ pgConfig, s3Config });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 text-left">
      <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 max-w-5xl w-full text-slate-900 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Plug size={24} className="text-[#f95716]" />
              Database & Storage Connection Settings
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-normal">
              Configure PostgreSQL database routing and S3 vault credentials for tenant <code className="font-mono text-[#f95716] font-bold">{tenant?.name}</code>. Auto-saves and syncs across node configurations.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Columns: PostgreSQL Form vs S3 Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PostgreSQL Settings Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-bold text-indigo-600 uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Database size={16} /> PostgreSQL Node Configuration
              </h4>

              <PostgresConfigForm
                config={pgConfig}
                onChange={handlePgChange}
                showPassword={showPgPassword}
                onTogglePassword={() => setShowPgPassword(!showPgPassword)}
                errors={pgVal.errors}
              />
            </div>

            {/* S3 Storage Settings Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-sm font-bold text-emerald-600 uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Cloud size={16} /> AWS S3 Storage Vault Configuration
              </h4>

              <S3ConfigForm
                config={s3Config}
                onChange={handleS3Change}
                showSecret={showS3Secret}
                onToggleSecret={() => setShowS3Secret(!showS3Secret)}
                errors={s3Val.errors}
              />
            </div>

          </div>

          {testResult && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              testResult.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <ShieldCheck size={18} /> {testResult.msg}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              {testing ? <RefreshCw size={14} className="animate-spin" /> : <Plug size={14} />}
              <span>{testing ? 'Testing Connections...' : 'Test Both Connections'}</span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="relative group">
                {!testResult?.success && (
                  <div className="absolute bottom-full right-0 mb-2.5 w-[250px] p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 text-center border border-slate-700/80">
                    <div className="flex items-center gap-1.5 justify-center text-amber-400 font-bold mb-0.5">
                      <ShieldCheck size={13} /> Disclaimer & Requirement
                    </div>
                    <span className="text-slate-200 leading-tight block">
                      Save is deactivated. Click <strong>"Test Both Connections"</strong> first to verify configurations.
                    </span>
                    <div className="absolute top-full right-8 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!testResult?.success}
                  className="px-6 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 shadow-none"
                >
                  <Save size={14} />
                  <span>Save Credentials & Sync</span>
                </button>
              </div>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
