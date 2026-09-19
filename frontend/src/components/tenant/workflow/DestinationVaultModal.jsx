import React from 'react';
import { Cloud, ShieldCheck, CheckCircle2, Folder, Zap, X, Lock, Server } from 'lucide-react';

export default function DestinationVaultModal({
  isOpen,
  onClose,
  s3Details,
  onConfirmDestination,
}) {
  if (!isOpen || !s3Details) return null;

  const bucketName = s3Details.bucketName || 'my-s3-vault';
  const region = s3Details.region || 'us-west-2';
  const folderPath = s3Details.folderPath || 'raw/chunkflow/';
  const encryption = s3Details.encryption || 'AES-256 Server-Side Encryption';
  const storageClass = s3Details.storageClass || 'Standard';

  const handleConfirm = () => {
    if (onConfirmDestination) onConfirmDestination(s3Details);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-left">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
            <Cloud size={180} />
          </div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                <ShieldCheck size={12} className="text-emerald-400" /> S3 Access Verified
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Destination S3 Vault Details
            </h3>
            <p className="text-xs text-slate-300 font-mono">
              Target Bucket: <strong className="text-emerald-300">s3://{bucketName}/</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 border-b border-slate-200/80">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Cloud size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Bucket</span>
              <span className="text-xs font-bold text-slate-900 truncate block font-mono">{bucketName}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <Server size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">AWS Region</span>
              <span className="text-xs font-bold text-slate-900 truncate block font-mono">{region}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Storage</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{storageClass}</span>
            </div>
          </div>
        </div>

        {/* Verification Checkmarks & Details */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
            <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-600" /> S3 Vault Security & Permissions Checklist
            </h4>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Bucket Access & Policy Verification: <strong className="text-slate-900">Passed</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Multi-part S3 Chunk Streaming: <strong className="text-slate-900">Enabled</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Destination Folder Prefix: <strong className="font-mono text-emerald-800">{folderPath}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Encryption Engine: <strong className="text-slate-900">{encryption}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            S3 Vault Destination ready for FastCDC pipeline
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Confirm S3 Destination Vault</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
