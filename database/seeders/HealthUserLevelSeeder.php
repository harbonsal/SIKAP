<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\HealthComplaint;

class HealthUserLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Add 'Bagian Kesehatan' User Level if not exists
        UserLevel::firstOrCreate(
            ['name' => 'Bagian Kesehatan'],
            // ['description' => 'Petugas yang menangani kesehatan santri'] // Removed as column likely doesn't exist
        );

        // 2. Seed default Health Complaints
        $complaints = [
            'Demam',
            'Batuk',
            'Pilek',
            'Pusing',
            'Sakit Perut',
            'Diare',
            'Gatal-gatal',
            'Sakit Gigi',
            'Luka Luar',
            'Pegal-pegal',
            'Radang Tenggorokan',
            'Muntah',
            'Sesak Nafas',
            'Cacar Air',
            'Lain-lain'
        ];

        foreach ($complaints as $complaint) {
            HealthComplaint::firstOrCreate(
                ['name' => $complaint]
            );
        }
        // 3. Assign Permissions
        $permissions = [
            'view_students',
            'view_health_complaints',
        ];

        $level = UserLevel::where('name', 'Bagian Kesehatan')->first();
        if ($level) {
            $permissionIds = [];
            foreach ($permissions as $permName) {
                $p = \App\Models\Permission::firstOrCreate(['name' => $permName]);
                $permissionIds[] = $p->id;
            }
            $level->permissions()->syncWithoutDetaching($permissionIds);
        }
    }
}
