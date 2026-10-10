import{r as n,j as a,H as m}from"./app-VHDNWdp-.js";function j({student:e,schoolInfo:s,signer:l}){n.useEffect(()=>{window.print()},[]);const d=r=>{if(!r)return"-";const t=r.split(",").map(c=>c.trim());return[...new Set(t)].join(", ")},i=l?.signature?`/storage/${l.signature}`:s?.headmaster_signature?`/storage/${s.headmaster_signature}`:`/images/signature/${l?.nip||s?.headmaster_nip}.png`;return a.jsxs(a.Fragment,{children:[a.jsx(m,{title:`Biodata - ${e.user.name}`}),a.jsxs("div",{className:"print-container text-sm leading-relaxed",children:[a.jsx("style",{children:`
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
                `}),a.jsx("h1",{children:"BIODATA SANTRI"}),a.jsx("table",{children:a.jsxs("tbody",{children:[a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"1. Nama Peserta Didik(Lengkap)"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value uppercase",children:e.user.name})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"2. Nomor Induk Siswa"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.user.nomor_induk})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"3. Nomor Induk Siswa Nasional"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.nisn||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"NIK"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.nik||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"4. Tempat, Tanggal Lahir"}),a.jsx("td",{className:"separator",children:":"}),a.jsxs("td",{className:"value",children:[e.birth_place,", ",e.birth_date]})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"5. Jenis Kelamin"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.gender==="L"?"Laki-Laki":"Perempuan"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"6. Agama"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.religion})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"7. Status Dalam Keluarga"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.living_with||"Anak Kandung"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"8. Anak Ke"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.child_order||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"9. Alamat Peserta Didik"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:d(e.address)})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"Telepon/HP"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.parent_phone||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"10. Madrasah/Sekolah Asal"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.previous_school||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"11. Diterima di Madrasah"}),a.jsx("td",{className:"separator"}),a.jsx("td",{className:"value"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"Di Kelas"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.accepted_grade||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"Pada Tanggal"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.accepted_date||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"12. Nama Orang Tua"}),a.jsx("td",{className:"separator"}),a.jsx("td",{className:"value"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"a. Ayah"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.father_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"b. Ibu"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.mother_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"13. Pekerjaan Orang Tua"}),a.jsx("td",{className:"separator"}),a.jsx("td",{className:"value"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"a. Ayah"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.father_occupation||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"b. Ibu"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.mother_occupation||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"14. Nama Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"15. Alamat Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_address||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"Telepon/HP"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_phone||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"16. Pekerjaan Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_occupation||"-"})]})]})}),a.jsx("div",{className:"mt-16 flex justify-end",children:a.jsxs("div",{className:"text-center",children:[a.jsxs("p",{children:[s?.city||"Tempat",", ",new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})]}),a.jsxs("p",{className:"mt-2",children:[l?.title||s?.headmaster_title||"Kepala Sekolah",","]}),a.jsx("div",{className:"h-24 flex items-center justify-center my-2",children:(l?.nip||s?.headmaster_nip||l?.signature||s?.headmaster_signature)&&a.jsx("img",{src:i,alt:"Tanda Tangan",className:"h-24 object-contain",onError:r=>r.target.style.display="none"})}),a.jsx("p",{className:"font-bold underline",children:l?.name||s?.headmaster_name||"Nama Kepala Sekolah"}),a.jsxs("p",{children:["NIP. ",l?.nip||s?.headmaster_nip||"........................"]})]})})]})]})}export{j as default};
