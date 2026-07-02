import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Settings, Users, Shuffle, Lock, Unlock, ArrowRight, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import Swal from 'sweetalert2';

export default function TabPlottingSantri({ activeClasses, systemAcademicYear, activeYear }) {
    const [step, setStep] = useState(1);
    const [loadingSetup, setLoadingSetup] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Setup Data
    const [levels, setLevels] = useState([]);
    const [semesters, setSemesters] = useState([]);

    // Form Data
    const [sourceLevelIds, setSourceLevelIds] = useState([]);
    const [sourceSemesterId, setSourceSemesterId] = useState('');
    const [targetClassIds, setTargetClassIds] = useState([]);
    const [gradingMethod, setGradingMethod] = useState('average');
    
    // Result Data
    const [distribution, setDistribution] = useState([]);
    const [retainedStudents, setRetainedStudents] = useState([]);
    const [lockedStudents, setLockedStudents] = useState({}); // { studentId: classId }

    useEffect(() => {
        axios.get(route('settings.education.plotting.setup-data'))
            .then(res => {
                setLevels(res.data.levels || []);
                setSemesters(res.data.semesters || []);
                setLoadingSetup(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingSetup(false);
            });
    }, []);

    const toggleTargetClass = (classId) => {
        setTargetClassIds(prev => 
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const handleGenerate = () => {
        if (sourceLevelIds.length === 0 || targetClassIds.length === 0) {
            Swal.fire('Peringatan', 'Pilih sumber data dan Target Kelas.', 'warning');
            return;
        }
        if (!sourceLevelIds.includes('new_students') && !sourceSemesterId) {
            Swal.fire('Peringatan', 'Semester Asal harus diisi untuk santri lama.', 'warning');
            return;
        }

        setGenerating(true);
        axios.post(route('settings.education.plotting.preview'), {
            source_level_ids: sourceLevelIds,
            source_semester_id: sourceSemesterId,
            target_class_ids: targetClassIds,
            grading_method: gradingMethod,
            locked_students: lockedStudents,
            retained_students: retainedStudents.map(s => s.id)
        })
        .then(res => {
            setDistribution(res.data.distribution || []);
            // setRetainedStudents(res.data.retained_students || []); // keep local state for now
            setStep(2);
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Gagal', 'Terjadi kesalahan saat generate plotting.', 'error');
        })
        .finally(() => setGenerating(false));
    };

    const handleRebalance = () => {
        handleGenerate(); // Call the same API, but now it passes the locked_students from state
    };

    const handleMoveStudent = (student, fromClassId, toClassId) => {
        // Optimistically update UI
        let newDist = [...distribution];
        let fromBucket = newDist.find(b => String(b.class.id) === String(fromClassId));
        let toBucket = newDist.find(b => String(b.class.id) === String(toClassId));

        if (fromBucket && toBucket) {
            fromBucket.students = fromBucket.students.filter(s => s.id !== student.id);
            toBucket.students.push({ ...student, is_locked: true });
            
            // Auto lock when moved manually
            setLockedStudents(prev => ({ ...prev, [student.id]: toClassId }));
            setDistribution(newDist);
        }
    };

    const toggleLock = (studentId, currentClassId, isCurrentlyLocked) => {
        if (isCurrentlyLocked) {
            const next = { ...lockedStudents };
            delete next[studentId];
            setLockedStudents(next);
            
            // Update UI state
            let newDist = [...distribution];
            let bucket = newDist.find(b => String(b.class.id) === String(currentClassId));
            if (bucket) {
                let s = bucket.students.find(s => s.id === studentId);
                if (s) s.is_locked = false;
            }
            setDistribution(newDist);
        } else {
            setLockedStudents(prev => ({ ...prev, [studentId]: currentClassId }));
            
            // Update UI state
            let newDist = [...distribution];
            let bucket = newDist.find(b => String(b.class.id) === String(currentClassId));
            if (bucket) {
                let s = bucket.students.find(s => s.id === studentId);
                if (s) s.is_locked = true;
            }
            setDistribution(newDist);
        }
    };

    const handleCommit = () => {
        Swal.fire({
            title: 'Simpan Plotting Permanen?',
            text: `Data plotting akan disimpan ke kelas aktif tahun ajaran ${activeYear?.name}. Data kelas lama akan ditimpa jika ada.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan!',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('settings.education.plotting.commit'), {
                    distribution: distribution
                }, {
                    onSuccess: () => {
                        setStep(1);
                        setTargetClassIds([]);
                        setLockedStudents({});
                        Swal.fire('Berhasil', 'Plotting santri berhasil disimpan.', 'success');
                    }
                });
            }
        });
    };

    if (loadingSetup) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Plotting Santri (Grade-Based)</h2>
                    <p className="text-muted-foreground">Otomatisasi pembagian kelas berdasarkan nilai akademik dengan metode Round-Robin.</p>
                </div>
                {step === 2 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <Settings className="w-4 h-4 mr-2" /> Pengaturan Ulang
                        </Button>
                        <Button variant="secondary" onClick={handleRebalance} disabled={generating}>
                            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shuffle className="w-4 h-4 mr-2" />}
                            Re-Balance
                        </Button>
                        <Button onClick={handleCommit}>
                            <Save className="w-4 h-4 mr-2" /> Simpan Permanen
                        </Button>
                    </div>
                )}
            </div>

            {step === 1 && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Sumber Data Santri</CardTitle>
                            <CardDescription>Pilih dari angkatan mana santri akan diproses.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tingkat / Angkatan Asal (Bisa Pilih Banyak)</Label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                                    <div 
                                        className={`p-2 rounded-md border cursor-pointer flex items-center gap-2 transition-colors ${sourceLevelIds.includes('new_students') ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                        onClick={() => {
                                            setSourceLevelIds(['new_students']);
                                            setGradingMethod('manual');
                                        }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={sourceLevelIds.includes('new_students')}
                                            readOnly
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="text-sm font-bold text-primary">
                                            ⭐ SANTRI BARU (Belum Punya Kelas) ⭐
                                        </div>
                                    </div>
                                    {levels.map(level => (
                                        <div 
                                            key={level.id} 
                                            className={`p-2 rounded-md border cursor-pointer flex items-center gap-2 transition-colors ${sourceLevelIds.includes(String(level.id)) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                            onClick={() => {
                                                setSourceLevelIds(prev => {
                                                    let p = prev.filter(id => id !== 'new_students');
                                                    const strId = String(level.id);
                                                    return p.includes(strId) ? p.filter(id => id !== strId) : [...p, strId];
                                                });
                                            }}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={sourceLevelIds.includes(String(level.id))}
                                                readOnly
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div className="text-sm font-medium">
                                                {level.name} ({level.jenjang?.name})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Tahun Ajaran Asal</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                    value={sourceSemesterId}
                                    onChange={(e) => setSourceSemesterId(e.target.value)}
                                    disabled={sourceLevelIds.includes('new_students')}
                                >
                                    <option value="">-- Pilih Tahun Ajaran --</option>
                                    {semesters.map(semester => (
                                        <option key={semester.id} value={semester.id}>{semester.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Metode Distribusi</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={gradingMethod}
                                    onChange={(e) => setGradingMethod(e.target.value)}
                                >
                                    <option value="average">Berdasarkan Rata-rata Nilai Rapor (Round-Robin)</option>
                                    <option value="manual">Tanpa Nilai (Kelas 7 / Klasifikasi Manual)</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Kelas Target</CardTitle>
                            <CardDescription>Pilih kelas paralel tujuan di Tahun Ajaran {activeYear?.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {activeClasses.map(cls => (
                                    <div 
                                        key={cls.id} 
                                        className={`p-3 rounded-md border cursor-pointer flex items-center gap-2 transition-colors ${targetClassIds.includes(cls.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                        onClick={() => toggleTargetClass(cls.id)}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={targetClassIds.includes(cls.id)}
                                            readOnly
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="text-sm font-medium">
                                            {cls.kelas?.name} {cls.kelas_paralel?.name}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button className="w-full mt-4" size="lg" onClick={handleGenerate} disabled={generating}>
                                {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Shuffle className="w-5 h-5 mr-2" />}
                                Generate Plotting
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 2 && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {distribution.map((bucket, bIndex) => (
                        <div key={bIndex} className="min-w-[320px] w-1/3 bg-muted/30 rounded-xl border p-4 flex flex-col max-h-[800px]">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{bucket.class?.name || (bucket.class?.kelas?.name + ' ' + bucket.class?.kelas_paralel?.name)}</h3>
                                    <div className="text-xs text-muted-foreground">{bucket.students.length} Santri</div>
                                </div>
                                <Badge variant="outline" className="bg-primary/10">{bucket.students.length}</Badge>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {bucket.students.map((student, sIndex) => (
                                    <div key={student.id} className={`p-3 rounded-lg border bg-card text-sm shadow-sm transition-all hover:shadow-md ${student.is_locked ? 'border-amber-400 bg-amber-50/50' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{student.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">NIS: {student.nis || '-'} • Skor: {student.plotting_score !== null && student.plotting_score !== undefined ? parseFloat(student.plotting_score).toFixed(1) : '-'}</div>
                                            </div>
                                            <button 
                                                onClick={() => toggleLock(student.id, bucket.class.id, student.is_locked)}
                                                className={`p-1.5 rounded-md hover:bg-muted ${student.is_locked ? 'text-amber-600' : 'text-gray-400'}`}
                                                title={student.is_locked ? 'Buka Kunci' : 'Kunci di kelas ini'}
                                            >
                                                {student.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        
                                        {/* Dropdown for Manual Move */}
                                        <div className="mt-3 flex justify-end">
                                            <select 
                                                className="text-xs border rounded px-2 py-1 bg-muted/50"
                                                value=""
                                                onChange={(e) => {
                                                    if(e.target.value) {
                                                        handleMoveStudent(student, bucket.class.id, e.target.value);
                                                    }
                                                }}
                                            >
                                                <option value="">Pindah ke...</option>
                                                {distribution.map(targetB => {
                                                    if (targetB.class.id === bucket.class.id) return null;
                                                    return (
                                                        <option key={targetB.class.id} value={targetB.class.id}>
                                                            {targetB.class?.kelas?.name} {targetB.class?.kelas_paralel?.name}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                {bucket.students.length === 0 && (
                                    <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        Tidak ada santri
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
