<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Color;
use App\Models\ConfigurationType;
use App\Models\Connector;

class NodeCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Palette of UI Colors
        $blueColor = Color::firstOrCreate(
            ['name' => 'blue'],
            ['hex_code' => '#2563eb', 'bg_class' => 'bg-blue-50', 'text_class' => 'text-blue-600']
        );

        $emeraldColor = Color::firstOrCreate(
            ['name' => 'emerald'],
            ['hex_code' => '#10b981', 'bg_class' => 'bg-emerald-50', 'text_class' => 'text-emerald-600']
        );

        $purpleColor = Color::firstOrCreate(
            ['name' => 'purple'],
            ['hex_code' => '#9333ea', 'bg_class' => 'bg-purple-50', 'text_class' => 'text-purple-600']
        );

        $amberColor = Color::firstOrCreate(
            ['name' => 'amber'],
            ['hex_code' => '#f59e0b', 'bg_class' => 'bg-amber-50', 'text_class' => 'text-amber-600']
        );

        $roseColor = Color::firstOrCreate(
            ['name' => 'rose'],
            ['hex_code' => '#f43f5e', 'bg_class' => 'bg-rose-50', 'text_class' => 'text-rose-600']
        );

        $indigoColor = Color::firstOrCreate(
            ['name' => 'indigo'],
            ['hex_code' => '#6366f1', 'bg_class' => 'bg-indigo-50', 'text_class' => 'text-indigo-600']
        );

        $cyanColor = Color::firstOrCreate(
            ['name' => 'cyan'],
            ['hex_code' => '#06b6d4', 'bg_class' => 'bg-cyan-50', 'text_class' => 'text-cyan-600']
        );

        // 2. Seed Source Node Configuration Types
        ConfigurationType::firstOrCreate(
            ['node_key' => 'postgres_source'],
            [
                'name' => 'Database Source (PostgreSQL)',
                'category' => 'source',
                'sub_type' => 'postgres',
                'color_id' => $blueColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Primary Production Database', 'required' => true],
                    ['name' => 'host', 'label' => 'Host', 'type' => 'text', 'placeholder' => 'e.g. localhost or 127.0.0.1', 'required' => true],
                    ['name' => 'port', 'label' => 'Port', 'type' => 'text', 'placeholder' => 'e.g. 5432', 'default' => '5432', 'required' => true],
                    ['name' => 'database_name', 'label' => 'Database Name', 'type' => 'text', 'placeholder' => 'e.g. chunkflow_tenant', 'required' => true],
                    ['name' => 'username', 'label' => 'Username', 'type' => 'text', 'placeholder' => 'e.g. postgres or db_user', 'required' => true],
                    ['name' => 'password', 'label' => 'Password', 'type' => 'password', 'placeholder' => 'Enter database password...', 'required' => true],
                    ['name' => 'use_ssl', 'label' => 'Use SSL connection', 'type' => 'boolean', 'default' => false],
                    ['name' => 'backup_schedule', 'label' => 'Schedule (Cron)', 'type' => 'text', 'placeholder' => 'e.g. 0 30 15 * * *'],
                    ['name' => 'retention_days', 'label' => 'Retention Days', 'type' => 'number', 'placeholder' => 'e.g. 30'],
                ],
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'mysql_source'],
            [
                'name' => 'MySQL Database Source',
                'category' => 'source',
                'sub_type' => 'mysql',
                'color_id' => $indigoColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. MySQL Production Server', 'required' => true],
                    ['name' => 'host', 'label' => 'Host', 'type' => 'text', 'placeholder' => 'e.g. mysql.internal', 'required' => true],
                    ['name' => 'port', 'label' => 'Port', 'type' => 'text', 'placeholder' => 'e.g. 3306', 'default' => '3306', 'required' => true],
                    ['name' => 'database_name', 'label' => 'Database Name', 'type' => 'text', 'placeholder' => 'e.g. main_db', 'required' => true],
                    ['name' => 'username', 'label' => 'Username', 'type' => 'text', 'placeholder' => 'e.g. root', 'required' => true],
                    ['name' => 'password', 'label' => 'Password', 'type' => 'password', 'placeholder' => 'Enter MySQL password...', 'required' => true],
                ],
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'kafka_source'],
            [
                'name' => 'Apache Kafka Stream',
                'category' => 'source',
                'sub_type' => 'kafka',
                'color_id' => $purpleColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. CDC Events Kafka Cluster', 'required' => true],
                    ['name' => 'bootstrap_servers', 'label' => 'Bootstrap Servers', 'type' => 'text', 'placeholder' => 'e.g. kafka:9092,kafka2:9092', 'required' => true],
                    ['name' => 'topic', 'label' => 'Topic Name', 'type' => 'text', 'placeholder' => 'e.g. tenant_cdc_events', 'required' => true],
                    ['name' => 'group_id', 'label' => 'Consumer Group ID', 'type' => 'text', 'placeholder' => 'e.g. chunkflow_consumer', 'required' => true],
                    ['name' => 'sasl_password', 'label' => 'SASL Secret Key', 'type' => 'password', 'placeholder' => 'Enter SASL Secret...'],
                ],
                'is_active' => true,
                'sort_order' => 3,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'mongodb_source'],
            [
                'name' => 'MongoDB Document Store',
                'category' => 'source',
                'sub_type' => 'mongodb',
                'color_id' => $emeraldColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Atlas MongoDB Cluster', 'required' => true],
                    ['name' => 'connection_string', 'label' => 'MongoDB URI', 'type' => 'password', 'placeholder' => 'mongodb+srv://user:pass@cluster.mongodb.net', 'required' => true],
                    ['name' => 'database_name', 'label' => 'Database Name', 'type' => 'text', 'placeholder' => 'e.g. analytics', 'required' => true],
                    ['name' => 'collection', 'label' => 'Collection Name', 'type' => 'text', 'placeholder' => 'e.g. user_logs'],
                ],
                'is_active' => true,
                'sort_order' => 4,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'webhook_source'],
            [
                'name' => 'HTTP Webhook Trigger',
                'category' => 'source',
                'sub_type' => 'webhook',
                'color_id' => $amberColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Stripe Webhook Listener', 'required' => true],
                    ['name' => 'endpoint_url', 'label' => 'Webhook Route', 'type' => 'text', 'placeholder' => '/api/v1/webhooks/incoming', 'required' => true],
                    ['name' => 'secret_token', 'label' => 'Signing Secret Token', 'type' => 'password', 'placeholder' => 'whsec_...'],
                ],
                'is_active' => true,
                'sort_order' => 5,
            ]
        );

        // 3. Seed Destination Node Configuration Types
        ConfigurationType::firstOrCreate(
            ['node_key' => 's3_destination'],
            [
                'name' => 'Amazon S3 Vault',
                'category' => 'destination',
                'sub_type' => 's3',
                'color_id' => $emeraldColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Amazon S3 Vault', 'required' => true],
                    ['name' => 'bucket_name', 'label' => 'Bucket Name', 'type' => 'text', 'placeholder' => 'e.g. chunkflow-vault-backups', 'required' => true],
                    ['name' => 'region', 'label' => 'AWS Region', 'type' => 'text', 'placeholder' => 'e.g. us-east-1 or ap-south-1', 'required' => true],
                    ['name' => 'access_key_id', 'label' => 'AWS Access Key ID', 'type' => 'text', 'placeholder' => 'e.g. AKIAIOSFODNN7EXAMPLE', 'required' => true],
                    ['name' => 'secret_access_key', 'label' => 'AWS Secret Access Key', 'type' => 'password', 'placeholder' => 'Enter AWS Secret Access Key...', 'required' => true],
                    ['name' => 'folder_path', 'label' => 'Folder Path (Prefix)', 'type' => 'text', 'placeholder' => 'e.g. /backups/production'],
                    ['name' => 'encryption', 'label' => 'Encryption Standard', 'type' => 'text', 'default' => 'AES-256 Server-Side Encryption'],
                    ['name' => 'storage_class', 'label' => 'Storage Class', 'type' => 'text', 'default' => 'Standard'],
                ],
                'is_active' => true,
                'sort_order' => 6,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'gcs_destination'],
            [
                'name' => 'Google Cloud Storage (GCS)',
                'category' => 'destination',
                'sub_type' => 'gcs',
                'color_id' => $blueColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. GCP Coldline Vault', 'required' => true],
                    ['name' => 'bucket_name', 'label' => 'Bucket Name', 'type' => 'text', 'placeholder' => 'e.g. my-gcp-backup-bucket', 'required' => true],
                    ['name' => 'project_id', 'label' => 'GCP Project ID', 'type' => 'text', 'placeholder' => 'e.g. chunkflow-prod', 'required' => true],
                    ['name' => 'service_account_json', 'label' => 'Service Account Key (JSON)', 'type' => 'password', 'placeholder' => 'Paste Service Account JSON...', 'required' => true],
                ],
                'is_active' => true,
                'sort_order' => 7,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'redis_destination'],
            [
                'name' => 'Redis Cache & Vector Vault',
                'category' => 'destination',
                'sub_type' => 'redis',
                'color_id' => $roseColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Production Redis Cluster', 'required' => true],
                    ['name' => 'host', 'label' => 'Redis Host', 'type' => 'text', 'placeholder' => 'e.g. redis.internal', 'required' => true],
                    ['name' => 'port', 'label' => 'Redis Port', 'type' => 'text', 'default' => '6379', 'required' => true],
                    ['name' => 'password', 'label' => 'Redis Password', 'type' => 'password', 'placeholder' => 'Enter Auth Password...'],
                ],
                'is_active' => true,
                'sort_order' => 8,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'snowflake_destination'],
            [
                'name' => 'Snowflake Data Warehouse',
                'category' => 'destination',
                'sub_type' => 'snowflake',
                'color_id' => $cyanColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. Enterprise Analytics Warehouse', 'required' => true],
                    ['name' => 'account', 'label' => 'Account Identifier', 'type' => 'text', 'placeholder' => 'xy12345.us-east-1', 'required' => true],
                    ['name' => 'username', 'label' => 'Username', 'type' => 'text', 'placeholder' => 'e.g. dw_user', 'required' => true],
                    ['name' => 'password', 'label' => 'Password', 'type' => 'password', 'placeholder' => 'Enter Snowflake password...', 'required' => true],
                    ['name' => 'warehouse', 'label' => 'Warehouse', 'type' => 'text', 'placeholder' => 'COMPUTE_WH'],
                    ['name' => 'database', 'label' => 'Database Name', 'type' => 'text', 'placeholder' => 'ANALYTICS_DB'],
                ],
                'is_active' => true,
                'sort_order' => 9,
            ]
        );

        ConfigurationType::firstOrCreate(
            ['node_key' => 'pinecone_destination'],
            [
                'name' => 'Pinecone Vector DB',
                'category' => 'destination',
                'sub_type' => 'pinecone',
                'color_id' => $purpleColor->id,
                'fields_schema' => [
                    ['name' => 'name', 'label' => 'Configuration Name', 'type' => 'text', 'placeholder' => 'e.g. LLM Embeddings Index', 'required' => true],
                    ['name' => 'environment', 'label' => 'Environment', 'type' => 'text', 'placeholder' => 'us-west1-gcp-free', 'required' => true],
                    ['name' => 'index_name', 'label' => 'Index Name', 'type' => 'text', 'placeholder' => 'chunkflow-vectors', 'required' => true],
                    ['name' => 'api_key', 'label' => 'Pinecone API Key', 'type' => 'password', 'placeholder' => 'Enter API Key...', 'required' => true],
                ],
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        // 4. Seed Default Connector Canvas Project
        Connector::firstOrCreate(
            ['name' => 'Database-to-S3 Backup Workflow Builder'],
            ['status' => 'active']
        );
    }
}
