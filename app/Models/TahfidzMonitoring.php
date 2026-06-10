<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzMonitoring extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'recorded_at', 'session_id', 'general_note'];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function session()
    {
        return $this->belongsTo(TahfidzHalaqohSession::class);
    }

    public function attendances()
    {
        return $this->hasMany(TahfidzMonitoringAttendance::class, 'monitoring_id');
    }

    public function violations()
    {
        return $this->hasMany(TahfidzMonitoringViolation::class, 'monitoring_id');
    }
}
