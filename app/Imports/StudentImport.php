<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

class StudentImport implements ToCollection, WithStartRow
{
    public $successCount = 0;
    public $errors = [];

    public function startRow(): int
    {
        return 2; // Skip header row
    }

    public function collection(Collection $rows)
    {
        $studentLevel = UserLevel::firstOrCreate(['name' => 'Santri'], ['category' => 'Santri']);
        $index = 1;

        foreach ($rows as $row) {
            $index++;

            // Let's be lenient and check minimum required fields (first 8)
            // But excel rows might be shorter if trailing cells are empty. We pad the row.
            $rowArray = $row->toArray();
            if (count(array_filter($rowArray)) === 0) {
                continue; // Skip completely empty rows
            }

            $rowArray = array_pad($rowArray, 43, null);

            if (empty(trim($rowArray[0] ?? '')) || empty(trim($rowArray[1] ?? ''))) {
                $this->errors[] = "Baris " . $index . ": Nama dan NIS wajib diisi.";
                continue;
            }

            try {
                $name = $rowArray[0];
                $nis = $rowArray[1];
                
                $nisn = $rowArray[2] ?? null;
                if ($nisn !== null) {
                    $cleanNisn = preg_replace('/[^0-9]/', '', $nisn);
                    if ($cleanNisn === '' || intval($cleanNisn) === 0) {
                        $nisn = null;
                    }
                }

                $nik = $rowArray[3] ?? null;
                if ($nik !== null) {
                    $cleanNik = preg_replace('/[^0-9]/', '', $nik);
                    if ($cleanNik === '' || intval($cleanNik) === 0) {
                        $nik = null;
                    }
                }

                $gender = strtoupper($rowArray[4] ?? 'L');
                if (!in_array($gender, ['L', 'P'])) {
                    $gender = 'L';
                }

                $birthPlace = $rowArray[5] ?? '';
                $birthDate = $rowArray[6] ?? null; // YYYY-MM-DD
                
                // Handling Excel date values
                if (is_numeric($birthDate)) {
                    $birthDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($birthDate)->format('Y-m-d');
                } elseif ($birthDate === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthDate)) {
                    $birthDate = '2010-01-01';
                }

                $address = $rowArray[7] ?? '';

                // Address Details
                $province = $rowArray[8] ?? null;
                $city = $rowArray[9] ?? null;
                $district = $rowArray[10] ?? null;
                $village = $rowArray[11] ?? null;
                $postalCode = $rowArray[12] ?? null;
                $addressDetails = $rowArray[13] ?? null;

                // New Fields
                $religion = $rowArray[14] ?? 'Islam';
                $originRegion = $rowArray[15] ?? 'Jawa';
                $citizenship = $rowArray[16] ?? 'WNI';
                
                $childOrder = isset($rowArray[17]) && preg_replace('/[^0-9]/', '', $rowArray[17]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[17])) : null;
                $siblingsCount = isset($rowArray[18]) && preg_replace('/[^0-9]/', '', $rowArray[18]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[18])) : null;
                $livingWith = $rowArray[19] ?? null;
                $financialSponsor = $rowArray[20] ?? null;
                
                $height = isset($rowArray[21]) && preg_replace('/[^0-9]/', '', $rowArray[21]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[21])) : null;
                $weight = isset($rowArray[22]) && preg_replace('/[^0-9]/', '', $rowArray[22]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[22])) : null;
                $bloodType = $rowArray[23] ?? null;

                // Parents
                $fatherName = $rowArray[24] ?? null;
                $fatherNik = $rowArray[25] ?? null;
                $fatherBirthYear = isset($rowArray[26]) && preg_replace('/[^0-9]/', '', $rowArray[26]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[26])) : null;
                $fatherEducation = $rowArray[27] ?? null;
                $fatherOccupation = $rowArray[28] ?? null;
                $fatherIncome = $rowArray[29] ?? null;

                $motherName = $rowArray[30] ?? null;
                $motherNik = $rowArray[31] ?? null;
                $motherBirthYear = isset($rowArray[32]) && preg_replace('/[^0-9]/', '', $rowArray[32]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[32])) : null;
                $motherEducation = $rowArray[33] ?? null;
                $motherOccupation = $rowArray[34] ?? null;
                $motherIncome = $rowArray[35] ?? null;

                // Guardian
                $guardianName = $rowArray[36] ?? null;
                $guardianNik = $rowArray[37] ?? null;
                $guardianBirthYear = isset($rowArray[38]) && preg_replace('/[^0-9]/', '', $rowArray[38]) !== '' ? intval(preg_replace('/[^0-9]/', '', $rowArray[38])) : null;
                $guardianEducation = $rowArray[39] ?? null;
                $guardianOccupation = $rowArray[40] ?? null;
                $guardianIncome = $rowArray[41] ?? null;
                $guardianAddress = $rowArray[42] ?? null;

                // Generic parent name for display if not set
                $parentName = $fatherName ?: ($motherName ?: ($guardianName ?: '-'));
                $parentPhone = null;

                // Check if User exists
                $existingUser = User::where('nomor_induk', $nis)->first();
                $userId = null;

                if ($existingUser) {
                    if (Student::where('user_id', $existingUser->id)->exists()) {
                        $this->errors[] = "Baris " . $index . ": User $nis sudah memiliki data siswa.";
                        continue;
                    }
                    $userId = $existingUser->id;
                } else {
                    // Create User
                    $user = User::create([
                        'name' => $name,
                        'nomor_induk' => $nis,
                        'email' => $nis . '@sikap.local', // Dummy email because DB requires email
                        'password' => Hash::make($nis), // Default password = NIS
                        'user_level_id' => $studentLevel->id,
                    ]);
                    $userId = $user->id;
                }

                // Create Student
                Student::create([
                    'user_id' => $userId,
                    'nisn' => $nisn,
                    'nik' => $nik,
                    'gender' => $gender,
                    'birth_place' => $birthPlace,
                    'birth_date' => $birthDate,
                    'address' => $address,

                    'province' => $province,
                    'city' => $city,
                    'district' => $district,
                    'village' => $village,
                    'postal_code' => $postalCode,
                    'address_details' => $addressDetails,

                    'parent_name' => $parentName,
                    'parent_phone' => $parentPhone,

                    // Dapodik Fields
                    'religion' => $religion,
                    'origin_region' => $originRegion,
                    'citizenship' => $citizenship,
                    'child_order' => $childOrder,
                    'siblings_count' => $siblingsCount,
                    'living_with' => $livingWith,
                    'financial_sponsor' => $financialSponsor,
                    'height' => $height,
                    'weight' => $weight,
                    'blood_type' => $bloodType,

                    'father_name' => $fatherName,
                    'father_nik' => $fatherNik,
                    'father_birth_year' => $fatherBirthYear,
                    'father_education' => $fatherEducation,
                    'father_occupation' => $fatherOccupation,
                    'father_income' => $fatherIncome,

                    'mother_name' => $motherName,
                    'mother_nik' => $motherNik,
                    'mother_birth_year' => $motherBirthYear,
                    'mother_education' => $motherEducation,
                    'mother_occupation' => $motherOccupation,
                    'mother_income' => $motherIncome,

                    'guardian_name' => $guardianName,
                    'guardian_nik' => $guardianNik,
                    'guardian_birth_year' => $guardianBirthYear,
                    'guardian_education' => $guardianEducation,
                    'guardian_occupation' => $guardianOccupation,
                    'guardian_income' => $guardianIncome,
                    'guardian_address' => $guardianAddress,
                ]);

                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris " . $index . ": " . $e->getMessage();
            }
        }
    }
}
