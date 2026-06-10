<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherUnavailableHour extends Model
{
    protected $fillable = [
        'user_id',
        'day_id',
        'learning_hour_id',
        'academic_year_id',
        'note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function day()
    {
        return $this->belongsTo(Day::class);
    }

    public function learningHour()
    {
        return $this->belongsTo(LearningHour::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
