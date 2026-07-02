<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

class RfidUpdateImport implements ToCollection, WithStartRow
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

        foreach ($rows as $row) {
            $index++;

            $rowArray = $row->toArray();
            if (count(array_filter($rowArray)) === 0) {
                continue; // Skip empty rows
            }

            // Ensure we have at least 2 columns
            $rowArray = array_pad($rowArray, 2, null);

            $nomorInduk = $rowArray[0];
            $rfid = $rowArray[1];

            if (empty(trim($nomorInduk ?? '')) || empty(trim($rfid ?? ''))) {
                // Silently skip if either is missing, as requested by user
                continue;
            }

            $user = User::where('nomor_induk', $nomorInduk)->first();
            if (!$user) {
                $this->errors[] = "Baris " . $index . ": NIP/ID {$nomorInduk} tidak ditemukan di database.";
                continue;
            }

            // Check if RFID is already used by someone else
            $existingRfidUser = User::where('rfid', $rfid)->where('id', '!=', $user->id)->first();
            if ($existingRfidUser) {
                $this->errors[] = "Baris " . $index . ": RFID {$rfid} sudah digunakan oleh user lain ({$existingRfidUser->name}).";
                continue;
            }

            try {
                $user->update([
                    'rfid' => trim($rfid),
                ]);

                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris " . $index . ": " . $e->getMessage();
            }
        }
    }
}
