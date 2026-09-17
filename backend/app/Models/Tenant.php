<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * 'name' is stored in the JSON 'data' column via Stancl VirtualColumn.
     * We declare it as a custom column so Stancl auto-fills it.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'subdomain',
        ];
    }
}

