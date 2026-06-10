<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\StudentPermission;
use App\Models\PermissionGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class RfidController extends Controller
{
    public function index()
    {
        return Inertia::render('Care/Rfid/Scan');
    }

    public function tap(Request $request)
    {
        $request->validate(['rfid' => 'required|string']);

        $user = User::where('rfid', $request->rfid)->with('student')->first();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Kartu tidak dikenali.'], 404);
        }

        if (!$user->student) {
            return response()->json(['status' => 'error', 'message' => 'Kartu milik ' . $user->name . ' (Bukan Santri).'], 400);
        }

        $now = Carbon::now();

        // Cari Izin Aktif untuk santri ini
        // Izin dianggap aktif jika:
        // 1. Group Permission Start Time <= Now <= End Time + toleransi? Or just start <= now.
        // 2. Status belum selesai (Returned).
        // Mari kita cari izin yang relevan.

        $permission = StudentPermission::where('student_id', $user->student->id)
            ->where('status', '!=', 'Returned')
            ->whereHas('permissionGroup', function ($q) use ($now) {
                // Izin hanya bisa dipakai jika sudah waktunya mulai
                $q->where('start_time', '<=', $now);
                // Dan (opsional) belum lewat jauh dari end_time?
                // Untuk saat ini asumsi santri bisa kembali kapan saja (terlambat), tapi tidak bisa start kalau sudah lewat 24 jam?
                // $q->where('end_time', '>=', $now->subHours(24)); 
            })
            ->with('permissionGroup')
            ->first();

        if (!$permission) {
            return response()->json(['status' => 'error', 'message' => 'Tidak ada jadwal izin aktif untuk ' . $user->name], 400);
        }

        $group = $permission->permissionGroup;
        $message = '';
        $type = '';

        if ($permission->status === 'Pending') {
            // TAP KELUAR
            $permission->update([
                'status' => 'Out',
                'exit_at' => $now
            ]);
            $type = 'OUT';
            $message = "Hati-hati di jalan, {$user->name}. Kembali sebelum " . $group->end_time->format('H:i');
        } elseif ($permission->status === 'Out') {
            // TAP MASUK
            $isLate = $now->greaterThan($group->end_time);
            $note = $isLate ? 'Terlambat ' . $group->end_time->diffForHumans($now, true) : null;

            $permission->update([
                'status' => 'Returned',
                'return_at' => $now,
                'is_late' => $isLate,
                'keterangan' => $note
            ]);
            $type = 'IN';
            $message = $isLate
                ? "Anda Terlambat! Seharusnya kembali {$group->end_time->format('H:i')}."
                : "Ahlan wa Sahlan, {$user->name}. Tepat waktu.";
        }

        return response()->json([
            'status' => 'success',
            'type' => $type,
            'student' => $user->name,
            'group' => $group->name,
            'message' => $message,
            'time' => $now->format('H:i:s'),
            'is_late' => $permission->is_late
        ]);
    }
}
