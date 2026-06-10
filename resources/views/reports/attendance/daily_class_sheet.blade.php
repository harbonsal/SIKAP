<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absensi Harian - {{ $activeClass->kelas->name }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 5mm;
        }

        body {
            font-family: Arial, sans-serif;
            /* System font usually handles Arabic fine */
            font-size: 10px;
            direction: rtl;
        }

        .header {
            text-align: center;
            margin-bottom: 5px;
            position: relative;
        }

        .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }

        .header h2 {
            margin: 2px 0;
            font-size: 14px;
            font-weight: normal;
        }

        .sub-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 11px;
            padding: 0 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            table-layout: fixed; /* Force exact column widths */
        }

        th,
        td {
            border: 1px solid #000;
            padding: 1px; /* Reduce padding for smaller cells */
            text-align: center;
            overflow: hidden;
        }

        th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 9px; /* Smaller header font */
        }
        
        td {
            font-size: 10px;
        }

        .text-right {
            text-align: right;
            padding-right: 5px;
        }

        .name-col {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Specific column widths for RTL */
        .col-no {
            width: 20px;
        }

        .col-id {
            width: 40px;
        }

        .col-name {
            width: 130px;
        }

        .col-summary {
            width: 16px;
        }

        /* Print specific styles */
        thead {
            display: table-header-group;
        }
        
        tr {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    @php
    // Function to convert to Eastern Arabic Numerals
    function toArabicNumerals($number) {
    $western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    $eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str_replace($western, $eastern, strval($number));
    }
    @endphp

    <div class="header">
        <h1>معهد اللؤلؤ والمرجان</h1>
        <h2>العام الدراسي {{ toArabicNumerals($activeClass->academicYear->name) }}</h2>
    </div>

    <div class="sub-header">
        <div>المرحلة : {{ $activeClass->kelas->jenjang->nama_arab ?? ($activeClass->kelas->jenjang_id == 1 ? 'المتوسطة' : 'الثانوية') }}</div>
        <div>الصف : {{ toArabicNumerals($activeClass->kelas->name) }} {{ $activeClass->kelasParalel->name }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2" class="col-no">الرقم</th>
                <th rowspan="2" class="col-id">رقم القيد</th>
                <th rowspan="2" class="text-right col-name">الاسم</th>

                <!-- Monday -->
                <th colspan="6">الإثنين</th>
                <!-- Tuesday -->
                <th colspan="6">الثلاثاء</th>
                <!-- Wednesday -->
                <th colspan="6">الأربعاء</th>
                <!-- Thursday -->
                <th colspan="6">الخميس</th>
                <!-- Friday -->
                <th colspan="6">الجمعة</th>
                <!-- Saturday -->
                <th colspan="6">السبت</th>
                
                <!-- Summary -->
                <th colspan="3">الخلاصة</th>
            </tr>
            <tr>
                <!-- Periods 1-6 for each of the 6 days -->
                @for($d=0; $d<6; $d++)
                    <th>١</th>
                    <th>٢</th>
                    <th>٣</th>
                    <th>٤</th>
                    <th>٥</th>
                    <th>٦</th>
                @endfor
                
                <!-- Summary Sub-headers -->
                <th class="col-summary">م</th>
                <th class="col-summary">إ</th>
                <th class="col-summary">غ</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($students as $index => $member)
            <tr>
                <td>{{ toArabicNumerals($index + 1) }}</td>
                <td>{{ toArabicNumerals($member->student->user->nomor_induk) }}</td>
                <td class="text-right name-col">{{ $member->student->user->nama_arab ?? $member->student->user->name }}</td>

                <!-- Cells for each day (6 days * 6 periods = 36 cells) -->
                @for($i=0; $i<36; $i++)
                    <td></td>
                @endfor
                
                <!-- Summary cells -->
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <script>
        window.print();
    </script>
</body>

</html>