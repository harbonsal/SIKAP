const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/app-B1Dy9_LS.js","assets/app-BW2W4ruL.css"])))=>i.map(i=>d[i]);
import{r as i,u as g,j as a,H as U,_ as L}from"./app-B1Dy9_LS.js";import{M as G}from"./MainLayout-a5-WISs-.js";import{C as H,a as F,b as O,d as V,c as J}from"./card-DxyK_92F.js";import{B as t}from"./button-Beg23Z0E.js";import"./input-CUhm8ICg.js";import{T as Q,a as $,b as m,c as s,d as q,e as n}from"./table-BWxkROPm.js";import{M as d}from"./Modal-BxtdC5UH.js";import{I as W}from"./InputLabel-CmEzKy2J.js";import{T as X}from"./TextInput-BifSxbpS.js";import{I as Y}from"./InputError-DjzNilY4.js";import{D as Z}from"./DangerButton-AH5bBTNg.js";import{S as j}from"./SecondaryButton-NME1AKAs.js";import{P as aa}from"./PrimaryButton-Cta7qo9L.js";import{C as ea}from"./copy-Cfxp3jjR.js";import"./utils-CDN07tui.js";import"./house-C8mipWlU.js";import"./createLucideIcon-D4fVmCT4.js";import"./book-open-ChpOfXSB.js";import"./bot-Dl0nViTA.js";import"./heart-C7eTBoiL.js";import"./user-Ci9fm9I0.js";import"./trash-2-DNSliy6U.js";import"./download-B2c2Pkqy.js";import"./Dropdown-wA9CQj8R.js";import"./transition-BnK5V1zP.js";import"./calendar-C3Rn_2vT.js";import"./chevron-down-CjnjdLLG.js";import"./check-QKtM6p6X.js";import"./dialog-BIqA37lA.js";import"./index-BFl8WqfK.js";import"./index-CZODD6gd.js";import"./index-Byxswrq4.js";import"./index-CFk7UA-M.js";import"./index-CGF1Fi-t.js";import"./search-YNOL40VE.js";import"./loader-circle-DAEsOQ4H.js";import"./arrow-right-5BedKUuT.js";import"./triangle-alert-nHQAwipU.js";import"./circle-x-DCEYyvI3.js";import"./circle-check-big-Cj9T95Ov.js";import"./index-B_jtOnfb.js";import"./with-selector-DTAtwloT.js";function Oa({apiKeys:c}){const[f,u]=i.useState(!1),[A,p]=i.useState(!1),[b,k]=i.useState(!1),[y,h]=i.useState(null),{data:N,setData:T,post:v,processing:I,errors:P,reset:_}=g({name:""}),{delete:C}=g(),D=()=>{u(!0)},r=()=>{u(!1),_()},S=()=>{k(!0)},x=()=>{k(!1)},B=e=>{e.preventDefault(),v(route("settings.api-keys.store"),{onSuccess:()=>r()})},K=e=>{h(e),p(!0)},l=()=>{p(!1),h(null)},M=e=>{e.preventDefault(),C(route("settings.api-keys.destroy",y),{onSuccess:()=>l()})},R=e=>{navigator.clipboard.writeText(e),alert("API Key disalin ke clipboard!")},w=e=>{if(confirm(`Apakah Anda yakin ingin ${e.is_active?"menonaktifkan":"mengaktifkan"} API Key ini?`)){const z={name:e.name,is_active:!e.is_active};L(async()=>{const{router:o}=await import("./app-B1Dy9_LS.js").then(E=>E.m);return{router:o}},__vite__mapDeps([0,1])).then(({router:o})=>{o.put(route("settings.api-keys.update",e.id),z)})}};return a.jsxs(G,{children:[a.jsx(U,{title:"Manajemen API Key"}),a.jsxs("div",{className:"space-y-6",children:[a.jsxs("div",{className:"flex justify-between items-center",children:[a.jsxs("div",{children:[a.jsx("h2",{className:"text-2xl font-bold tracking-tight",children:"Manajemen API Key"}),a.jsx("p",{className:"text-muted-foreground",children:"Kelola autentikasi untuk aplikasi pihak ketiga."})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsx(t,{variant:"outline",onClick:S,children:"Dokumentasi API"}),a.jsx(t,{onClick:D,children:"Buat API Key Baru"})]})]}),a.jsxs(H,{children:[a.jsxs(F,{children:[a.jsx(O,{children:"Daftar API Key"}),a.jsx(V,{children:"Semua kunci API yang digunakan untuk akses ke sistem ini."})]}),a.jsx(J,{children:a.jsx("div",{className:"rounded-md border",children:a.jsxs(Q,{children:[a.jsx($,{children:a.jsxs(m,{children:[a.jsx(s,{children:"Nama Aplikasi"}),a.jsx(s,{children:"Kunci API (Token)"}),a.jsx(s,{children:"Status"}),a.jsx(s,{children:"Terakhir Digunakan"}),a.jsx(s,{className:"text-right",children:"Aksi"})]})}),a.jsx(q,{children:c.length>0?c.map(e=>a.jsxs(m,{children:[a.jsx(n,{className:"font-medium",children:e.name}),a.jsx(n,{children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsxs("code",{className:"bg-gray-100 px-2 py-1 rounded text-sm select-all",children:[e.key.substring(0,8),"...",e.key.substring(e.key.length-4)]}),a.jsx("button",{onClick:()=>R(e.key),className:"text-gray-500 hover:text-indigo-600",title:"Salin",children:a.jsx(ea,{className:"w-4 h-4"})})]})}),a.jsx(n,{children:a.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.is_active?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`,children:e.is_active?"Aktif":"Nonaktif"})}),a.jsx(n,{children:e.last_used_at?new Date(e.last_used_at).toLocaleString("id-ID"):"Belum pernah digunakan"}),a.jsxs(n,{className:"text-right",children:[a.jsx(t,{variant:"outline",size:"sm",className:"mr-2",onClick:()=>w(e),children:e.is_active?"Nonaktifkan":"Aktifkan"}),a.jsx(t,{variant:"destructive",size:"sm",onClick:()=>K(e.id),children:"Hapus"})]})]},e.id)):a.jsx(m,{children:a.jsx(n,{colSpan:5,className:"h-24 text-center",children:"Belum ada API Key dibuat."})})})]})})})]}),a.jsx(d,{show:f,onClose:r,children:a.jsxs("form",{onSubmit:B,className:"p-6",children:[a.jsx("h2",{className:"text-lg font-medium text-gray-900",children:"Buat API Key Baru"}),a.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Masukkan nama identifikasi aplikasi atau layanan yang akan menggunakan kunci ini."}),a.jsxs("div",{className:"mt-6",children:[a.jsx(W,{htmlFor:"name",value:"Nama Aplikasi / Layanan"}),a.jsx(X,{id:"name",type:"text",className:"mt-1 block w-full",value:N.name,onChange:e=>T("name",e.target.value),required:!0}),a.jsx(Y,{message:P.name,className:"mt-2"})]}),a.jsxs("div",{className:"mt-6 flex justify-end",children:[a.jsx(j,{onClick:r,children:"Batal"}),a.jsx(aa,{className:"ml-3",disabled:I,children:"Buat API Key"})]})]})}),a.jsx(d,{show:A,onClose:l,children:a.jsxs("form",{onSubmit:M,className:"p-6",children:[a.jsx("h2",{className:"text-lg font-medium text-gray-900",children:"Konfirmasi Hapus"}),a.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Apakah Anda yakin ingin menghapus permanen API API Key ini? Akses dari aplikasi tersebut akan terputus seketika."}),a.jsxs("div",{className:"mt-6 flex justify-end",children:[a.jsx(j,{onClick:l,children:"Batal"}),a.jsx(Z,{className:"ml-3",children:"Hapus Permanen"})]})]})}),a.jsx(d,{show:b,onClose:x,maxWidth:"4xl",children:a.jsxs("div",{className:"p-6",children:[a.jsxs("div",{className:"flex justify-between items-center mb-4",children:[a.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Petunjuk Teknis Integrasi API"}),a.jsxs("div",{className:"flex gap-2",children:[a.jsx(t,{variant:"outline",size:"sm",onClick:()=>{const e=document.getElementById("api-doc-content").innerText;navigator.clipboard.writeText(e),alert("Dokumentasi disalin!")},children:"Salin Teks"}),a.jsx(t,{variant:"outline",size:"sm",onClick:x,children:"Tutup"})]})]}),a.jsx("div",{id:"api-doc-content",className:"bg-gray-50 p-6 rounded-lg border max-h-[70vh] overflow-y-auto text-sm font-mono whitespace-pre-wrap leading-relaxed",children:`# Dokumentasi API SIAP Alwan (v1) - Pembaruan 01 Juni 2026

Gunakan panduan ini untuk mengintegrasikan aplikasi pihak ketiga dengan data santri secara aman. Pembaruan ini mencakup *endpoint* tambahan khusus untuk sinkronisasi nilai Tahfidz dan Pantauan Akhlak bulanan.

---

### 🚀 Base URL & Autentikasi
Semua permintaan harus dikirim melalui HTTPS dengan header berikut:

**Base URL:** \`https://sikap.sinawang.my.id/api/v1\`
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
`})]})})]})]})}export{Oa as default};
