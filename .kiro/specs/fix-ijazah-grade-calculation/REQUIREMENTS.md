# Requirements: Fix Ijazah Grade Calculation

## Problem Statement
Halaman cetak ijazah saat ini mengambil nilai dari **jumlah nilai ujian semester 2** (dengan bobot UH1, UTS, UH2, UAS), tetapi seharusnya mengambil **nilai rapor semester 2** yang menggunakan formula:

```
Nilai Rapor = (Nilai Sem 1 + (2 × Nilai Sem 2)) / 3
```

## Current Behavior
Di `IjazahSettingsController::print()`:
- Mengambil nilai semester 2 dengan perhitungan bobot grade weights
- Tidak memperhitungkan nilai semester 1
- Hasil: nilai yang ditampilkan adalah nilai murni semester 2, bukan nilai rapor

## Expected Behavior
Nilai ijazah harus menggunakan formula nilai rapor yang sama dengan yang digunakan di `StudentGradeRecapController`:
- Ambil nilai semester 1 (Ganjil)
- Ambil nilai semester 2 (Genap)
- Hitung nilai rapor: `(Sem1 + (2 × Sem2)) / 3`
- Tampilkan nilai rapor di ijazah

## Reference Implementation
Formula yang benar sudah diimplementasikan di:
- `StudentGradeRecapController::show()` (line 228-231)
- `AnalysisController` (line 385-387)
- `StudentGradeController` (line 197-199)

## Acceptance Criteria
1. ✅ Nilai ijazah menggunakan formula rapor: `(Sem1 + (2 × Sem2)) / 3`
2. ✅ Jika nilai manual ada, tetap prioritaskan nilai manual
3. ✅ Jika hanya ada semester 2, gunakan nilai semester 2 saja
4. ✅ Perhitungan konsisten dengan sistem rapor yang ada
5. ✅ Total nilai dan rata-rata dihitung dari nilai rapor, bukan nilai semester 2

## Files to Modify
- `app/Http/Controllers/IjazahSettingsController.php` - Method `print()`

## Technical Notes
- Semester 1 = "Ganjil" atau "Semester 1"
- Semester 2 = "Genap" atau "Semester 2"
- Grade weights category = "pengetahuan"
- Semester filter: `['all', 'semua', 'All', $semesterName, strtolower($semesterName)]`
