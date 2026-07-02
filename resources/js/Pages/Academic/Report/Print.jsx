
import { Head } from '@inertiajs/react';
import { Printer, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';

export default function Print({
    student,
    student_user,
    active_class,
    academic_year,
    grades,
    rank,
    total_students,
    average_score,
    behaviors,
    attendance,
    note,
    settings,
    decision,
}) {

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    const getPredicate = (score, kkm) => {
        if (score < kkm) return 'D';
        if (score < 80) return 'C';
        if (score < 90) return 'B';
        return 'A';
    };

    // Settings
    const reportDate = settings.report_date ? formatDate(settings.report_date) : formatDate(new Date().toISOString());
    const headmasterName = settings.headmaster_name || 'Kepala Sekolah';
    const headerImage = settings.report_header_image ? `/storage/${settings.report_header_image}` : null;
    const stampImage = settings.stamp_image ? `/storage/${settings.stamp_image}` : null;
    const headmasterSignature = settings.headmaster_signature ? `/storage/${settings.headmaster_signature}` : null;
    const totalScore = parseFloat(grades.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0).toFixed(1));

    // Bilingual Labels
    const labels = {
        name: { id: 'Nama', ar: 'الاسم' },
        class: { id: 'Kelas', ar: 'الصف' },
        semester: { id: 'Semester', ar: 'الفصل الدراسي' },
        year: { id: 'Tahun Ajaran', ar: 'العام الدراسي' },
    };

    // Helper: Convert Latin to Arabic Numerals
    const toArabicNums = (str) => {
        if (!str) return '';
        const id = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.toString().replace(/[0-9]/g, w => ar[id.indexOf(w)]);
    };

    // Helper: Map Class Name to Arabic (Simple Heuristic)
    const getArabicClassName = (className, jenjangName, paralelName) => {
        const numMatch = className.match(/\d+/);
        const num = numMatch ? parseInt(numMatch[0], 10) : null;
        let ordinal = '';
        if (num) {
            const ordinals = { 1:'الأول', 2:'الثاني', 3:'الثالث', 4:'الرابع', 5:'الخامس', 6:'السادس', 7:'السابع', 8:'الثامن', 9:'التاسع', 10:'العاشر', 11:'الحادي عشر', 12:'الثاني عشر' };
            ordinal = ordinals[num] || toArabicNums(num);
        }
        let levelAr = '';
        const levelStr = (jenjangName + ' ' + className).toLowerCase();
        if (levelStr.includes('ibtida')) levelAr = 'الإبتدائي';
        else if (levelStr.includes('mutawas')) levelAr = 'المتوسط';
        else if (levelStr.includes('tsanaw') || levelStr.includes('aliyah')) levelAr = 'الثانوي';
        
        let arClass = '';
        if (ordinal && levelAr) {
            arClass = `${ordinal} ${levelAr}`;
        } else {
            arClass = className.replace(/\d+/g, (d) => toArabicNums(d)); // Convert numbers

            // Map levels - separate Tsanawiyah from Mutawassith
            if (jenjangName?.includes('Ibtida')) arClass = arClass.replace(/Ibtidai?y?a?h?/i, 'الإبتدائية');
            if (jenjangName?.includes('Tsanaw')) arClass = arClass.replace(/Tsanawiy?a?h?/i, 'الثانوية');
            if (jenjangName?.includes('Mutawas')) arClass = arClass.replace(/Mutawas+i?t?h?/i, 'المتوسطة');
            if (jenjangName?.includes('Aliyah')) arClass = arClass.replace(/Aliyah?/i, 'الثانوية');
        }

        // Map Paralel Name (e.g. A, B, C)
        if (paralelName) {
            const parMap = { 'A': 'أ', 'B': 'ب', 'C': 'ج', 'D': 'د', 'E': 'هـ', 'F': 'و' };
            const arPar = parMap[paralelName.toUpperCase()] || paralelName;
            arClass += ' ' + arPar;
        }

        return arClass;
    };

    return (
        <div className="font-sans antialiased bg-gray-100 min-h-screen p-0 md:p-8 print:bg-white print:p-0">
            <Head title={`Rapor - ${student.name}`} />
            <style>{`
                @page {
                    size: legal;
                    margin: 0cm;
                }

                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .report-page {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>

            {/* Print Buttons */}
            <div className="fixed bottom-4 right-4 z-50 print:hidden flex gap-3">
                <button
                    onClick={() => {
                        const element = document.getElementById('report-container');
                        
                        // Show loading state
                        Swal.fire({
                            title: 'Menyiapkan PDF...',
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });
                        
                        
                        
                        // Temporarily reset margins and paddings to prevent html2canvas offset issues
                        const parent = element.parentElement;
                        const originalParentPadding = parent.style.padding;
                        const originalElementMargin = element.style.margin;
                        
                        parent.style.setProperty('padding', '0', 'important');
                        element.style.setProperty('margin', '0', 'important');
                        // Scroll to top to ensure exact capture
                        window.scrollTo(0, 0);

                        const opt = {
                            margin:       0,
                            filename:     `Rapor_${student.name}.pdf`,
                            image:        { type: 'jpeg', quality: 1 },
                            html2canvas:  { scale: 2, useCORS: true },
                            jsPDF:        { unit: 'cm', format: 'legal', orientation: 'portrait' }
                        };

                        html2pdf().set(opt).from(element).save().then(() => {
                            // Restore original styles
                            parent.style.padding = originalParentPadding;
                            element.style.margin = originalElementMargin;
                            Swal.close();
                        });
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all font-medium"
                >
                    <Download className="w-5 h-5" />
                    Download PDF
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all font-medium"
                >
                    <Printer className="w-5 h-5" />
                    Cetak Rapor
                </button>
            </div>

            {/* Legal Size Container (215mm x 330mm) */}
            <div id="report-container" className="report-page mx-auto box-border bg-white shadow-xl print:shadow-none w-[21.59cm] min-h-[35.56cm] px-[1cm] pt-[2cm] pb-[1cm] print:h-auto print:min-h-0 print:max-w-none print:overflow-visible relative flex flex-col">

                {/* Header System vs Pre-printed */}
                {settings.header_config?.use_system_header ? (
                    <div className="mb-2 border-b-4 border-black pb-2 relative flex items-center justify-center min-h-[100px]">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            {settings.kop_image && (
                                <img src={`/storage/${settings.kop_image}`} alt="Logo" className="w-24 h-24 object-contain" />
                            )}
                        </div>
                        <div className="text-center px-2 w-full">
                            {settings.header_config?.yayasan_name && (
                                <h2 className="text-lg font-bold uppercase tracking-wide leading-tight">
                                    {settings.header_config.yayasan_name}
                                </h2>
                            )}
                            {settings.header_config?.institution_name && (
                                <h1 
                                    className="text-2xl font-black uppercase tracking-widest text-emerald-800 leading-snug print:text-black"
                                    style={{ fontFamily: "'Cooper Black', 'Georgia', serif" }}
                                >
                                    {settings.header_config.institution_name}
                                </h1>
                            )}
                            {settings.header_config?.institution_location && (
                                <h2 className="text-lg font-bold uppercase tracking-wide leading-tight">
                                    {settings.header_config.institution_location}
                                </h2>
                            )}
                            {settings.address && (
                                <p className="text-xs mt-1 leading-tight">{settings.address}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-14"></div>
                )}

                <header className="mb-2 text-center relative pt-0">

                    <div className="space-y-0.5">
                        <h1 className="text-3xl font-bold font-arabic mb-0">كشف الدرجات</h1>
                        {/* Dynamic Marhalah */}
                        <h2 className="text-base font-arabic font-medium leading-tight">
                            {(() => {
                                const jenjang = active_class.kelas?.jenjang;
                                if (!jenjang) return 'للمرحلة الدراسية';
                                if (jenjang.nama_arab) return jenjang.nama_arab; // Use DB value if exists

                                const name = jenjang.name;
                                if (name.includes("Ibtida")) return 'للمرحلة الإبتدائية';
                                if (name.includes("Mutawassith")) return 'للمرحلة المتوسطة';
                                if (name.includes("Tsanawy") || name.includes("Aliyah")) return 'للمرحلة الثانوية';
                                return 'للمرحلة الدراسية';
                            })()}
                        </h2>
                    </div>
                </header>

                {/* Identity Section - Bilingual Left/Right */}
                <div className="flex justify-between items-start mb-2 text-xs font-medium px-1 leading-tight">
                    {/* Left: Indonesian */}
                    <table className="w-1/2">
                        <tbody>
                            <tr>
                                <td className="w-24 py-0.5">Nama Santri</td>
                                <td className="w-3 text-center">:</td>
                                <td className="uppercase font-bold">{student.name}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5">Nomor Induk</td>
                                <td className="text-center">:</td>
                                <td>{student.nomor_induk || student.nisn}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5">Kelas</td>
                                <td className="text-center">:</td>
                                <td className="uppercase">{active_class.kelas.name} {active_class.kelas_paralel?.name}</td>
                            </tr>
                            <tr>
                                <td className="py-0.5">Semester</td>
                                <td className="text-center">:</td>
                                <td>{academic_year.semester}</td>
                            </tr>
                             <tr>
                                 <td className="py-0.5">Tahun Ajaran</td>
                                 <td className="text-center">:</td>
                                 <td>{academic_year.name}</td>
                             </tr>
                         </tbody>
                    </table>

                     {/* Right: Arabic (RTL) */}
                     <table className="w-1/2" dir="rtl">
                         <tbody>
                             <tr>
                                 <td className="w-24 py-0.5 font-arabic font-bold">الاسم</td>
                                 <td className="w-3 text-center">:</td>
                                 <td className="font-arabic text-lg font-bold">{student_user.nama_arab || '-'}</td>
                             </tr>
                             <tr>
                                 <td className="py-0.5 font-arabic">الصف</td>
                                 <td className="text-center">:</td>
                                 <td className="font-arabic">{getArabicClassName(active_class.kelas.name, active_class.kelas?.jenjang?.name, active_class.kelas_paralel?.name)}</td>
                             </tr>
                             <tr>
                                 <td className="py-0.5 font-arabic">الفصل الدراسي</td>
                                 <td className="text-center">:</td>
                                 <td className="font-arabic">{academic_year.semester === 'Ganjil' ? 'الأول' : 'الثاني'}</td>
                             </tr>
                             <tr>
                                 <td className="py-0.5 font-arabic">العام الدراسي</td>
                                 <td className="text-center">:</td>
                                 <td className="font-arabic">{toArabicNums(academic_year.name)}</td>
                             </tr>
                         </tbody>
                     </table>
                </div>

                {/* Grades Section - Split Layout */}
                <div className="flex justify-between gap-1 mb-1.5">
                    {/* Left Table: Indonesian */}
                    <div className="w-[49%]">
                        <table className="w-full text-[10px] border-collapse border border-black h-full leading-tight">
                            <thead className="text-center bg-gray-100 h-8">
                                <tr>
                                    <th className="border border-black w-6">NO</th>
                                    <th className="border border-black">MATA PELAJARAN</th>
                                    <th className="border border-black w-8">KKM</th>
                                    <th className="border border-black w-8">NILAI</th>
                                    <th className="border border-black w-10">Rata-rata Kelas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((item, index) => (
                                    <tr key={index} className="text-center h-4">
                                        <td className="border border-black">{index + 1}.</td>
                                        <td className="border border-black px-1.5 text-left">{item.mapel}</td>
                                        <td className="border border-black">{item.kkm}</td>
                                        <td className={`border border-black font-bold ${item.score < item.kkm ? 'text-red-600' : ''}`}>
                                            {item.score}
                                        </td>
                                        <td className="border border-black">{item.class_avg}</td>
                                    </tr>
                                ))}
                                {/* Summary Rows Left */}
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-left px-2">Jumlah Nilai</td>
                                    <td colSpan="2" className="border border-black text-center">{totalScore}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-left px-2">Rata-rata</td>
                                    <td colSpan="2" className="border border-black text-center">{average_score}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-left px-2">Rangking</td>
                                    <td colSpan="2" className="border border-black text-center">{rank && rank >= 1 && rank <= 10 ? rank : '-'}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-left px-2">Jumlah Santri</td>
                                    <td colSpan="2" className="border border-black text-center">{total_students}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Right Table: Arabic (Mirrored Order) */}
                    <div className="w-[49%]">
                        <table className="w-full text-[10px] border-collapse border border-black h-full leading-tight" dir="rtl">
                            <thead className="text-center bg-gray-100 h-8 font-arabic">
                                <tr>
                                    <th className="border border-black w-6">رقم</th>
                                    <th className="border border-black">المواد الدراسية</th>
                                    <th className="border border-black w-8 text-[10px]">الدرجة الصغرى</th>
                                    <th className="border border-black w-8">النتيجة</th>
                                    <th className="border border-black w-12 text-[10px]">المعدل التراكمي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((item, index) => (
                                    <tr key={index} className="text-center h-4">
                                        <td className="border border-black font-arabic">{toArabicNums(index + 1)}.</td>
                                        <td className="border border-black px-1.5 text-right font-arabic">{item.mapel_ar || '-'}</td>
                                        <td className="border border-black font-arabic">{toArabicNums(item.kkm)}</td>
                                        <td className={`border border-black font-bold font-arabic ${item.score < item.kkm ? 'text-red-600' : ''}`}>
                                            {toArabicNums(item.score)}
                                        </td>
                                        <td className="border border-black font-arabic">{toArabicNums(item.class_avg)}</td>
                                    </tr>
                                ))}
                                {/* Summary Rows Right - Label (Right) then Value (Left) */}
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-right px-2 font-arabic">مجموع الدرجات</td>
                                    <td colSpan="2" className="border border-black text-center font-arabic">{toArabicNums(totalScore)}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-right px-2 font-arabic">المعدل التراكمي</td>
                                    <td colSpan="2" className="border border-black text-center font-arabic">{toArabicNums(average_score)}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-right px-2 font-arabic">الترتيب</td>
                                    <td colSpan="2" className="border border-black text-center font-arabic">{rank && rank >= 1 && rank <= 10 ? toArabicNums(rank) : '-'}</td>
                                </tr>
                                <tr className="font-bold h-4">
                                    <td colSpan="3" className="border border-black text-right px-2 font-arabic">عدد الطلاب</td>
                                    <td colSpan="2" className="border border-black text-center font-arabic">{toArabicNums(total_students)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section: Behavior & Attendance Split */}
                <div className="flex justify-between gap-1 mb-1.5 h-auto">

                    {/* LEFT BLOCK: Kepribadian & Kehadiran (Latin) */}
                    <div className="w-[49%] flex border border-black">
                        {/* Kepribadian Left */}
                        <div className="flex-1 border-r border-black">
                            <h3 className="font-bold text-[10px] px-1 border-b border-black text-center h-4 flex items-center justify-center">Kepribadian</h3>
                            <table className="w-full text-[10px] border-collapse leading-tight">
                                <tbody>
                                    {[
                                        { key: 'Ibadah', label: 'Ibadah' },
                                        { key: 'Kepatuhan', label: 'Kepatuhan' },
                                        { key: 'Kedisiplinan', label: 'Kedisiplinan' },
                                        { key: 'Kebersihan', label: 'Kebersihan' },
                                        { key: 'Kesopanan', label: 'Kesopanan' },
                                        { key: 'Kerajinan', label: 'Kerajinan' },
                                    ].map((aspect, i) => (
                                        <tr key={aspect.key} className="h-4">
                                            <td className="border-b border-r border-black px-2">{aspect.label}</td>
                                            <td className="border-b border-black text-center w-10">
                                                {behaviors && behaviors[aspect.key] ? behaviors[aspect.key].score : 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Kehadiran Right (of Left Block) */}
                        <div className="w-[35%]">
                            <h3 className="font-bold text-[10px] px-1 border-b border-black text-center h-4 flex items-center justify-center">Kehadiran</h3>
                            <table className="w-full text-[10px] border-collapse leading-tight">
                                <tbody>
                                    <tr className="h-4">
                                        <td className="border-b border-r border-black px-2">Sakit</td>
                                        <td className="border-b border-black text-center w-8">{attendance.sakit}</td>
                                    </tr>
                                    <tr className="h-4">
                                        <td className="border-b border-r border-black px-2">Izin</td>
                                        <td className="border-b border-black text-center w-8">{attendance.izin}</td>
                                    </tr>
                                    <tr className="h-4">
                                        <td className="border-b border-r border-black px-2">Alpa</td>
                                        <td className="border-b border-black text-center w-8">{attendance.alpha}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT BLOCK: Attendance & Behavior (Arabic) */}
                    <div className="w-[49%] flex border border-black" dir="rtl">
                        {/* Behavior Right (Arabic, Far Right visually) */}
                        <div className="flex-1 border-l border-black">
                            <h3 className="font-bold text-[11px] px-1 border-b border-black text-center h-5 flex items-center justify-center font-arabic">السلوك</h3>
                            <table className="w-full text-[10px] border-collapse leading-tight" dir="rtl">
                                <tbody>
                                    {[
                                        { key: 'Ibadah', ar: 'العبادة' },
                                        { key: 'Kepatuhan', ar: 'الطاعة' },
                                        { key: 'Kedisiplinan', ar: 'المواظبة' },
                                        { key: 'Kebersihan', ar: 'النظافة' },
                                        { key: 'Kesopanan', ar: 'الأدب' },
                                        { key: 'Kerajinan', ar: 'النشاط' },
                                    ].map((aspect) => (
                                        <tr key={aspect.key} className="h-4">
                                            <td className="border-b border-l border-black px-2 font-arabic text-right">{aspect.ar}</td>
                                            <td className="border-b border-black text-center w-10 font-arabic">
                                                {toArabicNums(behaviors && behaviors[aspect.key] ? behaviors[aspect.key].score : 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Attendance Left (of Right Block) */}
                        <div className="w-[35%]">
                            <h3 className="font-bold text-[11px] px-1 border-b border-black text-center h-5 flex items-center justify-center font-arabic">سجل الحضور</h3>
                            <table className="w-full text-[10px] border-collapse leading-tight" dir="rtl">
                                <tbody>
                                    <tr className="h-4">
                                        <td className="border-b border-l border-black px-2 font-arabic text-right">المرض</td>
                                        <td className="border-b border-black text-center w-8 font-arabic">{toArabicNums(attendance.sakit)}</td>
                                    </tr>
                                    <tr className="h-4">
                                        <td className="border-b border-l border-black px-2 font-arabic text-right">الإذن</td>
                                        <td className="border-b border-black text-center w-8 font-arabic">{toArabicNums(attendance.izin)}</td>
                                    </tr>
                                    <tr className="h-4">
                                        <td className="border-b border-l border-black px-2 font-arabic text-right">الغياب</td>
                                        <td className="border-b border-black text-center w-8 font-arabic">{toArabicNums(attendance.alpha)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Note Section - Arabic Style */}
                <div className="mb-2 border border-black flex">
                    <div className="flex-1 p-1.5 text-xs text-justify leading-snug font-serif relative">
                        {/* Check if note content exists, else default text */}
                        <p className="whitespace-pre-wrap px-2 py-1">
                            {note || "Semoga ananda tetap istiqamah dalam belajar dan tidak cepat puas. Semoga Allah selalu menuntun ananda untuk menjadi pribadi yang berilmu, beradab, dan bermanfaat bagi umat. Jazaakumullahukhairaa khairan atas usaha yang sudah dilakukan wabaarakallahu fiikum"}
                        </p>
                    </div>
                    <div className="w-24 border-l border-black flex items-center justify-center bg-gray-50">
                        <span className="font-arabic font-bold text-[15px]">الملاحظة</span>
                    </div>
                </div>


                {/* Conclusion Box (Al-Qarar) - Only for Semester 2 (Genap) */}
                {academic_year.semester === 'Genap' && decision && (
                    <div className="mb-2 border border-black px-4 py-3 flex justify-end">
                        <div className="w-full text-right" dir="rtl">
                            
                            <p className="font-arabic text-base mb-2 leading-relaxed"><span className="font-bold">القرار : </span>
                                بناءً على النتائج التي تحققت في الفصل الدراسي الأول والثاني ، يثبت أن الطالب <span className="font-bold underline text-lg px-1">{decision.status_ar || 'ناجح'}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Signatures - 2 Columns (Parent & Homeroom) per user request for Semester 1 */}
                {/* Signatures */}
                <div className="mt-2 pt-1 text-xs px-6">
                    <div className="flex justify-between items-start text-center">
                        {/* Parent (Left) */}
                        {/* Parent (Left) */}
                        <div className="w-1/3">
                            {/* Invisible Date Placeholder for Alignment */}
                            <p className="mb-1 font-arabic text-[15px] text-center invisible">00 Januari 0000</p>
                            <p className="mb-0 font-arabic font-bold text-[15px]">ولي الأمر</p>

                            {/* Signature Spacer used to match Right Side Image Height */}
                            <div className="h-16 w-full my-1"></div>

                            <p className="font-bold border-b border-black text-[13px] uppercase inline-block min-w-[150px]">
                                ( {student.father_name || "......................................."} )
                            </p>
                        </div>

                        {/* Homeroom (Right) */}
                        <div className="w-1/3 relative">
                            {/* Date in Arabic */}
                            <p className="mb-1 font-arabic text-[15px] text-center" dir="rtl">
                                {(() => {
                                    const reportPlace = settings.report_place_ar || 'ماجيلانج'; // Default to Magelang
                                    const dateObj = settings.report_date ? new Date(settings.report_date) : new Date();
                                    const day = toArabicNums(dateObj.getDate());
                                    const year = toArabicNums(dateObj.getFullYear());
                                    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    const month = months[dateObj.getMonth()];
                                    return `${reportPlace}، ${day} ${month} ${year}`;
                                })()}
                            </p>
                            <p className="mb-0 font-arabic font-bold text-[15px] text-center">مشرف الصف</p>

                            {/* Signature Image Cascade */}
                            <div className="h-16 flex items-center justify-center relative w-full my-1">
                                {active_class.teacher?.signature && (
                                    <img
                                        src={`/storage/${active_class.teacher.signature}`}
                                        alt="TTD"
                                        className="h-16 object-contain absolute bottom-0 z-30"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                {active_class.teacher?.nomor_induk && (
                                    <img
                                        src={`/images/signature/${active_class.teacher.nomor_induk}.png`}
                                        alt="TTD Legacy"
                                        className="h-16 object-contain absolute bottom-0 z-20"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                            </div>

                            <p className="font-bold border-b border-black text-[15px] font-arabic inline-block min-w-[150px]">
                                ( {active_class.teacher?.nama_arab || active_class.teacher?.name} )
                            </p>
                            <p className="text-[11px] mt-1">NIP. {active_class.teacher?.nomor_induk || '-'}</p>
                        </div>
                    </div>


                    {/* Headmaster (Center Below) - Only for Semester 2 (Genap) */}
                    {academic_year.semester === 'Genap' && (
                        <div className="flex justify-center mt-1 text-center">
                            <div className="w-1/3 relative">
                                <p className="mb-0 font-arabic font-bold text-[15px]">مدير المدرسة</p>

                                {/* Signature & Stamp Cascade */}
                                <div className="h-20 flex items-center justify-center relative w-full my-1">
                                    {/* Stamp */}
                                    {stampImage && (
                                        <img
                                            src={stampImage}
                                            alt="Stampel"
                                            className="h-20 w-20 object-contain absolute left-8 -bottom-1 opacity-80 mix-blend-multiply -rotate-6 z-10"
                                        />
                                    )}

                                    {/* Priority 1: User Profile Signature */}
                                    {active_class.kelas?.jenjang?.headmaster?.signature && (
                                        <img
                                            src={`/storage/${active_class.kelas.jenjang.headmaster.signature}`}
                                            alt="TTD KS Profile"
                                            className="h-16 object-contain absolute bottom-0 z-30"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}

                                    {/* Priority 2: Legacy File by NIP */}
                                    {active_class.kelas?.jenjang?.headmaster?.nomor_induk && (
                                        <img
                                            src={`/images/signature/${active_class.kelas.jenjang.headmaster.nomor_induk}.png`}
                                            alt="TTD KS Legacy"
                                            className="h-16 object-contain absolute bottom-0 z-20"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}

                                    {/* Priority 3: Global Setting */}
                                    {headmasterSignature && (
                                        <img
                                            src={headmasterSignature}
                                            alt="TTD KS Setting"
                                            className="h-16 object-contain absolute bottom-0 z-10"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                </div>

                                <p className="font-bold border-b border-black text-[15px] font-arabic inline-block min-w-[150px]">
                                    ( {active_class.kelas?.jenjang?.headmaster?.nama_arab || active_class.kelas?.jenjang?.headmaster?.name || headmasterName} )
                                </p>
                                <p className="text-[11px] mt-1">NIP. {active_class.kelas?.jenjang?.headmaster?.nomor_induk || '-'}</p>
                            </div>
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
}


