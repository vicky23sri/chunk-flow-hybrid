import React from 'react';
import { toast } from 'react-toastify';

export { toast };

const getToastId = (message, title) => {
  const str = typeof message === 'string' ? message : JSON.stringify(message);
  return `${title || ''}_${str}`;
};

export const showSuccess = (message, title) => {
  const content = title ? (
    <div>
      <div className="font-bold text-xs tracking-wider uppercase mb-0.5">{title}</div>
      <div className="text-xs font-medium opacity-90">{message}</div>
    </div>
  ) : (
    message
  );
  toast.success(content, { toastId: getToastId(message, title) });
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
  toast.error(content, { toastId: getToastId(message, title) });
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
  toast.warn(content, { toastId: getToastId(message, title) });
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
  toast.info(content, { toastId: getToastId(message, title) });
};
