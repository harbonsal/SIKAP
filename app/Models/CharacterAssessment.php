<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\ActiveClass;

class CharacterAssessment extends Model
{
    protected $fillable = [
        'student_id',
        'active_class_id',
        'category',
        'score',
        'note',
        'month',
        'year'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }
}
