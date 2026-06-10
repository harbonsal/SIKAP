<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory; // Added this line

class StudentGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_subject_id',
        'student_id',
        'grade_weight_id',
        'semester_id',
        'score',
        'original_score',
        'reading_quality',
        'reading_deficiencies',
    ];

    protected $casts = [
        'reading_deficiencies' => 'array',
    ];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function gradeWeight()
    {
        return $this->belongsTo(GradeWeight::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function tahfidzDetails()
    {
        return $this->hasMany(TahfidzAssessmentDetail::class);
    }
}
