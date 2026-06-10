<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Student;
use App\Models\ActiveClass;
use App\Models\ClassMember;
use App\Models\UserLevel;
use Illuminate\Support\Facades\Hash;

class DummyStudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get or Create 'Santri' Role
        $role = UserLevel::firstOrCreate(
            ['name' => 'Santri'],
            ['name' => 'Santri'] // Fallback if not exists
        );

        // 2. Get 3 Active Classes
        $activeClasses = ActiveClass::with(['kelas', 'kelasParalel'])->take(3)->get();

        if ($activeClasses->count() < 3) {
            $this->command->warn("Hanya ditemukan {$activeClasses->count()} kelas aktif. Membuat data untuk kelas yang ada saja.");
        }

        $studentCount = 1;

        foreach ($activeClasses as $activeClass) {
            $this->command->info("Creating students for class: {$activeClass->kelas->name} {$activeClass->kelasParalel->name}");

            // Create 4 students per class
            for ($i = 1; $i <= 4; $i++) {
                $nomorInduk = '2025' . str_pad($studentCount, 4, '0', STR_PAD_LEFT);
                $name = "Santri " . $activeClass->kelas->name . " " . $activeClass->kelasParalel->name . " " . $i;
                $email = "santri{$studentCount}@sikap.test";

                // Create or Get User
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $name,
                        'password' => Hash::make('password'),
                        'nomor_induk' => $nomorInduk,
                        'user_level_id' => $role->id,
                    ]
                );

                // Create or Get Student Profile
                $student = Student::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'nisn' => '00' . $nomorInduk,
                        'gender' => ($i % 2 == 0) ? 'P' : 'L', // Alternate gender
                        'birth_place' => 'Jakarta',
                        'birth_date' => '2010-01-01',
                        'address' => 'Jl. Contoh No. ' . $studentCount,
                        'parent_name' => 'Orang Tua ' . $studentCount,
                    ]
                );

                // Assign to Class
                ClassMember::firstOrCreate([
                    'active_class_id' => $activeClass->id,
                    'student_id' => $student->id,
                ]);

                $studentCount++;
            }
        }
    }
}
