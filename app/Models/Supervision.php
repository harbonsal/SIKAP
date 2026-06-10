<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supervision extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'supervisor_id',
        'active_subject_id',
        'topic',
        'date',
        'lesson_hours',
        'academic_year_id',
        'semester_id',
        'total_score',
        'notes',
        'status',
        'proof_url',
        'is_student_questionnaire_open',
        'is_published'
    ];

    protected $casts = [
        'is_student_questionnaire_open' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function details()
    {
        return $this->hasMany(SupervisionDetail::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function studentQuestionnaireResponses()
    {
        return $this->hasMany(StudentQuestionnaireResponse::class);
    }
}
