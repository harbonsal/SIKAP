<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pekan extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_kbm',
    ];

    protected $casts = [
        'is_kbm' => 'boolean',
    ];
}
