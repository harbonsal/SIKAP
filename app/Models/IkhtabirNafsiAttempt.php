<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IkhtabirNafsiAttempt extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'supervisor_note' => 'array',
        'published_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(IkhtabirNafsiMessage::class, 'attempt_id');
    }

    public function topic()
    {
        return $this->belongsTo(IkhtabirNafsiTopic::class, 'topic_id');
    }
}
