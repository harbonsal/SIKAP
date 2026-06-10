<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzAssessmentDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_grade_id',
        'question_number',
        'surah_name',
        'verse_start',
        'verse_end',
        'mistakes',
        'notes',
    ];

    public function studentGrade()
    {
        return $this->belongsTo(StudentGrade::class);
    }
}
