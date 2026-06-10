<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzHalaqohMember extends Model
{
    use HasFactory;

    protected $fillable = ['musyrif_id', 'student_id'];

    public function musyrif()
    {
        return $this->belongsTo(TahfidzMusyrif::class, 'musyrif_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
