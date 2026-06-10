<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HafalanSkriningReport extends Model
{
    protected $fillable = [
        'user_id',
        'juz_number',
        'total_mistakes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hafalan_skrinings()
    {
        return $this->hasMany(HafalanSkrining::class);
    }
}
