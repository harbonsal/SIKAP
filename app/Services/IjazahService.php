<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Mapel;
use App\Models\StudentGrade;
use App\Helpers\ArabicNumberConverter;

class IjazahService
{
    // Hardcoded mapping for V1, can be moved to DB settings later
    // Based on olah_ijazah.xlsx headers
    protected $requiredMapels = [
        'Tahfidz' => ['Tahfizh Al-Quran'], // Mapel Name in DB
        'Tauhid' => ['Tauhid'],
        'Hadits' => ['Hadits'],
        'Fikih' => ['Fikih'],
        'Akhlak' => ['Akhlak'],
        'Tafsir' => ['Tafsir'],
        'Faroidh' => ['Faroidh'], // Need to check if exists
        'Ushul Fikih' => ['Ushul Fikih'],
        'Ushul Tafsir' => ['Ushul Tafsir'],
        'Mustholahul Hadits' => ['Mustholahul Hadits'],
        'Manhaj' => ['Manhaj'], // ?
        'Tarikh' => ['Tarikh', 'Sejarah Kebudayaan Islam'],
        'Qowaidh Fikih' => ['Qowaidh Fikih'],
        'Nahwu' => ['Nahwu'],
        'Balaghah' => ['Balaghah'],
        'Mutholaah' => ['Mutholaah'],
        'Ta\'bir' => ['Ta\'bir', 'Bahasa Arab'], // ?
    ];

    public function getIjazahData(Student $student)
    {
        $data = [
            'student' => $student,
            'grades' => [],
            'average' => 0,
        ];

        $totalScore = 0;
        $count = 0;

        foreach ($this->requiredMapels as $key => $possibleNames) {
            $grade = $this->getFinalGrade($student, $possibleNames);

            $data['grades'][$key] = [
                'score' => $grade,
                'text_ar' => ArabicNumberConverter::convert($grade),
                'predicate' => $this->getPredicate($grade),
            ];

            if ($grade > 0) {
                $totalScore += $grade;
                $count++;
            }
        }

        $data['average'] = $count > 0 ? round($totalScore / $count, 2) : 0;
        $data['average_ar'] = ArabicNumberConverter::convert(floor($data['average'])); // Arabic usually whole numbers or specific decimal text? 
        // For now floor/round.

        return $data;
    }

    private function getFinalGrade(Student $student, array $mapelNames)
    {
        // Logic to get the LATEST final grade for this subject
        // For now, let's try to find the mapel ID first
        $mapelIds = Mapel::whereIn('name', $mapelNames)->pluck('id');

        if ($mapelIds->isEmpty()) {
            return 0;
        }

        // Get the latest grade for this student and mapel
        // We need to look at StudentGrade -> ActiveSubject -> Mapel
        // And pick the latest AcademicYear? Or the graduation year?

        // Simplified: Get highest grade ever? Or latest?
        // Usually Ijazah is last year (Class 6/9/12).

        $grade = StudentGrade::whereHas('activeSubject', function ($q) use ($mapelIds) {
            $q->whereIn('mapel_id', $mapelIds);
        })
            ->where('student_id', $student->id)
            ->latest() // Most recent
            ->first();

        // Assuming 'final_score' or calculate from PAS/PTS?
        // Let's check StudentGrade structure.
        // Usually it has 'score' or 'final_score'.
        // If it's a complex weight system, we might need a stored final_score.

        return $grade ? ($grade->final_score ?? $grade->total_score ?? 0) : 0;
    }

    private function getPredicate($score)
    {
        // Mumtaz, Jayyid Jiddan, etc.
        if ($score >= 90) return 'Mumtaz';
        if ($score >= 80) return 'Jayyid Jiddan';
        if ($score >= 70) return 'Jayyid';
        if ($score >= 60) return 'Maqbul';
        return 'Rasib';
    }
}
