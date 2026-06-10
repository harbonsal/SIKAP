<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Silabus extends Model
{
    protected $fillable = [
        'mapel_id',
        'jenjang_id',
        'kelas_id',
        'kurikulum',
        'semester',
        'kode',
        'standar_kompetensi',
        'kompetensi',
        'materi',
        'alokasi_waktu',
        'pekan',
    ];

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }

    public function jenjang()
    {
        return $this->belongsTo(Jenjang::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }
}
