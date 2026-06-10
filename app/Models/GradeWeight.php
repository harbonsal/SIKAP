<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class GradeWeight extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'category',
        'name',
        'weight',
        'semester',
    ];

    /**
     * Boot method to add cache invalidation hooks
     */
    protected static function boot()
    {
        parent::boot();

        // Clear cache when GradeWeight is updated or deleted
        static::saved(function ($gradeWeight) {
            if ($gradeWeight->academic_year_id && $gradeWeight->semester) {
                // Clear cache for all possible semester variations
                $semesterVariations = ['All', 'all', 'Semua', 'semua', 'Ganjil', 'Genap', 'Semester 1', 'Semester 2'];
                foreach ($semesterVariations as $sem) {
                    Cache::forget("grade_weights_{$gradeWeight->academic_year_id}_{$sem}");
                }
            }
        });

        static::deleted(function ($gradeWeight) {
            if ($gradeWeight->academic_year_id && $gradeWeight->semester) {
                // Clear cache for all possible semester variations
                $semesterVariations = ['All', 'all', 'Semua', 'semua', 'Ganjil', 'Genap', 'Semester 1', 'Semester 2'];
                foreach ($semesterVariations as $sem) {
                    Cache::forget("grade_weights_{$gradeWeight->academic_year_id}_{$sem}");
                }
            }
        });
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
