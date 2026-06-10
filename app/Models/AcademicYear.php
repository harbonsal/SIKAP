<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'is_active', 'status'];

    protected $casts = [
        'is_active' => 'boolean',
        'status' => 'string',
    ];
}
