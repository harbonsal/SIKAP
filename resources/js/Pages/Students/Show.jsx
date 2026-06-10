import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage } from '@inertiajs/react'; // Add usePage
import { ArrowLeft, Printer, Edit } from 'lucide-react';

export default function Show({ student }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.user_level?.name === 'Administrator';

    const handlePrint = () => {
        window.print();
    };

    return (
        <MainLayout>
            <Head title={`Detail Siswa - ${student.user.name}`} />

            <div className="max-w-5xl mx-auto space-y-6 print:w-full print:max-w-none">
                {/* Header - Hidden on Print */}
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('students.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Detail Siswa</h2>
                            <p className="text-muted-foreground">Informasi lengkap biodata siswa.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Link
                                href={route('students.edit', student.id)}
                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        )}
                        <a
                            href={route('reports.biodata', { student_id: student.id })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Biodata
                        </a>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 print:border-0 print:shadow-none print:p-0">

                    {/* Print Header */}
                    <div className="hidden print:block text-center mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase">Biodata Siswa</h1>
                        <p className="text-sm text-muted-foreground">Laporan Data Induk Siswa</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                        {/* Data Akademik & Asrama */}
                        <div className="space-y-4 md:col-span-2">
                            <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Data Akademik & Asrama</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <dl className="grid grid-cols-3 gap-2 text-sm">
                                    <dt className="font-medium text-muted-foreground print:text-black">Kelas Aktif</dt>
                                    <dd className="col-span-2">: {student.class_members && student.class_members.length > 0
                                        ? `${student.class_members[0].active_class?.kelas?.name || '-'} ${student.class_members[0].active_class?.kelas_paralel?.name || ''}`
                                        : '-'}</dd>
                                </dl>
                                <dl className="grid grid-cols-3 gap-2 text-sm">
                                    <dt className="font-medium text-muted-foreground print:text-black">Kamar Santri</dt>
                                    <dd className="col-span-2">: {student.kamar_members && student.kamar_members.length > 0
                                        ? `${student.kamar_members[0].active_kamar?.kamar?.name || '-'} (${student.kamar_members[0].active_kamar?.name || ''})`
                                        : '-'}</dd>
                                </dl>
                            </div>
                        </div>

                        {/* Data Pribadi */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Data Pribadi</h3>
                            <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground print:text-black">Nama Lengkap</dt>
                                <dd className="col-span-2 font-medium">: {student.user?.name || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">NIS / NISN</dt>
                                <dd className="col-span-2">: {student.user?.nomor_induk || '-'} / {student.nisn || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">NIK</dt>
                                <dd className="col-span-2">: {student.nik || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Jenis Kelamin</dt>
                                <dd className="col-span-2">: {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Tempat, Tgl Lahir</dt>
                                <dd className="col-span-2">: {student.birth_place}, {student.birth_date}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Agama</dt>
                                <dd className="col-span-2">: {student.religion}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Kewarganegaraan</dt>
                                <dd className="col-span-2">: {student.citizenship}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Anak ke-</dt>
                                <dd className="col-span-2">: {student.child_order} dari {student.siblings_count} bersaudara</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Asal Daerah</dt>
                                <dd className="col-span-2">: {student.origin_region || '-'}</dd>
                            </dl>
                        </div>

                        {/* Data Fisik & Tempat Tinggal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Fisik & Tempat Tinggal</h3>
                            <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground print:text-black">Tinggi / Berat</dt>
                                <dd className="col-span-2">: {student.height || '-'} cm / {student.weight || '-'} kg</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Golongan Darah</dt>
                                <dd className="col-span-2">: {student.blood_type || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Alamat Lengkap</dt>
                                <dd className="col-span-2">: {student.address}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Tinggal Bersama</dt>
                                <dd className="col-span-2">: {student.living_with || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Penanggung Biaya</dt>
                                <dd className="col-span-2">: {student.financial_sponsor || '-'}</dd>
                            </dl>
                        </div>

                        {/* Data Ayah */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Data Ayah</h3>
                            <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground print:text-black">Nama Ayah</dt>
                                <dd className="col-span-2">: {student.father_name || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">NIK</dt>
                                <dd className="col-span-2">: {student.father_nik || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Tahun Lahir</dt>
                                <dd className="col-span-2">: {student.father_birth_year || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Pendidikan</dt>
                                <dd className="col-span-2">: {student.father_education || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Pekerjaan</dt>
                                <dd className="col-span-2">: {student.father_occupation || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Penghasilan</dt>
                                <dd className="col-span-2">: {student.father_income || '-'}</dd>
                            </dl>
                        </div>

                        {/* Data Ibu */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Data Ibu</h3>
                            <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground print:text-black">Nama Ibu</dt>
                                <dd className="col-span-2">: {student.mother_name || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">NIK</dt>
                                <dd className="col-span-2">: {student.mother_nik || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Tahun Lahir</dt>
                                <dd className="col-span-2">: {student.mother_birth_year || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Pendidikan</dt>
                                <dd className="col-span-2">: {student.mother_education || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Pekerjaan</dt>
                                <dd className="col-span-2">: {student.mother_occupation || '-'}</dd>

                                <dt className="font-medium text-muted-foreground print:text-black">Penghasilan</dt>
                                <dd className="col-span-2">: {student.mother_income || '-'}</dd>
                            </dl>
                        </div>

                        {/* Data Wali (Optional) */}
                        {student.guardian_name && (
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-semibold border-b pb-2 text-primary print:text-black">Data Wali</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <dl className="grid grid-cols-3 gap-2 text-sm">
                                        <dt className="font-medium text-muted-foreground print:text-black">Nama Wali</dt>
                                        <dd className="col-span-2">: {student.guardian_name}</dd>

                                        <dt className="font-medium text-muted-foreground print:text-black">NIK</dt>
                                        <dd className="col-span-2">: {student.guardian_nik || '-'}</dd>

                                        <dt className="font-medium text-muted-foreground print:text-black">Tahun Lahir</dt>
                                        <dd className="col-span-2">: {student.guardian_birth_year || '-'}</dd>
                                    </dl>
                                    <dl className="grid grid-cols-3 gap-2 text-sm">
                                        <dt className="font-medium text-muted-foreground print:text-black">Pendidikan</dt>
                                        <dd className="col-span-2">: {student.guardian_education || '-'}</dd>

                                        <dt className="font-medium text-muted-foreground print:text-black">Pekerjaan</dt>
                                        <dd className="col-span-2">: {student.guardian_occupation || '-'}</dd>

                                        <dt className="font-medium text-muted-foreground print:text-black">Alamat</dt>
                                        <dd className="col-span-2">: {student.guardian_address || '-'}</dd>
                                    </dl>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Print Footer */}
                    <div className="hidden print:block mt-16 pt-8 border-t text-center text-xs text-muted-foreground">
                        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
