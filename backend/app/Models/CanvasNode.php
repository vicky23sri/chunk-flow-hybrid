<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CanvasNode extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'canvas_nodes';

    protected $fillable = [
        'connector_id',
        'node_id',
        'element_id',
        'label',
        'position_x',
        'position_y',
        'encrypted_config',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'position_x' => 'float',
        'position_y' => 'float',
    ];

    public function connector()
    {
        return $this->belongsTo(Connector::class);
    }

    public function node()
    {
        return $this->belongsTo(Node::class);
    }
}
