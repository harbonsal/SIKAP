<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Kkm extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'mapel_id',
        'kelas_id',
        'kkm_value',
    ];

    /**
     * Boot method to add cache invalidation hooks
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($kkm) {
            if (empty($kkm->academic_year_id)) {
                $activeYear = \App\Models\AcademicYear::where('is_active', true)->first() 
                    ?: \App\Models\AcademicYear::first() 
                    ?: \App\Models\AcademicYear::create([
                        'name' => '2024/2025',
                        'start_date' => '2024-07-01',
                        'end_date' => '2025-06-30',
                        'is_active' => true,
                    ]);
                $kkm->academic_year_id = $activeYear->id;
            }
        });

        // Clear cache when KKM is updated or deleted
        static::saved(function ($kkm) {
            if ($kkm->academic_year_id) {
                Cache::forget("kkm_values_{$kkm->academic_year_id}");
            }
        });

        static::deleted(function ($kkm) {
            if ($kkm->academic_year_id) {
                Cache::forget("kkm_values_{$kkm->academic_year_id}");
            }
        });
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }
}
