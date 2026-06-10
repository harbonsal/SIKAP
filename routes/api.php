<?php

use App\Http\Controllers\Api\ApiGradeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Aplikasi Ortu
|--------------------------------------------------------------------------
| Semua route di sini dilindungi oleh middleware 'api.key' (CheckApiKey).
| Client harus menyertakan header: X-Api-Key: {ORTU_API_KEY}
|
| Base URL: https://sikap.sinawang.my.id/api/v1/...
*/

Route::middleware('api.key')->prefix('v1')->group(function () {

    // Simple ping test for API Key
    Route::get('/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'PONG! API Key valid.',
            'timestamp' => now()->toDateTimeString(),
        ]);
    })->name('api.ping');

    // Info dasar santri
    Route::get('/student/{nomor_induk}/info', [ApiGradeController::class, 'studentInfo'])
        ->name('api.student.info');

    // Nilai akademik santri (per mapel, per komponen)
    // Versi 1: Query Params (Existing)
    Route::get('/student/{nomor_induk}/grades', [ApiGradeController::class, 'academicGrades'])
        ->name('api.student.grades');

    // Versi 2: Query Params (Requested by External Dev)
    // Format: /api/v1/student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026
    // semester: nama semester (Ganjil/Genap)
    // tahunAjaran: format tahun ajaran (2025/2026)
    Route::get('/student/{nomor_induk}/{semester}/grades', [ApiGradeController::class, 'academicGradesByQuery'])
        ->name('api.student.grades.query');

    // Riwayat semester santri
    Route::get('/student/{nomor_induk}/semesters', [ApiGradeController::class, 'studentSemesters'])
        ->name('api.student.semesters');

    // Nilai karakter/akhlak santri (khusus dari menu pengasuhan)
    Route::get('/student/{nomor_induk}/character', [ApiGradeController::class, 'characterGrades'])
        ->name('api.student.character');

    // Versi Query Parameter untuk External Developer
    // Format: /api/v1/student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026
    // semester: nama semester (Ganjil/Genap)
    // tahunAjaran: format tahun ajaran (2025/2026)
    Route::get('/student/{nomor_induk}/{semester}/character', [ApiGradeController::class, 'characterGradesByQuery'])
        ->name('api.student.character.query');

    // Akhlak per bulan (sesuai request UI external)
    Route::get('/student/{nomor_induk}/{semester}/character/monthly', [ApiGradeController::class, 'characterMonthlyGradesByQuery'])
        ->name('api.student.character.monthly');

    // Tahfidz (sesuai request UI external)
    Route::get('/student/{nomor_induk}/{semester}/tahfidz', [ApiGradeController::class, 'tahfidzGradesByQuery'])
        ->name('api.student.tahfidz.query');
});
