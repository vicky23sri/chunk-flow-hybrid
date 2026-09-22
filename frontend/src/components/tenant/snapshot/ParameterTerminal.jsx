import React from 'react';
import { Terminal } from 'lucide-react';

export default function ParameterTerminal({
  wf,
  pgConfig,
  s3Config,
  activeTab,
  onTabChange,
}) {
  return (
    <div className="bg-slate-50 border-t border-slate-200 p-5 text-slate-800 animate-in fade-in duration-200 text-left rounded-b-3xl">
      {/* Terminal Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-4 flex-wrap">
        <Terminal size={16} className="text-[#f95716]" />
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Parameter Specs:</span>

        <button
          onClick={() => onTabChange('postgres')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'postgres'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          PostgreSQL Source Specs
        </button>

        <button
          onClick={() => onTabChange('s3')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 's3'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Amazon S3 Vault Specs
        </button>
      </div>

      {/* Tab 1: PostgreSQL Full Parameters */}
      {activeTab === 'postgres' && (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl font-mono text-xs text-slate-700 space-y-2.5 shadow-xs">
          <div className="flex justify-between border-b border-slate-200 pb-2 text-blue-700 font-bold uppercase tracking-wider">
            <span>PARAMETER NAME</span>
            <span>VALUE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">configuration_name</span>
            <span className="text-slate-900 font-bold">{pgConfig.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">database_host</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">{pgConfig.host}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">database_port</span>
            <span className="text-blue-700 font-bold">{pgConfig.port}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">database_name</span>
            <span className="text-[#f95716] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">{pgConfig.database}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">username</span>
            <span className="text-slate-900 font-medium">{pgConfig.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">use_ssl</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">{pgConfig.useSSL ? 'true (require)' : 'false (disable)'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">backup_schedule_cron</span>
            <span className="text-slate-900">{pgConfig.backupSchedule || '0 30 15 * * *'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">retention_days</span>
            <span className="text-slate-900 font-bold">{pgConfig.retentionDays} Days</span>
          </div>
        </div>
      )}

      {/* Tab 2: S3 Vault Full Parameters */}
      {activeTab === 's3' && (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl font-mono text-xs text-slate-700 space-y-2.5 shadow-xs">
          <div className="flex justify-between border-b border-slate-200 pb-2 text-emerald-700 font-bold uppercase tracking-wider">
            <span>PARAMETER NAME</span>
            <span>VALUE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">vault_name</span>
            <span className="text-slate-900 font-bold">{s3Config.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">s3_bucket_name</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">s3://{s3Config.bucketName}/</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">aws_region</span>
            <span className="text-slate-900 font-bold">{s3Config.region}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">access_key_id</span>
            <span className="text-slate-800">{s3Config.accessKeyId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">folder_prefix_path</span>
            <span className="text-slate-800">{s3Config.folderPath || 'raw/chunkflow/'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">encryption_standard</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">{s3Config.encryption}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">storage_class</span>
            <span className="text-slate-800">{s3Config.storageClass}</span>
          </div>
        </div>
      )}
    </div>
  );
}
