<?php
/**
 * SIKAP — Academic Preparation Debugger Runner
 * File ini ada di: public/runner_debug_copy.php
 * Akses: https://sikap.sinawang.my.id/runner_debug_copy.php
 * Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

// Dari public/, Laravel root ada di ../
$candidates = [
    __DIR__,                    // public/ sendiri (jika domain → root laravel)
    dirname(__DIR__),           // satu level up = Laravel root (jika domain → public/)
    dirname(dirname(__DIR__)),  // dua level up
];

$foundRoot = null;
foreach ($candidates as $path) {
    if (file_exists($path.'/vendor/autoload.php') && file_exists($path.'/bootstrap/app.php')) {
        $foundRoot = $path;
        break;
    }
}

if (!$foundRoot) {
    echo "<h1>❌ Laravel Root Not Found</h1>";
    exit;
}

define('LARAVEL_START', microtime(true));
require $foundRoot.'/vendor/autoload.php';
$app = require_once $foundRoot.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Laravel is booted! Let's run diagnostics
use App\Models\AcademicYear;
use App\Services\AcademicPreparationService;
use Illuminate\Support\Facades\DB;

echo "<html><head><title>Academic Copy Debugger</title></head><body style='font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px;'>";
echo "<h1 style='color: #58a6ff;'>🔍 SIKAP Academic Preparation Debugger</h1>";

try {
    $activeYear = \App\Services\AcademicStateService::currentAcademicYear()
        ?? AcademicYear::where('is_active', true)->first();

    if (!$activeYear) {
        throw new \Exception("Active academic year not found.");
    }
    
    echo "<div style='background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 15px; margin-bottom: 15px;'>";
    echo "<h3>📅 Target / Planning Year (Sandbox)</h3>";
    echo "ID: <code>{$activeYear->id}</code><br>";
    echo "Name: <code>{$activeYear->name}</code><br>";
    echo "Status: <code>{$activeYear->status}</code><br>";
    echo "is_active (System): <code>" . ($activeYear->is_active ? 'Yes' : 'No') . "</code><br>";
    echo "</div>";

    $sourceYear = AcademicYear::where('id', '!=', $activeYear->id)
        ->orderBy('name', 'desc')
        ->first();

    if (!$sourceYear) {
        throw new \Exception("Source academic year not found in DB.");
    }

    echo "<div style='background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 15px; margin-bottom: 15px;'>";
    echo "<h3>📅 Source Year</h3>";
    echo "ID: <code>{$sourceYear->id}</code><br>";
    echo "Name: <code>{$sourceYear->name}</code><br>";
    echo "</div>";

    $service = new AcademicPreparationService();

    // 1. Test Copy Classes
    echo "<h2 style='color: #79c0ff;'>🧪 Test 1: Copy Active Classes</h2>";
    DB::beginTransaction();
    try {
        $resClasses = $service->copyActiveClasses($sourceYear, $activeYear);
        echo "<p style='color: #3fb950;'>✅ Success! Created: {$resClasses['created']}, Updated: {$resClasses['updated']}</p>";
    } catch (\Throwable $ex) {
        echo "<p style='color: #f85149; font-weight: bold;'>❌ Failed!</p>";
        echo "<pre style='background: #21262d; border: 1px solid #30363d; padding: 15px; border-radius: 8px; overflow: auto; color: #ff7b72;'>" 
             . htmlspecialchars($ex->getMessage()) . "\n" 
             . "File: " . $ex->getFile() . " on line " . $ex->getLine() . "\n" 
             . $ex->getTraceAsString() . "</pre>";
    }
    DB::rollBack();

    // 2. Test Copy Subjects
    echo "<h2 style='color: #79c0ff;'>🧪 Test 2: Copy Active Subjects</h2>";
    DB::beginTransaction();
    try {
        $resSubjects = $service->copyActiveSubjects($sourceYear, $activeYear);
        echo "<p style='color: #3fb950;'>✅ Success! Created: {$resSubjects['created']}, Updated: {$resSubjects['updated']}, Skipped: {$resSubjects['skipped']}</p>";
    } catch (\Throwable $ex) {
        echo "<p style='color: #f85149; font-weight: bold;'>❌ Failed!</p>";
        echo "<pre style='background: #21262d; border: 1px solid #30363d; padding: 15px; border-radius: 8px; overflow: auto; color: #ff7b72;'>" 
             . htmlspecialchars($ex->getMessage()) . "\n" 
             . "File: " . $ex->getFile() . " on line " . $ex->getLine() . "\n" 
             . $ex->getTraceAsString() . "</pre>";
    }
    DB::rollBack();

    // 3. Test Copy Teacher Settings
    echo "<h2 style='color: #79c0ff;'>🧪 Test 3: Copy Teacher Settings</h2>";
    DB::beginTransaction();
    try {
        $resTeachers = $service->copyTeacherSettings($sourceYear, $activeYear);
        echo "<p style='color: #3fb950;'>✅ Success! Quota Created: {$resTeachers['quotaCreated']}, Quota Updated: {$resTeachers['quotaUpdated']}, Off Teachers: {$resTeachers['offTeachers']}, Off Slots: {$resTeachers['offSlots']}</p>";
    } catch (\Throwable $ex) {
        echo "<p style='color: #f85149; font-weight: bold;'>❌ Failed!</p>";
        echo "<pre style='background: #21262d; border: 1px solid #30363d; padding: 15px; border-radius: 8px; overflow: auto; color: #ff7b72;'>" 
             . htmlspecialchars($ex->getMessage()) . "\n" 
             . "File: " . $ex->getFile() . " on line " . $ex->getLine() . "\n" 
             . $ex->getTraceAsString() . "</pre>";
    }
    DB::rollBack();

} catch (\Throwable $e) {
    echo "<h2 style='color: #f85149;'>❌ Fatal Execution Error</h2>";
    echo "<pre style='background: #21262d; border: 1px solid #30363d; padding: 15px; border-radius: 8px; color: #ff7b72;'>" 
         . htmlspecialchars($e->getMessage()) . "\n" 
         . "File: " . $e->getFile() . " on line " . $e->getLine() . "\n" 
         . $e->getTraceAsString() . "</pre>";
}

echo "</body></html>";
