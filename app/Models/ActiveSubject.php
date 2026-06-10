<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ActiveSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_class_id',
        'mapel_id',
        'teacher_id',
        'jam',
    ];

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function studentGrades()
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function semesterSubjectTeachers()
    {
        return $this->hasMany(SemesterSubjectTeacher::class);
    }

    public function teacherForSemester($semesterId)
    {
        $override = $this->semesterSubjectTeachers->where('semester_id', $semesterId)->first();
        return $override ? $override->teacher : $this->teacher;
    }

    public function tahfidzTesters()
    {
        return $this->hasMany(TahfidzTester::class);
    }

    /**
     * Scope a query to only include active subjects accessible by a given user.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  \App\Models\User  $user
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForUser($query, $user)
    {
        if ($user->hasPermission('view_all_assessments')) {
            return $query;
        }

        return $query->where('active_subjects.teacher_id', $user->id);
    }
}
