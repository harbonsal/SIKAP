<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IkhtabirNafsiTopic extends Model
{
    use HasFactory;

    protected $fillable = [
        'text_ar',
        'level',
        'active',
    ];

    public function attempts()
    {
        return $this->hasMany(IkhtabirNafsiAttempt::class, 'topic_id');
    }
}
