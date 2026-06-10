<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student; // Added for the student relationship

class TahfidzMemorization extends Model
{
    protected $fillable = [
        'student_id',
        'juz',
        'completed_pages',
        'is_completed',
        'is_validated',
    ];

    protected $casts = [
        'completed_pages' => 'array',
        'is_completed' => 'boolean',
        'is_validated' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
