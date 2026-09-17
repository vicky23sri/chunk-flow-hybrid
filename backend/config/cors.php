<?php

return [
    'paths'                    => ['api/*', 'health'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Tenant-Subdomain',
        'X-Tenant-ID',
        'Accept',
    ],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
