import React, { useState } from 'react';
import {
  FileCode, Clock, Plug, Unplug, RefreshCw, Play,
  X, Layers, Download, Database, Cloud, Zap,
  ArrowRight, Shield, Lock, Server, HardDrive, Activity,
  Copy, CheckCircle2, ExternalLink, Eye, ChevronRight,
  Globe, Calendar, Timer, FolderOpen, Key, ShieldCheck
} from 'lucide-react';

// ─── Compact Table Row (Default View) ────────────────────────────────────
export default function TopologyCard({
  wf,
  tenant,
  tenantConfig,
  isExpanded,
  activeParamTab,
  isRunning,
  onToggleExpand,
  onParamTabChange,
  onRunCdcStream,
  onNavigateToBuilder,
  onDownloadSnapshot,
}) {
  const [showModal, setShowModal] = useState(false);

  // Parse connections & nodes
  let connections = [];
  try {
    if (Array.isArray(wf.connections_data)) connections = wf.connections_data;
    else if (typeof wf.connections_data === 'string') connections = JSON.parse(wf.connections_data);
  } catch (e) {}

  let nodes = [];
  try {
    if (Array.isArray(wf.nodes_data)) nodes = wf.nodes_data;
    else if (typeof wf.nodes_data === 'string') nodes = JSON.parse(wf.nodes_data);
  } catch (e) {}

  const isWired = (connections && connections.length > 0) || (wf.source_config_id && wf.destination_config_id);

  // Extract PostgreSQL Config
  const pgNode = nodes.find((n) => n.subtype === 'postgres' || n.type === 'source');
  const pgConfig = {
    name: pgNode?.config?.name || wf.source_name || tenantConfig.postgres?.[0]?.name || 'PostgreSQL Data Source',
    host: pgNode?.config?.host || tenantConfig.postgres?.[0]?.host || 'localhost',
    port: pgNode?.config?.port || tenantConfig.postgres?.[0]?.port || '5432',
    database: pgNode?.config?.database || tenantConfig.postgres?.[0]?.database_name || `chunkflow_tenant_${tenant?.subdomain || 'willsparrow'}`,
    username: pgNode?.config?.username || tenantConfig.postgres?.[0]?.username || 'virat',
    useSSL: pgNode?.config?.useSSL ?? tenantConfig.postgres?.[0]?.use_ssl ?? false,
    backupSchedule: pgNode?.config?.backupSchedule || tenantConfig.postgres?.[0]?.backup_schedule || '0 30 15 * * *',
    retentionDays: pgNode?.config?.retentionDays || tenantConfig.postgres?.[0]?.retention_days || 30,
  };

  // Extract S3 Config
  const s3Node = nodes.find((n) => n.subtype === 's3' || n.type === 'destination');
  const s3Config = {
    name: s3Node?.config?.name || wf.destination_name || tenantConfig.s3?.[0]?.name || 'Amazon S3 Vault',
    bucketName: s3Node?.config?.bucketName || tenantConfig.s3?.[0]?.bucket_name || 'chunkflow-vault-raw',
    region: s3Node?.config?.region || tenantConfig.s3?.[0]?.region || 'us-west-2',
    accessKeyId: s3Node?.config?.accessKeyId || tenantConfig.s3?.[0]?.access_key_id || 'AKIAU6GDU4SYVJT2X***',
    folderPath: s3Node?.config?.folderPath || tenantConfig.s3?.[0]?.folder_path || 'raw/chunkflow/',
    encryption: s3Node?.config?.encryption || tenantConfig.s3?.[0]?.encryption || 'AES-256 Server-Side Encryption',
    storageClass: s3Node?.config?.storageClass || tenantConfig.s3?.[0]?.storage_class || 'Standard',
  };

  const timeStr = new Date(wf.created_at || Date.now()).toLocaleString();

  return (
    <>
      {/* ── COMPACT TABLE ROW ─────────────────────────────────────── */}
      <div
        onClick={() => setShowModal(true)}
        className="group bg-white border border-slate-200/90 rounded-2xl cursor-pointer transition-all duration-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 overflow-hidden"
      >
        <div className="grid items-center gap-0" style={{ gridTemplateColumns: '1fr auto 1fr auto' }}>

          {/* ── COL 1: Source Configuration ───────────────────── */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4 min-w-0 border-r border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/15 shrink-0">
              <Database size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-mono font-extrabold text-blue-600 uppercase tracking-[0.15em] leading-none">Source Configuration</span>
                <span className="text-[7px] font-mono font-bold bg-blue-100 text-blue-700 px-1.5 py-px rounded border border-blue-200/60 hidden sm:inline">Database</span>
              </div>
              <h4 className="text-[13px] font-extrabold text-slate-900 truncate leading-tight tracking-tight">
                {pgConfig.name}
              </h4>
              <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5 leading-tight">
                Database: <span className="text-blue-600 font-semibold">{pgConfig.database}</span>
              </div>
            </div>
          </div>

          {/* ── COL 2: Connection Wire ────────────────────────── */}
          <div className="flex flex-col items-center justify-center px-4 sm:px-5 py-3 shrink-0 self-stretch bg-slate-50/50">
            {isWired ? (
              <>
                <div className="flex items-center gap-0.5 mb-1">
                  <div className="w-5 h-[2px] rounded-full bg-gradient-to-r from-blue-400 to-blue-300" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-[#f95716] text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                    <Zap size={12} />
                  </div>
                  <div className="w-5 h-[2px] rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400" />
                </div>
                <span className="text-[7px] font-mono font-extrabold text-[#f95716] uppercase tracking-widest leading-none">FastCDC</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-5 border-t border-dashed border-amber-300" />
                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
                    <Unplug size={10} />
                  </div>
                  <div className="w-5 border-t border-dashed border-amber-300" />
                </div>
                <span className="text-[7px] font-mono font-bold text-amber-500 uppercase tracking-widest leading-none">No Link</span>
              </>
            )}
          </div>

          {/* ── COL 3: Destination Vault ──────────────────────── */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4 min-w-0 border-l border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/15 shrink-0">
              <Cloud size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-mono font-extrabold text-emerald-600 uppercase tracking-[0.15em] leading-none">Destination Configuration</span>
                <span className="text-[7px] font-mono font-bold bg-emerald-100 text-emerald-700 px-1.5 py-px rounded border border-emerald-200/60 hidden sm:inline">Vault</span>
              </div>
              <h4 className="text-[13px] font-extrabold text-slate-900 truncate leading-tight tracking-tight">
                {s3Config.name}
              </h4>
              <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5 leading-tight">
                s3://{s3Config.bucketName}/<span className="text-emerald-600 font-semibold">{s3Config.folderPath}</span>
              </div>
            </div>
          </div>

          {/* ── COL 4: Actions Column ────────────────────────── */}
          <div className="flex items-center gap-1.5 px-3 sm:px-4 py-3 border-l border-slate-100 self-stretch bg-slate-50/30 shrink-0">
            {isWired ? (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                LIVE
              </span>
            ) : (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-200 mr-1">
                OFF
              </span>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onRunCdcStream(wf, e); }}
              disabled={isRunning}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-all cursor-pointer disabled:opacity-40"
              title="Run FastCDC Stream"
            >
              {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); if (onNavigateToBuilder) onNavigateToBuilder(wf); }}
              className="p-1.5 rounded-lg bg-[#f95716] hover:bg-orange-600 text-white transition-all cursor-pointer shadow-sm"
              title="Open Canvas Editor"
            >
              <Layers size={13} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onDownloadSnapshot(wf, e); }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              title="Download Snapshot Hashes"
            >
              <Download size={13} />
            </button>

            <ChevronRight size={15} className="text-slate-300 group-hover:text-[#f95716] transition-colors hidden sm:block" />
          </div>

        </div>

        {/* Pipeline Name Footer Bar */}
        <div className="px-4 sm:px-5 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shrink-0">
              <FileCode size={10} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 truncate">{wf.name}</span>
            <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 hidden sm:inline">{wf.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1">
              <Clock size={8} /> {timeStr}
            </span>
            <span className="text-[8px] font-mono text-[#f95716] font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
              Click to inspect →
            </span>
          </div>
        </div>
      </div>



      {/* ── FULL INSPECTION MODAL ─────────────────────────────────── */}
      {showModal && (
        <PipelineInspectModal
          wf={wf}
          tenant={tenant}
          pgConfig={pgConfig}
          s3Config={s3Config}
          isWired={isWired}
          isRunning={isRunning}
          timeStr={timeStr}
          onClose={() => setShowModal(false)}
          onRunCdcStream={onRunCdcStream}
          onNavigateToBuilder={onNavigateToBuilder}
          onDownloadSnapshot={onDownloadSnapshot}
        />
      )}
    </>
  );
}


