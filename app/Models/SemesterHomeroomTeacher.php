<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterHomeroomTeacher extends Model
{
    protected $fillable = ['active_class_id', 'semester_id', 'teacher_id'];

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
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
