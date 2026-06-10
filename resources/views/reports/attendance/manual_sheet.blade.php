<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absensi {{ ucfirst($type) }} - {{ $activeClass->kelas->name }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 5mm;
            /* Reduced margins */
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            /* Reduced font size */
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }

        .header h1 {
            margin: 0;
            font-size: 16px;
            text-transform: uppercase;
        }

        .header h2 {
            margin: 3px 0 0;
            font-size: 12px;
            font-weight: normal;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
        }

        th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 9px;
        }

        .text-left {
            text-align: left;
            padding-left: 5px;
        }

        .name-col {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
            /* Limit name width */
            font-size: 9px;
        }

        .footer {
            margin-top: 10px;
            width: 100%;
        }

        .ttd-box {
            float: right;
            width: 200px;
            text-align: center;
        }

        .ttd-space {
            height: 40px;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>PESANTREN AL-LU'LU' WAL MARJAN</h1>
        <h2 style="font-weight: bold; font-size: 14px; margin-top: 5px;">ABSENSI {{ $type == 'pkbm' ? 'PKBM' : ($type == 'tahfidz' ? 'HALAQOH TAHFIDZ' : 'BELADIRI') }}</h2>
        <h3 style="margin: 2px 0 0; font-size: 11px; font-weight: normal;">Kelas: {{ $activeClass->kelas->name }} {{ $activeClass->kelasParalel->name }} | Tahun Ajaran: {{ $activeClass->academicYear->name }}</h3>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2" style="width: 25px;">No</th>
                <th rowspan="2" style="width: 60px;">NIS</th>
                <th rowspan="2" class="text-left" style="min-width: 140px;">Nama Lengkap</th>
                @foreach ($selectedMonths as $month)
                <th colspan="5">{{ strtoupper($monthNames[$month]) }}</th>
                @endforeach
            </tr>
            <tr>
                @foreach ($selectedMonths as $month)
                <th style="width: 15px;">1</th>
                <th style="width: 15px;">2</th>
                <th style="width: 15px;">3</th>
                <th style="width: 15px;">4</th>
                <th style="width: 15px;">5</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($students as $index => $member)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $member->student->user->nomor_induk }}</td>
                <td class="text-left name-col">{{ $member->student->user->name }}</td>
                @foreach ($selectedMonths as $month)
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                @endforeach
            </tr>
            @endforeach
            {{-- Empty rows if needed, or dynamic fill --}}
            @for ($i = 0; $i < 3; $i++)
                <tr>
                <td></td>
                <td></td>
                <td></td>
                @foreach ($selectedMonths as $month)
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                @endforeach
                </tr>
                @endfor
        </tbody>
    </table>

    <div class="footer">
        <div class="ttd-box">
            <p>................., ...........................</p>
            <p>Pengampu {{ ucfirst($type) }}</p>
            <div class="ttd-space"></div>
            <p>( ........................................ )</p>
        </div>
    </div>

    <script>
        window.print();
    </script>
</body>

</html>