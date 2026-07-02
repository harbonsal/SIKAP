<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RfidTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            ['1234567890', '0012345678'],
            ['0987654321', '0087654321'],
        ];
    }

    public function headings(): array
    {
        return [
            'Nomor Induk',
            'RFID',
        ];
    }
}
