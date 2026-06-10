<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <title>Ijazah {{ $student->name }}</title>
    <style>
        body {
            font-family: 'Amiri', 'Traditional Arabic', serif;
            text-align: right;
            margin: 0;
            padding: 0;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            border: 1px solid #D3D3D3;
            background: white;
            box-sizing: border-box;
        }

        .page-break {
            page-break-before: always;
        }

        h1,
        h2,
        h3,
        h4 {
            text-align: center;
            margin: 5px;
            font-weight: bold;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .content {
            margin-top: 20px;
            font-size: 14pt;
            line-height: 1.6;
        }

        .bio-table {
            width: 100%;
            border: none;
            margin-top: 20px;
        }

        .bio-table td {
            padding: 8px;
            vertical-align: top;
            font-size: 14pt;
            border: none;
        }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .grades-table th,
        .grades-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 13pt;
        }

        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            padding: 0 50px;
        }

        .signature {
            text-align: center;
            width: 250px;
        }

        @media print {
            body {
                margin: 0;
                box-shadow: none;
            }

            .page {
                margin: 0;
                border: none;
                width: auto;
                height: auto;
            }

            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>

<body>
    <!-- HALAMAN 1: DEPAN -->
    <div class="page">
        <div class="header">
            <h3>YAYASAN AL-LU'LU' WAL MARJAN</h3>
            <h2>PESANTREN AL-LU'LU' WAL MARJAN</h2>
            <p>SK Kemenag No. ... Tahun ...</p>
            <br>
            <h1 style="font-size: 32pt; text-decoration: underline;">IJAZAH</h1>
            <p>Nomor: .......................................</p>
        </div>

        <div class="content">
            <p style="text-align: center;">Mudir Pesantren Al-Lu'lu' Wal Marjan menerangkan bahwa:</p>

            <table class="bio-table">
                <tr>
                    <td width="30%">Nama</td>
                    <td width="5%">:</td>
                    <td><b>{{ $student->name }}</b> / {{ $student->nama_arab ?? '' }}</td>
                </tr>
                <tr>
                    <td>Tempat, Tanggal Lahir</td>
                    <td>:</td>
                    <td>{{ $student->birth_place }}, {{ $student->birth_date }} <br> {{ $student->birth_place_ar ?? '' }}</td>
                </tr>
                <tr>
                    <td>Nomor Induk Santri</td>
                    <td>:</td>
                    <td>{{ $student->user->nomor_induk }}</td>
                </tr>
                <tr>
                    <td>NISN</td>
                    <td>:</td>
                    <td>{{ $nisn }}</td>
                </tr>
                <tr>
                    <td>Nama Orang Tua</td>
                    <td>:</td>
                    <td>{{ $father_name }}</td>
                </tr>
            </table>

            <br>
            <p style="text-align: justify; text-indent: 50px;">
                Telah menamatkan pendidikan di jenjang <b>Tsanawiyah (Setingkat SMP)</b> Pesantren Al-Lu'lu' Wal Marjan dan dinyatakan:
            </p>

            <h1 style="font-size: 40pt; margin: 30px 0;">LULUS</h1>

            <p style="text-align: justify;">
                Dan kepadanya diberikan Ijazah ini beserta transkrip nilai sebagai tanda tamat belajar, untuk dapat dipergunakan sebagaimana mestinya.
            </p>
        </div>

        <div class="footer">
            <div class="signature">
                <p>Magelang, {{ date('d F Y') }}</p>
                <p>Mudir Pesantren,</p>
                <br><br><br><br>
                <p><b>Rizal Yuliar Putrananda</b></p>
            </div>
            <div class="signature">
                <!-- Foto 3x4 placeholder -->
                <div style="width: 3cm; height: 4cm; border: 1px dashed black; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                    Foto 3x4
                </div>
            </div>
        </div>
    </div>

    <!-- HALAMAN 2: NILAI -->
    <div class="page page-break">
        <div class="header">
            <h2>DAFTAR NILAI UJIAN AKHIR</h2>
            <h3>TAHUN PELAJARAN {{ date('Y') }}/{{ date('Y')+1 }}</h3>
        </div>

        <table class="bio-table" style="margin-bottom: 20px;">
            <tr>
                <td width="20%">Nama</td>
                <td>: {{ $student->name }}</td>
                <td width="20%">NIS</td>
                <td>: {{ $student->user->nomor_induk }}</td>
            </tr>
        </table>

        <table class="grades-table">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th>Mata Pelajaran</th>
                    <th width="15%">Nilai (Angka)</th>
                    <th width="30%">Nilai (Huruf)</th>
                    <th width="20%">Predikat</th>
                </tr>
            </thead>
            <tbody>
                @php $no = 1; @endphp
                @foreach($grades as $mapel => $grade)
                <tr>
                    <td>{{ $no++ }}</td>
                    <td style="text-align: right; padding-right: 15px;">{{ $mapel }}</td>
                    <td>{{ $grade['score'] }}</td>
                    <td>{{ $grade['text_ar'] }}</td>
                    <td>{{ $grade['predicate'] }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background-color: #f0f0f0;">
                    <td colspan="2"><strong>Rata-rata</strong></td>
                    <td><strong>{{ $average }}</strong></td>
                    <td colspan="2"><strong>{{ $average_ar }}</strong></td>
                </tr>
            </tfoot>
        </table>

        <div class="footer">
            <div class="signature">
                <p>Magelang, {{ date('d F Y') }}</p>
                <p>Kepala Sekolah,</p>
                <br><br><br><br>
                <p><b>(Nama Kepala Sekolah)</b></p>
            </div>
        </div>
    </div>

    <script>
        window.print();
    </script>
</body>

</html>