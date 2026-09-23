import React, { useState } from 'react';
import { Layers, X, Check, Sparkles, Sliders } from 'lucide-react';
import { createConnector } from '../../../services/api';
import { showSuccess, showError } from '../../../utils/toast';

export default function CreateConnectorModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createConnector(name.trim());
      if (res && res.success) {
        showSuccess(`Connector "${name}" created successfully!`, 'Connector Created');
        if (onCreated) onCreated(res);
        setName('');
        onClose();
      } else {
        showError(res?.message || 'Failed to create connector', 'Error');
      }
    } catch (err) {
      showError(err.message, 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 text-left">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shadow-xs">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Create New Connector
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Set up a new workflow builder container
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Connector Workflow Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Postgres-to-S3 CDC Sync Connector"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Connector Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium bg-white"
            >
              <option value="active">Active (Ready for Streaming)</option>
              <option value="draft">Draft (Configuration only)</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 text-[11px] text-orange-950 space-y-1 font-normal">
            <div className="font-bold flex items-center gap-1.5 text-orange-700">
              <Sparkles size={13} className="text-[#f95716]" /> Dynamic Connector Setup:
            </div>
            <p className="text-orange-900/80 text-[10px]">
              This creates a dedicated connector project in the database where you can drop and wire source & destination nodes.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'Creating...' : 'Create Connector'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
