<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Node extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'nodes';

    protected $fillable = [
        'node_key',
        'name',
        'category',
        'sub_type',
        'color',
        'fields_schema',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'color' => 'array',
        'fields_schema' => 'array',
        'is_active' => 'boolean',
    ];
}
