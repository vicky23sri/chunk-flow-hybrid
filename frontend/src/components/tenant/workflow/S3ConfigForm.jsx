import React from 'react';
import { Cloud, Eye, EyeOff, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function S3ConfigForm({
  config = {},
  onChange,
  showSecret,
  onToggleSecret,
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
      {/* Bucket Name */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Bucket Name *</label>
        <input
          type="text"
          value={config.bucketName ?? ''}
          placeholder="e.g. my-s3-bucket-name"
          disabled={readOnly}
          onChange={(e) => handleChange('bucketName', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-medium outline-none shadow-xs transition-all"
        />
      </div>

      {/* Region */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Region *</label>
        <select
          value={config.region || 'us-west-2'}
          disabled={readOnly}
          onChange={(e) => handleChange('region', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none shadow-xs transition-all cursor-pointer"
        >
          <option value="us-west-2">US West (Oregon)</option>
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="eu-west-1">EU West (Ireland)</option>
          <option value="ap-south-1">AP South (Mumbai)</option>
        </select>
      </div>

      {/* Access Key ID */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Access Key ID *</label>
        <input
          type="text"
          value={config.accessKeyId ?? ''}
          placeholder="e.g. AKIA..."
          disabled={readOnly}
          onChange={(e) => handleChange('accessKeyId', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none shadow-xs transition-all uppercase"
        />
      </div>

      {/* Secret Access Key */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Secret Access Key *</label>
        <div className="relative flex items-center">
          <input
            type={showSecret ? 'text' : 'password'}
            value={config.secretAccessKey ?? ''}
            placeholder="Enter AWS Secret Access Key..."
            disabled={readOnly}
            onChange={(e) => handleChange('secretAccessKey', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 outline-none shadow-xs transition-all font-mono"
          />
          {onToggleSecret && (
            <button
              type="button"
              onClick={onToggleSecret}
              className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              title={showSecret ? 'Hide secret access key' : 'Show secret access key'}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Folder Path */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Folder Path</label>
        <input
          type="text"
          value={config.folderPath ?? ''}
          placeholder="e.g. raw/chunkflow/"
          disabled={readOnly}
          onChange={(e) => handleChange('folderPath', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none shadow-xs transition-all"
        />
      </div>

      {/* Storage Settings */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <h4 className="font-bold text-xs text-slate-900">Storage Settings</h4>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Encryption</label>
          <select
            value={config.encryption || 'AES-256 Server-Side Encryption'}
            disabled={readOnly}
            onChange={(e) => handleChange('encryption', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none shadow-xs transition-all cursor-pointer"
          >
            <option value="AES-256 Server-Side Encryption">AES-256 Server-Side Encryption</option>
            <option value="AWS-KMS">AWS-KMS (Key Management Service)</option>
            <option value="None">None</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">Storage Class</label>
          <select
            value={config.storageClass || 'Standard'}
            disabled={readOnly}
            onChange={(e) => handleChange('storageClass', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none shadow-xs transition-all cursor-pointer"
          >
            <option value="Standard">Standard</option>
            <option value="Intelligent-Tiering">Intelligent-Tiering</option>
            <option value="Glacier Instant Retrieval">Glacier Instant Retrieval</option>
            <option value="Deep Archive">Deep Archive</option>
          </select>
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

      {/* Test S3 Button */}
      {onTestConnection && (
        <button
          type="button"
          onClick={onTestConnection}
          disabled={isTesting}
          className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isTesting ? (
            <RefreshCw size={14} className="animate-spin text-emerald-600" />
          ) : (
            <Zap size={14} className="text-emerald-600 fill-emerald-600" />
          )}
          <span>{isTesting ? 'Verifying S3 Access...' : 'Test S3 Configuration'}</span>
        </button>
      )}
    </div>
  );
}
