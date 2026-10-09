<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarbiyahGroupAttendance extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function groupLog()
    {
        return $this->belongsTo(TarbiyahGroupLog::class, 'tarbiyah_group_log_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
