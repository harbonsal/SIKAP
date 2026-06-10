import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Edit({ student, filters }) {
    const { data, setData, put, processing, errors } = useForm({
        // User Data (Read Only)
        name: student.user?.name || '',
        nama_arab: student.user?.nama_arab || '',
        nomor_induk: student.user?.nomor_induk || '',
        email: student.user?.email || '',
        password: '', // Optional update

        // Student Data
        nisn: student.nisn || '',
        nik: student.nik || '',
        gender: student.gender,
        birth_place: student.birth_place || '',
        birth_place_ar: student.birth_place_ar || '',
        birth_date: student.birth_date,

        // Address Data
        address: student.address,
        origin_region: student.origin_region || 'Jawa',
        province: student.province || '',
        city: student.city || '',
        district: student.district || '',
        village: student.village || '',
        postal_code: student.postal_code || '',
        address_details: student.address_details || '',

        parent_name: student.parent_name,
        parent_phone: student.parent_phone || '',

        // Dapodik Fields
        religion: student.religion || 'Islam',
        citizenship: student.citizenship || 'WNI',
        child_order: student.child_order || '',
        siblings_count: student.siblings_count || '',
        living_with: student.living_with || '',
        financial_sponsor: student.financial_sponsor || '',
        height: student.height || '',
        weight: student.weight || '',
        blood_type: student.blood_type || '',

        // Father
        father_name: student.father_name || '',
        father_nik: student.father_nik || '',
        father_birth_year: student.father_birth_year || '',
        father_education: student.father_education || '',
        father_occupation: student.father_occupation || '',
        father_income: student.father_income || '',

        // Mother
        mother_name: student.mother_name || '',
        mother_nik: student.mother_nik || '',
        mother_birth_year: student.mother_birth_year || '',
        mother_education: student.mother_education || '',
        mother_occupation: student.mother_occupation || '',
        mother_income: student.mother_income || '',

        // Guardian
        guardian_name: student.guardian_name || '',
        guardian_nik: student.guardian_nik || '',
        guardian_birth_year: student.guardian_birth_year || '',
        guardian_education: student.guardian_education || '',
        guardian_occupation: student.guardian_occupation || '',
        guardian_income: student.guardian_income || '',
        guardian_address: student.guardian_address || '',
    });

    const [activeTab, setActiveTab] = useState('pribadi');

    // Region Data States
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loadingRegions, setLoadingRegions] = useState(false);
    const [isManualAddress, setIsManualAddress] = useState(false);

    // Fetch Provinces on Mount
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await axios.get(route('api.regions.provinces'));
                setProvinces(response.data);
                if (response.data.length === 0) {
                    setIsManualAddress(true);
                }
            } catch (error) {
                console.error("Failed to fetch provinces", error);
                setIsManualAddress(true);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch Cities when Province changes (or on load if province exists)
    useEffect(() => {
        const fetchCities = async () => {
            if (!data.province) return;

            const prov = provinces.find(p => p.name === data.province);
            if (prov) {
                setLoadingRegions(true);
                try {
                    const response = await axios.get(route('api.regions.regencies', prov.id));
                    setCities(response.data);
                } catch (error) {
                    console.error("Failed to fetch cities", error);
                } finally {
                    setLoadingRegions(false);
                }
            }
        };
        if (provinces.length > 0) fetchCities();
    }, [data.province, provinces]);

    // Fetch Districts
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!data.city || cities.length === 0) return;
            const city = cities.find(c => c.name === data.city);
            if (city) {
                setLoadingRegions(true);
                try {
                    const response = await axios.get(route('api.regions.districts', city.id));
                    setDistricts(response.data);
                } catch (error) {
                    console.error("Failed to fetch districts", error);
                } finally {
                    setLoadingRegions(false);
                }
            }
        };
        fetchDistricts();
    }, [data.city, cities]);

    // Fetch Villages
    useEffect(() => {
        const fetchVillages = async () => {
            if (!data.district || districts.length === 0) return;
            const dist = districts.find(d => d.name === data.district);
            if (dist) {
                setLoadingRegions(true);
                try {
                    const response = await axios.get(route('api.regions.villages', dist.id));
                    setVillages(response.data);
                } catch (error) {
                    console.error("Failed to fetch villages", error);
                } finally {
                    setLoadingRegions(false);
                }
            }
        };
        fetchVillages();
    }, [data.district, districts]);


    // Handlers (Same as Create.jsx)
    const handleProvinceChange = async (e) => {
        const provinceName = e.target.options[e.target.selectedIndex].text;
        const provinceId = e.target.value;

        setData(data => ({ ...data, province: provinceName, city: '', district: '', village: '' }));
        setCities([]);
        setDistricts([]);
        setVillages([]);

        if (provinceId) {
            setLoadingRegions(true);
            try {
                const response = await axios.get(route('api.regions.regencies', provinceId));
                setCities(response.data);
            } catch (error) {
                console.error("Failed to fetch cities", error);
            } finally {
                setLoadingRegions(false);
            }
        }
    };

    const handleCityChange = async (e) => {
        const cityName = e.target.options[e.target.selectedIndex].text;
        const cityId = e.target.value;

        setData(data => ({ ...data, city: cityName, district: '', village: '' }));
        setDistricts([]);
        setVillages([]);

        if (cityId) {
            setLoadingRegions(true);
            try {
                const response = await axios.get(route('api.regions.districts', cityId));
                setDistricts(response.data);
            } catch (error) {
                console.error("Failed to fetch districts", error);
            } finally {
                setLoadingRegions(false);
            }
        }
    };

    const handleDistrictChange = async (e) => {
        const districtName = e.target.options[e.target.selectedIndex].text;
        const districtId = e.target.value;

        setData(data => ({ ...data, district: districtName, village: '' }));
        setVillages([]);

        if (districtId) {
            setLoadingRegions(true);
            try {
                const response = await axios.get(route('api.regions.villages', districtId));
                setVillages(response.data);
            } catch (error) {
                console.error("Failed to fetch villages", error);
            } finally {
                setLoadingRegions(false);
            }
        }
    };

    const handleVillageChange = (e) => {
        const villageName = e.target.options[e.target.selectedIndex].text;
        setData('village', villageName);
    };

    // Update combined address when details change
    useEffect(() => {
        const fullAddress = `${data.address_details || ''}, ${data.village || ''}, ${data.district || ''}, ${data.city || ''}, ${data.province || ''} ${data.postal_code || ''}`;
        setData('address', fullAddress.replace(/^, |, , /g, '').trim());
    }, [data.address_details, data.village, data.district, data.city, data.province, data.postal_code]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('students.update', { student: student.id, ...filters }));
    };

    const tabs = [
        { id: 'pribadi', label: 'Data Pribadi' },
        { id: 'fisik', label: 'Data Fisik' },
        { id: 'orangtua', label: 'Data Orang Tua' },
        { id: 'wali', label: 'Data Wali' },
    ];

    return (
        <MainLayout>
            <Head title="Edit Siswa" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('students.index', filters)}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Siswa</h2>
                        <p className="text-muted-foreground">Perbarui data siswa dan informasi akun.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Akun Login Section (Read Only mostly) */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Informasi Akun (Login)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    readOnly
                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-[10px] text-muted-foreground">*Nama dikelola di menu User</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Nama Lengkap (Arab)</label>
                                <input
                                    type="text"
                                    value={data.nama_arab}
                                    readOnly
                                    dir="rtl"
                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-[10px] text-muted-foreground">*Nama Arab dikelola di menu User</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Nomor Induk Siswa (NIS)</label>
                                <input
                                    type="text"
                                    value={data.nomor_induk}
                                    readOnly
                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-[10px] text-muted-foreground">*NIS dikelola di menu User</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Email (Opsional)</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Password Baru (Opsional)</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Isi jika ingin mengganti password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex space-x-1 rounded-xl bg-muted p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === tab.id
                                    ? 'bg-background shadow text-foreground'
                                    : 'text-muted-foreground hover:bg-white/[0.12] hover:text-white'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">

                        {/* DATA PRIBADI */}
                        <div className={activeTab === 'pribadi' ? 'block space-y-6' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">NISN</label>
                                    <input type="text" value={data.nisn} onChange={(e) => setData('nisn', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    {errors.nisn && <p className="text-sm text-destructive">{errors.nisn}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">NIK</label>
                                    <input type="text" value={data.nik} onChange={(e) => setData('nik', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    {errors.nik && <p className="text-sm text-destructive">{errors.nik}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Jenis Kelamin <span className="text-destructive">*</span></label>
                                    <select value={data.gender} onChange={(e) => setData('gender', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tempat Lahir <span className="text-destructive">*</span></label>
                                    <input type="text" value={data.birth_place} onChange={(e) => setData('birth_place', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tempat Lahir (Arab)</label>
                                    <input
                                        type="text"
                                        value={data.birth_place_ar}
                                        onChange={(e) => setData('birth_place_ar', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        dir="rtl"
                                        placeholder="مثال: جاكرتا"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tanggal Lahir <span className="text-destructive">*</span></label>
                                    <input type="date" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Agama</label>
                                    <input type="text" value={data.religion} onChange={(e) => setData('religion', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Asal Daerah</label>
                                    <select value={data.origin_region} onChange={(e) => setData('origin_region', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="Jawa">Jawa</option>
                                        <option value="Luar Jawa">Luar Jawa</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Kewarganegaraan</label>
                                    <input type="text" value={data.citizenship} onChange={(e) => setData('citizenship', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>

                                {/* ALAMAT LENGKAP SECTION */}
                                <div className="col-span-1 md:col-span-2 space-y-4 border-t pt-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-primary">Alamat Lengkap</h4>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="manualAddress"
                                                checked={isManualAddress}
                                                onChange={(e) => setIsManualAddress(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="manualAddress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Input Manual (Tanpa Master Data)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Provinsi</label>
                                            {isManualAddress ? (
                                                <input
                                                    type="text"
                                                    value={data.province}
                                                    onChange={(e) => setData('province', e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="Ketik nama provinsi..."
                                                />
                                            ) : (
                                                <select
                                                    value={provinces.find(p => p.name === data.province)?.id || ''}
                                                    onChange={handleProvinceChange}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="">- Pilih Provinsi -</option>
                                                    {provinces.map(prov => (
                                                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Kota/Kabupaten</label>
                                            {isManualAddress ? (
                                                <input
                                                    type="text"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="Ketik nama kota/kabupaten..."
                                                />
                                            ) : (
                                                <select
                                                    value={cities.find(c => c.name === data.city)?.id || ''}
                                                    onChange={handleCityChange}
                                                    disabled={!data.province}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                                >
                                                    <option value="">- Pilih Kota/Kabupaten -</option>
                                                    {cities.map(city => (
                                                        <option key={city.id} value={city.id}>{city.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Kecamatan</label>
                                            {isManualAddress ? (
                                                <input
                                                    type="text"
                                                    value={data.district}
                                                    onChange={(e) => setData('district', e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="Ketik nama kecamatan..."
                                                />
                                            ) : (
                                                <select
                                                    value={districts.find(d => d.name === data.district)?.id || ''}
                                                    onChange={handleDistrictChange}
                                                    disabled={!data.city}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                                >
                                                    <option value="">- Pilih Kecamatan -</option>
                                                    {districts.map(dist => (
                                                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Kelurahan/Desa</label>
                                            {isManualAddress ? (
                                                <input
                                                    type="text"
                                                    value={data.village}
                                                    onChange={(e) => setData('village', e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholder="Ketik nama kelurahan/desa..."
                                                />
                                            ) : (
                                                <select
                                                    value={villages.find(v => v.name === data.village)?.id || ''}
                                                    onChange={handleVillageChange}
                                                    disabled={!data.district}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                                >
                                                    <option value="">- Pilih Kelurahan -</option>
                                                    {villages.map(village => (
                                                        <option key={village.id} value={village.id}>{village.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none">Kode Pos</label>
                                            <input type="text" value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium leading-none">Detail Alamat (Jalan, RT/RW, No. Rumah)</label>
                                            <textarea value={data.address_details} onChange={(e) => setData('address_details', e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Contoh: Jl. Merdeka No. 10, RT 01/RW 02" />
                                        </div>
                                        {!isManualAddress && loadingRegions && <div className="col-span-2 text-xs text-blue-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Memuat data wilayah...</div>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Anak ke-</label>
                                    <input type="number" value={data.child_order} onChange={(e) => setData('child_order', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Jumlah Saudara</label>
                                    <input type="number" value={data.siblings_count} onChange={(e) => setData('siblings_count', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tinggal Bersama</label>
                                    <select value={data.living_with} onChange={(e) => setData('living_with', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="">- Pilih -</option>
                                        <option value="Orang Tua">Orang Tua</option>
                                        <option value="Wali">Wali</option>
                                        <option value="Asrama">Asrama</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Penanggung Biaya</label>
                                    <select value={data.financial_sponsor} onChange={(e) => setData('financial_sponsor', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="">- Pilih -</option>
                                        <option value="Orang Tua">Orang Tua</option>
                                        <option value="Wali">Wali</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* DATA FISIK */}
                        <div className={activeTab === 'fisik' ? 'block space-y-6' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tinggi Badan (cm)</label>
                                    <input type="number" value={data.height} onChange={(e) => setData('height', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Berat Badan (kg)</label>
                                    <input type="number" value={data.weight} onChange={(e) => setData('weight', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Golongan Darah</label>
                                    <select value={data.blood_type} onChange={(e) => setData('blood_type', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="">- Pilih -</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="AB">AB</option>
                                        <option value="O">O</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* DATA ORANG TUA */}
                        <div className={activeTab === 'orangtua' ? 'block space-y-6' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* AYAH */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-primary border-b pb-2">Data Ayah</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nama Ayah</label>
                                        <input type="text" value={data.father_name} onChange={(e) => setData('father_name', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">NIK Ayah</label>
                                        <input type="text" value={data.father_nik} onChange={(e) => setData('father_nik', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Tahun Lahir</label>
                                        <input type="number" value={data.father_birth_year} onChange={(e) => setData('father_birth_year', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pendidikan</label>
                                        <input type="text" value={data.father_education} onChange={(e) => setData('father_education', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pekerjaan</label>
                                        <input type="text" value={data.father_occupation} onChange={(e) => setData('father_occupation', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Penghasilan</label>
                                        <input type="text" value={data.father_income} onChange={(e) => setData('father_income', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                </div>

                                {/* IBU */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-primary border-b pb-2">Data Ibu</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nama Ibu</label>
                                        <input type="text" value={data.mother_name} onChange={(e) => setData('mother_name', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">NIK Ibu</label>
                                        <input type="text" value={data.mother_nik} onChange={(e) => setData('mother_nik', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Tahun Lahir</label>
                                        <input type="number" value={data.mother_birth_year} onChange={(e) => setData('mother_birth_year', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pendidikan</label>
                                        <input type="text" value={data.mother_education} onChange={(e) => setData('mother_education', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pekerjaan</label>
                                        <input type="text" value={data.mother_occupation} onChange={(e) => setData('mother_occupation', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Penghasilan</label>
                                        <input type="text" value={data.mother_income} onChange={(e) => setData('mother_income', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DATA WALI */}
                        <div className={activeTab === 'wali' ? 'block space-y-6' : 'hidden'}>
                            {data.financial_sponsor === 'Orang Tua' ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Penanggung biaya adalah Orang Tua. Data Wali tidak diperlukan.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nama Wali</label>
                                        <input type="text" value={data.guardian_name} onChange={(e) => setData('guardian_name', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">NIK Wali</label>
                                        <input type="text" value={data.guardian_nik} onChange={(e) => setData('guardian_nik', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Tahun Lahir</label>
                                        <input type="number" value={data.guardian_birth_year} onChange={(e) => setData('guardian_birth_year', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pendidikan</label>
                                        <input type="text" value={data.guardian_education} onChange={(e) => setData('guardian_education', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Pekerjaan</label>
                                        <input type="text" value={data.guardian_occupation} onChange={(e) => setData('guardian_occupation', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Penghasilan</label>
                                        <input type="text" value={data.guardian_income} onChange={(e) => setData('guardian_income', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium leading-none">Alamat Wali</label>
                                        <textarea value={data.guardian_address} onChange={(e) => setData('guardian_address', e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
