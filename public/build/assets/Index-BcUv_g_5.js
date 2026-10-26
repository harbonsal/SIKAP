const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/app-Cc-lU_SH.js","assets/app-XC_0UDXS.css"])))=>i.map(i=>d[i]);
import{d as L,r as i,u as g,j as a,H as G,_ as H}from"./app-Cc-lU_SH.js";import{M as F}from"./MainLayout-KH2eYCIF.js";import{C as O,a as V,b as $,d as J,c as Q}from"./card-8O4t-pBe.js";import{B as t}from"./button-CRn3Drw-.js";import"./input-Dr29YEhG.js";import{T as q,a as W,b as m,c as s,d as X,e as n}from"./table-Dp1_Cmyc.js";import{M as d}from"./Modal-DCIcyNV4.js";import{I as Y}from"./InputLabel-BA7rxtSL.js";import{T as Z}from"./TextInput-Tz5j8zhz.js";import{I as aa}from"./InputError-L38HOmRR.js";import{D as ea}from"./DangerButton-mhH8Qa3j.js";import{S as j}from"./SecondaryButton-DIdv_Goe.js";import{P as ta}from"./PrimaryButton-9duLP0E-.js";import{C as na}from"./copy-BkDHkhsX.js";import"./sweetalert2.esm.all-BACkg63S.js";import"./utils-CDN07tui.js";import"./house-DPA4M1bk.js";import"./createLucideIcon-_TObK_83.js";import"./clipboard-check-C98H5vUC.js";import"./book-open-DbqeJx8r.js";import"./bot-CSo1KT7q.js";import"./chevron-right-D8NlhhjV.js";import"./heart-CgT9HzQU.js";import"./graduation-cap-BQKDkZif.js";import"./settings-YSp28DhS.js";import"./trash-2-nLM8Lpi_.js";import"./download--t6lSjAD.js";import"./user-CO2-w5xb.js";import"./Dropdown-BmUe6w2O.js";import"./transition-DYNzrqYL.js";import"./calendar-BndYS4sY.js";import"./chevron-down-CBz_9cJi.js";import"./check-BQEcGPj9.js";import"./dialog-DN8raKjp.js";import"./index-_Jv4I7WF.js";import"./index-CEEwpyTv.js";import"./index-t4YJyYGY.js";import"./index-CcbFgDJR.js";import"./index-Cgkxx6p9.js";import"./x-nJG0Az95.js";import"./search-ClF5mLUp.js";import"./loader-circle-snYZg220.js";import"./arrow-right-C6hsjUJ9.js";import"./AppUpdateDetector-Bn5-KTZk.js";import"./sparkles-DuqaHyfA.js";import"./info-at0Nfnss.js";import"./triangle-alert-DFeclZsL.js";import"./circle-x-BONC2Pb3.js";import"./index-B_jtOnfb.js";import"./with-selector-BcleL1jr.js";function ae({apiKeys:c}){const{app_settings:f}=L().props,[A,u]=i.useState(!1),[b,p]=i.useState(!1),[y,k]=i.useState(!1),[N,h]=i.useState(null),{data:T,setData:v,post:I,processing:P,errors:_,reset:C}=g({name:""}),{delete:D}=g(),S=()=>{u(!0)},r=()=>{u(!1),C()},B=()=>{k(!0)},x=()=>{k(!1)},K=e=>{e.preventDefault(),I(route("settings.api-keys.store"),{onSuccess:()=>r()})},w=e=>{h(e),p(!0)},o=()=>{p(!1),h(null)},M=e=>{e.preventDefault(),D(route("settings.api-keys.destroy",N),{onSuccess:()=>o()})},R=e=>{navigator.clipboard.writeText(e),alert("API Key disalin ke clipboard!")},z=e=>{if(confirm(`Apakah Anda yakin ingin ${e.is_active?"menonaktifkan":"mengaktifkan"} API Key ini?`)){const E={name:e.name,is_active:!e.is_active};H(async()=>{const{router:l}=await import("./app-Cc-lU_SH.js").then(U=>U.m);return{router:l}},__vite__mapDeps([0,1])).then(({router:l})=>{l.put(route("settings.api-keys.update",e.id),E)})}};return a.jsxs(F,{children:[a.jsx(G,{title:"Manajemen API Key"}),a.jsxs("div",{className:"space-y-6",children:[a.jsxs("div",{className:"flex justify-between items-center",children:[a.jsxs("div",{children:[a.jsx("h2",{className:"text-2xl font-bold tracking-tight",children:"Manajemen API Key"}),a.jsx("p",{className:"text-muted-foreground",children:"Kelola autentikasi untuk aplikasi pihak ketiga."})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsx(t,{variant:"outline",onClick:B,children:"Dokumentasi API"}),a.jsx(t,{onClick:S,children:"Buat API Key Baru"})]})]}),a.jsxs(O,{children:[a.jsxs(V,{children:[a.jsx($,{children:"Daftar API Key"}),a.jsx(J,{children:"Semua kunci API yang digunakan untuk akses ke sistem ini."})]}),a.jsx(Q,{children:a.jsx("div",{className:"rounded-md border",children:a.jsxs(q,{children:[a.jsx(W,{children:a.jsxs(m,{children:[a.jsx(s,{children:"Nama Aplikasi"}),a.jsx(s,{children:"Kunci API (Token)"}),a.jsx(s,{children:"Status"}),a.jsx(s,{children:"Terakhir Digunakan"}),a.jsx(s,{className:"text-right",children:"Aksi"})]})}),a.jsx(X,{children:c.length>0?c.map(e=>a.jsxs(m,{children:[a.jsx(n,{className:"font-medium",children:e.name}),a.jsx(n,{children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsxs("code",{className:"bg-gray-100 px-2 py-1 rounded text-sm select-all",children:[e.key.substring(0,8),"...",e.key.substring(e.key.length-4)]}),a.jsx("button",{onClick:()=>R(e.key),className:"text-gray-500 hover:text-indigo-600",title:"Salin",children:a.jsx(na,{className:"w-4 h-4"})})]})}),a.jsx(n,{children:a.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.is_active?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`,children:e.is_active?"Aktif":"Nonaktif"})}),a.jsx(n,{children:e.last_used_at?new Date(e.last_used_at).toLocaleString("id-ID"):"Belum pernah digunakan"}),a.jsxs(n,{className:"text-right",children:[a.jsx(t,{variant:"outline",size:"sm",className:"mr-2",onClick:()=>z(e),children:e.is_active?"Nonaktifkan":"Aktifkan"}),a.jsx(t,{variant:"destructive",size:"sm",onClick:()=>w(e.id),children:"Hapus"})]})]},e.id)):a.jsx(m,{children:a.jsx(n,{colSpan:5,className:"h-24 text-center",children:"Belum ada API Key dibuat."})})})]})})})]}),a.jsx(d,{show:A,onClose:r,children:a.jsxs("form",{onSubmit:K,className:"p-6",children:[a.jsx("h2",{className:"text-lg font-medium text-gray-900",children:"Buat API Key Baru"}),a.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Masukkan nama identifikasi aplikasi atau layanan yang akan menggunakan kunci ini."}),a.jsxs("div",{className:"mt-6",children:[a.jsx(Y,{htmlFor:"name",value:"Nama Aplikasi / Layanan"}),a.jsx(Z,{id:"name",type:"text",className:"mt-1 block w-full",value:T.name,onChange:e=>v("name",e.target.value),required:!0}),a.jsx(aa,{message:_.name,className:"mt-2"})]}),a.jsxs("div",{className:"mt-6 flex justify-end",children:[a.jsx(j,{onClick:r,children:"Batal"}),a.jsx(ta,{className:"ml-3",disabled:P,children:"Buat API Key"})]})]})}),a.jsx(d,{show:b,onClose:o,children:a.jsxs("form",{onSubmit:M,className:"p-6",children:[a.jsx("h2",{className:"text-lg font-medium text-gray-900",children:"Konfirmasi Hapus"}),a.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Apakah Anda yakin ingin menghapus permanen API API Key ini? Akses dari aplikasi tersebut akan terputus seketika."}),a.jsxs("div",{className:"mt-6 flex justify-end",children:[a.jsx(j,{onClick:o,children:"Batal"}),a.jsx(ea,{className:"ml-3",children:"Hapus Permanen"})]})]})}),a.jsx(d,{show:y,onClose:x,maxWidth:"4xl",children:a.jsxs("div",{className:"p-6",children:[a.jsxs("div",{className:"flex justify-between items-center mb-4",children:[a.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Petunjuk Teknis Integrasi API"}),a.jsxs("div",{className:"flex gap-2",children:[a.jsx(t,{variant:"outline",size:"sm",onClick:()=>{const e=document.getElementById("api-doc-content").innerText;navigator.clipboard.writeText(e),alert("Dokumentasi disalin!")},children:"Salin Teks"}),a.jsx(t,{variant:"outline",size:"sm",onClick:x,children:"Tutup"})]})]}),a.jsx("div",{id:"api-doc-content",className:"bg-gray-50 p-6 rounded-lg border max-h-[70vh] overflow-y-auto text-sm font-mono whitespace-pre-wrap leading-relaxed",children:`# Dokumentasi API SIKAP ${f?.app_name||"Alwan"} (v1) - Pembaruan 01 Juni 2026

Gunakan panduan ini untuk mengintegrasikan aplikasi pihak ketiga dengan data santri secara aman. Pembaruan ini mencakup *endpoint* tambahan khusus untuk sinkronisasi nilai Tahfidz dan Pantauan Akhlak bulanan.

---

### 🚀 Base URL & Autentikasi
Semua permintaan harus dikirim melalui HTTPS dengan header berikut:

**Base URL:** \`${window.location.origin}/api/v1\`
**Auth Header:** \`X-Api-Key: [TOKEN_ANDA]\`

---

### 📘 Langkah Integrasi (Quick Start)

#### Langkah 1: Ambil Referensi Semester
Gunakan endpoint ini untuk mendapatkan daftar ID semester yang pernah diikuti santri.
**GET** \`/student/{nomor_induk}/semesters\`

#### Langkah 2: Ambil Data Nilai (Rapor)
Pilih salah satu metode URL untuk mengambil nilai akademik, akhlak, dan tahfidz secara umum (format lama):

*   **Opsi A (Rapor Aktif):**
    \`GET /student/{nomor_induk}/grades\`
*   **Opsi B (Rapor Histori - Query Params):**
    \`GET /student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026\`

> [!TIP]
> **{semester}** menggunakan nama semester: "Ganjil" atau "Genap"
> **tahunAjaran** menggunakan format: "2025/2026"

#### Langkah 3: Ambil Data Karakter/Akhlak
Terdapat tiga opsi untuk menarik data karakter/akhlak santri:

*   **Opsi A (Karakter Aktif - Format Umum):**
    \`GET /student/{nomor_induk}/character\`
*   **Opsi B (Karakter Histori - Format Umum):**
    \`GET /student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026\`
*   **[BARU] Opsi C (Histori Bulanan - Khusus UI Aplikasi Eksternal):**
    \`GET /student/{nomor_induk}/{semester}/character/monthly?tahunAjaran=2025/2026\`

#### Langkah 4: Ambil Data Nilai Tahfidz
*   **[BARU] Opsi Khusus Tabel Tahfidz (UI Aplikasi Eksternal):**
    \`GET /student/{nomor_induk}/{semester}/tahfidz?tahunAjaran=2025/2026\`

---

### 📊 Contoh Struktur Response (200 OK)

#### 1. Rapor Keseluruhan (\`/grades\`)
\`\`\`json
{
    "success": true,
    "data": {
        "student": {
            "nomor_induk": "220011",
            "nama": "Fulan bin Fulan",
            "kelas": "VII A",
            "jenjang": "SMP"
        },
        "academic": {
            "semester": "Ganjil",
            "tahun_ajaran": "2024/2025",
            "average_score": 88.5,
            "subjects": [
                {
                    "name": "Matematika",
                    "kkm": 75,
                    "score": 90,
                    "components": { "UH1": 85, "UTS": 90, "UAS": 95 },
                    "status": "Tuntas"
                }
            ]
        },
        "character": [
            { "category": "Kedisiplinan", "score": 90, "note": "Sangat baik." }
        ],
        "tahfidz": {
            "completed_juz": [1, 2, 30],
            "validated_juz": [30],
            "total_completed": 3
        },
        "attendance": { "sakit": 1, "izin": 0, "alpa": 0, "total": 1 }
    }
}
\`\`\`

#### 2. Akhlak Bulanan (\`/character/monthly\`) - [BARU]
*Respons yang dirancang khusus agar langsung cocok dengan tabel pantauan akhlak bulanan.*
\`\`\`json
{
  "success": true,
  "data": {
    "student": {
      "nomor_induk": "220011",
      "nama": "Fulan bin Fulan",
      "kelas": "VII A"
    },
    "monthly_character": [
      {
        "Bulan": "Agustus",
        "Ibadah": 75,
        "Patuh": 72,
        "Disiplin": 75,
        "Sopan": 72,
        "Bersih": 73,
        "Rajin": 71
      }
    ]
  }
}
\`\`\`

#### 3. Nilai Tahfidz Eksternal (\`/tahfidz\`) - [BARU]
*Respons yang dirancang khusus untuk mengisi tabel ujian/nilai Tahfidz.*
\`\`\`json
{
  "success": true,
  "data": {
    "student": {
      "nomor_induk": "220011",
      "nama": "Fulan bin Fulan",
      "kelas": "VII A"
    },
    "tahfidz": [
      {
        "Juz": "30",
        "Lembar": "20",
        "Nilai": 85,
        "Predikat": "B",
        "Ujian": "UTS"
      }
    ]
  }
}
\`\`\`

---

### ⚠️ Keamanan & Rate Limit
1. Jangan pernah menanamkan (*hardcode*) API Key dalam kode sumber aplikasi mobile/web sisi klien. Gunakan *backend proxy* jika memungkinkan.
2. Token dapat dicabut (*revoke*) sewaktu-waktu oleh admin SIKAP jika terdeteksi aktivitas mencurigakan.
3. Gunakan header \`Accept: application/json\` pada setiap permintaan.
`})]})})]})]})}export{ae as default};
