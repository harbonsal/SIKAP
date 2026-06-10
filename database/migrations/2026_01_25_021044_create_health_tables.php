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
        // 1. Master Data: Jenis Keluhan (e.g. Demam, Pusing, Batuk)
        Schema::create('health_complaints', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Transaction Header: Catatan Kesehatan Santri
        Schema::create('student_health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->date('date'); // Tanggal sakit/lapor
            $table->text('therapy')->nullable(); // Tindakan/Obat yang diberikan
            $table->text('description')->nullable(); // Keterangan tambahan
            $table->enum('status', ['Sakit', 'Istirahat', 'Sembuh', 'Dirujuk'])->default('Sakit'); // Simple status tracking
            $table->foreignId('created_by')->constrained('users'); // Siapa yang input (Bagian Kesehatan)
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Transaction Detail: Pivot (Many-to-Many) because one record can have multiple complaints
        Schema::create('health_record_complaint', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_health_record_id')->constrained('student_health_records')->onDelete('cascade');
            $table->foreignId('health_complaint_id')->constrained('health_complaints')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_record_complaint');
        Schema::dropIfExists('student_health_records');
        Schema::dropIfExists('health_complaints');
    }
};
