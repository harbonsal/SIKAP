<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAttendance extends Model
{
    protected $fillable = [
        'class_journal_id',
        'student_id',
        'status',
        'note',
    ];

    public function classJournal()
    {
        return $this->belongsTo(ClassJournal::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
