<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SystemMaintenanceController extends Controller
{
    public function clearCache()
    {
        // Only allow if user has appropriate role/permission
        // Ideally should be checked via middleware, but double check here or just rely on route middleware
        if (!auth()->user()->hasRole(['Administrator', 'Admin'])) {
            abort(403, 'Unauthorized action.');
        }

        try {
            Artisan::call('optimize:clear');
            return back()->with('success', 'System cache cleared successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to clear cache: ' . $e->getMessage());
        }
    }
}
