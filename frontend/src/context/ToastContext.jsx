import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, title, message };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message, title = 'Success') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Action Failed') => {
    addToast({ type: 'error', title, message, duration: 7000 });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Notice') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: CheckCircle2,
      accent: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/40',
      iconBg: 'bg-rose-500/20 text-rose-400',
      icon: AlertCircle,
      accent: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/40',
      iconBg: 'bg-amber-500/20 text-amber-400',
      icon: AlertTriangle,
      accent: 'bg-amber-500',
    },
    info: {
      bg: 'bg-slate-900/95 border-indigo-500/40 text-indigo-100 shadow-indigo-950/40',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      icon: Info,
      accent: 'bg-indigo-500',
    },
  }[toast.type] || styles.info;

  const IconComponent = styles.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 relative overflow-hidden ${styles.bg}`}
    >
      <div className={`w-1.5 absolute left-0 top-0 bottom-0 ${styles.accent}`} />
      
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
        <IconComponent size={20} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider opacity-90 mb-0.5">
          {toast.title}
        </h4>
        <p className="text-xs leading-relaxed opacity-95 break-words font-medium">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer border-0 bg-transparent"
        aria-label="Dismiss toast"
      >
        <X size={15} />
      </button>
    </div>
  );
}
