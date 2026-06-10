<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermissionGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'active_kamar_id',
        'start_time',
        'end_time',
        'description',
        'created_by'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function activeKamar()
    {
        return $this->belongsTo(ActiveKamar::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function studentPermissions()
    {
        return $this->hasMany(StudentPermission::class);
    }
}
