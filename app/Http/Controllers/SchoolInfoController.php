<?php

namespace App\Http\Controllers;

use App\Models\SchoolInfo;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SchoolInfoController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/SchoolInfo/Index', [
            'schoolInfo' => SchoolInfo::firstOrNew(),
            'appLogo' => Setting::where('key', 'app_logo')->value('value'),
            'loginBackground' => Setting::where('key', 'login_background')->value('value'),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'report_date' => 'nullable|date',
            'report_place_ar' => 'nullable|string',
            'stamp_image' => 'nullable|image|max:2048',
            'headmaster_signature' => 'nullable|image|max:2048',
            'app_logo' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'login_background' => 'nullable|image|max:5120',
            'kop_image' => 'nullable|image|max:2048',
            'use_system_header' => 'nullable|boolean',
            'yayasan_name' => 'nullable|string|max:255',
            'institution_name' => 'nullable|string|max:255',
            'institution_location' => 'nullable|string|max:255',
            'sem1_weight' => 'nullable|integer|min:0',
            'sem2_weight' => 'nullable|integer|min:0',
        ]);

        $schoolInfo = SchoolInfo::firstOrNew();

        // Handle File Uploads
        if ($request->hasFile('kop_image')) {
            if ($schoolInfo->kop_image) Storage::disk('public')->delete($schoolInfo->kop_image);
            $schoolInfo->kop_image = $request->file('kop_image')->store('school_assets', 'public');
        }

        if ($request->hasFile('stamp_image')) {
            if ($schoolInfo->stamp_image) Storage::disk('public')->delete($schoolInfo->stamp_image);
            $schoolInfo->stamp_image = $request->file('stamp_image')->store('school_assets', 'public');
        }

        if ($request->hasFile('headmaster_signature')) {
            if ($schoolInfo->headmaster_signature) Storage::disk('public')->delete($schoolInfo->headmaster_signature);
            $schoolInfo->headmaster_signature = $request->file('headmaster_signature')->store('school_assets', 'public');
        }

        if ($request->hasFile('app_logo')) {
            $oldLogo = Setting::where('key', 'app_logo')->value('value');
            if ($oldLogo) Storage::disk('public')->delete($oldLogo);
            $newLogoPath = $request->file('app_logo')->store('school_assets', 'public');
            Setting::updateOrCreate(['key' => 'app_logo'], ['value' => $newLogoPath]);
        }

        if ($request->hasFile('login_background')) {
            $oldBg = Setting::where('key', 'login_background')->value('value');
            if ($oldBg) Storage::disk('public')->delete($oldBg);
            $newBgPath = $request->file('login_background')->store('school_assets', 'public');
            Setting::updateOrCreate(['key' => 'login_background'], ['value' => $newBgPath]);
        }

        // Fill other data
        $schoolInfo->fill($request->only([
            'name',
            'address',
            'city',
            'report_date',
            'report_place_ar'
        ]));

        $headerConfig = $schoolInfo->header_config ?? [];
        $headerConfig['use_system_header'] = filter_var($request->use_system_header, FILTER_VALIDATE_BOOLEAN);
        $headerConfig['yayasan_name'] = $request->yayasan_name;
        $headerConfig['institution_name'] = $request->institution_name;
        $headerConfig['institution_location'] = $request->institution_location;
        $schoolInfo->header_config = $headerConfig;

        $gradeConfig = $schoolInfo->grade_config ?? [];
        $gradeConfig['sem1_weight'] = $request->filled('sem1_weight') ? (int) $request->sem1_weight : 1;
        $gradeConfig['sem2_weight'] = $request->filled('sem2_weight') ? (int) $request->sem2_weight : 2;
        $schoolInfo->grade_config = $gradeConfig;

        $schoolInfo->save();

        return redirect()->back()->with('success', 'Informasi sekolah & tanda tangan kepala sekolah berhasil disimpan.');
    }
}
