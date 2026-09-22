import { getActiveSubdomain } from './api';

// LocalStorage & API Persistence Helper for PostgreSQL & S3 Connection Settings
const getPgKey = (subdomain) => {
  const sub = (subdomain || getActiveSubdomain() || 'default').toLowerCase();
  return `chunkflow_${sub}_saved_pg_config`;
};

const getS3Key = (subdomain) => {
  const sub = (subdomain || getActiveSubdomain() || 'default').toLowerCase();
  return `chunkflow_${sub}_saved_s3_config`;
};

export const getSavedPostgresConfig = (subdomain) => {
  try {
    const key = getPgKey(subdomain);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name ?? '',
        host: parsed.host ?? '',
        port: parsed.port ?? '',
        database: parsed.database ?? '',
        username: parsed.username ?? '',
        password: parsed.password ?? '',
        useSSL: !!parsed.useSSL,
        backupSchedule: parsed.backupSchedule ?? '',
        retentionDays: parsed.retentionDays ?? '',
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved PostgreSQL config:', err);
  }

  return {
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    useSSL: false,
    backupSchedule: '',
    retentionDays: '',
  };
};

export const savePostgresConfig = (config, subdomain) => {
  try {
    const key = getPgKey(subdomain);
    const current = getSavedPostgresConfig(subdomain);
    const updated = { ...current, ...config };
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save PostgreSQL config:', err);
  }
};

export const getSavedS3Config = (subdomain) => {
  try {
    const key = getS3Key(subdomain);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name ?? '',
        bucketName: parsed.bucketName ?? '',
        region: parsed.region ?? '',
        accessKeyId: parsed.accessKeyId ?? '',
        secretAccessKey: parsed.secretAccessKey ?? '',
        folderPath: parsed.folderPath ?? '',
        encryption: parsed.encryption ?? '',
        storageClass: parsed.storageClass ?? '',
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved S3 config:', err);
  }

  return {
    name: '',
    bucketName: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
    folderPath: '',
    encryption: '',
    storageClass: '',
  };
};

export const saveS3Config = (config, subdomain) => {
  try {
    const key = getS3Key(subdomain);
    const current = getSavedS3Config(subdomain);
    const updated = { ...current, ...config };
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save S3 config:', err);
  }
};

