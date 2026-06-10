<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolInfo extends Model
{
    protected $fillable = [
        'name',
        'address',
        'header_config',
        'schedule_config',
        'city',
        'report_date',
        'report_place_ar',
        'kop_image',
        'stamp_image',
        'headmaster_signature',
    ];

    protected $casts = [
        'header_config' => 'array',
        'schedule_config' => 'array',
    ];
}
