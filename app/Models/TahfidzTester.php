<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TahfidzTester extends Model
{
    protected $fillable = [
        'active_subject_id',
        'user_id',
        'type', // 'main', 'assistant'
    ];

    public function activeSubject()
    {
        return $this->belongsTo(ActiveSubject::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
