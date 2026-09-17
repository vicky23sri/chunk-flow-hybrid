import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Clear Canvas?',
  message = 'Are you sure you want to clear all nodes and connection wires from the canvas? This action cannot be undone.',
  confirmText = 'Clear Canvas',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = <Trash2 size={24} />,
}) {
  // Close modal when user hits Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const iconBgStyle = isDanger
    ? 'bg-rose-50 text-rose-600 border-rose-200'
    : 'bg-amber-50 text-amber-600 border-amber-200';
  
  const confirmBtnStyle = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
    : 'bg-[#f95716] hover:bg-orange-600 text-white shadow-orange-500/25';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-left">
        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${iconBgStyle}`}>
              {icon}
            </div>

            <div className="flex-1 pr-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2 ${confirmBtnStyle}`}
            >
              <Trash2 size={14} />
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
