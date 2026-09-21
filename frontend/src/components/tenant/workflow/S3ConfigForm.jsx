import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Zap, RefreshCw, AlertCircle, Globe, ChevronDown, Check, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { AWS_REGIONS } from '../../../utils/awsRegions';

function RegionCombobox({ value, onChange, disabled, hasError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal search with external value when closed
  useEffect(() => {
    if (!isOpen) {
      const match = AWS_REGIONS.find((r) => r.code === value);
      setSearch(match ? `${match.name} (${match.code})` : value || '');
      setIsCustomMode(!match && !!value);
    }
  }, [value, isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = AWS_REGIONS.filter(
    (r) =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (regionCode) => {
    onChange(regionCode);
    const selected = AWS_REGIONS.find((r) => r.code === regionCode);
    setSearch(selected ? `${selected.name} (${selected.code})` : regionCode);
    setIsCustomMode(!selected);
    setIsOpen(false);
  };

  const handleEnableCustomInput = () => {
    setIsCustomMode(true);
    setSearch('');
    onChange('');
    setIsOpen(false);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      <div className="relative flex items-center">
        <Globe size={15} className={`absolute left-3.5 pointer-events-none ${hasError ? 'text-rose-400' : 'text-slate-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          placeholder="Select AWS region or type custom code e.g. us-west-2..."
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          className={`w-full ${
            hasError
              ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
          } rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none shadow-xs transition-all`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
        >
          <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#f95716]' : ''}`} />
        </button>
      </div>

      {/* Custom Sleek Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div
            onClick={handleEnableCustomInput}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-orange-50 hover:bg-orange-100 text-[#f95716] font-bold cursor-pointer transition-colors border border-orange-200/70"
          >
            <PlusCircle size={15} className="shrink-0" />
            <span>+ Other / Custom Region (Type your own code)</span>
          </div>

          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mt-1 mb-1">
            <span>AWS Global Regions ({filteredRegions.length})</span>
            <Search size={12} />
          </div>

          {filteredRegions.length > 0 ? (
            filteredRegions.map((r) => {
              const isSelected = value === r.code;
              return (
                <div
                  key={r.code}
                  onClick={() => handleSelect(r.code)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{r.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-medium">
                      {r.code}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-600 shrink-0 ml-2" />}
                </div>
              );
            })
          ) : (
            <div
              onClick={() => handleSelect(search)}
              className="px-3 py-2.5 rounded-xl text-xs bg-orange-50 text-[#f95716] font-medium cursor-pointer hover:bg-orange-100 transition-colors flex items-center justify-between"
            >
              <span>Use custom region: <strong>"{search}"</strong></span>
              <Check size={14} />
            </div>
          )}
        </div>
      )}

      {/* Region Hint */}
      <span className="text-[10px] text-slate-400 block mt-1 font-normal">
        {isCustomMode
          ? '✏️ Custom region active. Type any custom AWS or S3 endpoint region code.'
          : 'Select an AWS region above or choose "+ Other / Custom Region" to type custom code.'}
      </span>
    </div>
  );
}

export default function S3ConfigForm({
  config = {},
  onChange,
  showSecret,
  onToggleSecret,
  onTestConnection,
  isTesting,
  testResult,
  errors = {},
  readOnly = false,
}) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="space-y-4 text-xs text-left">
      {/* Configuration Name */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Configuration Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.name ?? ''}
          placeholder="e.g. Primary S3 Backup Vault"
          disabled={readOnly}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900 font-semibold rounded-xl px-3.5 py-2.5 text-xs outline-none shadow-xs transition-all"
        />
      </div>

      {/* Bucket Name */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Bucket Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.bucketName ?? ''}
          placeholder="e.g. my-s3-bucket-name"
          disabled={readOnly}
          onChange={(e) => handleChange('bucketName', e.target.value)}
          className={`w-full ${
            errors?.bucketName
              ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
          } rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium outline-none shadow-xs transition-all`}
        />
        {errors?.bucketName && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.bucketName}
          </span>
        )}
      </div>

      {/* Custom Sleek Region Combobox */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Region <span className="text-rose-500">*</span>
        </label>
        <RegionCombobox
          value={config.region ?? ''}
          onChange={(val) => handleChange('region', val)}
          disabled={readOnly}
          hasError={!!errors?.region}
        />
        {errors?.region && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.region}
          </span>
        )}
      </div>

      {/* Access Key ID */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Access Key ID <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={config.accessKeyId ?? ''}
          placeholder="e.g. AKIA..."
          disabled={readOnly}
          onChange={(e) => handleChange('accessKeyId', e.target.value)}
          className={`w-full ${
            errors?.accessKeyId
              ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
          } rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none shadow-xs transition-all uppercase`}
        />
        {errors?.accessKeyId && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.accessKeyId}
          </span>
        )}
      </div>

      {/* Secret Access Key */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">
          Secret Access Key <span className="text-rose-500">*</span>
        </label>
        <div className="relative flex items-center">
          <input
            type={showSecret ? 'text' : 'password'}
            value={config.secretAccessKey ?? ''}
            placeholder="Enter AWS Secret Access Key..."
            disabled={readOnly}
            onChange={(e) => handleChange('secretAccessKey', e.target.value)}
            className={`w-full ${
              errors?.secretAccessKey
                ? 'bg-rose-50/40 border border-rose-300 focus:bg-white focus:border-rose-500 text-rose-900'
                : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#f95716] text-slate-900'
            } rounded-xl pl-3.5 pr-10 py-2.5 text-xs outline-none shadow-xs transition-all font-mono`}
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
        {errors?.secretAccessKey && (
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <AlertCircle size={12} className="shrink-0 text-rose-500" />
            {errors.secretAccessKey}
          </span>
        )}
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



      {/* Test Connection Disclaimer & Status */}
      {testResult && (testResult.success || testResult.type === 'success') && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/50 border border-emerald-300/80 text-emerald-900 text-xs font-medium shadow-xs animate-in fade-in zoom-in-95 duration-200 space-y-1 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-xs font-black tracking-tight text-emerald-950">S3 Vault Access Verified</span>
            <span className="ml-auto text-[10px] font-mono bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
              Save Active
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-snug pl-8">
            <strong className="font-bold text-emerald-900">Disclaimer:</strong> AWS S3 bucket & credentials authenticated successfully. The <span className="font-bold text-slate-900 underline decoration-emerald-500 decoration-2">"Save Config"</span> button is now activated.
          </p>
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
