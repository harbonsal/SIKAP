<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveKamar extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'kamar_id',
        'musrif_id',
        'name',
    ];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function kamar()
    {
        return $this->belongsTo(Kamar::class);
    }

    public function musrif()
    {
        return $this->belongsTo(User::class, 'musrif_id');
    }

    public function members()
    {
        return $this->hasMany(KamarMember::class);
    }
}
