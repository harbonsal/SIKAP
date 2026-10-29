<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MusyrifDutyTemplate extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'order_num' => 'integer',
        'is_active' => 'boolean',
    ];

    public function logs()
    {
        return $this->hasMany(MusyrifDutyLog::class, 'duty_template_id');
    }
}

