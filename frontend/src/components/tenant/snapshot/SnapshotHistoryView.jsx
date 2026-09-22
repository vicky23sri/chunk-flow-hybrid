import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, ShieldCheck, HardDrive, Calendar, Clock, Download, Hash } from 'lucide-react';
import { listSnapshots, getChunkSize } from '../../../services/api';
import SnapshotHistoryList from './SnapshotHistoryList';

export default function SnapshotHistoryView({ tenant }) {
  const [snapshots, setSnapshots] = useState([]);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const [snapRes, sizeRes] = await Promise.all([
        listSnapshots(),
        getChunkSize(),
      ]);

      if (Array.isArray(snapRes)) {
        setSnapshots(snapRes);
      }
      if (sizeRes && typeof sizeRes.physical_size_bytes === 'number') {
        setTotalSizeBytes(sizeRes.physical_size_bytes);
      }
    } catch (err) {
      console.error('Failed to load snapshot history:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.subdomain]);

  const formattedTotalMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full flex-1 space-y-6 text-left font-sans bg-[#f8fafc] min-h-[calc(100vh-100px)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-white via-slate-50 to-orange-50/40 border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden mb-6 text-slate-900 text-left">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={13} className="text-emerald-600" /> master.csv Audit Log
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200">
                  <Database size={13} className="text-[#f95716]" /> FastCDC Engine Sliced
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f95716] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <Database size={22} />
                </div>
                <span>CDC Master Vault Snapshots</span>
              </h1>

              <p className="text-slate-500 text-xs sm:text-sm font-normal max-w-2xl leading-relaxed">
                Dedicated snapshot manifest repository for tenant workspace <code className="font-mono text-[#f95716] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{tenant?.subdomain || 'willsparrow'}</code>. Browse timestamped database snapshots and download chunk hash details JSON files.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#f95716]' : 'text-slate-500'} />
                <span>Refresh Snapshots</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading / List */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl py-20 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3 shadow-xs">
            <RefreshCw size={28} className="animate-spin text-[#f95716]" />
            <span>Loading master.csv CDC snapshots...</span>
          </div>
        ) : (
          <SnapshotHistoryList snapshots={snapshots} onRefresh={loadData} />
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-500 font-mono flex flex-wrap justify-between items-center gap-3 shadow-xs mt-6">
        <div className="flex items-center gap-2">
          <HardDrive size={13} className="text-slate-400" />
          <span>Audit Log File: <code className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">logs/vault/master.csv</code></span>
        </div>

        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span>Physical Storage Size: <code className="text-[#f95716] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{formattedTotalMB} MB</code></span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>FastCDC Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
