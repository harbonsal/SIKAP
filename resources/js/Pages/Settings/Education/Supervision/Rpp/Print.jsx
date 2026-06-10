import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Print({ rpp }) {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <div className="font-sans p-8 max-w-[210mm] mx-auto bg-white text-black leading-relaxed">
            <Head title={`Cetak RPP - ${rpp.topic}`} />

            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase mb-1">Rencana Pelaksanaan Pembelajaran (RPP)</h1>
                <p className="text-sm">Tahun Pelajaran {rpp.academic_year?.name} - {rpp.semester?.name}</p>
            </div>

            {/* Identitas */}
            <table className="w-full mb-6 text-sm">
                <tbody>
                    <tr>
                        <td className="w-32 font-bold py-1">Satuan Pendidikan</td>
                        <td>: SMA IT Al-Bina (Contoh)</td>
                        <td className="w-32 font-bold py-1">Mata Pelajaran</td>
                        <td>: {rpp.active_subject?.mapel?.name}</td>
                    </tr>
                    <tr>
                        <td className="font-bold py-1">Kelas/Semester</td>
                        <td>: {rpp.active_subject?.active_class?.kelas?.name} / {rpp.semester?.name}</td>
                        <td className="font-bold py-1">Materi Pokok</td>
                        <td>: {rpp.topic}</td>
                    </tr>
                    <tr>
                        <td className="font-bold py-1">Alokasi Waktu</td>
                        <td>: {rpp.silabus?.alokasi_waktu || '2 x 45 JP'}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            {/* A. Tujuan */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">A. TUJUAN PEMBELAJARAN</h3>
                <div className="pl-4 whitespace-pre-line text-sm text-justify">
                    {rpp.objectives}
                </div>
            </div>

            {/* B. Metode & Media */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">B. METODE & MEDIA PEMBELAJARAN</h3>
                <div className="pl-4 text-sm">
                    <p><span className="font-semibold">Metode:</span> {rpp.methods?.join(', ') || '-'}</p>
                    <p><span className="font-semibold">Media:</span> {rpp.media?.join(', ') || '-'}</p>
                </div>
            </div>

            {/* C. Kegiatan Pembelajaran */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">C. KEGIATAN PEMBELAJARAN</h3>

                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 w-1/4">Tahapan</th>
                            <th className="border border-black p-2">Kegiatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-semibold align-top">Pendahuluan</td>
                            <td className="border border-black p-2 whitespace-pre-line text-justify">{rpp.activities?.pendahuluan}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-semibold align-top">Kegiatan Inti</td>
                            <td className="border border-black p-2 whitespace-pre-line text-justify">{rpp.activities?.inti}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-semibold align-top">Penutup</td>
                            <td className="border border-black p-2 whitespace-pre-line text-justify">{rpp.activities?.penutup}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* D. Penilaian */}
            <div className="mb-8">
                <h3 className="font-bold mb-2">D. PENILAIAN HASIL BELAJAR</h3>
                <div className="pl-4 text-sm">
                    <p>{rpp.assessments?.join(', ') || '-'}</p>
                </div>
            </div>

            {/* Tanda Tangan */}
            <div className="flex justify-between mt-16 px-8 text-sm">
                <div className="text-center">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br /><br /><br />
                    <p className="font-bold underline">Ustadz Fulan, S.Pd.I</p>
                    <p>NIP. -</p>
                </div>
                <div className="text-center">
                    <p>Guru Mata Pelajaran</p>
                    <br /><br /><br />
                    <p className="font-bold underline">{rpp.teacher?.name}</p>
                    <p>NIP. -</p>
                </div>
            </div>

        </div>
    );
}
