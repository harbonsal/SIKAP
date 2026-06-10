<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuranProgress extends Model
{
    protected $table = 'quran_progresses';

    protected $fillable = [
        'user_id',
        'juz_number',
        'last_verse_key',
        'last_page_number',
        'is_completed',
        'played_ayahs',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'played_ayahs' => 'array',
        'last_page_number' => 'integer',
        'juz_number' => 'integer',
    ];
}
