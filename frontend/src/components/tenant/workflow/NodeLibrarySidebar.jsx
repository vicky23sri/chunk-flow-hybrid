import React, { useEffect, useState } from 'react';
import { Database, Cloud, Zap, Server, HardDrive, Layers, Globe, Sparkles, Loader2 } from 'lucide-react';

const ICON_MAP = {
  postgres: Database,
  mysql: Database,
  kafka: Zap,
  mongodb: Server,
  webhook: Globe,
  s3: Cloud,
  gcs: Cloud,
  redis: HardDrive,
  snowflake: Layers,
  pinecone: Sparkles,
};

const COLOR_MAP = {
  blue: { badge: 'text-blue-600 bg-blue-50 border-blue-200', dot: 'bg-blue-600', text: 'group-hover:text-blue-600', border: 'hover:border-blue-500/60' },
  emerald: { badge: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'group-hover:text-emerald-600', border: 'hover:border-emerald-500/60' },
  purple: { badge: 'text-purple-600 bg-purple-50 border-purple-200', dot: 'bg-purple-600', text: 'group-hover:text-purple-600', border: 'hover:border-purple-500/60' },
  amber: { badge: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-600', text: 'group-hover:text-amber-600', border: 'hover:border-amber-500/60' },
  rose: { badge: 'text-rose-600 bg-rose-50 border-rose-200', dot: 'bg-rose-600', text: 'group-hover:text-rose-600', border: 'hover:border-rose-500/60' },
  indigo: { badge: 'text-indigo-600 bg-indigo-50 border-indigo-200', dot: 'bg-indigo-600', text: 'group-hover:text-indigo-600', border: 'hover:border-indigo-500/60' },
  cyan: { badge: 'text-cyan-600 bg-cyan-50 border-cyan-200', dot: 'bg-cyan-600', text: 'group-hover:text-cyan-600', border: 'hover:border-cyan-500/60' },
};

export default function NodeLibrarySidebar({ onDragStart, onCreateNode }) {
  const [nodeTypes, setNodeTypes] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const goApiBase = import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1';
    const sub = localStorage.getItem('tenant_subdomain') || 'willsparrow';

    fetch(`${goApiBase}/nodes?subdomain=${encodeURIComponent(sub)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          // Filter to only show active nodes as configured in the Node Library page
          const activeNodes = data.data.filter(n => n.is_active);

          // Add color formatting since API doesn't return `color.name`
          const formattedData = activeNodes.map(n => {
            let colorName = n.category === 'source' ? 'blue' : 'emerald';
            // Parse color from JSON if needed, but the original COLOR_MAP uses string keys 'blue', 'emerald' etc.
            // For now, fallback to default color based on category
            if (n.sub_type === 'postgres' || n.sub_type === 'mysql' || n.sub_type === 'gcs') colorName = 'blue';
            if (n.sub_type === 'kafka') colorName = 'amber';
            if (n.sub_type === 'mongodb') colorName = 'emerald';
            if (n.sub_type === 'webhook') colorName = 'purple';
            if (n.sub_type === 's3') colorName = 'amber'; // Wait, s3 is orange in my seeder
            if (n.sub_type === 'redis') colorName = 'rose';
            if (n.sub_type === 'snowflake') colorName = 'cyan';
            if (n.sub_type === 'pinecone') colorName = 'indigo';

            return { ...n, color: { name: colorName } };
          });
          setNodeTypes(formattedData);
        }
      })
      .catch((err) => console.error('Failed to load node types catalog:', err));

    // Fetch previously saved configurations
    fetch(`${goApiBase}/canvas?subdomain=${encodeURIComponent(sub)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.nodes)) {
          const configuredNodes = data.nodes.filter(n => n.config_data && Object.keys(n.config_data).length > 0 && n.config_data.name);
          const formatted = configuredNodes.map(n => ({
            id: `saved_${n.element_id}`,
            node_key: n.node_key || `${n.sub_type}_saved`,
            name: n.config_data.name,
            category: 'saved_config',
            original_category: n.category,
            sub_type: n.sub_type,
            color: { name: 'purple' },
            saved_config: n.config_data,
            original_node_db_id: n.node_id
          }));

          const uniqueConfigs = [];
          const seenNames = new Set();
          for (const c of formatted) {
            if (!seenNames.has(c.name)) {
              seenNames.add(c.name);
              uniqueConfigs.push(c);
            }
          }
          setSavedConfigs(uniqueConfigs);
        }
      })
      .catch((err) => console.error('Failed to load saved configs:', err))
      .finally(() => setLoading(false));
  }, []);

  const sources = nodeTypes.filter((n) => n.category === 'source');
  const destinations = nodeTypes.filter((n) => n.category === 'destination');

  // Fallbacks if backend catalog is loading
  const displaySources = sources.length > 0 ? sources : [
    { id: '1', node_key: 'postgres_source', name: 'Database Source', category: 'source', sub_type: 'postgres', color: { name: 'blue' } },
  ];
  const displayDestinations = destinations.length > 0 ? destinations : [
    { id: '2', node_key: 's3_destination', name: 'Amazon S3 Vault', category: 'destination', sub_type: 's3', color: { name: 'emerald' } },
  ];

  const renderNodeItem = (item) => {
    const IconComp = ICON_MAP[item.sub_type] || Database;
    const colorName = item.color?.name || (item.category === 'source' ? 'blue' : 'emerald');
    const colors = COLOR_MAP[colorName] || COLOR_MAP.blue;

    return (
      <div
        key={item.id || item.node_key}
        draggable
        onDragStart={(e) => onDragStart(e, item.original_category || item.category, item.sub_type, item.node_key, item.original_node_db_id || item.id, item.saved_config)}
        onClick={() => onCreateNode(item.original_category || item.category, item.sub_type, item.node_key, item.original_node_db_id || item.id, null, null, item.saved_config)}
        className={`p-3 rounded-2xl bg-white border border-slate-200 ${colors.border} hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left flex items-center gap-3 shadow-xs group`}
      >
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${colors.badge}`}>
          <IconComp size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-bold text-slate-900 ${colors.text} transition-colors truncate`}>
            {item.name}
          </div>
          <div className="text-[10px] text-slate-500 font-normal truncate uppercase tracking-wider font-mono">
            {item.sub_type} driver
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lg:col-span-3 col-span-12 bg-slate-50/60 p-4 sm:p-5 border-r border-b lg:border-b-0 border-slate-200/80 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-140px)]">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Node Library
            </h3>
            {loading && <Loader2 size={12} className="animate-spin text-blue-600" />}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-normal">
            Drag nodes onto canvas or click to add:
          </p>
        </div>

        {/* 1. SOURCES SECTION */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-blue-600 uppercase flex items-center gap-1.5 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" /> 1. SOURCES ({displaySources.length})
          </span>
          <div className="space-y-2">
            {displaySources.map(renderNodeItem)}
          </div>
        </div>

        {/* 2. DESTINATIONS SECTION */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase flex items-center gap-1.5 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 2. DESTINATIONS ({displayDestinations.length})
          </span>
          <div className="space-y-2">
            {displayDestinations.map(renderNodeItem)}
          </div>
        </div>

        {/* 3. SAVED CONFIGURATIONS SECTION */}
        {/* {savedConfigs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
            <span className="text-[10px] font-mono font-bold text-purple-600 uppercase flex items-center gap-1.5 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> 3. SAVED CONFIGS ({savedConfigs.length})
            </span>
            <div className="space-y-2">
              {savedConfigs.map(renderNodeItem)}
            </div>
          </div>
        )} */}
      </div>

      {/* Connection Instructions Box */}
      <div className="mt-5 bg-white border border-slate-200 p-3 sm:p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-600 shadow-xs">
        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#f95716] shrink-0" /> Instructions:
        </div>
        <ul className="space-y-1 text-[10px] sm:text-[11px] list-disc list-inside font-normal text-slate-500 leading-snug">
          <li>Drag or click any node to add.</li>
          <li>Click <strong className="text-blue-600 font-bold">Blue dot</strong> on Source, then <strong className="text-emerald-600 font-bold">Green dot</strong> on Destination to wire.</li>
          <li>Click node card to open configuration form.</li>
        </ul>
      </div>
    </div>
  );
}
