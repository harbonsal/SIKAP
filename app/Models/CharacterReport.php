<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CharacterReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'active_class_id',
        'notes',
        'month',
        'year',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }
}
