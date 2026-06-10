<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterSubjectTeacher extends Model
{
    protected $fillable = ['active_subject_id', 'semester_id', 'teacher_id'];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
