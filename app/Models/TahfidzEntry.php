<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'active_subject_id',
        'date',
        'type',
        'juz',
        'page',
        'surah',
        'verse_start',
        'verse_end',
        'lines',
        'status',
        'notes',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }
}
