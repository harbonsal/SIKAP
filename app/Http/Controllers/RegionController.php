<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\Regency;
use App\Models\District;
use App\Models\Village;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RegionController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Regions/Index', [
            'counts' => [
                'provinces' => Province::count(),
                'regencies' => Regency::count(),
                'districts' => District::count(),
                'villages' => Village::count(),
            ]
        ]);
    }

    public function sync()
    {
        set_time_limit(3600); // Increase time limit for large data sync

        try {
            DB::beginTransaction();

            // 1. Sync Provinces
            $provinces = Http::timeout(120)->retry(3, 100)->withoutVerifying()->get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')->json();
            foreach ($provinces as $prov) {
                Province::updateOrCreate(['id' => $prov['id']], ['name' => $prov['name']]);
            }

            // 2. Sync Regencies (Loop through provinces)
            foreach ($provinces as $prov) {
                $regencies = Http::timeout(120)->retry(3, 100)->withoutVerifying()->get("https://www.emsifa.com/api-wilayah-indonesia/api/regencies/{$prov['id']}.json")->json();
                foreach ($regencies as $reg) {
                    Regency::updateOrCreate(['id' => $reg['id']], [
                        'province_id' => $prov['id'],
                        'name' => $reg['name']
                    ]);
                }
            }

            // 3. Sync Districts
            $allRegencies = Regency::all();
            foreach ($allRegencies as $reg) {
                $districts = Http::timeout(120)->retry(3, 100)->withoutVerifying()->get("https://www.emsifa.com/api-wilayah-indonesia/api/districts/{$reg->id}.json")->json();
                foreach ($districts as $dist) {
                    District::updateOrCreate(['id' => $dist['id']], [
                        'regency_id' => $reg->id,
                        'name' => $dist['name']
                    ]);
                }
            }

            // 4. Sync Villages
            $allDistricts = District::all();
            foreach ($allDistricts as $dist) {
                $villages = Http::timeout(120)->retry(3, 100)->withoutVerifying()->get("https://www.emsifa.com/api-wilayah-indonesia/api/villages/{$dist->id}.json")->json();
                foreach ($villages as $vill) {
                    Village::updateOrCreate(['id' => $vill['id']], [
                        'district_id' => $dist->id,
                        'name' => $vill['name']
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', 'Data wilayah berhasil disinkronisasi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal sinkronisasi: ' . $e->getMessage());
        }
    }

    // API Endpoints for Frontend
    public function getProvinces()
    {
        return response()->json(Province::orderBy('name')->get());
    }

    public function getRegencies($provinceId)
    {
        return response()->json(Regency::where('province_id', $provinceId)->orderBy('name')->get());
    }

    public function getDistricts($regencyId)
    {
        return response()->json(District::where('regency_id', $regencyId)->orderBy('name')->get());
    }

    public function getVillages($districtId)
    {
        return response()->json(Village::where('district_id', $districtId)->orderBy('name')->get());
    }
}
