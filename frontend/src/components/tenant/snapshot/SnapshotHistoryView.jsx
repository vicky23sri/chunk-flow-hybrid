import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, ShieldCheck, HardDrive, Calendar, Clock, Download, Hash, FileText } from 'lucide-react';
import { listSnapshots, getChunkSize } from '../../../services/api';
import SnapshotHistoryList from './SnapshotHistoryList';
import PageHeader from '../../shared/PageHeader';

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
    <div className="w-full space-y-6 text-left font-sans flex flex-col justify-between flex-1">
      <div>
        {/* Header */}
        <PageHeader
            icon={FileText}
            title="CDC Master Vault Snapshots"
            description={`Snapshot manifest for tenant ${tenant?.subdomain || 'willsparrow'} — Browse timestamped database snapshots`}
            actions={
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#f95716]' : 'text-slate-400'} /> Refresh
              </button>
            }
          />

        {/* Loading / List */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl py-20 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3 shadow-xs">
            <RefreshCw size={28} className="animate-spin text-[#f95716]" />
            <span>Loading CDC Vault snapshots from database...</span>
          </div>
        ) : (
          <SnapshotHistoryList snapshots={snapshots} onRefresh={loadData} />
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-500 font-mono flex flex-wrap justify-between items-center gap-3 shadow-xs mt-6">
        <div className="flex items-center gap-2">
          <HardDrive size={13} className="text-slate-400" />
          <span>Vault Table: <code className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">cdc_snapshot_vaults</code></span>
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
