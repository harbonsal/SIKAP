<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassJournal extends Model
{
    protected $fillable = [
        'active_subject_id',
        'teacher_id',
        'academic_year_id',
        'pekan_id',
        'jam_ke',
        'date',
        'topic',
        'description',
        'status',
    ];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function pekan()
    {
        return $this->belongsTo(Pekan::class);
    }

    public function studentAttendances()
    {
        return $this->hasMany(StudentAttendance::class);
    }
}
