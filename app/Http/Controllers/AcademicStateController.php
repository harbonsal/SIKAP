<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class AcademicStateController extends Controller
{
    /**
     * Switch the current view state (academic year and semester).
     */
    public function switch(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        $user = $request->user();
        $canSwitchAnyYear = $user
            && (
                $user->can('edit_active_classes')
                || $user->can('create_active_classes')
                || $user->can('edit_active_subjects')
                || $user->can('create_active_subjects')
                || $user->can('edit_access_control')
                || $user->userLevel?->name === 'Administrator'
            );

        $systemYear = \App\Services\AcademicStateService::activeAcademicYear();
        $systemSemester = \App\Services\AcademicStateService::activeSemester();

        $targetYear = \App\Models\AcademicYear::findOrFail($request->academic_year_id);
        $isAdmin = $user && ($user->hasRole('Administrator') || $canSwitchAnyYear);

        if ($targetYear->status === 'draft' && !$isAdmin) {
            abort(403, 'Anda tidak memiliki izin untuk membuka draft tahun ajaran baru.');
        }

        // Allow if it is active (system year), archived, or user is admin
        $isAllowed = $targetYear->is_active || $targetYear->status === 'archived' || $isAdmin;

        if (!$isAllowed) {
            abort(403, 'Anda tidak memiliki izin untuk membuka konteks tahun ajaran ini.');
        }

        Session::put('view_academic_year_id', $request->academic_year_id);
        Session::put('view_semester_id', $request->semester_id);

        return back()->with('success', 'Tampilan tahun ajaran berhasil diubah.');
    }
}
