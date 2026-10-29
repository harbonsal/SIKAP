<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MusyrifDutyLog extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'date',
        'checked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function dutyTemplate()
    {
        return $this->belongsTo(MusyrifDutyTemplate::class, 'duty_template_id');
    }

    public function activeKamar()
    {
        return $this->belongsTo(ActiveKamar::class);
    }
}

