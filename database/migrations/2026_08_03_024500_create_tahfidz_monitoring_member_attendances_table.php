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
        Schema::create('tahfidz_monitoring_member_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitoring_id')->constrained('tahfidz_monitorings')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('musyrif_id')->nullable()->constrained('tahfidz_musyrifs')->onDelete('set null');
            $table->string('status')->default('Hadir'); // Hadir, Izin, Sakit, Alpha
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_monitoring_member_attendances');
    }
};
