<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'active_class_id', // Note: student might move classes, but for summary we usually attach to the class where they got the summary.
        'academic_year_id',
        'semester',
        'sakit',
        'izin',
        'alpa',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id'); // ID refers to Users table
    }

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }
}
