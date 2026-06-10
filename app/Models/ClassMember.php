<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_class_id',
        'student_id',
    ];

    public function activeClass()
    {
        return $this->belongsTo(ActiveClass::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
