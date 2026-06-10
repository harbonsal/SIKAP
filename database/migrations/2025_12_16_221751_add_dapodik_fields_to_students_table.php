<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // 1. Data Pribadi (Personal)
            // nik added
            // nik already exists
            // $table->string('nik', 16)->nullable()->after('nisn');
            // religion: Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu
            $table->string('religion')->default('Islam')->after('nik');
            // citizenship: WNI, WNA
            $table->string('citizenship')->default('WNI')->after('religion');
            $table->integer('child_order')->nullable()->after('citizenship');
            $table->integer('siblings_count')->nullable()->after('child_order');
            // living_with: Orang Tua, Wali, Asrama, Lainnya
            $table->string('living_with')->nullable()->after('siblings_count');
            // financial_sponsor: Orang Tua, Wali, Lainnya
            $table->string('financial_sponsor')->nullable()->after('living_with');

            // 2. Data Fisik (Physical)
            $table->integer('height')->nullable()->after('financial_sponsor'); // cm
            $table->integer('weight')->nullable()->after('height'); // kg
            $table->string('blood_type', 3)->nullable()->after('weight'); // A, B, AB, O

            // 3. Data Ayah (Father)
            $table->string('father_name')->nullable()->after('blood_type');
            $table->string('father_nik', 16)->nullable()->after('father_name');
            $table->year('father_birth_year')->nullable()->after('father_nik');
            $table->string('father_education')->nullable()->after('father_birth_year');
            $table->string('father_occupation')->nullable()->after('father_education');
            $table->string('father_income')->nullable()->after('father_occupation');

            // 4. Data Ibu (Mother)
            $table->string('mother_name')->nullable()->after('father_income');
            $table->string('mother_nik', 16)->nullable()->after('mother_name');
            $table->year('mother_birth_year')->nullable()->after('mother_nik');
            $table->string('mother_education')->nullable()->after('mother_birth_year');
            $table->string('mother_occupation')->nullable()->after('mother_education');
            $table->string('mother_income')->nullable()->after('mother_occupation');

            // 5. Data Wali (Guardian)
            $table->string('guardian_name')->nullable()->after('mother_income');
            $table->string('guardian_nik', 16)->nullable()->after('guardian_name');
            $table->year('guardian_birth_year')->nullable()->after('guardian_nik');
            $table->string('guardian_education')->nullable()->after('guardian_birth_year');
            $table->string('guardian_occupation')->nullable()->after('guardian_education');
            $table->string('guardian_income')->nullable()->after('guardian_occupation');
            $table->text('guardian_address')->nullable()->after('guardian_income');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                // 'nik',
                'religion',
                'citizenship',
                'child_order',
                'siblings_count',
                'living_with',
                'financial_sponsor',
                'height',
                'weight',
                'blood_type',
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
            ]);
        });
    }
};
