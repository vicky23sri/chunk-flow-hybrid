import { Database, Cloud, Zap, Server, Globe, HardDrive, Layers, Sparkles } from 'lucide-react';

export const ICON_MAP = {
  postgres: Database,
  mysql: Database,
  kafka: Zap,
  mongodb: Server,
  webhook: Globe,
  s3: Cloud,
  gcs: Cloud,
  redis: HardDrive,
  snowflake: Layers,
  pinecone: Sparkles,
};

export const BRAND = {
  postgres: { color: '#336791', light: '#E8EEF4', name: 'PostgreSQL', desc: 'Advanced open-source relational database with robust ACID compliance and extensibility.' },
  mysql: { color: '#00758F', light: '#E5F3F7', name: 'MySQL', desc: 'World\'s most popular open-source relational database management system.' },
  kafka: { color: '#231F20', light: '#EAEAEA', name: 'Apache Kafka', desc: 'Distributed event streaming platform for high-throughput data pipelines.' },
  mongodb: { color: '#00684A', light: '#E5F0EB', name: 'MongoDB', desc: 'Flexible document database for modern application development.' },
  webhook: { color: '#7C3AED', light: '#F0EAFD', name: 'Webhook', desc: 'HTTP callback endpoint for real-time event-driven data ingestion.' },
  s3: { color: '#FF9900', light: '#FFF3E0', name: 'Amazon S3', desc: 'Scalable object storage with industry-leading durability and availability.' },
  gcs: { color: '#4285F4', light: '#E8F0FE', name: 'Google Cloud', desc: 'Unified object storage with global edge-caching and lifecycle management.' },
  redis: { color: '#DC382D', light: '#FDE8E7', name: 'Redis', desc: 'In-memory data structure store used as cache, message broker, and queue.' },
  snowflake: { color: '#29B5E8', light: '#E6F6FC', name: 'Snowflake', desc: 'Cloud-native data warehouse built for performance and concurrency.' },
  pinecone: { color: '#000000', light: '#F0F0F0', name: 'Pinecone', desc: 'Purpose-built vector database for machine learning similarity search.' },
};

export const COLOR_BG_MAP = {
  postgres: 'bg-blue-600',
  gcs: 'bg-blue-600',
  s3: 'bg-emerald-600',
  mongodb: 'bg-emerald-600',
  kafka: 'bg-purple-600',
  pinecone: 'bg-purple-600',
  mysql: 'bg-indigo-600',
  redis: 'bg-rose-600',
  snowflake: 'bg-cyan-600',
  webhook: 'bg-amber-600',
};
