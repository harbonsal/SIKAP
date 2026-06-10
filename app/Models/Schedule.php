<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'active_class_id',
        'active_subject_id',
        'teacher_id',
        'day_id',
        'learning_hour_id',
        'is_manual',
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function day()
    {
        return $this->belongsTo(Day::class);
    }

    public function learningHour()
    {
        return $this->belongsTo(LearningHour::class);
    }
}
