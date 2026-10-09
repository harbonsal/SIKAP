<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\SchoolInfo;
use Illuminate\Support\Facades\Storage;

class ReportSettingController extends Controller
{
    public function index()
    {
        $schoolInfo = SchoolInfo::first();
        if (!$schoolInfo) {
            $schoolInfo = new SchoolInfo();
        }
        return Inertia::render('Settings/ReportSettings/Index', [
            'schoolInfo' => collect($schoolInfo)->merge([
                'kop_image' => $schoolInfo->kop_image,
                'stamp_image' => $schoolInfo->stamp_image,
                'headmaster_signature' => $schoolInfo->headmaster_signature,
            ])
        ]);
    }

    public function update(Request $request)
    {
        $schoolInfo = SchoolInfo::first();
        if (!$schoolInfo) {
            $schoolInfo = new SchoolInfo();
        }

        $request->validate([
            'report_date' => 'nullable|date',
            'report_place_ar' => 'nullable|string|max:255',
            'use_system_header' => 'nullable|boolean',
            'yayasan_name' => 'nullable|string|max:255',
            'institution_name' => 'nullable|string|max:255',
            'institution_location' => 'nullable|string|max:255',
            'kop_image' => 'nullable|image|max:2048',
            'stamp_image' => 'nullable|image|max:2048',
            'headmaster_signature' => 'nullable|image|max:2048',
            'use_watermark' => 'nullable|boolean',
            'watermark_image' => 'nullable|image|max:2048',
            'watermark_opacity' => 'nullable|integer|min:0|max:100',
            'watermark_scale' => 'nullable|integer|min:10|max:300',
            'watermark_brightness' => 'nullable|integer|min:0|max:300',
            'headmaster_ar' => 'nullable|string|max:255',
            'wali_kelas_ar' => 'nullable|string|max:255',
            'parents_ar' => 'nullable|string|max:255',
        ]);

        $schoolInfo->report_date = $request->report_date;
        $schoolInfo->report_place_ar = $request->report_place_ar;

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

        $headerConfig = $schoolInfo->header_config ?? [];
        $headerConfig['use_system_header'] = filter_var($request->use_system_header, FILTER_VALIDATE_BOOLEAN);
        $headerConfig['yayasan_name'] = $request->yayasan_name;
        $headerConfig['institution_name'] = $request->institution_name;
        $headerConfig['institution_location'] = $request->institution_location;
        $headerConfig['use_watermark'] = filter_var($request->use_watermark, FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('watermark_image')) {
            if (isset($headerConfig['watermark_image'])) Storage::disk('public')->delete($headerConfig['watermark_image']);
            $headerConfig['watermark_image'] = $request->file('watermark_image')->store('school_assets', 'public');
        }

        $headerConfig['watermark_opacity'] = $request->input('watermark_opacity', 20);
        $headerConfig['watermark_scale'] = $request->input('watermark_scale', 100);
        $headerConfig['watermark_brightness'] = $request->input('watermark_brightness', 100);

        $headerConfig['headmaster_ar'] = $request->input('headmaster_ar') ?? 'مدير المدرسة';
        $headerConfig['wali_kelas_ar'] = $request->input('wali_kelas_ar') ?? 'مشرف الصف';
        $headerConfig['parents_ar'] = $request->input('parents_ar') ?? 'ولي الأمر';

        $schoolInfo->header_config = $headerConfig;
        $schoolInfo->save();

        return redirect()->back()->with('success', 'Pengaturan rapor berhasil disimpan');
    }
}
