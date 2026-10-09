<?php

namespace App\Helpers;

use App\Models\SchoolInfo;

class GradeHelper
{
    private static $weights = null;

    /**
     * Get the grading weights from SchoolInfo (cached per request).
     */
    public static function getWeights()
    {
        if (self::$weights === null) {
            $schoolInfo = SchoolInfo::first();
            $w1 = isset($schoolInfo->grade_config['sem1_weight']) ? (int) $schoolInfo->grade_config['sem1_weight'] : 1;
            $w2 = isset($schoolInfo->grade_config['sem2_weight']) ? (int) $schoolInfo->grade_config['sem2_weight'] : 2;
            $wTotal = ($w1 + $w2) > 0 ? ($w1 + $w2) : 1;

            self::$weights = [
                'w1' => $w1,
                'w2' => $w2,
                'total' => $wTotal
            ];
        }

        return self::$weights;
    }

    /**
     * Calculate the final report grade based on the configured weights.
     *
     * @param float $sem1Score
     * @param float $sem2Score
     * @return float
     */
    public static function calculateFinalGrade($sem1Score, $sem2Score)
    {
        $weights = self::getWeights();
        return ($sem1Score * $weights['w1'] + $sem2Score * $weights['w2']) / $weights['total'];
    }

    /**
     * Sort GradeWeights Collection in a standard order (UH1, UTS, UH2, UAS/UKK).
     */
    public static function sortGradeWeights($gradeWeights)
    {
        $orderMap = [
            'uh1' => 1, 'uh 1' => 1,
            'uts' => 2, 'pts' => 2,
            'uh2' => 3, 'uh 2' => 3,
            'uas' => 4, 'ukk' => 4, 'pas' => 4, 'pat' => 4
        ];

        return collect($gradeWeights)
            ->filter(function ($gw) {
                $nameUpper = strtoupper(is_string($gw) ? $gw : $gw->name);
                return !str_contains($nameUpper, 'VALIDASI') && !str_contains($nameUpper, 'VALIDATION');
            })
            ->sortBy(function ($gw) use ($orderMap) {
                $nameLower = strtolower(is_string($gw) ? $gw : $gw->name);
                foreach ($orderMap as $key => $val) {
                    if (str_contains($nameLower, $key)) {
                        return $val;
                    }
                }
                return 99; // Others at the end
            })->values();
    }
}
