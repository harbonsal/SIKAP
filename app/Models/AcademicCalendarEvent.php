<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicCalendarEvent extends Model
{
    protected $fillable = [
        'title',
        'category',
        'start_date',
        'end_date',
        'color',
        'description',
        'is_kbm_active',
    ];

    protected $casts = [
        'is_kbm_active' => 'boolean',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];
}
