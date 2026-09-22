import React from 'react';
import { Plug, Unplug, Layers, Database, Cloud } from 'lucide-react';

export default function MatrixTableView({
  filteredWorkflows,
  tenantConfig,
  tenant,
  onNavigateToBuilder,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden text-left font-sans">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            <th className="py-3.5 px-5">Pipeline Name & ID</th>
            <th className="py-3.5 px-5">Connection Status</th>
            <th className="py-3.5 px-5">Source Configuration</th>
            <th className="py-3.5 px-5">Destination Configuration</th>
            <th className="py-3.5 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {filteredWorkflows.map((wf) => {
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
            const pgNode = nodes.find((n) => n.subtype === 'postgres' || n.type === 'source');
            const s3Node = nodes.find((n) => n.subtype === 's3' || n.type === 'destination');

            const sourceName = pgNode?.config?.name || wf.source_name || tenantConfig.postgres?.[0]?.name || 'database configuration';
            const pgDb = pgNode?.config?.database || tenantConfig.postgres?.[0]?.database_name || `chunkflow_tenant_${tenant?.subdomain || 'willsparrow'}`;

            const destName = s3Node?.config?.name || wf.destination_name || tenantConfig.s3?.[0]?.name || 'Amazon S3 Vault';
            const s3Bkt = s3Node?.config?.bucketName || tenantConfig.s3?.[0]?.bucket_name || 'chunkflow-vault-raw';
            const s3Path = s3Node?.config?.folderPath || tenantConfig.s3?.[0]?.folder_path || 'raw/chunkflow/';

            return (
              <tr key={wf.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-5 font-bold text-slate-900">
                  <div className="text-sm">{wf.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 font-normal">ID: {wf.id.slice(0, 12)}...</div>
                </td>
                <td className="py-4 px-5">
                  {isWired ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Plug size={12} className="text-emerald-600" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Unplug size={12} className="text-amber-500" /> Unconnected
                    </span>
                  )}
                </td>
                <td className="py-4 px-5 font-mono">
                  <div className="font-bold text-sky-700 text-xs flex items-center gap-1.5">
                    <Database size={13} className="text-sky-500 shrink-0" />
                    <span>{sourceName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Database: <span className="font-semibold text-slate-600">{pgDb}</span></div>
                </td>
                <td className="py-4 px-5 font-mono">
                  <div className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                    <Cloud size={13} className="text-emerald-500 shrink-0" />
                    <span>{destName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Path: <span className="text-emerald-600 font-semibold">s3://{s3Bkt}/{s3Path}</span></div>
                </td>
                <td className="py-4 px-5 text-right">
                  <button
                    onClick={() => onNavigateToBuilder && onNavigateToBuilder(wf)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Layers size={13} /> Canvas
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
