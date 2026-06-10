<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Support\Facades\Session;

class AcademicStateService
{
    private static ?AcademicYear $yearCache = null;
    private static ?Semester $semesterCache = null;

    public static function activeAcademicYear(): ?AcademicYear
    {
        return AcademicYear::where('is_active', true)->first();
    }

    public static function activeSemester(): ?Semester
    {
        return Semester::where('is_active', true)->first();
    }

    /**
     * Get the active academic year for the current view.
     * Uses session preference if available, otherwise defaults to the system active year.
     */
    public static function currentAcademicYear(): ?AcademicYear
    {
        if (self::$yearCache) {
            return self::$yearCache;
        }

        $sessionYearId = Session::get('view_academic_year_id');

        if ($sessionYearId) {
            $year = AcademicYear::find($sessionYearId);
            if ($year) {
                self::$yearCache = $year;
                return $year;
            }
        }

        // Fallback to active year
        self::$yearCache = self::activeAcademicYear();
        return self::$yearCache;
    }

    /**
     * Get the active semester for the current view.
     * Uses session preference if available, otherwise defaults to the system active semester.
     */
    public static function currentSemester(): ?Semester
    {
        if (self::$semesterCache) {
            return self::$semesterCache;
        }

        $sessionSemesterId = Session::get('view_semester_id');

        if ($sessionSemesterId) {
            $semester = Semester::find($sessionSemesterId);
            if ($semester) {
                self::$semesterCache = $semester;
                return $semester;
            }
        }

        // Fallback to active semester
        self::$semesterCache = self::activeSemester();
        return self::$semesterCache;
    }

    /**
     * Check if the current view is a historical view (not the active year).
     */
    public static function isHistoricalView(): bool
    {
        $current = self::currentAcademicYear();
        return $current && !$current->is_active;
    }
}
