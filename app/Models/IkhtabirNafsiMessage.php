<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IkhtabirNafsiMessage extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function attempt()
    {
        return $this->belongsTo(IkhtabirNafsiAttempt::class, 'attempt_id');
    }
}
