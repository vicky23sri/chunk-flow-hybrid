import React from 'react';
import { toast } from 'react-toastify';

export { toast };

export const showSuccess = (message, title) => {
  const content = title ? (
    <div>
      <div className="font-bold text-xs tracking-wider uppercase mb-0.5">{title}</div>
      <div className="text-xs font-medium opacity-90">{message}</div>
    </div>
  ) : (
    message
  );
  toast.success(content);
};

export const showError = (message, title) => {
  const content = title ? (
    <div>
      <div className="font-bold text-xs tracking-wider uppercase mb-0.5">{title}</div>
      <div className="text-xs font-medium opacity-90">{message}</div>
    </div>
  ) : (
    message
  );
  toast.error(content);
};

export const showWarning = (message, title) => {
  const content = title ? (
    <div>
      <div className="font-bold text-xs tracking-wider uppercase mb-0.5">{title}</div>
      <div className="text-xs font-medium opacity-90">{message}</div>
    </div>
  ) : (
    message
  );
  toast.warn(content);
};

export const showInfo = (message, title) => {
  const content = title ? (
    <div>
      <div className="font-bold text-xs tracking-wider uppercase mb-0.5">{title}</div>
      <div className="text-xs font-medium opacity-90">{message}</div>
    </div>
  ) : (
    message
  );
  toast.info(content);
};
