<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jurnal Kelas - {{ $activeClass->kelas->name }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0mm; /* Allow the browser to dictate the margin but start from 0 if possible to maximize space */
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            direction: rtl;
            margin: 5mm; /* Apply some internal margin */
            padding: 0;
        }

        .header-table {
            width: 100%;
            margin-bottom: 5px;
            border: none;
            font-weight: bold;
            font-size: 14px;
        }

        .header-table td {
            border: none;
            vertical-align: top;
        }

        .day-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            table-layout: fixed;
        }

        .day-table th,
        .day-table td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
        }

        .day-table th {
            background-color: #fff;
            font-weight: bold;
            font-size: 11px;
        }

        .day-table td {
            font-size: 12px;
            height: 16px;
        }

        .col-jam { width: 4%; }
        .col-mapel { width: 12%; }
        .col-guru { width: 14%; }
        .col-materi { width: 35%; }
        .col-tugas { width: 8%; }
        .col-catatan { width: 12%; }
        .col-ttd { width: 7%; }

        .footer-table {
            width: 100%;
            margin-top: 5px;
            border: none;

            text-align: center;
            font-size: 12px;
            page-break-inside: avoid;
        }

        .footer-table td {
            border: none;
            padding: 5px;
            width: 33%;
        }

        .page-break {
            page-break-after: always;
        }
        
        .day-header {
            text-align: right;
            font-weight: bold;
            font-size: 12px;
            padding-bottom: 2px;
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
    
    $daysPage1 = [
        ['arab' => 'الاثنين', 'indo' => 'Senin'],
        ['arab' => 'الثلاثاء', 'indo' => 'Selasa'],
        ['arab' => 'الأربعاء', 'indo' => 'Rabu'],
    ];
    
    $daysPage2 = [
        ['arab' => 'الخميس', 'indo' => 'Kamis'],
        ['arab' => 'الجمعة', 'indo' => 'Jumat'],
        ['arab' => 'السبت', 'indo' => 'Sabtu'],
    ];
    @endphp

    <!-- PAGE 1 -->
    <table class="header-table">
        <tr>
            <td style="width: 50%;">
                <table style="width: auto; text-align: right; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 0 0 0 5px;">الفصل الدراسي</td>
                        <td style="padding: 0;">:</td>
                        <td style="padding: 0 5px 0 0;">{{ $semesterArab }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 0 5px;">شهر</td>
                        <td style="padding: 0;">:</td>
                        <td style="padding: 0 5px 0 0;">...................................</td>
                    </tr>
                </table>
            </td>
            <td style="width: 50%;" dir="ltr">
                <table style="width: auto; text-align: right; margin-left: 0; margin-right: auto; border-collapse: collapse;" dir="rtl">
                    <tr>
                        <td style="padding: 0 0 0 5px;">المرحلة</td>
                        <td style="padding: 0;">:</td>
                        <td style="padding: 0 5px 0 0;">{{ $jenjang }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 0 5px;">صف</td>
                        <td style="padding: 0;">:</td>
                        <td style="padding: 0 5px 0 0;">{{ $kelasName }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @foreach($daysPage1 as $day)
    <div class="day-header">
        يوم/تاريخ : {{ $day['arab'] }}، ......../......../2026
    </div>
    <table class="day-table">
        <thead>
            <tr>
                <th rowspan="2" class="col-jam">حصة</th>
                <th rowspan="2" class="col-mapel">مادة</th>
                <th rowspan="2" class="col-guru">مدرس المادة</th>
                <th rowspan="2" class="col-materi">موضوع الدرس</th>
                <th colspan="2">مادة بديلة / واجب</th>
                <th rowspan="2" class="col-catatan">ملاحظة</th>
                <th rowspan="2" class="col-ttd">توقيع</th>
            </tr>
            <tr>
                <th class="col-tugas">مناوب</th>
                <th class="col-tugas">حصة فارغة</th>
            </tr>
        </thead>
        <tbody>
            @for($i=1; $i<=6; $i++)
            <tr>
                <td>{{ toArabicNumerals($i) }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endfor
        </tbody>
    </table>
    @endforeach

    <div class="page-break"></div>

    <!-- PAGE 2 -->
    <!-- Removed main header to save vertical space -->

    @foreach($daysPage2 as $day)
    <div class="day-header">
        يوم/تاريخ : {{ $day['arab'] }}، ......../......../2026
    </div>
    <table class="day-table">
        <thead>
            <tr>
                <th rowspan="2" class="col-jam">حصة</th>
                <th rowspan="2" class="col-mapel">مادة</th>
                <th rowspan="2" class="col-guru">مدرس المادة</th>
                <th rowspan="2" class="col-materi">موضوع الدرس</th>
                <th colspan="2">مادة بديلة / واجب</th>
                <th rowspan="2" class="col-catatan">ملاحظة</th>
                <th rowspan="2" class="col-ttd">توقيع</th>
            </tr>
            <tr>
                <th class="col-tugas">مناوب</th>
                <th class="col-tugas">حصة فارغة</th>
            </tr>
        </thead>
        <tbody>
            @for($i=1; $i<=6; $i++)
            <tr>
                <td>{{ toArabicNumerals($i) }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endfor
        </tbody>
    </table>
    @endforeach

    <table class="footer-table">
        <tr>
            <td style="text-align: right;">
                ماجيلانج، ....................................... 2026<br>
                مشرف الفصل<br><br><br><br>
                (......................................................)
            </td>
            <td></td>
            <td style="text-align: left;">
                رئيس المدرسة<br><br><br><br>
                (......................................................)
            </td>
        </tr>
    </table>

    <script>
        window.print();
    </script>
</body>
</html>
