<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\UserLevel;

class AddAssessmentPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Permission
        $permission = Permission::firstOrCreate(['name' => 'view_all_assessments']);

        // 2. Assign to Administrator
        $adminRole = UserLevel::where('name', 'Administrator')->first();
        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching([$permission->id]);
        }
    }
}
