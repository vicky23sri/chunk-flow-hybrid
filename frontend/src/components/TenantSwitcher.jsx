import React, { useState, useEffect } from 'react';
import { api, getActiveSubdomain, setActiveSubdomain } from '../services/api';
import { showInfo } from '../utils/toast';
import { Globe, ChevronDown } from 'lucide-react';

export default function TenantSwitcher({ onTenantChange }) {
  const [tenants, setTenants] = useState([]);
  const [activeSub, setActiveSub] = useState(getActiveSubdomain());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants();
      if (Array.isArray(data)) {
        setTenants(data);
      }
    } catch (err) {
      console.error('Failed to load tenants list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (subdomain) => {
    setActiveSub(subdomain);
    setActiveSubdomain(subdomain);
    showInfo(`Switched active workspace domain context to '${subdomain}'`, 'Domain Scope Changed');
    if (onTenantChange) {
      onTenantChange(subdomain);
    }
  };

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="flex items-center gap-1.5 text-[0.75rem] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">
        <Globe size={13} className="text-indigo-600 shrink-0" />
        <span>Domain Scope:</span>
      </div>
      <div className="relative flex items-center">
        <select
          value={activeSub}
          onChange={(e) => handleSelect(e.target.value)}
          className="appearance-none bg-white text-indigo-600 border border-indigo-200 rounded-lg py-1.5 pl-3 pr-8 text-[0.85rem] font-bold cursor-pointer outline-none shadow-xs transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 whitespace-nowrap"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.subdomain} className="bg-white text-slate-900">
              {t.name} ({t.subdomain}.app.local)
            </option>
          ))}
          {!tenants.some((t) => t.subdomain === activeSub) && (
            <option value={activeSub} className="bg-white text-slate-900">
              {activeSub}.app.local
            </option>
          )}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 pointer-events-none text-indigo-500 shrink-0" />
      </div>
    </div>
  );
}


