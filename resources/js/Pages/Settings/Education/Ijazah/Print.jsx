import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';

export default function IjazahPrint({ student, averageScore, settings, schoolInfo, academicYear, totalScore, totalScoreText, subjectsProcessed, candidates = [] }) {
    const toArabicNumerals = (str) => {
        if (str === null || str === undefined || str === '') return '';

        const numerals = {
            '0': '٠',
            '1': '١',
            '2': '٢',
            '3': '٣',
            '4': '٤',
            '5': '٥',
            '6': '٦',
            '7': '٧',
            '8': '٨',
            '9': '٩',
        };

        return String(str).replace(/[0-9]/g, (s) => numerals[s]);
    };

    const getPredicate = (score) => {
        if (score >= 90) return 'ممتاز';
        if (score >= 75) return 'جيد جدا';
        if (score >= 60) return 'جيد';
        return 'مقبول';
    };

    const predicate = getPredicate(averageScore);
    const roundedAvg = Math.round(averageScore);

    const bodyTop = settings.ijazah_body_top || 'قد أتم دراسة المرحلة الثانوية';
    const bodyBottom = settings.ijazah_body_bottom || 'والمعهد إذ يمنح هذه الشهادة';
    const mudirName = settings.ijazah_mudir_name || '(Nama Mudir)';
    const headmasterSignature = schoolInfo?.headmaster_signature ? `/storage/${schoolInfo.headmaster_signature}` : null;
    const stampImage = schoolInfo?.stamp_image ? `/storage/${schoolInfo.stamp_image}` : null;

    const getTodayGregorian = () => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}-${mm}-${d.getFullYear()}`;
    };

    const getTodayHijri = () => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const hijriY = d.getFullYear() - 579;
        return `${dd}-${mm}-${hijriY}`;
    };

    const hijriDate = settings.ijazah_hijri_date || getTodayHijri();
    const gregorianDate = settings.ijazah_gregorian_date || getTodayGregorian();

    const nameArab = student.user?.nama_arab || student.user?.name || '-';
    const place = student.birth_place_ar || student.birth_place || '...';
    const masehiYear = new Date(student.birth_date).getFullYear();
    const hijriBirthYear = Number.isNaN(masehiYear) ? '...' : (masehiYear - 579);

    const birthString = `المولود في ${place} عام: ${toArabicNumerals(hijriBirthYear)}هـ / ${toArabicNumerals(masehiYear)}م`;

    const getHijriAcademicYear = (academicYearName) => {
        if (!academicYearName) return '...';

        try {
            const parts = academicYearName.split('/');
            if (parts.length === 2) {
                const startG = parseInt(parts[0], 10);
                const endG = parseInt(parts[1], 10);

                if (!Number.isNaN(startG) && !Number.isNaN(endG)) {
                    const startH = startG - 579;
                    const endH = endG - 579;
                    return `${toArabicNumerals(startH)}/${toArabicNumerals(endH)}هـ`;
                }
            }
        } catch (e) {
            console.error('Year parsing error', e);
        }

        return academicYearName;
    };

    const hijriYear = getHijriAcademicYear(academicYear?.name || settings.academicYear?.name || '');

    useEffect(() => {
        // Auto print
        // window.print();
    }, []);

    return (
        <div className="bg-white min-h-screen" style={{ fontFamily: 'Amiri, serif' }}>
            <Head title={`Ijazah - ${nameArab}`} />

            <Tabs defaultValue="single" className="w-full">
                {/* Tab Navigation - Hidden during print */}
                <div className="print:hidden bg-gray-100 p-4 border-b">
                    <div className="max-w-4xl mx-auto">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="single">Cetak Ijazah (Per Santri)</TabsTrigger>
                            <TabsTrigger value="recap">Rekapitulasi Nilai (3 Tsanawy)</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Tab Content - Single Student Print View */}
                <TabsContent value="single" className="print:block">
                <div className="bg-white min-h-screen text-right" dir="rtl">
                    <div
                        className="mx-auto w-[210mm] min-h-[297mm] relative bg-white shadow-lg print:shadow-none print:w-full flex flex-col items-center justify-between text-black"
                        style={{ paddingTop: '6.5cm', paddingLeft: '2.7cm', paddingRight: '2.7cm', paddingBottom: '2.7cm' }}
                    >
                        <div className="w-full text-2xl leading-loose mb-6 text-center">
                            الحمد لله رب العالمين والصلاة والسلام على الحبيب الأمين محمد وعلى آله وصحبه أجمعين، وبعد:
                        </div>

                        <div className="w-full space-y-4 text-center">
                            <div className="text-2xl">
                                فإن الابن الطالب <span className="font-bold">{nameArab}</span>
                            </div>

                            <div className="text-2xl">{birthString}</div>

                            <div className="mx-auto max-w-[95%] text-2xl leading-relaxed text-center">
                                {bodyTop}
                            </div>

                            <div className="text-2xl" dir="rtl">
                                وتخرج في العام الدراسي {hijriYear} الموافق {toArabicNumerals(academicYear?.name || '...')}م
                            </div>

                            <div className="text-2xl">
                                وقد قرر المعهد على نجاحه بمعدل: {toArabicNumerals(roundedAvg)} بتقدير {predicate}
                            </div>

                            <div className="mx-auto max-w-[95%] text-2xl leading-relaxed text-center">
                                {bodyBottom}
                            </div>
                        </div>

                        <div className="w-full flex justify-between items-end text-xl mt-10 px-4">
                            <div className="text-right w-1/3 mb-36" dir="rtl">
                                <p>سجلت برقم: {toArabicNumerals(student.user?.nomor_induk || student.nomor_induk)}</p>
                                <div className="mt-1">
                                    <p>وتاريخ: {hijriDate ? `${toArabicNumerals(hijriDate)} هـ` : '-'}</p>
                                    <p className="mr-12">{gregorianDate ? `${toArabicNumerals(gregorianDate)}م` : '-'}</p>
                                </div>
                            </div>

                            <div className="w-1/3 flex justify-center">
                                <div className="w-28 h-36 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-sm relative">
                                    صورة
                                    {/* Optional: Add Stamp here too if needed */}
                                </div>
                            </div>

                            <div className="w-1/3 text-center relative">
                                <p className="mb-2 font-bold">مدير المعهد</p>
                                
                                {/* Signature Area Cascade */}
                                <div className="h-32 flex items-center justify-center relative w-full mb-2">
                                     {stampImage && (
                                        <img 
                                            src={stampImage} 
                                            alt="Stempel" 
                                            className="h-28 w-28 object-contain absolute left-0 bottom-2 opacity-80 mix-blend-multiply -rotate-6 z-10"
                                        />
                                    )}
                                    {/* Option 1: Profile/Setting Signature */}
                                    {headmasterSignature && (
                                        <img 
                                            src={headmasterSignature} 
                                            alt="TTD Mudir" 
                                            className="h-24 object-contain absolute bottom-4 z-30"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    {/* Option 2: Legacy File by NIP (using settings.ijazah_mudir_niy if available, or just nomor_induk of headmaster if we had it) */}
                                    {/* Note: Ijazah mudir might be different from school headmaster, but we use the global one here */}
                                </div>

                                <p className="font-bold underline text-2xl">{mudirName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mx-auto w-[210mm] h-[297mm] p-8 relative bg-white shadow-lg print:shadow-none print:w-full print:break-before-page flex flex-col items-center">
                        <div className="w-full h-full p-6 pt-2">
                            <div className="w-full mb-2 border-b-4 border-double border-black pb-2">
                                <div className="text-center space-y-1">
                                    <div className="text-lg font-bold">بسم الله الرحمن الرحيم</div>
                                    <h1 className="text-xl font-bold mt-1">نتيجة الامتحان النهائي للمرحلة الثانوية</h1>
                                </div>

                                <div className="mt-4 flex justify-between items-end text-base font-bold px-2">
                                    <div>
                                        <span>الاسم : </span>
                                        <span>{nameArab}</span>
                                    </div>
                                    <div>
                                        <span>العام الدراسي : </span>
                                        <span>{hijriYear}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full text-right text-lg font-bold mb-1 pr-2">درجات المواد</div>
                            <table className="w-full text-sm border-collapse border-2 border-slate-800 text-center uppercase" dir="rtl">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-slate-800 p-2 w-12" rowSpan="2">الرقم</th>
                                        <th className="border border-slate-800 p-2" rowSpan="2">المواد الدراسية</th>
                                        <th className="border border-slate-800 p-2 w-20" rowSpan="2">النهاية الكبرى</th>
                                        <th className="border border-slate-800 p-2 w-20" rowSpan="2">النهاية الصغرى</th>
                                        <th className="border border-slate-800 p-2 text-center" colSpan="2">الدرجة المستحقة</th>
                                    </tr>
                                    <tr className="bg-slate-100">
                                        <th className="border border-slate-800 p-2 w-20">رقماً</th>
                                        <th className="border border-slate-800 p-2">كتابة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(subjectsProcessed || []).map((subj, index) => (
                                        <tr key={index}>
                                            <td className="border border-slate-800 p-1">{toArabicNumerals(index + 1)}</td>
                                            <td className="border border-slate-800 p-1 text-right pr-4 font-bold">{subj.name_ar}</td>
                                            <td className="border border-slate-800 p-1">{toArabicNumerals(subj.max_score || 100)}</td>
                                            <td className="border border-slate-800 p-1">{toArabicNumerals(subj.min_score || 70)}</td>
                                            <td className="border border-slate-800 p-1 font-bold">
                                                {subj.final_score > 0 ? toArabicNumerals(subj.final_score) : '-'}
                                            </td>
                                            <td className="border border-slate-800 p-1 text-sm font-bold">
                                                {subj.score_text !== '-' ? subj.score_text : '-'}
                                            </td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <td colSpan="4" className="border border-slate-800 p-2 font-bold bg-slate-100">المجموع العام</td>
                                        <td className="border border-slate-800 p-2 font-bold">{toArabicNumerals(totalScore)}</td>
                                        <td className="border border-slate-800 p-2"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-2 w-full text-base space-y-1">
                                <div className="flex border-b border-slate-300 pb-1">
                                    <span className="font-bold w-40">المجموع بالحروف:</span>
                                    <span>{totalScoreText}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-300 pb-1">
                                    <div className="flex">
                                        <span className="font-bold w-32">النتيجة النهائية:</span>
                                        <span>{predicate === 'راسب' ? 'راسب' : 'ناجح'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-bold w-20">التقدير:</span>
                                        <span>{predicate}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-bold w-32">المعدل التراكمي:</span>
                                        <span>{toArabicNumerals(roundedAvg)}</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="absolute bottom-12 text-lg text-center"
                                dir="ltr"
                                style={{ left: '3rem', right: 'auto' }}
                            >
                                <div className="w-48 relative">
                                    <p className="mb-2 font-bold text-right" dir="rtl">مدير المعهد</p>
                                    
                                    {/* Signature Area Cascade for Back Page */}
                                    <div className="h-24 flex items-center justify-end relative w-full mb-2">
                                        {headmasterSignature && (
                                            <img 
                                                src={headmasterSignature} 
                                                alt="TTD Mudir" 
                                                className="h-20 object-contain z-20"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                    </div>

                                    <p className="font-bold text-right" dir="rtl">{mudirName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* Tab Content - Recap View */}
            <TabsContent value="recap" className="print:block">
                <div className="max-w-7xl mx-auto p-8">
                    <h1 className="text-2xl font-bold mb-6 text-center">Rekapitulasi Nilai Ijazah - 3 Tsanawy</h1>
                    
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 p-2">Rank</th>
                                    <th className="border border-gray-300 p-2">Nama</th>
                                    <th className="border border-gray-300 p-2">Nama Arab</th>
                                    <th className="border border-gray-300 p-2">Kelas</th>
                                    <th className="border border-gray-300 p-2">Rata-rata</th>
                                    <th className="border border-gray-300 p-2">Total</th>
                                    {(subjectsProcessed || []).map((subj, index) => (
                                        <th key={index} className="border border-gray-300 p-2 text-xs">
                                            {subj.name_ar}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((candidate, index) => (
                                    <tr key={candidate.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-300 p-2 text-center font-bold">{candidate.rank}</td>
                                        <td className="border border-gray-300 p-2">{candidate.name}</td>
                                        <td className="border border-gray-300 p-2 font-arabic" dir="rtl">{candidate.nama_arab}</td>
                                        <td className="border border-gray-300 p-2">{candidate.class_name}</td>
                                        <td className="border border-gray-300 p-2 text-center font-bold">{candidate.average_score}</td>
                                        <td className="border border-gray-300 p-2 text-center">{candidate.total_score}</td>
                                        {candidate.subjects.map((subj, sIndex) => (
                                            <td key={sIndex} className="border border-gray-300 p-2 text-center">
                                                {subj.final_score > 0 ? subj.final_score : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </TabsContent>
            </Tabs>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
                @media print {
                    @page { margin: 0; size: A4; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none; }
                }
            `}</style>
        </div>
    );
}
