<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User; // Assuming User model is in App\Models

class Student extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::creating(function ($student) {
            if (empty($student->gender)) {
                $student->gender = 'L';
            }
            if (empty($student->birth_place)) {
                $student->birth_place = 'Jakarta';
            }
            if (empty($student->birth_date)) {
                $student->birth_date = '2010-01-01';
            }
            if (empty($student->address)) {
                $student->address = 'Jl. Setiabudi No. 1';
            }
            if (empty($student->parent_name)) {
                $student->parent_name = 'Parent Name';
            }
        });
    }

    protected $fillable = [
        'user_id',
        'nisn',
        'nik',
        'religion',
        'citizenship',
        'child_order',
        'siblings_count',
        'living_with',
        'financial_sponsor',
        'gender',
        'birth_place',
        'birth_place_ar',
        'birth_date',
        'address',
        'origin_region',
        'province',
        'city',
        'district',
        'village',
        'postal_code',
        'address_details',
        'height',
        'weight',
        'blood_type',
        'parent_name',
        'parent_phone',
        'father_name',
        'father_nik',
        'father_birth_year',
        'father_education',
        'father_occupation',
        'father_income',
        'mother_name',
        'mother_nik',
        'mother_birth_year',
        'mother_education',
        'mother_occupation',
        'mother_income',
        'guardian_name',
        'guardian_nik',
        'guardian_birth_year',
        'guardian_education',
        'guardian_occupation',
        'guardian_income',
        'guardian_address',
        'previous_school',
        'accepted_grade',
        'accepted_date',
        'guardian_phone',
        'entry_year',
        'entry_semester',
        'target_sabqi_pages',
        'target_manzil_pages',
    ];

    protected $appends = ['name', 'nomor_induk', 'kelas', 'kamar', 'nis', 'kelas_name', 'kamar_name'];

    public function memorizations()
    {
        return $this->hasMany(TahfidzMemorization::class);
    }

    public function memorizationDetails()
    {
        return $this->hasMany(TahfidzMemorizationDetail::class);
    }

    public function careViolations()
    {
        return $this->hasMany(CareViolation::class);
    }

    public function latestMemorizationDetail()
    {
        return $this->hasOne(TahfidzMemorizationDetail::class)->latestOfMany();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getNameAttribute()
    {
        return $this->user->name ?? '-';
    }

    public function getNomorIndukAttribute()
    {
        return $this->user->nomor_induk ?? '-';
    }

    public function getNisAttribute()
    {
        return $this->nomor_induk;
    }

    public function studentGrades()
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function classMembers()
    {
        return $this->hasMany(ClassMember::class);
    }

    public function tahfidzHalaqohMember()
    {
        return $this->hasOne(TahfidzHalaqohMember::class);
    }

    public function kamarMembers()
    {
        return $this->hasMany(KamarMember::class);
    }

    public function latestClassMember()
    {
        return $this->hasOne(ClassMember::class)->latestOfMany();
    }

    public function latestKamarMember()
    {
        return $this->hasOne(KamarMember::class)->latestOfMany();
    }

    public function getKelasAttribute()
    {
        return $this->latestClassMember?->activeClass?->kelas;
    }

    public function getKelasNameAttribute()
    {
        $activeClass = $this->latestClassMember?->activeClass;
        if (!$activeClass) return null;
        
        if (!empty($activeClass->name)) return $activeClass->name;
        
        $kelasName = $activeClass->kelas?->name ?? '';
        $paralelName = $activeClass->kelasParalel?->name ?? '';
        $fallback = trim("$kelasName $paralelName");
        
        return $fallback ?: null;
    }

    public function getKamarAttribute()
    {
        return $this->latestKamarMember?->activeKamar?->kamar;
    }

    public function getKamarNameAttribute()
    {
        $activeKamar = $this->latestKamarMember?->activeKamar;
        if (!$activeKamar) return null;

        if (!empty($activeKamar->name)) return $activeKamar->name;

        return $activeKamar->kamar?->name ?? null;
    }

    public function activeClass()
    {
        return $this->hasOneThrough(
            ActiveClass::class,
            ClassMember::class,
            'student_id',
            'id',
            'id',
            'active_class_id'
        )->where('academic_year_id', function ($query) {
            $query->select('id')->from('academic_years')->where('is_active', true)->limit(1);
        });
    }

    public function activeKamar()
    {
        return $this->hasOneThrough(
            ActiveKamar::class,
            KamarMember::class,
            'student_id',
            'id',
            'id',
            'active_kamar_id'
        )->where('academic_year_id', function ($query) {
            $query->select('id')->from('academic_years')->where('is_active', true)->limit(1);
        });
    }
}
