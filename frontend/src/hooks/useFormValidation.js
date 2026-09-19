import { useState } from 'react';

/**
 * Custom React Hook for Form Validation
 * Only shows errors directly under input fields when the button is clicked with invalid/missing details.
 */
export function useFormValidation() {
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validatePostgres = (config = {}) => {
    const newErrors = {};

    // Host
    if (!config.host || !config.host.trim()) {
      newErrors.host = 'Please fill in this detail';
    }

    // Port
    if (config.port && config.port.toString().trim() !== '') {
      const portNum = Number(config.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        newErrors.port = 'Port must be a number between 1 and 65535';
      }
    }

    // Database Name
    if (!config.database || !config.database.trim()) {
      newErrors.database = 'Please fill in this detail';
    } else if (/\s/.test(config.database)) {
      newErrors.database = 'Database name cannot contain spaces';
    }

    // Username
    if (!config.username || !config.username.trim()) {
      newErrors.username = 'Please fill in this detail';
    }

    // Password
    if (!config.password || !config.password.trim()) {
      newErrors.password = 'Please fill in this detail';
    }

    // Retention Days
    if (config.retentionDays !== undefined && config.retentionDays !== '' && config.retentionDays !== null) {
      const retNum = Number(config.retentionDays);
      if (isNaN(retNum) || retNum < 0) {
        newErrors.retentionDays = 'Retention days must be a positive number';
      }
    }

    setErrors(newErrors);
    setSubmitted(true);
    return Object.keys(newErrors).length === 0;
  };

  const validateS3 = (config = {}) => {
    const newErrors = {};

    // Bucket Name
    if (!config.bucketName || !config.bucketName.trim()) {
      newErrors.bucketName = 'Please fill in this detail';
    } else {
      const bucket = config.bucketName.trim();
      if (bucket.length < 3 || bucket.length > 63) {
        newErrors.bucketName = 'Bucket name must be between 3 and 63 characters';
      } else if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket)) {
        newErrors.bucketName = 'Must start/end with lowercase letter/number (lowercase, numbers, hyphens, dots)';
      }
    }

    // Region
    if (!config.region || !config.region.trim()) {
      newErrors.region = 'Please fill in this detail';
    }

    // Access Key ID
    if (!config.accessKeyId || !config.accessKeyId.trim()) {
      newErrors.accessKeyId = 'Please fill in this detail';
    }

    // Secret Access Key
    if (!config.secretAccessKey || !config.secretAccessKey.trim()) {
      newErrors.secretAccessKey = 'Please fill in this detail';
    }

    setErrors(newErrors);
    setSubmitted(true);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    setSubmitted(false);
  };

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  return {
    errors,
    submitted,
    validatePostgres,
    validateS3,
    clearErrors,
    clearFieldError,
    setErrors,
  };
}
