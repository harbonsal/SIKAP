<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\UserLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccessControlController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/AccessControl/Index', [
            'userLevels' => UserLevel::where('name', '!=', 'Administrator')->get(),
        ]);
    }

    public function edit(UserLevel $userLevel)
    {
        $excludedPermissions = [
            'view_user_levels',
            'create_user_levels',
            'edit_user_levels',
            'delete_user_levels',
            'view_access_control',
            'edit_access_control',
        ];

        $permissions = Permission::whereNotIn('name', $excludedPermissions)->get();

        // Group permissions by module
        $groupedPermissions = $permissions->groupBy(function ($item) {
            $parts = explode('_', $item->name, 2);
            $action = $parts[0];
            $module = $parts[1] ?? 'other';

            // Allow specific actions to define the module
            if (in_array($action, ['view', 'create', 'edit', 'delete', 'import', 'export', 'generate', 'use'])) {
                return $module;
            }
            // Logic for 'menu_' permissions
            if ($action === 'menu') {
                return 'Menu Sidebar';
            }
            return 'Other';
        });

        return Inertia::render('Settings/AccessControl/Edit', [
            'userLevel' => $userLevel->load('permissions'),
            'groupedPermissions' => $groupedPermissions,
            'allPermissions' => $permissions,
        ]);
    }

    public function update(Request $request)
    {
        // Keep for backward compatibility if needed, or remove.
        // We will implement bulk update here or in a new method.
        // Let's use a new method for clarity.
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'user_level_id' => 'required|exists:user_levels,id',
            'permission_changes' => 'required|array',
            'permission_changes.*.permission_id' => 'required|exists:permissions,id',
            'permission_changes.*.has_access' => 'required|boolean',
        ]);

        $userLevel = UserLevel::findOrFail($request->user_level_id);
        $permissionsToSync = [];
        $permissionsToDetach = [];

        // 1. Process explicit changes from UI
        foreach ($request->permission_changes as $change) {
            if ($change['has_access']) {
                $userLevel->permissions()->syncWithoutDetaching([$change['permission_id']]);
            } else {
                $userLevel->permissions()->detach($change['permission_id']);
            }
        }

        // 2. SMART AUTO-FIX: Ensure Parent Menus exist if Children exist
        $currentPermissions = $userLevel->permissions()->pluck('name')->toArray();
        $missingParents = [];

        // Definition of Parent -> Child dependency
        $dependencies = [
            'menu_academic' => ['view_assessments', 'create_assessments', 'view_journals', 'view_silabus', 'view_academic_schedules'],
            'menu_tahfidz' => ['view_tahfidz_assessments', 'view_tahfidz_halaqoh', 'view_tahfidz_achievements'],
            'menu_care' => ['view_health_records', 'view_health_complaints', 'view_permissions'],
            'menu_finance' => ['view_payments', 'view_bills'],
            'menu_settings' => ['view_users', 'view_school_info'],
        ];

        foreach ($dependencies as $parent => $children) {
            // Check if ANY child permission exists in current permissions
            $hasChild = false;
            foreach ($children as $child) {
                if (in_array($child, $currentPermissions)) {
                    $hasChild = true;
                    break;
                }
            }

            // If has child but missing parent, Add Parent
            if ($hasChild && !in_array($parent, $currentPermissions)) {
                $missingParents[] = $parent;
            }
        }

        if (!empty($missingParents)) {
            $parentIds = [];
            foreach ($missingParents as $parentName) {
                // Self-Healing: Create permission if it doesn't exist
                $p = Permission::firstOrCreate(['name' => $parentName]);
                $parentIds[] = $p->id;
            }
            $userLevel->permissions()->syncWithoutDetaching($parentIds);
        }

        return redirect()->back()->with('success', 'Hak akses berhasil diperbarui (Menu Induk otomatis disesuaikan).');
    }
}
