<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Configuration extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'connector_id',
        'source_type_id',
        'destination_type_id',
        'name',
        'source_encrypted_data',
        'destination_encrypted_data',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    public function connector()
    {
        return $this->belongsTo(Connector::class);
    }

    public function sourceType()
    {
        return $this->belongsTo(ConfigurationType::class, 'source_type_id');
    }

    public function destinationType()
    {
        return $this->belongsTo(ConfigurationType::class, 'destination_type_id');
    }
}
