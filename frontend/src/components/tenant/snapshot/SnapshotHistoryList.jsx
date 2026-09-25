import React from 'react';
import { Calendar, Clock, Hash, Download, Database, CheckCircle, Archive } from 'lucide-react';
import { downloadSnapshot } from '../../../services/api';
import { showSuccess, showError } from '../../../utils/toast';

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(seconds / 86400);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function SnapshotHistoryList({ snapshots, onRefresh }) {
  const handleDownload = async (manifestId) => {
    try {
      await downloadSnapshot(manifestId);
      showSuccess(`Snapshot hash details "${manifestId}" downloaded!`, 'Hashes Downloaded');
    } catch (err) {
      showError(err.message || 'Failed to download snapshot hash details.', 'Download Error');
    }
  };

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center my-6 text-slate-500 font-sans shadow-xs">
        <Database size={32} className="mx-auto text-slate-300 mb-3" />
        <h4 className="font-bold text-slate-700 text-sm">No CDC Snapshots Recorded in Vault</h4>
        <p className="text-xs text-slate-400 mt-1">Run a FastCDC stream pipeline above to generate timestamped database snapshots.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6 text-left font-sans">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Database size={16} className="text-[#f95716]" />
          <span>FastCDC Master Vault Snapshots ({snapshots.length})</span>
        </h3>
        <span className="text-[11px] font-mono font-medium text-slate-400">
          Source: master.csv
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {snapshots.map((s) => {
          const date = new Date(s.timestamp || Date.now());
          const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const isRecent = Date.now() - date.getTime() < 24 * 60 * 60 * 1000;

          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200/90 hover:border-orange-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-[13px] font-black text-slate-900 truncate flex items-center gap-2">
                    <Hash size={12} className="text-[#f95716] text-bold" />
                    <span>Snapshot: {s.id}</span>
                  </h4>

                  {isRecent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle size={11} /> Recent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <Archive size={11} /> Archived
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>{formattedTime}</span>
                  </span>
                  <span className="text-slate-400">({timeAgo(date)})</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleDownload(s.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#f95716] text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  title="Download CDC Snapshot Hash Details"
                >
                  <Download size={14} />
                  <span>Download Hashes</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
