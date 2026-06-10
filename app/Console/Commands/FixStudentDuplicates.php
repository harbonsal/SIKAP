<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\ClassMember;

class FixStudentDuplicates extends Command
{
    protected $signature = 'fix:student-duplicates';
    protected $description = 'Fix duplicate class memberships for 2025/2026 by keeping only the latest one';

    public function handle()
    {
        $ay = AcademicYear::where('name', '2025/2026')->first();
        if (!$ay) {
            $this->error('Academic Year 2025/2026 not found!');
            return 1;
        }

        $this->info("Scanning duplicates for AY: {$ay->name}...");

        $classMembers = ClassMember::whereHas('activeClass', function ($q) use ($ay) {
            $q->where('academic_year_id', $ay->id);
        })->with('student.user', 'activeClass.kelas')->get();

        $duplicates = $classMembers->groupBy('student_id')->filter(function ($g) {
            return $g->count() > 1;
        });

        if ($duplicates->count() === 0) {
            $this->info("No duplicates found!");
            return 0;
        }

        $this->warn("Found " . $duplicates->count() . " duplicates. Fixing...");
        $deletedCount = 0;

        foreach ($duplicates as $sid => $group) {
            // Sort by updated_at descending (Keep the latest)
            $sorted = $group->sortByDesc('updated_at')->values();

            $keep = $sorted->first();
            $remove = $sorted->slice(1);

            $sName = $keep->student ? $keep->student->name : "ID $sid";
            $this->line("Processing: $sName");
            $this->info(" - KEEP: {$keep->activeClass->kelas->name} (Updated: {$keep->updated_at})");

            foreach ($remove as $item) {
                $this->error(" - DELETE: {$item->activeClass->kelas->name} (Updated: {$item->updated_at})");
                $item->delete();
                $deletedCount++;
            }
        }

        $this->info("\nDone! Deleted $deletedCount duplicate entries.");
        return 0;
    }
}
