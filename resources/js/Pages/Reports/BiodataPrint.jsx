import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function BiodataPrint({ student, schoolInfo, signer }) {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <>
            <Head title={`Biodata - ${student.user.name}`} />
            <div className="print-container text-sm leading-relaxed">
                <style>{`
                    @page {
                        size: A4;
                        margin: 1.5cm 1.5cm 1.5cm 3cm; /* Top, Right, Bottom, Left */
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            font-family: 'Times New Roman', Times, serif;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                    .print-container {
                        width: 100%;
                        max-width: 210mm; /* A4 width */
                        margin: 0 auto;
                        padding: 0; /* Margins handled by @page */
                        font-family: 'Times New Roman', Times, serif;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 1rem;
                    }
                    td {
                        vertical-align: top;
                        padding: 4px 0;
                    }
                    .label {
                        width: 35%;
                        font-weight: bold;
                    }
                    .separator {
                        width: 2%;
                        text-align: center;
                    }
                    .value {
                        width: 63%;
                    }
                    h1 {
                        text-align: center;
                        font-size: 16pt;
                        font-weight: bold;
                        margin-bottom: 2rem;
                        text-transform: uppercase;
                    }
                `}</style>

                <h1>BIODATA SANTRI</h1>

                <table>
                    <tbody>
                        <tr>
                            <td className="label">1. Nama Lengkap</td>
                            <td className="separator">:</td>
                            <td className="value uppercase">{student.user.name}</td>
                        </tr>
                        <tr>
                            <td className="label">2. Nomor Induk Siswa (NIS)</td>
                            <td className="separator">:</td>
                            <td className="value">{student.user.nomor_induk}</td>
                        </tr>
                        <tr>
                            <td className="label">3. NISN</td>
                            <td className="separator">:</td>
                            <td className="value">{student.nisn || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label">4. Tempat, Tanggal Lahir</td>
                            <td className="separator">:</td>
                            <td className="value">{student.birth_place}, {student.birth_date}</td>
                        </tr>
                        <tr>
                            <td className="label">5. Jenis Kelamin</td>
                            <td className="separator">:</td>
                            <td className="value">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                        </tr>
                        <tr>
                            <td className="label">6. Agama</td>
                            <td className="separator">:</td>
                            <td className="value">{student.religion}</td>
                        </tr>
                        <tr>
                            <td className="label">7. Anak ke</td>
                            <td className="separator">:</td>
                            <td className="value">{student.child_order} dari {student.siblings_count} bersaudara</td>
                        </tr>
                        <tr>
                            <td className="label">8. Alamat Peserta Didik</td>
                            <td className="separator">:</td>
                            <td className="value">
                                {student.address}<br />
                                {student.village ? `Kel. ${student.village}, ` : ''}
                                {student.district ? `Kec. ${student.district}` : ''}<br />
                                {student.city ? `${student.city}, ` : ''}
                                {student.province ? `${student.province}` : ''}
                                {student.postal_code ? ` ${student.postal_code}` : ''}
                            </td>
                        </tr>
                        <tr>
                            <td className="label">9. Nama Orang Tua</td>
                            <td className="separator"></td>
                            <td className="value"></td>
                        </tr>
                        <tr>
                            <td className="label pl-4">a. Ayah</td>
                            <td className="separator">:</td>
                            <td className="value">{student.father_name || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label pl-4">b. Ibu</td>
                            <td className="separator">:</td>
                            <td className="value">{student.mother_name || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label">10. Pekerjaan Orang Tua</td>
                            <td className="separator"></td>
                            <td className="value"></td>
                        </tr>
                        <tr>
                            <td className="label pl-4">a. Ayah</td>
                            <td className="separator">:</td>
                            <td className="value">{student.father_occupation || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label pl-4">b. Ibu</td>
                            <td className="separator">:</td>
                            <td className="value">{student.mother_occupation || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label">11. Alamat Orang Tua</td>
                            <td className="separator">:</td>
                            <td className="value">
                                {student.address} {/* Assuming same as student for now, or add parent address field */}
                            </td>
                        </tr>
                        <tr>
                            <td className="label">12. Nama Wali</td>
                            <td className="separator">:</td>
                            <td className="value">{student.guardian_name || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label">13. Pekerjaan Wali</td>
                            <td className="separator">:</td>
                            <td className="value">{student.guardian_occupation || '-'}</td>
                        </tr>
                        <tr>
                            <td className="label">14. Alamat Wali</td>
                            <td className="separator">:</td>
                            <td className="value">{student.guardian_address || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-16 flex justify-end">
                    <div className="text-center">
                        <p>{schoolInfo?.city || 'Tempat'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="mt-2">{signer?.title || schoolInfo?.headmaster_title || 'Kepala Sekolah'},</p>

                        {/* Signature Image */}
                        <div className="h-24 flex items-center justify-center my-2">
                            {(signer?.nip || schoolInfo?.headmaster_nip) && (
                                <img
                                    src={`/images/signatures/${signer?.nip || schoolInfo?.headmaster_nip}.png`}
                                    alt="Tanda Tangan"
                                    className="h-24 object-contain"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                        </div>

                        <p className="font-bold underline">{signer?.name || schoolInfo?.headmaster_name || 'Nama Kepala Sekolah'}</p>
                        <p>NIP. {signer?.nip || schoolInfo?.headmaster_nip || '........................'}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
