<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use App\Models\Kkm;
use App\Models\GradeWeight;

/**
 * AnalysisPerformanceService
 * 
 * Service class for optimizing analysis page performance through caching
 * and efficient calculation methods. Provides methods for:
 * - Caching static data (KKM values, grade weights)
 * - Calculating weighted averages
 * - Determining safety status
 * - Query-based ranking calculations
 */
class AnalysisPerformanceService
{
    /**
     * Calculate weighted average for a student's grades
     * 
     * @param Collection $grades Student grades collection
     * @param Collection $weights Grade weights collection
     * @return float Weighted average score
     */
    public function calculateWeightedAverage(Collection $grades, Collection $weights): float
    {
        if ($weights->isEmpty()) {
            return 0.0;
        }

        $totalWeightSum = $weights->sum('weight');
        
        if ($totalWeightSum == 0) {
            return 0.0;
        }

        $weightedSum = 0;
        
        foreach ($weights as $weight) {
            $grade = $grades->where('grade_weight_id', $weight->id)->first();
            $score = $grade ? $grade->score : 0;
            $weightedSum += $score * $weight->weight;
        }

        return round($weightedSum / $totalWeightSum);
    }

    /**
     * Get cached KKM values grouped by kelas_id and keyed by mapel_id
     * 
     * @param int $academicYearId Academic year ID (for cache key uniqueness)
     * @return Collection KKMs grouped by kelas_id, keyed by mapel_id
     */
    public function getCachedKKMs(int $academicYearId): Collection
    {
        $cacheKey = "kkm_values_{$academicYearId}";
        
        return Cache::remember($cacheKey, 3600, function () {
            return Kkm::all()->groupBy('kelas_id')->map(fn($g) => $g->keyBy('mapel_id'));
        });
    }

    /**
     * Get cached grade weights for a specific academic year and semester
     * 
     * @param int $academicYearId Academic year ID
     * @param string $semesterName Semester name (e.g., 'Ganjil', 'Genap')
     * @return Collection Grade weights collection
     */
    public function getCachedGradeWeights(int $academicYearId, string $semesterName): Collection
    {
        $cacheKey = "grade_weights_{$academicYearId}_{$semesterName}";
        
        return Cache::remember($cacheKey, 3600, function () use ($academicYearId, $semesterName) {
            return GradeWeight::where('academic_year_id', $academicYearId)
                ->where('category', 'pengetahuan')
                ->whereIn('semester', ['All', 'all', 'Semua', 'semua', $semesterName])
                ->get();
        });
    }

    /**
     * Calculate safety status for a student-subject combination
     * 
     * @param float $score Final score
     * @param float $kkm KKM threshold
     * @param bool $hasRedMarks Whether student has any red marks (scores below KKM)
     * @param bool $isSem2 Whether this is semester 2
     * @return string Safety status: 'Aman', 'Perlu Perhatian', or 'Tidak Aman'
     */
    public function calculateSafetyStatus(float $score, float $kkm, bool $hasRedMarks, bool $isSem2): string
    {
        // If semester 2 and final rapor is below KKM, status is critical
        if ($isSem2 && $score < $kkm) {
            return 'Tidak Aman';
        }
        
        // If has red marks or current score below KKM, needs attention
        if ($hasRedMarks || $score < $kkm) {
            return 'Perlu Perhatian';
        }
        
        // Otherwise, safe
        return 'Aman';
    }

    /**
     * Calculate ranking for students using query-based approach
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query Base query for students
     * @param int $limit Number of students to return
     * @param string $direction Sort direction ('desc' for top, 'asc' for bottom)
     * @return Collection Ranked students collection
     */
    public function calculateRanking($query, int $limit, string $direction = 'desc'): Collection
    {
        // This method will be implemented in Phase 3 (Query Optimization)
        // For now, return empty collection as placeholder
        return collect();
    }

    /**
     * Clear cached KKM values for a specific academic year
     * 
     * @param int $academicYearId Academic year ID
     * @return void
     */
    public function clearKKMCache(int $academicYearId): void
    {
        $cacheKey = "kkm_values_{$academicYearId}";
        Cache::forget($cacheKey);
    }

    /**
     * Clear cached grade weights for a specific academic year and semester
     * 
     * @param int $academicYearId Academic year ID
     * @param string $semesterName Semester name
     * @return void
     */
    public function clearGradeWeightCache(int $academicYearId, string $semesterName): void
    {
        $cacheKey = "grade_weights_{$academicYearId}_{$semesterName}";
        Cache::forget($cacheKey);
    }
}
