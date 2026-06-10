<?php

namespace App\Helpers;

class ArabicNumberConverter
{
    private static $ones = [
        0 => '',
        1 => 'واحد',
        2 => 'اثنان',
        3 => 'ثلاث',
        4 => 'أربع',
        5 => 'خمس',
        6 => 'ست',
        7 => 'سبع',
        8 => 'ثمان',
        9 => 'تسع',
    ];

    private static $tens = [
        0  => '',
        10 => 'عشر',
        20 => 'عشرون',
        30 => 'ثلاثون',
        40 => 'أربعون',
        50 => 'خمسون',
        60 => 'ستون',
        70 => 'سبعون',
        80 => 'ثمانون',
        90 => 'تسعون',
    ];

    /**
     * Convert an integer (0–9999) to Arabic words.
     */
    public static function convert($number)
    {
        $number = (int) $number;

        if ($number == 0) return 'صفر';

        $result = '';

        // Thousands
        if ($number >= 1000) {
            $thousands = (int) floor($number / 1000);
            if ($thousands == 1) {
                $result .= 'ألف';
            } elseif ($thousands == 2) {
                $result .= 'ألفان';
            } elseif ($thousands <= 10) {
                $result .= self::$ones[$thousands] . ' آلاف';
            } else {
                $result .= self::convertBelow1000($thousands) . ' ألف';
            }
            $number %= 1000;
            if ($number > 0) $result .= ' و';
        }

        // Hundreds
        if ($number >= 100) {
            $hundreds = (int) floor($number / 100);
            if ($hundreds == 1) {
                $result .= 'مائة';
            } elseif ($hundreds == 2) {
                $result .= 'مائتان';
            } else {
                $result .= self::$ones[$hundreds] . 'مائة';
            }
            $number %= 100;
            if ($number > 0) $result .= ' و';
        }

        if ($number > 0) {
            $result .= self::convertBelow100($number);
        }

        return $result;
    }

    /**
     * Convert a number below 1000 to Arabic words (helper for thousands).
     */
    private static function convertBelow1000($number)
    {
        $result = '';

        if ($number >= 100) {
            $hundreds = (int) floor($number / 100);
            if ($hundreds == 1) $result .= 'مائة';
            elseif ($hundreds == 2) $result .= 'مائتان';
            else $result .= self::$ones[$hundreds] . 'مائة';

            $number %= 100;
            if ($number > 0) $result .= ' و';
        }

        if ($number > 0) {
            $result .= self::convertBelow100($number);
        }

        return $result;
    }

    /**
     * Convert a number 1–99 to Arabic words.
     */
    private static function convertBelow100($number)
    {
        if ($number <= 0) return '';

        if ($number < 10) {
            if ($number == 1) return 'إحدى';
            if ($number == 2) return 'اثنتان';
            return self::$ones[$number];
        }

        if ($number == 10) return 'عشرة';

        if ($number < 20) {
            $unit = $number % 10;
            if ($unit == 1) $unitText = 'إحدى';
            elseif ($unit == 2) $unitText = 'اثنتا';
            else $unitText = self::$ones[$unit];
            return $unitText . ' عشرة';
        }

        // 20–99
        $unit = $number % 10;
        $ten  = (int) floor($number / 10) * 10;

        if ($unit > 0) {
            if ($unit == 1) $unitText = 'إحدى';
            elseif ($unit == 2) $unitText = 'اثنتان';
            else $unitText = self::$ones[$unit];
            return $unitText . ' و' . self::$tens[$ten];
        }

        return self::$tens[$ten];
    }
}
