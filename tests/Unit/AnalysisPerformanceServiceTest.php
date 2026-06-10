<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AnalysisPerformanceService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class AnalysisPerformanceServiceTest extends TestCase
{
    protected AnalysisPerformanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AnalysisPerformanceService();
        Cache::flush();
    }

    /** @test */
    public function it_calculates_weighted_average_correctly()
    {
        // Create mock grades collection
        $grades = collect([
            (object)['grade_weight_id' => 1, 'score' => 80],
            (object)['grade_weight_id' => 2, 'score' => 90],
            (object)['grade_weight_id' => 3, 'score' => 85],
        ]);

        // Create mock weights collection
        $weights = collect([
            (object)['id' => 1, 'weight' => 30],
            (object)['id' => 2, 'weight' => 40],
            (object)['id' => 3, 'weight' => 30],
        ]);

        $result = $this->service->calculateWeightedAverage($grades, $weights);

        // Expected: (80*30 + 90*40 + 85*30) / 100 = (2400 + 3600 + 2550) / 100 = 85.5
        $this->assertEquals(86, $result); // Rounded to 86
    }

    /** @test */
    public function it_returns_zero_for_empty_weights()
    {
        $grades = collect([
            (object)['grade_weight_id' => 1, 'score' => 80],
        ]);

        $weights = collect();

        $result = $this->service->calculateWeightedAverage($grades, $weights);

        $this->assertEquals(0.0, $result);
    }

    /** @test */
    public function it_handles_missing_grades_as_zero()
    {
        // Grades missing for weight ID 2
        $grades = collect([
            (object)['grade_weight_id' => 1, 'score' => 80],
            (object)['grade_weight_id' => 3, 'score' => 90],
        ]);

        $weights = collect([
            (object)['id' => 1, 'weight' => 50],
            (object)['id' => 2, 'weight' => 25],
            (object)['id' => 3, 'weight' => 25],
        ]);

        $result = $this->service->calculateWeightedAverage($grades, $weights);

        // Expected: (80*50 + 0*25 + 90*25) / 100 = (4000 + 0 + 2250) / 100 = 62.5
        $this->assertEquals(63, $result); // Rounded to 63
    }

    /** @test */
    public function it_calculates_safety_status_aman()
    {
        $status = $this->service->calculateSafetyStatus(80, 75, false, false);
        $this->assertEquals('Aman', $status);
    }

    /** @test */
    public function it_calculates_safety_status_perlu_perhatian_with_red_marks()
    {
        $status = $this->service->calculateSafetyStatus(80, 75, true, false);
        $this->assertEquals('Perlu Perhatian', $status);
    }

    /** @test */
    public function it_calculates_safety_status_perlu_perhatian_below_kkm()
    {
        $status = $this->service->calculateSafetyStatus(70, 75, false, false);
        $this->assertEquals('Perlu Perhatian', $status);
    }

    /** @test */
    public function it_calculates_safety_status_tidak_aman_in_sem2()
    {
        $status = $this->service->calculateSafetyStatus(70, 75, false, true);
        $this->assertEquals('Tidak Aman', $status);
    }

    /** @test */
    public function it_calculates_safety_status_aman_in_sem2_above_kkm()
    {
        $status = $this->service->calculateSafetyStatus(80, 75, false, true);
        $this->assertEquals('Aman', $status);
    }

    /** @test */
    public function it_caches_kkm_values()
    {
        $academicYearId = 1;
        $cacheKey = "kkm_values_{$academicYearId}";

        // Pre-populate cache to avoid database access
        $mockData = collect([
            1 => collect([
                10 => (object)['kkm_value' => 75],
                11 => (object)['kkm_value' => 80],
            ])
        ]);
        Cache::put($cacheKey, $mockData, 3600);

        // Call should return cached data
        $result = $this->service->getCachedKKMs($academicYearId);
        
        // Verify it's a collection
        $this->assertInstanceOf(Collection::class, $result);
        $this->assertEquals($mockData, $result);
    }

    /** @test */
    public function it_caches_grade_weights()
    {
        $academicYearId = 1;
        $semesterName = 'Ganjil';
        $cacheKey = "grade_weights_{$academicYearId}_{$semesterName}";

        // Pre-populate cache to avoid database access
        $mockData = collect([
            (object)['id' => 1, 'name' => 'UH1', 'weight' => 30],
            (object)['id' => 2, 'name' => 'UTS', 'weight' => 40],
        ]);
        Cache::put($cacheKey, $mockData, 3600);

        // Call should return cached data
        $result = $this->service->getCachedGradeWeights($academicYearId, $semesterName);
        
        // Verify it's a collection
        $this->assertInstanceOf(Collection::class, $result);
        $this->assertEquals($mockData, $result);
    }

    /** @test */
    public function it_clears_kkm_cache()
    {
        $academicYearId = 1;
        $cacheKey = "kkm_values_{$academicYearId}";

        // Cache some data
        Cache::put($cacheKey, collect(['test' => 'data']), 3600);
        
        $this->assertTrue(Cache::has($cacheKey));

        // Clear cache
        $this->service->clearKKMCache($academicYearId);

        $this->assertFalse(Cache::has($cacheKey));
    }

    /** @test */
    public function it_clears_grade_weight_cache()
    {
        $academicYearId = 1;
        $semesterName = 'Ganjil';
        $cacheKey = "grade_weights_{$academicYearId}_{$semesterName}";

        // Cache some data
        Cache::put($cacheKey, collect(['test' => 'data']), 3600);
        
        $this->assertTrue(Cache::has($cacheKey));

        // Clear cache
        $this->service->clearGradeWeightCache($academicYearId, $semesterName);

        $this->assertFalse(Cache::has($cacheKey));
    }

    /** @test */
    public function it_handles_zero_total_weight_sum()
    {
        $grades = collect([
            (object)['grade_weight_id' => 1, 'score' => 80],
        ]);

        $weights = collect([
            (object)['id' => 1, 'weight' => 0],
        ]);

        $result = $this->service->calculateWeightedAverage($grades, $weights);

        $this->assertEquals(0.0, $result);
    }
}
