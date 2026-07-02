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
}
