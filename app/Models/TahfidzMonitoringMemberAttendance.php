<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzMonitoringMemberAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'monitoring_id',
        'student_id',
        'musyrif_id',
        'status',
        'note'
    ];

    public function monitoring()
    {
        return $this->belongsTo(TahfidzMonitoring::class, 'monitoring_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function musyrif()
    {
        return $this->belongsTo(TahfidzMusyrif::class, 'musyrif_id');
    }
}