// ─── Pipeline Inspection Modal ───────────────────────────────────────────
function PipelineInspectModal({
  wf,
  tenant,
  pgConfig,
  s3Config,
  isWired,
  isRunning,
  timeStr,
  onClose,
  onRunCdcStream,
  onNavigateToBuilder,
  onDownloadSnapshot,
}) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const CopyBtn = ({ text, field }) => (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(text, field); }}
      className="p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer ml-1.5 opacity-0 group-hover/row:opacity-100"
      title="Copy to clipboard"
    >
      {copiedField === field
        ? <CheckCircle2 size={12} className="text-emerald-500" />
        : <Copy size={12} className="text-slate-400 hover:text-slate-600" />
      }
    </button>
  );

  // PostgreSQL parameter rows
  const pgRows = [
    { icon: Server, label: 'Configuration Name', value: pgConfig.name, key: 'pg_name' },
    { icon: Globe, label: 'Database Host', value: pgConfig.host, key: 'pg_host', badge: 'blue' },
    { icon: Activity, label: 'Port', value: pgConfig.port, key: 'pg_port', badge: 'blue' },
    { icon: Database, label: 'Database Name', value: pgConfig.database, key: 'pg_db', badge: 'orange' },
    { icon: Key, label: 'Username', value: pgConfig.username, key: 'pg_user' },
    { icon: Lock, label: 'SSL Mode', value: pgConfig.useSSL ? 'require (enabled)' : 'disable', key: 'pg_ssl', badge: pgConfig.useSSL ? 'emerald' : 'amber' },
    { icon: Calendar, label: 'Backup Schedule', value: pgConfig.backupSchedule, key: 'pg_cron' },
    { icon: Timer, label: 'Retention Period', value: `${pgConfig.retentionDays} Days`, key: 'pg_retention' },
  ];

  // S3 parameter rows
  const s3Rows = [
    { icon: Cloud, label: 'Vault Name', value: s3Config.name, key: 's3_name' },
    { icon: HardDrive, label: 'S3 Bucket', value: `s3://${s3Config.bucketName}/`, key: 's3_bucket', badge: 'emerald' },
    { icon: Globe, label: 'AWS Region', value: s3Config.region, key: 's3_region' },
    { icon: Key, label: 'Access Key ID', value: s3Config.accessKeyId, key: 's3_key' },
    { icon: FolderOpen, label: 'Folder Prefix', value: s3Config.folderPath || 'raw/chunkflow/', key: 's3_path' },
    { icon: ShieldCheck, label: 'Encryption Standard', value: s3Config.encryption, key: 's3_enc', badge: 'emerald' },
    { icon: HardDrive, label: 'Storage Class', value: s3Config.storageClass, key: 's3_class' },
  ];

  const badgeClasses = {
    blue: 'text-blue-700 bg-blue-50 border border-blue-200/60',
    orange: 'text-[#f95716] bg-orange-50 border border-orange-200/60',
    emerald: 'text-emerald-700 bg-emerald-50 border border-emerald-200/60',
    amber: 'text-amber-700 bg-amber-50 border border-amber-200/60',
  };

  const renderParamRow = (row) => (
    <div key={row.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 transition-colors group/row">
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <row.icon size={12} className="text-slate-400 shrink-0" />
        <span className="font-mono">{row.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-mono font-bold ${row.badge ? `${badgeClasses[row.badge]} px-2 py-0.5 rounded` : 'text-slate-900'}`}>
          {row.value}
        </span>
        <CopyBtn text={row.value} field={row.key} />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 text-left"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full text-slate-900 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ───────────────────────────────────────── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 sm:px-8 pt-6 sm:pt-7 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <FileCode size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                  {wf.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 select-all">
                    ID: {wf.id.slice(0, 8)}…
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={10} /> {timeStr}
                  </span>
                  {isWired ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      FASTCDC CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      <Unplug size={9} /> UNCONNECTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Visual Pipeline Flow Indicator ──────────────────────── */}
        <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-50/40 via-orange-50/20 to-emerald-50/40 border-b border-slate-100">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-200 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                <Database size={13} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-wider leading-none">Source</div>
                <div className="text-xs font-bold text-slate-900 leading-tight">{pgConfig.name}</div>
              </div>
            </div>

            {isWired ? (
              <div className="flex items-center gap-1">
                <div className="w-6 h-px bg-blue-300" />
                <div className="w-3 h-px bg-blue-400" />
                <div className="px-2 py-1 rounded-full bg-white border border-orange-200 shadow-sm flex items-center gap-1">
                  <Zap size={10} className="text-[#f95716]" />
                  <span className="text-[9px] font-mono font-extrabold text-[#f95716]">FastCDC</span>
                  <Activity size={9} className="text-emerald-500 animate-pulse" />
                </div>
                <div className="w-3 h-px bg-emerald-400" />
                <div className="w-6 h-px bg-emerald-300" />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-8 border-t border-dashed border-amber-300" />
                <div className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-1">
                  <Unplug size={9} className="text-amber-500" />
                  <span className="text-[9px] font-mono font-bold text-amber-600">No Link</span>
                </div>
                <div className="w-8 border-t border-dashed border-amber-300" />
              </div>
            )}

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-200 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                <Cloud size={13} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider leading-none">Destination</div>
                <div className="text-xs font-bold text-slate-900 leading-tight">{s3Config.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two Column Configuration Panels ────────────────────── */}
        <div className="px-6 sm:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* PostgreSQL Source Panel */}
            <div className="rounded-2xl border border-blue-200/80 overflow-hidden bg-white shadow-sm">
              {/* Panel Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Database size={14} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">PostgreSQL Source</h4>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">Node Configuration</span>
                </div>
                <span className="ml-auto text-[9px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                  PORT {pgConfig.port}
                </span>
              </div>

              {/* Parameter Rows */}
              <div className="divide-y divide-slate-100">
                {pgRows.map(renderParamRow)}
              </div>
            </div>

            {/* S3 Destination Panel */}
            <div className="rounded-2xl border border-emerald-200/80 overflow-hidden bg-white shadow-sm">
              {/* Panel Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 border-b border-emerald-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Cloud size={14} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Amazon S3 Vault</h4>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">Destination Configuration</span>
                </div>
                <span className="ml-auto text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                  {s3Config.region}
                </span>
              </div>

              {/* Parameter Rows */}
              <div className="divide-y divide-slate-100">
                {s3Rows.map(renderParamRow)}
              </div>
            </div>

          </div>
        </div>

        {/* ── Modal Footer Actions ───────────────────────────────── */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onRunCdcStream(wf, e); }}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
            >
              {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
              <span>{isRunning ? 'Streaming…' : 'Run FastCDC Stream'}</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); if (onNavigateToBuilder) onNavigateToBuilder(wf); }}
              className="px-4 py-2 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
            >
              <Layers size={13} />
              <span>Open in Canvas</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onDownloadSnapshot(wf, e); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Download Hashes</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
