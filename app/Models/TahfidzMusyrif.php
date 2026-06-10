<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzMusyrif extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'is_active'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function members()
    {
        return $this->hasMany(TahfidzHalaqohMember::class, 'musyrif_id');
    }
}
