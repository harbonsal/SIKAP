<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;

class TahfidzMemorizationDetail extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year_id',
        'officer_id',
        'juz',
        'page_number',
        'surah_name',
        'verse_key',
        'mistake_count',
        'mistakes_history',
        'status',
        'type',
    ];

    protected $casts = [
        'mistakes_history' => 'array',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
