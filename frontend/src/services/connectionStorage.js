// LocalStorage Persistence Helper for PostgreSQL & S3 Connection Settings

const PG_CONFIG_KEY = 'chunkflow_saved_pg_config';
const S3_CONFIG_KEY = 'chunkflow_saved_s3_config';

export const getSavedPostgresConfig = () => {
  try {
    const raw = localStorage.getItem(PG_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
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

export const savePostgresConfig = (config) => {
  try {
    const current = getSavedPostgresConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(PG_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save PostgreSQL config:', err);
  }
};

export const getSavedS3Config = () => {
  try {
    const raw = localStorage.getItem(S3_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bucketName: parsed.bucketName ?? '',
        region: parsed.region || 'us-west-2',
        accessKeyId: parsed.accessKeyId ?? '',
        secretAccessKey: parsed.secretAccessKey ?? '',
        folderPath: parsed.folderPath ?? '',
        encryption: parsed.encryption || 'AES-256 Server-Side Encryption',
        storageClass: parsed.storageClass || 'Standard',
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved S3 config:', err);
  }

  return {
    bucketName: '',
    region: 'us-west-2',
    accessKeyId: '',
    secretAccessKey: '',
    folderPath: '',
    encryption: 'AES-256 Server-Side Encryption',
    storageClass: 'Standard',
  };
};

export const saveS3Config = (config) => {
  try {
    const current = getSavedS3Config();
    const updated = { ...current, ...config };
    localStorage.setItem(S3_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save S3 config:', err);
  }
};
