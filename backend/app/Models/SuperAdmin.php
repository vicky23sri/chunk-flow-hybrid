<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SuperAdmin extends Authenticatable implements JWTSubject
{
    use HasUuids;

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password'];

    protected $casts = ['password' => 'hashed'];

    public function getAuthPassword()
    {
        return $this->password_hash ?? $this->attributes['password'] ?? null;
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return ['role' => 'super_admin'];
    }
}

