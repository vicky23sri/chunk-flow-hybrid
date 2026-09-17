import React, { useState } from 'react';
import { 
  Database, Download, RefreshCw, Filter, HardDrive, ShieldCheck, 
  FileCode, CheckCircle2, ChevronRight, Hash, Layers, Calendar, ExternalLink
} from 'lucide-react';

export default function SnapshotExplorer({ tenant }) {
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo snapshot database entries with FastCDC metrics
  const [snapshots, setSnapshots] = useState([
    {
      id: 'snap_001_20260917_020000',
      timestamp: '2026-09-17 02:00:00',
      database: `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
      tablesCount: 14,
      rawSizeMB: 128.4,
      chunkedSizeMB: 26.8,
      dedupRatio: '4.8x',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      s3Key: `tenant/${tenant?.id || 'acme'}/snapshots/20260917_020000.sql.dump`,
      status: 'Verified',
    },
    {
      id: 'snap_002_20260916_020000',
      timestamp: '2026-09-16 02:00:00',
      database: `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
      tablesCount: 14,
      rawSizeMB: 125.1,
      chunkedSizeMB: 26.1,
      dedupRatio: '4.8x',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      s3Key: `tenant/${tenant?.id || 'acme'}/snapshots/20260916_020000.sql.dump`,
      status: 'Verified',
    },
    {
      id: 'snap_003_20260915_020000',
      timestamp: '2026-09-15 02:00:00',
      database: `chunkflow_tenant_${tenant?.subdomain || 'acme'}`,
      tablesCount: 12,
      rawSizeMB: 118.0,
      chunkedSizeMB: 25.2,
      dedupRatio: '4.7x',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      s3Key: `tenant/${tenant?.id || 'acme'}/snapshots/20260915_020000.sql.dump`,
      status: 'Verified',
    },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleDownload = (snap) => {
    const content = `-- ChunkFlow Backup Snapshot DUMP
-- Tenant: ${tenant?.name || 'Acme'} (${tenant?.subdomain})
-- Database: ${snap.database}
-- Timestamp: ${snap.timestamp}
-- SHA-256 Checksum: ${snap.sha256}
-- FastCDC Ratio: ${snap.dedupRatio}

SELECT pg_catalog.set_config('search_path', 'public', false);
-- Dump payload mock
`;
    const blob = new Blob([content], { type: 'application/x-sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snap.id}.sql.dump`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white text-slate-900 p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-left relative overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Database size={24} className="text-[#f95716]" />
            Database Backup Snapshots & Vault
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-normal">
            Git-like FastCDC versioned snapshot history for database <code className="font-mono text-[#f95716] font-bold">chunkflow_tenant_{tenant?.subdomain}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold font-mono py-2.5 px-4 rounded-xl outline-none focus:border-[#f95716] appearance-none pr-8 cursor-pointer shadow-sm"
            >
              <option value="all">All Snapshots</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <Filter size={13} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Snapshots Grid */}
      <div className="space-y-4">
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            className="bg-slate-50/60 border border-slate-200/90 rounded-2xl p-5 hover:border-[#f95716]/60 hover:bg-white transition-all duration-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
          >
            {/* Snapshot Information */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
                <FileCode size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-black text-base text-slate-900 tracking-tight font-mono">
                    {snap.id}
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 size={11} /> {snap.status}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200">
                    FastCDC {snap.dedupRatio}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-mono flex items-center gap-4 flex-wrap mt-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Calendar size={13} /> {snap.timestamp}
                  </span>
                  <span>Tables: <strong className="text-slate-900">{snap.tablesCount}</strong></span>
                  <span>Size: <strong className="text-sky-600 font-bold">{snap.chunkedSizeMB} MB</strong> <span className="text-slate-400 line-through">({snap.rawSizeMB} MB raw)</span></span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono mt-2 flex items-center gap-2 truncate max-w-xl">
                  <Hash size={12} className="text-[#f95716] shrink-0" />
                  <span className="truncate">SHA-256: {snap.sha256}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleDownload(snap)}
                className="px-4 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-orange-500/20"
              >
                <Download size={14} />
                <span>Download Snapshot</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Meta */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono flex flex-wrap justify-between items-center gap-2">
        <span>S3 Partition Storage Vault: s3://chunkflow-raw/tenant/{tenant?.id}/snapshots/</span>
        <span className="text-emerald-600 font-bold">FastCDC Content-Defined Chunking Active</span>
      </div>

    </div>
  );
}
