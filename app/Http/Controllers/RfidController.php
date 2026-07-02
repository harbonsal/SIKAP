<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\StudentPermission;
use App\Models\PermissionGroup;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class RfidController extends Controller
{
    public function index()
    {
        $autoConfirm = Setting::where('key', 'rfid_auto_confirm')->value('value') !== 'false';
        $autoConfirmSeconds = (int) (Setting::where('key', 'rfid_auto_confirm_seconds')->value('value') ?: 3);

        return Inertia::render('Care/Rfid/Scan', [
            'autoConfirm' => $autoConfirm,
            'autoConfirmSeconds' => $autoConfirmSeconds
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'rfid' => 'required|string',
            'scan_mode' => 'nullable|string|in:OUT,IN'
        ]);


        $user = User::where('rfid', $request->rfid)
            ->orWhere('nomor_induk', $request->rfid)
            ->with(['student'])
            ->first();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Kartu atau Nomor Induk tidak dikenali.'], 404);
        }

        if (!$user->student) {
            return response()->json(['status' => 'error', 'message' => 'Data milik ' . $user->name . ' (Bukan Santri).'], 400);
        }

        $now = Carbon::now();

        $permission = StudentPermission::where('student_id', $user->student->id)
            ->whereHas('permissionGroup', function ($q) use ($now) {
                $q->where('start_time', '<=', $now);
            })
            ->with('permissionGroup')
            ->orderBy('id', 'desc')
            ->first();

        if (!$permission) {
            return response()->json(['status' => 'error', 'message' => 'Tidak ada jadwal izin aktif untuk ' . $user->name], 400);
        }

        $scan_mode = $request->input('scan_mode', 'OUT');
        $requires_confirmation = false;
        $confirmation_message = '';

        if ($scan_mode === 'OUT' && $permission->status === 'Out') {
            $requires_confirmation = true;
            $time = $permission->exit_at ? Carbon::parse($permission->exit_at)->format('H:i') : '';
            $confirmation_message = "Santri sudah tercatat KELUAR pada $time. Apakah Anda ingin memperbarui waktu keluar dengan jam saat ini?";
        } elseif ($scan_mode === 'IN' && $permission->status === 'Returned') {
            // Only allow duplicate IN if the permission is relatively recent (e.g., today)
            $requires_confirmation = true;
            $time = $permission->return_at ? Carbon::parse($permission->return_at)->format('H:i') : '';
            $confirmation_message = "Santri sudah tercatat KEMBALI pada $time. Apakah Anda ingin memperbarui waktu kembali dengan jam saat ini?";
        } elseif ($scan_mode === 'IN' && $permission->status === 'Pending') {
            return response()->json(['status' => 'error', 'message' => 'Santri ini belum tercatat KELUAR.'], 400);
        } elseif ($scan_mode === 'OUT' && $permission->status === 'Returned') {
            return response()->json(['status' => 'error', 'message' => 'Izin santri ini sudah selesai (Sudah Kembali).'], 400);
        }


        $studentData = [
            'name' => $user->name,
            'nomor_induk' => $user->nomor_induk,
            'kelas' => $user->student->kelas ? $user->student->kelas->name : '-',
            'kamar' => $user->student->kamar ? $user->student->kamar->name : '-',
            'alamat' => $user->student->alamat ?? '-',
            'foto' => $user->student->photo_path ? asset('storage/' . $user->student->photo_path) : null,
            'address' => $user->student->address ?? '-'
        ];

        return response()->json([
            'status' => 'success',
            'requires_confirmation' => $requires_confirmation,
            'confirmation_message' => $confirmation_message,
            'student' => $studentData,
            'permission' => [
                'id' => $permission->id,
                'status' => $permission->status,
                'group' => $permission->permissionGroup->name,
                'end_time' => $permission->permissionGroup->end_time->format('H:i')
            ]
        ]);
    }

    public function tap(Request $request)
    {
        $request->validate([
            'rfid' => 'required|string',
            'scan_mode' => 'nullable|string|in:OUT,IN',
            'force_update' => 'nullable|boolean'
        ]);

        $user = User::where('rfid', $request->rfid)
            ->orWhere('nomor_induk', $request->rfid)
            ->with('student')
            ->first();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Kartu atau Nomor Induk tidak dikenali.'], 404);
        }

        if (!$user->student) {
            return response()->json(['status' => 'error', 'message' => 'Data milik ' . $user->name . ' (Bukan Santri).'], 400);
        }

        $now = Carbon::now();

        $permission = StudentPermission::where('student_id', $user->student->id)
            ->whereHas('permissionGroup', function ($q) use ($now) {
                $q->where('start_time', '<=', $now);
            })
            ->with('permissionGroup')
            ->orderBy('id', 'desc')
            ->first();

        if (!$permission) {
            return response()->json(['status' => 'error', 'message' => 'Tidak ada jadwal izin aktif untuk ' . $user->name], 400);
        }

        $group = $permission->permissionGroup;
        $message = '';
        $type = '';
        $scan_mode = $request->input('scan_mode', 'OUT');
        $force_update = $request->boolean('force_update');

        if ($scan_mode === 'OUT') {
            if ($permission->status === 'Returned') {
                return response()->json(['status' => 'error', 'message' => 'Izin santri ini sudah selesai.'], 400);
            }
            if ($permission->status === 'Out' && !$force_update) {
                return response()->json(['status' => 'error', 'message' => 'Santri sudah berstatus Keluar.'], 400);
            }
            
            // TAP KELUAR (New or Update)
            $permission->update([
                'status' => 'Out',
                'exit_at' => $now
            ]);
            $type = 'OUT';
            $message = $force_update 
                ? "Waktu keluar diperbarui menjadi " . $now->format('H:i') 
                : "Hati-hati di jalan, {$user->name}. Kembali sebelum " . $group->end_time->format('H:i');
        } elseif ($scan_mode === 'IN') {
            if ($permission->status === 'Pending') {
                return response()->json(['status' => 'error', 'message' => 'Santri ini belum tercatat keluar.'], 400);
            }
            if ($permission->status === 'Returned' && !$force_update) {
                return response()->json(['status' => 'error', 'message' => 'Santri sudah berstatus Kembali.'], 400);
            }

            // TAP MASUK (New or Update)
            $isLate = $now->greaterThan($group->end_time);
            $note = $isLate ? 'Terlambat ' . $group->end_time->diffForHumans($now, true) : null;

            $permission->update([
                'status' => 'Returned',
                'return_at' => $now,
                'is_late' => $isLate,
                'keterangan' => $note
            ]);
            $type = 'IN';
            
            if ($force_update) {
                $message = "Waktu kembali diperbarui menjadi " . $now->format('H:i') . ($isLate ? " (Terlambat)" : "");
            } else {
                $message = $isLate
                    ? "Anda Terlambat! Seharusnya kembali {$group->end_time->format('H:i')}."
                    : "Ahlan wa Sahlan, {$user->name}. Tepat waktu.";
            }
        }

        return response()->json([
            'status' => 'success',
            'type' => $type,
            'student' => $user->name,
            'group' => $group->name,
            'message' => $message,
            'time' => $now->format('H:i:s'),
            'is_late' => $permission->is_late,
            'permission_id' => $permission->id
        ]);
    }

    public function updateNote(Request $request)
    {
        $request->validate([
            'permission_id' => 'required|exists:student_permissions,id',
            'uang_saku' => 'nullable|integer',
            'barang_titipan' => 'nullable|string'
        ]);

        $permission = StudentPermission::findOrFail($request->permission_id);
        $permission->update([
            'uang_saku' => $request->uang_saku,
            'barang_titipan' => $request->barang_titipan,
        ]);

        return response()->json(['status' => 'success']);
    }

    public function saveSettings(Request $request)
    {
        $request->validate([
            'auto_confirm' => 'required|boolean',
            'seconds' => 'required|integer|min:1|max:60'
        ]);

        Setting::updateOrCreate(
            ['key' => 'rfid_auto_confirm'],
            ['value' => $request->auto_confirm ? 'true' : 'false']
        );

        Setting::updateOrCreate(
            ['key' => 'rfid_auto_confirm_seconds'],
            ['value' => (string) $request->seconds]
        );

        return redirect()->back()->with('success', 'Pengaturan scanner berhasil disimpan.');
    }
}
