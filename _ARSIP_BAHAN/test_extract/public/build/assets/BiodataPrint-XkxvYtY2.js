import{r as i,j as a,H as c}from"./app-wTSopcIY.js";function t({student:e,schoolInfo:s,signer:l}){return i.useEffect(()=>{window.print()},[]),a.jsxs(a.Fragment,{children:[a.jsx(c,{title:`Biodata - ${e.user.name}`}),a.jsxs("div",{className:"print-container text-sm leading-relaxed",children:[a.jsx("style",{children:`
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
                `}),a.jsx("h1",{children:"BIODATA SANTRI"}),a.jsx("table",{children:a.jsxs("tbody",{children:[a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"1. Nama Lengkap"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value uppercase",children:e.user.name})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"2. Nomor Induk Siswa (NIS)"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.user.nomor_induk})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"3. NISN"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.nisn||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"4. Tempat, Tanggal Lahir"}),a.jsx("td",{className:"separator",children:":"}),a.jsxs("td",{className:"value",children:[e.birth_place,", ",e.birth_date]})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"5. Jenis Kelamin"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.gender==="L"?"Laki-laki":"Perempuan"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"6. Agama"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.religion})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"7. Anak ke"}),a.jsx("td",{className:"separator",children:":"}),a.jsxs("td",{className:"value",children:[e.child_order," dari ",e.siblings_count," bersaudara"]})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"8. Alamat Peserta Didik"}),a.jsx("td",{className:"separator",children:":"}),a.jsxs("td",{className:"value",children:[e.address,a.jsx("br",{}),e.village?`Kel. ${e.village}, `:"",e.district?`Kec. ${e.district}`:"",a.jsx("br",{}),e.city?`${e.city}, `:"",e.province?`${e.province}`:"",e.postal_code?` ${e.postal_code}`:""]})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"9. Nama Orang Tua"}),a.jsx("td",{className:"separator"}),a.jsx("td",{className:"value"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"a. Ayah"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.father_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"b. Ibu"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.mother_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"10. Pekerjaan Orang Tua"}),a.jsx("td",{className:"separator"}),a.jsx("td",{className:"value"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"a. Ayah"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.father_occupation||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label pl-4",children:"b. Ibu"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.mother_occupation||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"11. Alamat Orang Tua"}),a.jsx("td",{className:"separator",children:":"}),a.jsxs("td",{className:"value",children:[e.address," "]})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"12. Nama Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_name||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"13. Pekerjaan Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_occupation||"-"})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"label",children:"14. Alamat Wali"}),a.jsx("td",{className:"separator",children:":"}),a.jsx("td",{className:"value",children:e.guardian_address||"-"})]})]})}),a.jsx("div",{className:"mt-16 flex justify-end",children:a.jsxs("div",{className:"text-center",children:[a.jsxs("p",{children:[s?.city||"Tempat",", ",new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})]}),a.jsxs("p",{className:"mt-2",children:[l?.title||s?.headmaster_title||"Kepala Sekolah",","]}),a.jsx("div",{className:"h-24 flex items-center justify-center my-2",children:(l?.nip||s?.headmaster_nip)&&a.jsx("img",{src:`/images/signatures/${l?.nip||s?.headmaster_nip}.png`,alt:"Tanda Tangan",className:"h-24 object-contain",onError:r=>r.target.style.display="none"})}),a.jsx("p",{className:"font-bold underline",children:l?.name||s?.headmaster_name||"Nama Kepala Sekolah"}),a.jsxs("p",{children:["NIP. ",l?.nip||s?.headmaster_nip||"........................"]})]})})]})]})}export{t as default};
