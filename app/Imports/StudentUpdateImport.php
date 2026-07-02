<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

class StudentUpdateImport implements ToCollection, WithStartRow
{
    public $successCount = 0;
    public $skippedCount = 0;
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
                continue; // Skip empty
            }

            if (!isset($rowArray[0]) || empty(trim($rowArray[0]))) {
                continue;
            }

            $nis = trim($rowArray[0]);

            $user = User::where('nomor_induk', $nis)->first();
            if (!$user) {
                $this->errors[] = "Baris {$index}: NIS '{$nis}' tidak ditemukan.";
                $this->skippedCount++;
                continue;
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                $this->errors[] = "Baris {$index}: NIS '{$nis}' belum memiliki profil biodata.";
                $this->skippedCount++;
                continue;
            }

            try {
                $updateData = [];

                $fieldMap = [
                    2  => 'nisn',
                    3  => 'nik',
                    4  => 'gender',
                    5  => 'birth_place',
                    6  => 'birth_date',
                    7  => 'religion',
                    8  => 'origin_region',
                    9  => 'citizenship',
                    10 => 'child_order',
                    11 => 'siblings_count',
                    12 => 'living_with',
                    13 => 'financial_sponsor',
                    14 => 'height',
                    15 => 'weight',
                    16 => 'blood_type',
                    17 => 'province',
                    18 => 'city',
                    19 => 'district',
                    20 => 'village',
                    21 => 'postal_code',
                    22 => 'address_details',
                    23 => 'father_name',
                    24 => 'father_nik',
                    25 => 'father_birth_year',
                    26 => 'father_education',
                    27 => 'father_occupation',
                    28 => 'father_income',
                    29 => 'mother_name',
                    30 => 'mother_nik',
                    31 => 'mother_birth_year',
                    32 => 'mother_education',
                    33 => 'mother_occupation',
                    34 => 'mother_income',
                    35 => 'guardian_name',
                    36 => 'guardian_nik',
                    37 => 'guardian_birth_year',
                    38 => 'guardian_education',
                    39 => 'guardian_occupation',
                    40 => 'guardian_income',
                    41 => 'guardian_address',
                ];

                foreach ($fieldMap as $colIndex => $field) {
                    if (isset($rowArray[$colIndex]) && trim($rowArray[$colIndex]) !== '') {
                        $val = trim($rowArray[$colIndex]);

                        if ($field === 'nisn' || $field === 'nik') {
                            $cleanVal = preg_replace('/[^0-9]/', '', $val);
                            if ($cleanVal === '' || intval($cleanVal) === 0) {
                                $updateData[$field] = null;
                                continue;
                            }
                        }

                        $intFields = [
                            'child_order', 'siblings_count', 'height', 'weight',
                            'father_birth_year', 'mother_birth_year', 'guardian_birth_year'
                        ];
                        if (in_array($field, $intFields)) {
                            $cleanVal = preg_replace('/[^0-9]/', '', $val);
                            if ($cleanVal === '') {
                                $updateData[$field] = null;
                                continue;
                            }
                            $val = intval($cleanVal);
                        }

                        if ($field === 'birth_date') {
                            if (is_numeric($val)) {
                                $val = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($val)->format('Y-m-d');
                            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
                                continue;
                            }
                        }

                        if ($field === 'gender') $val = strtoupper($val);
                        $updateData[$field] = $val;
                    }
                }

                if (isset($rowArray[1]) && trim($rowArray[1]) !== '') {
                    $user->update(['name' => trim($rowArray[1])]);
                }

                if (!empty($updateData)) {
                    $province = $updateData['province'] ?? $student->province ?? '';
                    $city = $updateData['city'] ?? $student->city ?? '';
                    $district = $updateData['district'] ?? $student->district ?? '';
                    $village = $updateData['village'] ?? $student->village ?? '';
                    $postalCode = $updateData['postal_code'] ?? $student->postal_code ?? '';
                    $addressDetails = $updateData['address_details'] ?? $student->address_details ?? '';
                    
                    $parts = array_filter([$addressDetails, $village, $district, $city, $province, $postalCode]);
                    if (!empty($parts)) {
                        $updateData['address'] = implode(', ', $parts);
                    }

                    $fatherName = $updateData['father_name'] ?? $student->father_name ?? '';
                    $motherName = $updateData['mother_name'] ?? $student->mother_name ?? '';
                    if ($fatherName || $motherName) {
                        $updateData['parent_name'] = $fatherName ?: $motherName;
                    }

                    try {
                        $student->update($updateData);
                    } catch (\Illuminate\Database\QueryException $ex) {
                        if ($ex->errorInfo[1] == 1062) {
                            unset($updateData['nisn']);
                            unset($updateData['nik']);
                            if (!empty($updateData)) {
                                $freshStudent = Student::find($student->id);
                                if ($freshStudent) {
                                    $freshStudent->update($updateData);
                                }
                            }
                            $this->errors[] = "Baris {$index} (NIS: {$nis}): NISN/NIK duplikat terdeteksi. Sisa biodata berhasil diperbarui.";
                        } else {
                            throw $ex;
                        }
                    }
                }

                $this->successCount++;
            } catch (\Exception $e) {
                $this->errors[] = "Baris {$index} (NIS: {$nis}): " . $e->getMessage();
                $this->skippedCount++;
            }
        }
    }
}
