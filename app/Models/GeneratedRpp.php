<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedRpp extends Model
{
    protected $fillable = [
        'user_id',
        'active_subject_id',
        'topic',
        'teaching_method_id',
        'duration_minutes',
        'additional_notes',
        'ai_result_html',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function teachingMethod()
    {
        return $this->belongsTo(TeachingMethod::class);
    }
}
