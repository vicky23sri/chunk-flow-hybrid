<?php

namespace Database\Seeders;

use App\Models\SuperAdmin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Tenant;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Super Admin
        SuperAdmin::firstOrCreate(
            ['email' => 'admin@chunkflow.com'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('admin123'),
            ]
        );

        $this->command->info('✅ SuperAdmin created: admin@chunkflow.com / admin123');

        $tenant = Tenant::firstOrCreate(
            ['id' => 'acme'], 
            ['name' => 'Acme Corporation', 'subdomain' => 'acme']
        );
        $tenant->domains()->firstOrCreate(['domain' => 'acme.localhost']);

        // 3. Seed admin user & node catalog in tenant DB using $tenant->run()
        $tenant->run(function () {
            User::firstOrCreate(
                ['email' => 'admin@acme.com'],
                [
                    'name'     => 'Acme Admin',
                    'password' => Hash::make('admin123'),
                    'role'     => 'admin',
                ]
            );

            $this->call(NodeCatalogSeeder::class);
        });

        $this->command->info('✅ Seed tenant created: acme (admin@acme.com / admin123)');
    }
}
