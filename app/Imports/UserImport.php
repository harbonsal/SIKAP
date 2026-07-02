<?php

namespace App\Imports;

use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

class UserImport implements ToCollection, WithStartRow
{
    public $successCount = 0;
    public $errors = [];

    public function startRow(): int
    {
        return 2; // Skip header
    }

    public function collection(Collection $rows)
    {
        $index = 1;

        // Cache levels mapping (case-insensitive keys)
        $userLevels = UserLevel::all()->pluck('id', 'name')->mapWithKeys(function ($item, $key) {
            return [strtolower(trim($key)) => $item];
        })->toArray();

        foreach ($rows as $row) {
            $index++;

            $rowArray = $row->toArray();
            if (count(array_filter($rowArray)) === 0) {
                continue; // Skip empty rows
            }

            $rowArray = array_pad($rowArray, 5, null);

            $name = $rowArray[0];
            $nomorInduk = $rowArray[1];
            $email = $rowArray[2];
            $noHp = $rowArray[3];
            $levelName = $rowArray[4];

            if (empty(trim($name ?? '')) || empty(trim($nomorInduk ?? '')) || empty(trim($levelName ?? ''))) {
                $this->errors[] = "Baris " . $index . ": Nama, NIP/ID, dan Level User wajib diisi.";
                continue;
            }

            $searchLevel = strtolower(trim($levelName));
            if (!isset($userLevels[$searchLevel])) {
                $this->errors[] = "Baris " . $index . ": Level User '{$levelName}' tidak ditemukan di sistem.";
                continue;
            }
            $levelId = $userLevels[$searchLevel];

            $existingUser = User::where('nomor_induk', $nomorInduk)->first();
            if ($existingUser) {
                $this->errors[] = "Baris " . $index . ": NIP/ID {$nomorInduk} sudah terdaftar.";
                continue;
            }

            try {
                User::create([
                    'name' => trim($name),
                    'nomor_induk' => trim($nomorInduk),
                    'email' => trim($email) ?: (trim($nomorInduk) . '@sikap.local'),
                    'no_hp' => trim($noHp),
                    'password' => Hash::make(trim($nomorInduk)), // Default password = NIP/ID
                    'user_level_id' => $levelId,
                ]);

                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris " . $index . ": " . $e->getMessage();
            }
        }
    }
}
