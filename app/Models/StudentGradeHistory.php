<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGradeHistory extends Model
{
    protected $fillable = [
        'student_grade_id',
        'old_score',
        'new_score',
        'user_id',
    ];

    public function studentGrade(): BelongsTo
    {
        return $this->belongsTo(StudentGrade::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
