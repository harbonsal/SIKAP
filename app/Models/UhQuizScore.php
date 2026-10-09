<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UhQuizScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'uh_session_id',
        'student_id',
        'quiz_number',
        'score',
    ];

    public function uhSession()
    {
        return $this->belongsTo(UhSession::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
