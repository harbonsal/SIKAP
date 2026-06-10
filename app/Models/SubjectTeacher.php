<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ActiveSubject;
use App\Models\User;

class SubjectTeacher extends Model
{
    protected $fillable = ['active_subject_id', 'teacher_id', 'is_main'];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
