export const getNodeDefaultConfig = (type, subtype) => {
  let title = `${subtype.toUpperCase()} ${type === 'source' ? 'Source' : 'Destination'}`;
  let subtitle = 'Enter details...';
  let config = { name: '' };

  if (subtype === 'postgres') {
    title = 'Database Source (PostgreSQL)';
    subtitle = 'Enter database details...';
    config = { name: '', host: '', port: '5432', database: '', username: '', password: '', useSSL: false, backupSchedule: '', retentionDays: '' };
  } else if (subtype === 'mysql') {
    title = 'MySQL Database Source';
    subtitle = 'Enter MySQL details...';
    config = { name: '', host: '', port: '3306', database: '', username: '', password: '' };
  } else if (subtype === 'kafka') {
    title = 'Apache Kafka Stream';
    subtitle = 'bootstrap:9092';
    config = { name: '', bootstrapServers: '', topic: '', groupId: '', saslPassword: '' };
  } else if (subtype === 'mongodb') {
    title = 'MongoDB Document Store';
    subtitle = 'Enter MongoDB URI...';
    config = { name: '', connectionString: '', database: '', collection: '' };
  } else if (subtype === 'webhook') {
    title = 'HTTP Webhook Trigger';
    subtitle = '/api/v1/webhooks';
    config = { name: '', endpointUrl: '', secretToken: '' };
  } else if (subtype === 's3') {
    title = 'Amazon S3 Vault';
    subtitle = 's3://vault/';
    config = { name: '', bucketName: '', region: 'us-east-1', accessKeyId: '', secretAccessKey: '', folderPath: '' };
  } else if (subtype === 'gcs') {
    title = 'Google Cloud Storage (GCS)';
    subtitle = 'gs://bucket/';
    config = { name: '', bucketName: '', projectId: '', serviceAccountJson: '' };
  } else if (subtype === 'redis') {
    title = 'Redis Cache Vault';
    subtitle = 'redis:6379';
    config = { name: '', host: '', port: '6379', password: '' };
  } else if (subtype === 'snowflake') {
    title = 'Snowflake Data Warehouse';
    subtitle = 'Enter account ID...';
    config = { name: '', account: '', username: '', password: '', warehouse: '', database: '' };
  } else if (subtype === 'pinecone') {
    title = 'Pinecone Vector DB';
    subtitle = 'Enter index name...';
    config = { name: '', environment: '', indexName: '', apiKey: '' };
  }

  return { title, subtitle, config };
};
