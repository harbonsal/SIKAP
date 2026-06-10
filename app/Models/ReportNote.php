<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportNote extends Model
{
    protected $fillable = [
        'student_id',
        'active_class_id',
        'note',
        'type',
        'semester'
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
