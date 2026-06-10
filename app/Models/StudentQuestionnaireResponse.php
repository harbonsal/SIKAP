<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentQuestionnaireResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'supervision_id',
        'student_id',
        'question_id',
        'answer', // 'Ya' or 'Tidak'
        'note',
    ];

    public function supervision()
    {
        return $this->belongsTo(Supervision::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function question()
    {
        return $this->belongsTo(StudentQuestionnaire::class, 'question_id');
    }
}
