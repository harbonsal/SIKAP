<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UhSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_subject_id',
        'semester_id',
        'type',
        'quiz_count',
    ];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function quizScores()
    {
        return $this->hasMany(UhQuizScore::class);
    }

    public function participationScores()
    {
        return $this->hasMany(UhParticipationScore::class);
    }
}
