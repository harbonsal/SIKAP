<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Sampul - {{ $activeClass->kelas->name }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }

        body {
            font-family: Arial, sans-serif;
            text-align: center;
            direction: rtl;
            margin: 0;
            padding: 0;
        }

        .main-title {
            font-size: 38px;
            font-weight: bold;
            margin-top: 60px;
            margin-bottom: 30px;
        }

        .sub-title {
            font-size: 22px;
            margin-bottom: 15px;
        }

        .logo-container {
            margin: 50px auto;
        }

        .logo {
            width: 250px;
            height: 250px;
            object-fit: contain;
        }

        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 100px;
            font-size: 20px;
            font-weight: bold;
            padding: 0 50px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    @php
    function toArabicNumerals($number) {
        $western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str_replace($western, $eastern, strval($number));
    }
    
    $jenjang = $activeClass->kelas->jenjang->nama_arab ?? ($activeClass->kelas->jenjang_id == 1 ? 'المتوسطة' : 'الثانوية');
    if (stripos($activeClass->kelas->name, 'Mutawasith') !== false) {
        $jenjang = 'المتوسطة';
    } elseif (stripos($activeClass->kelas->name, 'Tsanawi') !== false) {
        $jenjang = 'الثانوية';
    }
    
    $kelasNumberStr = preg_replace('/[^0-9]/', '', $activeClass->kelas->name);
    $numberMap = [
        '1' => 'الأول',
        '2' => 'الثاني',
        '3' => 'الثالث',
        '4' => 'الرابع',
        '5' => 'الخامس',
        '6' => 'السادس',
        '7' => 'السابع',
        '8' => 'الثامن',
        '9' => 'التاسع',
        '10' => 'العاشر',
        '11' => 'الحادي عشر',
        '12' => 'الثاني عشر'
    ];
    $kelasNumber = $numberMap[$kelasNumberStr] ?? toArabicNumerals($kelasNumberStr);
    
    $paralelMap = ['A' => 'أ', 'B' => 'ب', 'C' => 'ج', 'D' => 'د', 'E' => 'هـ', 'F' => 'و', 'G' => 'ز', 'H' => 'ح'];
    $paralelRaw = strtoupper(trim($activeClass->kelasParalel->name));
    $paralelArab = $paralelMap[$paralelRaw] ?? $paralelRaw;
    
    $kelasName = trim($kelasNumber . ' ' . $paralelArab);
    
    $semesterText = $activeSemester->name ?? ($activeAcademicYear->semester ?? '');
    $semesterArab = '';
    if (strtolower($semesterText) === 'ganjil' || $semesterText == '1') {
        $semesterArab = 'الأول';
    } elseif (strtolower($semesterText) === 'genap' || $semesterText == '2') {
        $semesterArab = 'الثانى';
    } else {
        $semesterArab = $semesterText;
    }

    $year = toArabicNumerals($activeAcademicYear->name ?? ''); 
    @endphp

    <!-- Page 1: Sampul Absensi -->
    <div class="main-title">كشف الحضور</div>
    <div class="sub-title">الفصل الدراسي {{ $semesterArab }} للعام الدراسي {{ $year }}</div>
    <div class="sub-title">{{ \App\Models\SchoolInfo::first()?->name ?? 'Lembaga Anda' }}</div>
    
    <div class="logo-container">
        <!-- Dynamic Logo -->
        <img src="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png' }}" class="logo" alt="Logo">
    </div>
    
    <div class="footer">
        <div>الصف : &nbsp;&nbsp; {{ $kelasName }} &nbsp;&nbsp;&nbsp;&nbsp; {{ $jenjang }}</div>
        <div>ولي الصف : ............................................................</div>
    </div>
    
    <div class="page-break"></div>
    
    <!-- Page 2: Sampul Jurnal -->
    <div class="main-title">كشف متابعة التدريس</div>
    <div class="sub-title">الفصل الدراسي {{ $semesterArab }} للعام الدراسي {{ $year }}</div>
    <div class="sub-title">{{ \App\Models\SchoolInfo::first()?->name ?? 'Lembaga Anda' }}</div>
    
    <div class="logo-container">
        <img src="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png' }}" class="logo" alt="Logo">
    </div>
    
    <div class="footer">
        <div>الصف : &nbsp;&nbsp; {{ $kelasName }} &nbsp;&nbsp;&nbsp;&nbsp; {{ $jenjang }}</div>
        <div>ولي الصف : ............................................................</div>
    </div>
    
    <script>
        window.print();
    </script>
</body>
</html>
