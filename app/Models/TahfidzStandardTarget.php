<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TahfidzStandardTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'jenjang_id',
        'semester_number',
        'target_juz_count',
        'juz_details',
    ];

    public function jenjang()
    {
        return $this->belongsTo(Jenjang::class);
    }
    
    /**
     * Helper to get target pages (1 Juz = 20 pages)
     */
    public function getTargetPagesAttribute()
    {
        return $this->target_juz_count * 20;
    }
}
