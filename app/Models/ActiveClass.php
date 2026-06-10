<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'kelas_id',
        'kelas_paralel_id',
        'teacher_id',
        'name',
        'total_hours_per_week',
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function class()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function kelasParalel()
    {
        return $this->belongsTo(KelasParalel::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classMembers()
    {
        return $this->hasMany(ClassMember::class);
    }

    public function activeSubjects()
    {
        return $this->hasMany(ActiveSubject::class);
    }

    public function semesterHomeroomTeachers()
    {
        return $this->hasMany(SemesterHomeroomTeacher::class);
    }

    public function homeroomForSemester($semesterId)
    {
        $override = $this->semesterHomeroomTeachers->where('semester_id', $semesterId)->first();
        return $override ? $override->teacher : $this->teacher;
    }
}
