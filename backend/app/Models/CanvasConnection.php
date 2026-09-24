<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CanvasConnection extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'canvas_connections';

    protected $fillable = [
        'connector_id',
        'connection_id',
        'source_element_id',
        'target_element_id',
    ];

    public function connector()
    {
        return $this->belongsTo(Connector::class);
    }
}
