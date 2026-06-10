<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KamarMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'active_kamar_id',
        'kamar_id',
        'student_id',
    ];

    public function activeKamar()
    {
        return $this->belongsTo(ActiveKamar::class);
    }

    // Legacy fallback relation for deployments that still use kamar_id directly.
    public function kamar()
    {
        return $this->belongsTo(Kamar::class, 'kamar_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
