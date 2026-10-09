<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarbiyahGroupLog extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function musyrif()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function attendances()
    {
        return $this->hasMany(TarbiyahGroupAttendance::class);
    }
}
