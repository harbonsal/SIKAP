<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $studentDetails = null;

        if ($user->student) {
            $student = $user->student;

            // Get Active Class
            $classMember = $student->classMembers()->whereHas('activeClass.academicYear', function ($q) {
                $q->where('is_active', true);
            })->with(['activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.teacher'])->first();

            // Get Active Kamar
            $kamarMember = $student->kamarMembers()->whereHas('activeKamar.academicYear', function ($q) {
                $q->where('is_active', true);
            })->with(['activeKamar.kamar', 'activeKamar.musrif'])->first();

            $studentDetails = [
                'active_class' => $classMember ? trim(($classMember->activeClass?->kelas?->name ?? '') . ' ' . ($classMember->activeClass?->kelasParalel?->name ?? '')) : '-',
                'wali_kelas' => $classMember?->activeClass?->teacher?->name ?? '-',
                'kamar' => $kamarMember?->activeKamar?->kamar?->name ?? '-',
                'musrif' => $kamarMember?->activeKamar?->musrif?->name ?? '-',
            ];
        }

        // --- Calculate All Roles (Primary + Additional + Inferred) ---
        $user->loadMissing(['userLevel', 'additionalLevels']);

        $roles = collect([$user->userLevel->name ?? null]);

        if ($user->additionalLevels) {
            foreach ($user->additionalLevels as $level) {
                $roles->push($level->name);
            }
        }

        // Check if user is currently a Wali Kelas (assigned to active class)
        $isWalas = \App\Models\ActiveClass::where('teacher_id', $user->id)
            ->whereHas('academicYear', fn($q) => $q->where('is_active', true))
            ->exists();
        if ($isWalas) {
            $roles->push('Wali Kelas');
        }

        // Check if user is currently a Musrif (assigned to active kamar)
        $isMusrif = \App\Models\ActiveKamar::where('musrif_id', $user->id)
            ->whereHas('academicYear', fn($q) => $q->where('is_active', true))
            ->exists();
        if ($isMusrif) {
            $roles->push('Musrif Asrama');
        }

        $displayRoles = $roles->filter()->unique()->values()->all();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'studentDetails' => $studentDetails,
            'displayRoles' => $displayRoles,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        if ($request->hasFile('signature')) {
            // Delete old signature if exists in database path
            if ($request->user()->signature) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($request->user()->signature);
            }
            
            // 1. Standard Laravel Storage (Database way)
            $path = $request->file('signature')->store('signatures', 'public');
            $request->user()->signature = $path;

            // 2. Legacy/Fallback Storage (Manual way for Print fallback compatibility)
            // Save to public/images/signature/{nip}.png
            if ($request->user()->nomor_induk) {
                $file = $request->file('signature');
                $destinationPath = public_path('images/signature');
                
                // Ensure directory exists
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }
                
                $fileName = $request->user()->nomor_induk . '.png'; // Force PNG for fallback consistency
                $file->move($destinationPath, $fileName);
            }
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Tanda tangan berhasil diperbarui!');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
