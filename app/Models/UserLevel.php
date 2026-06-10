<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'dashboard_type',
        'widgets',
    ];

    protected $casts = [
        'widgets' => 'array',
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }
}
