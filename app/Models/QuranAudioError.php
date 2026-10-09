<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranAudioError extends Model
{
    use HasFactory;

    protected $table = 'quran_audio_errors';

    protected $fillable = [
        'user_id',
        'qari_id',
        'surah_number',
        'ayat_number',
        'verse_key',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
