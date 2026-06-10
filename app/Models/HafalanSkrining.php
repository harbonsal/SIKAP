<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HafalanSkrining extends Model
{
    use HasFactory;

    protected $table = 'hafalan_skrinings';

    protected $fillable = [
        'user_id',
        'juz_number',
        'surah_number',
        'ayat_number',
        'verse_key',
        'page_number',
        'full_ayat_text',
        'kata_benar',
        'hafalan_salah',
        'hafalan_skrining_report_id',
    ];

    protected $casts = [
        'juz_number'   => 'integer',
        'surah_number' => 'integer',
        'ayat_number'  => 'integer',
        'page_number'  => 'integer',
        'hafalan_skrining_report_id' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function report()
    {
        return $this->belongsTo(HafalanSkriningReport::class, 'hafalan_skrining_report_id');
    }
}
