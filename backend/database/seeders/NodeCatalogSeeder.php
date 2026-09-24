<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Node;
use App\Models\Connector;

class NodeCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $nodes = [
            [
                'node_key' => 'postgres_source',
                'name' => 'PostgreSQL Database',
                'category' => 'source',
                'sub_type' => 'postgres',
                'color' => ['hex_code' => '#336791', 'bg_class' => 'bg-blue-600', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'host', 'label' => 'Host', 'type' => 'text', 'required' => true],
                    ['key' => 'port', 'label' => 'Port', 'type' => 'text', 'required' => true, 'default' => '5432'],
                    ['key' => 'database', 'label' => 'Database Name', 'type' => 'text', 'required' => true],
                    ['key' => 'username', 'label' => 'Username', 'type' => 'text', 'required' => true],
                    ['key' => 'password', 'label' => 'Password', 'type' => 'password', 'required' => true],
                    ['key' => 'useSSL', 'label' => 'Use SSL/TLS', 'type' => 'checkbox', 'required' => false, 'default' => true]
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'node_key' => 'mysql_source',
                'name' => 'MySQL Database',
                'category' => 'source',
                'sub_type' => 'mysql',
                'color' => ['hex_code' => '#3b82f6', 'bg_class' => 'bg-blue-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'host', 'label' => 'Host', 'type' => 'text', 'required' => true],
                    ['key' => 'port', 'label' => 'Port', 'type' => 'text', 'required' => true, 'default' => '3306'],
                    ['key' => 'database', 'label' => 'Database Name', 'type' => 'text', 'required' => true],
                    ['key' => 'username', 'label' => 'Username', 'type' => 'text', 'required' => true],
                    ['key' => 'password', 'label' => 'Password', 'type' => 'password', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'node_key' => 'kafka_source',
                'name' => 'Kafka Stream',
                'category' => 'source',
                'sub_type' => 'kafka',
                'color' => ['hex_code' => '#f59e0b', 'bg_class' => 'bg-amber-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'brokers', 'label' => 'Brokers (comma separated)', 'type' => 'text', 'required' => true],
                    ['key' => 'topic', 'label' => 'Topic', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'node_key' => 'mongodb_source',
                'name' => 'MongoDB',
                'category' => 'source',
                'sub_type' => 'mongodb',
                'color' => ['hex_code' => '#10b981', 'bg_class' => 'bg-emerald-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'uri', 'label' => 'Connection URI', 'type' => 'password', 'required' => true],
                    ['key' => 'database', 'label' => 'Database', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'node_key' => 'webhook_source',
                'name' => 'Webhook Receiver',
                'category' => 'source',
                'sub_type' => 'webhook',
                'color' => ['hex_code' => '#a855f7', 'bg_class' => 'bg-purple-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'path', 'label' => 'Endpoint Path', 'type' => 'text', 'required' => true, 'default' => '/webhook']
                ],
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'node_key' => 's3_destination',
                'name' => 'Amazon S3 / R2 Bucket',
                'category' => 'destination',
                'sub_type' => 's3',
                'color' => ['hex_code' => '#FF9900', 'bg_class' => 'bg-orange-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'bucket', 'label' => 'Bucket Name', 'type' => 'text', 'required' => true],
                    ['key' => 'region', 'label' => 'Region', 'type' => 'text', 'required' => true, 'default' => 'us-east-1'],
                    ['key' => 'accessKey', 'label' => 'Access Key ID', 'type' => 'text', 'required' => true],
                    ['key' => 'secretKey', 'label' => 'Secret Access Key', 'type' => 'password', 'required' => true],
                    ['key' => 'folder', 'label' => 'Folder Path (Optional)', 'type' => 'text', 'required' => false],
                    ['key' => 'encryption', 'label' => 'Enable Encryption (SSE-S3)', 'type' => 'checkbox', 'required' => false, 'default' => true]
                ],
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'node_key' => 'gcs_destination',
                'name' => 'Google Cloud Storage',
                'category' => 'destination',
                'sub_type' => 'gcs',
                'color' => ['hex_code' => '#3b82f6', 'bg_class' => 'bg-blue-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'bucket', 'label' => 'Bucket Name', 'type' => 'text', 'required' => true],
                    ['key' => 'projectId', 'label' => 'Project ID', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'node_key' => 'redis_destination',
                'name' => 'Redis Cache',
                'category' => 'destination',
                'sub_type' => 'redis',
                'color' => ['hex_code' => '#f43f5e', 'bg_class' => 'bg-rose-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'host', 'label' => 'Host', 'type' => 'text', 'required' => true],
                    ['key' => 'port', 'label' => 'Port', 'type' => 'text', 'required' => true, 'default' => '6379'],
                    ['key' => 'password', 'label' => 'Password', 'type' => 'password', 'required' => false]
                ],
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'node_key' => 'snowflake_destination',
                'name' => 'Snowflake',
                'category' => 'destination',
                'sub_type' => 'snowflake',
                'color' => ['hex_code' => '#06b6d4', 'bg_class' => 'bg-cyan-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'account', 'label' => 'Account URL', 'type' => 'text', 'required' => true],
                    ['key' => 'warehouse', 'label' => 'Warehouse', 'type' => 'text', 'required' => true],
                    ['key' => 'database', 'label' => 'Database', 'type' => 'text', 'required' => true],
                    ['key' => 'schema', 'label' => 'Schema', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 9,
            ],
            [
                'node_key' => 'pinecone_destination',
                'name' => 'Pinecone Vector DB',
                'category' => 'destination',
                'sub_type' => 'pinecone',
                'color' => ['hex_code' => '#6366f1', 'bg_class' => 'bg-indigo-500', 'text_class' => 'text-white'],
                'fields_schema' => [
                    ['key' => 'apiKey', 'label' => 'API Key', 'type' => 'password', 'required' => true],
                    ['key' => 'environment', 'label' => 'Environment', 'type' => 'text', 'required' => true],
                    ['key' => 'indexName', 'label' => 'Index Name', 'type' => 'text', 'required' => true]
                ],
                'is_active' => true,
                'sort_order' => 10,
            ]
        ];

        foreach ($nodes as $nodeData) {
            Node::updateOrCreate(
                ['node_key' => $nodeData['node_key']],
                $nodeData
            );
        }

        // 4. Seed Default Connector Canvas Project
        Connector::firstOrCreate(
            ['name' => 'Database-to-S3 Backup Workflow Builder'],
            ['status' => 'active']
        );
    }
}
