<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ConfigurationType extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'node_key',
        'name',
        'category',
        'sub_type',
        'color_id',
        'fields_schema',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'fields_schema' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function color()
    {
        return $this->belongsTo(Color::class);
    }
}
