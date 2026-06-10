<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'permission_group_id',
        'student_id',
        'status',
        'exit_at',
        'return_at',
        'is_late',
        'keterangan'
    ];

    protected $casts = [
        'exit_at' => 'datetime',
        'return_at' => 'datetime',
        'is_late' => 'boolean',
    ];

    public function permissionGroup()
    {
        return $this->belongsTo(PermissionGroup::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
